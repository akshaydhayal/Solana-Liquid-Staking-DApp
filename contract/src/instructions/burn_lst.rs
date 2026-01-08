use solana_program::{
    account_info::{AccountInfo, next_account_info}, clock::Clock, entrypoint::ProgramResult, instruction::{AccountMeta, Instruction,}, msg, program::{invoke, invoke_signed}, program_error::ProgramError, program_pack::Pack, pubkey::Pubkey, rent::Rent, system_instruction::{SystemInstruction, create_account, transfer}, sysvar::Sysvar
};
use spl_token::{
    instruction::{burn_checked, initialize_mint2, mint_to_checked}, state::{Account, Mint}
};
use borsh::{BorshDeserialize, BorshSerialize};

use crate::{error::LSTErrors, state::{epoch_withdraw::EpochWithdraw, user_withdraw_request::UserWithdrawStatus}};
use crate::state::{
    lst_manager::LSTManager,
    user_withdraw_request::UserWithdrawRequest
};
use crate::maths::exchange_rate::{lst_to_sol_rate,calculate_lst_to_sol_amounts};

pub fn burn_lst(program_id:&Pubkey, accounts:&[AccountInfo], burn_lst_amount:u64, lst_manager_bump:u8, lst_manager_vault_bump:u8, lst_mint_bump:u8, user_withdraw_request_bump:u8, epoch_withdraw_bump:u8)->ProgramResult{
    let mut accounts_iter=accounts.iter();
    let user=next_account_info(&mut accounts_iter)?;
    let lst_manager_pda=next_account_info(&mut accounts_iter)?;
    let lst_manager_vault_pda=next_account_info(&mut accounts_iter)?;
    let lst_mint_pda=next_account_info(&mut accounts_iter)?;
    let user_lst_ata=next_account_info(&mut accounts_iter)?;
    let user_withdraw_request_pda=next_account_info(&mut accounts_iter)?;
    let epoch_withdraw_pda=next_account_info(&mut accounts_iter)?;
    let system_prog=next_account_info(&mut accounts_iter)?;

    if !user.is_signer{
        return Err(ProgramError::MissingRequiredSignature);
    }
    if *system_prog.key!=solana_program::system_program::ID{
        return Err(ProgramError::IncorrectProgramId);
    }
    
    let lst_manager_seeds=&["lst_manager".as_bytes(), &lst_manager_bump.to_le_bytes()];
    let lst_manager_derived=Pubkey::create_program_address(lst_manager_seeds,program_id)?;
    msg!("lst manager derived : {}",lst_manager_derived);
    if lst_manager_derived!=*lst_manager_pda.key{
        return Err(LSTErrors::LSTManagerPdaMismatch.into());
    }
    
    let lst_manager_vault_seeds=&["lst_manager_vault".as_bytes(), &lst_manager_pda.key.to_bytes(), &lst_manager_vault_bump.to_le_bytes()];
    let lst_manager_vault_derived=Pubkey::create_program_address(lst_manager_vault_seeds,program_id)?;
    msg!("lst manager vault derived : {}",lst_manager_vault_derived);
    if *lst_manager_vault_pda.key!=lst_manager_vault_derived{
        return Err(LSTErrors::LSTManagerVaultPdaMismatch.into());
    }
    
    let lst_mint_seeds=&["lst_mint".as_bytes(), &lst_manager_pda.key.to_bytes(), &lst_mint_bump.to_le_bytes()];
    let lst_mint_derived=Pubkey::create_program_address(lst_mint_seeds,program_id)?;
    msg!("lst mint derived : {}",lst_mint_derived);
    if *lst_mint_pda.key!=lst_mint_derived{
        return Err(LSTErrors::LSTMintPdaMismatch.into());
    }
    
    let user_withdraw_request_seeds=&[b"user_withdraw_request", user.key.as_ref(), &[user_withdraw_request_bump]];
    let user_withdraw_request_derived=Pubkey::create_program_address(user_withdraw_request_seeds, program_id)?;
    if user_withdraw_request_derived!=*user_withdraw_request_pda.key{
        return Err(LSTErrors::UserWithdrawRequestPdaMismatch.into());
    }

    let rent=Rent::get()?;
    let clock=Clock::get()?;

    let epoch_withdraw_seeds:&[&[u8]]=&[b"epoch_withdraw", &clock.epoch.to_le_bytes(), &[epoch_withdraw_bump]];
    let epoch_withdraw_derived=Pubkey::create_program_address(epoch_withdraw_seeds, program_id)?;
    if epoch_withdraw_derived!=*epoch_withdraw_pda.key{
        return Err(LSTErrors::EpochWithdrawPdaMismatch.into());
    }

    //burn lst tokens from user's lst ata
    let mut lst_manager_data=LSTManager::try_from_slice(&lst_manager_pda.data.borrow())?;
    let total_sol_in_protocol=lst_manager_data.total_sol_staked + lst_manager_vault_pda.lamports();
    let total_lst_in_protocol=Mint::unpack(&lst_mint_pda.data.borrow())?.supply;

    //exchange rates
    let lst_to_sol_rate=lst_to_sol_rate(total_sol_in_protocol, total_lst_in_protocol)?;
    let sol_amount_to_unstake=calculate_lst_to_sol_amounts(burn_lst_amount, lst_to_sol_rate)?;
    
    let burn_lst_tokens_ix=burn_checked(&spl_token::ID,
        user_lst_ata.key, lst_mint_pda.key, user.key,
        &[], burn_lst_amount, 9)?;
    invoke(&burn_lst_tokens_ix,
        &[user_lst_ata.clone(), lst_mint_pda.clone(), user.clone()])?;
    msg!("user {} lst tokens are burned",burn_lst_amount);

    //create user withdraw request pda now
    //create a withdraw pda if this is user's first request or update pda if is not first withdraw request
    let mut user_withdraw_request_pda_data;
    if user_withdraw_request_pda.data_is_empty(){
        let create_user_withdraw_request_pda_ix=create_account(user.key, user_withdraw_request_pda.key,
            rent.minimum_balance(UserWithdrawRequest::LEN),
            UserWithdrawRequest::LEN as u64, program_id);
        invoke_signed(&create_user_withdraw_request_pda_ix,  
            &[user.clone(), user_withdraw_request_pda.clone(), system_prog.clone()],
            &[user_withdraw_request_seeds])?;
        msg!("user withdraw request pda created!"); 

        user_withdraw_request_pda_data=UserWithdrawRequest{
            user:*user.key,
            sol_amount_to_withdraw:sol_amount_to_unstake,
            requested_epoch:clock.epoch,
            withdraw_status:UserWithdrawStatus::PENDING
        };
    }else{
        user_withdraw_request_pda_data=UserWithdrawRequest::try_from_slice(&user_withdraw_request_pda.data.borrow())?;
        //if old request is completed, reset the pda, else just add info to old reqyest pda data
        if user_withdraw_request_pda_data.withdraw_status==UserWithdrawStatus::PENDING{
            user_withdraw_request_pda_data.sol_amount_to_withdraw+=sol_amount_to_unstake;
            user_withdraw_request_pda_data.requested_epoch=clock.epoch;
        }else if user_withdraw_request_pda_data.withdraw_status==UserWithdrawStatus::COMPLETED{
            user_withdraw_request_pda_data.sol_amount_to_withdraw=sol_amount_to_unstake;
            user_withdraw_request_pda_data.withdraw_status=UserWithdrawStatus::PENDING;
            user_withdraw_request_pda_data.requested_epoch=clock.epoch;
        }
    }

    //creaye epoch wuthdraw pda if not exist, else uodate the info
    let mut epoch_withdraw_pda_data;
    if epoch_withdraw_pda.data_is_empty(){
        let create_epoch_withdraw_pda_ix=create_account(user.key, epoch_withdraw_pda.key,
            rent.minimum_balance(EpochWithdraw::LEN),
            EpochWithdraw::LEN as u64, program_id);
        invoke_signed(&create_epoch_withdraw_pda_ix,  
            &[user.clone(), epoch_withdraw_pda.clone(), system_prog.clone()],
            &[epoch_withdraw_seeds])?;
        msg!("epoch withdraw pda created!"); 
        epoch_withdraw_pda_data=EpochWithdraw{sol_amount_to_unstake:sol_amount_to_unstake,requested_epoch:clock.epoch,finalised:false};
    }else{
        epoch_withdraw_pda_data=EpochWithdraw::try_from_slice(&epoch_withdraw_pda.data.borrow())?;
        epoch_withdraw_pda_data.sol_amount_to_unstake+=sol_amount_to_unstake;
    }

    //steps:
    // user requests withdrawl amount, tells program how much lst to burn
    // we calculate exchange rates now , 1 lst= x sol
    // burn users reqyuested lst tokens and create a withdraw pda request
    // withdraw pda={user recieve address, sol to send, withdraw status:pending/completed, cancelled}
    // create a epoch withdraw pda that stores every epoch details to unstake and withdraw by
    // splitting a stake account.
    
    //another unstake ix for admin to call,
    //create a split account from main stake account with amount stored in epoch withdraw, 
    // and set the status in epoch withdraw pda to finalized. so that now nobody can request for 
    // withdraw in this epoch, after now all withdraw requests must be stored in next epoch pda.
        
    lst_manager_data.total_lst_supply-=burn_lst_amount;
    lst_manager_data.serialize(&mut *lst_manager_pda.data.borrow_mut())?;
    user_withdraw_request_pda_data.serialize(&mut *user_withdraw_request_pda.data.borrow_mut())?;
    epoch_withdraw_pda_data.serialize(&mut *epoch_withdraw_pda.data.borrow_mut())?;
    Ok(())
}