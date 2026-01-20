use solana_program::{
    account_info::{AccountInfo, next_account_info}, clock::Clock, entrypoint::ProgramResult, instruction::{AccountMeta, Instruction,}, msg, program::{invoke, invoke_signed}, program_error::ProgramError, program_pack::Pack, pubkey::Pubkey, rent::Rent, system_instruction::{SystemInstruction, create_account, transfer}, sysvar::Sysvar
};
use borsh::{BorshDeserialize, BorshSerialize};

use crate::{error::LSTErrors, state::{lst_manager::LSTManager, user_withdraw_request::UserWithdrawStatus}};
use crate::state::{
    user_withdraw_request::UserWithdrawRequest
};

pub fn claim_sol_from_withdraw_vault(program_id:&Pubkey, accounts:&[AccountInfo], lst_manager_bump:u8, lst_manager_user_withdrawl_vault_bump:u8, user_withdraw_request_bump:u8)->ProgramResult{
    let mut accounts_iter=accounts.iter();
    let user=next_account_info(&mut accounts_iter)?;
    let lst_manager_pda=next_account_info(&mut accounts_iter)?;
    let lst_manager_user_withdrawl_vault_pda=next_account_info(&mut accounts_iter)?;
    let user_withdraw_request_pda=next_account_info(&mut accounts_iter)?;
    let system_prog=next_account_info(&mut accounts_iter)?;

    if !user.is_signer{
        return Err(ProgramError::MissingRequiredSignature);
    }
    if *system_prog.key!=solana_program::system_program::ID{
        return Err(ProgramError::IncorrectProgramId);
    }
    

    //steps
    // this is user withdraw reqyest pda structire:pub struct UserWithdrawRequest
    //{user:Pubkey, sol_amount_user_gets:u64, requested_epoch:u64, withdraw_status
    //in this ix, a user will send a request to claim his sol which he must get as he burnt or unstaked the LST tokens
    //first get the withdraw request pda data and check this has already not claimed before
    //now check if current epoch>=requested epoch+1,  
    //as if user requrst 5sol in epoch 1000, admin will call the unstake ix from validator
    //right before 1000 ends and at that moment, a split stake account will be created with
    // epoch 1000 total users requested amount and this split stake will be deactivated before
    //epoch 1000 ends. so thia split stake acc will be deactivatye then in epoch 1001. and then
    //admin calls the withdraw from split stake acc ix to get that amount in user withdraw vault
    //from where user will request in claim sol ix.
    //and for that curr epoch>=requested epoch+1

    //if both checks are passed, then transfer the sol_amount_user_gers from user withdraw vault
    //to requested pda's user address.
    //then set the withdraw status to completed so that double claim is not done

    let lst_manager_seeds=&["lst_manager".as_bytes(), &lst_manager_bump.to_le_bytes()];
    let lst_manager_derived=Pubkey::create_program_address(lst_manager_seeds,program_id)?;
    msg!("lst manager derived : {}",lst_manager_derived);
    if lst_manager_derived!=*lst_manager_pda.key{
        return Err(LSTErrors::LSTManagerPdaMismatch.into());
    }
    
    let lst_manager_user_withdrawl_vault_seeds=&["lst_manager_user_withdrawl_vault".as_bytes(), lst_manager_pda.key.as_ref(), &[lst_manager_user_withdrawl_vault_bump]];
    let lst_manager_user_withdrawl_vault_derived=Pubkey::create_program_address(lst_manager_user_withdrawl_vault_seeds, program_id)?;
    if *lst_manager_user_withdrawl_vault_pda.key!=lst_manager_user_withdrawl_vault_derived{
        return Err(LSTErrors::LSTManagerUserWithdrawlVaultPdaMismatch.into());
    }
    
    let user_withdraw_request_seeds=&[b"user_withdraw_request", user.key.as_ref(), &[user_withdraw_request_bump]];
    let user_withdraw_request_derived=Pubkey::create_program_address(user_withdraw_request_seeds, program_id)?;
    if user_withdraw_request_derived!=*user_withdraw_request_pda.key{
        return Err(LSTErrors::UserWithdrawRequestPdaMismatch.into());
    }

    let mut user_withdraw_request_data=UserWithdrawRequest::try_from_slice(&user_withdraw_request_pda.data.borrow())?;
    if user_withdraw_request_data.withdraw_status==UserWithdrawStatus::COMPLETED{
        msg!("User Withdraw Request Already Claimed");
        return Err(LSTErrors::UserWithdrawRequestAlreadyClaimed.into());
    }
    let clock=Clock::get()?;
    let current_epoch=clock.epoch;
    if current_epoch <= user_withdraw_request_data.requested_epoch{
        msg!("User Claiming Before Requested Epoch Ends");
        return Err(LSTErrors::UserClaimingBeforeRequestedEpochEnds.into());
    }

    let transfer_from_vault_to_user_ix=Instruction::new_with_bincode(
        *system_prog.key,
        &SystemInstruction::Transfer { lamports: user_withdraw_request_data.sol_amount_user_gets},
        vec![
            AccountMeta::new(*lst_manager_user_withdrawl_vault_pda.key, true),
            AccountMeta::new(*user.key, false),
        ]
    );
    invoke_signed(&transfer_from_vault_to_user_ix,
        &[lst_manager_user_withdrawl_vault_pda.clone(), user.clone(), system_prog.clone()],
    &[lst_manager_user_withdrawl_vault_seeds])?;

    let mut lst_manager_pda_data=LSTManager::try_from_slice(&lst_manager_pda.data.borrow())?;
    // lst_manager_pda_data.total_pending_withdrawl_sol-=user_withdraw_request_data.sol_amount_user_gets;
    user_withdraw_request_data.withdraw_status=UserWithdrawStatus::COMPLETED;
    
    user_withdraw_request_data.serialize(&mut *user_withdraw_request_pda.data.borrow_mut())?;        
    lst_manager_pda_data.serialize(&mut *lst_manager_pda.data.borrow_mut())?;
    Ok(())
}