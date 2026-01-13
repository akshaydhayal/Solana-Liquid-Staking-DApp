use solana_program::{
    account_info::{AccountInfo, next_account_info}, clock::Clock, entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction,}, msg, program::{invoke, invoke_signed},
    program_error::ProgramError, program_pack::Pack, pubkey::Pubkey, rent::Rent,
    system_instruction::{SystemInstruction, create_account, transfer},
    sysvar::Sysvar, stake
};
use spl_token::{
    instruction::{burn_checked, initialize_mint2, mint_to_checked}, state::{Account, Mint}
};
use borsh::{BorshDeserialize, BorshSerialize};

use crate::{error::LSTErrors, state::{epoch_withdraw::EpochWithdraw, stake_registry_record::StakeRegistryRecord, user_withdraw_request::UserWithdrawStatus}};
use crate::state::{
    lst_manager::LSTManager,
    user_withdraw_request::UserWithdrawRequest
};
use crate::maths::exchange_rate::{lst_to_sol_rate,calculate_lst_to_sol_amounts};

pub fn unstake_sol(program_id:&Pubkey, accounts:&[AccountInfo], stake_acc_index:u64, lst_manager_bump:u8, lst_manager_vault_bump:u8, epoch_withdraw_bump:u8, stake_acc_bump:u8, split_stake_acc_bump:u8, stake_registry_record_bump:u8)->ProgramResult{
    let mut accounts_iter=accounts.iter();
    let user=next_account_info(&mut accounts_iter)?;
    let lst_manager_pda=next_account_info(&mut accounts_iter)?;
    let lst_manager_vault_pda=next_account_info(&mut accounts_iter)?;
    
    let epoch_withdraw_pda=next_account_info(&mut accounts_iter)?;
    let stake_acc=next_account_info(&mut accounts_iter)?;
    let split_stake_acc=next_account_info(&mut accounts_iter)?;
    let stake_registry_record_pda=next_account_info(&mut accounts_iter)?;
    
    let sys_var_clock=next_account_info(&mut accounts_iter)?;
    let stake_prog=next_account_info(&mut accounts_iter)?;
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
    let mut lst_manager_data=LSTManager::try_from_slice(&lst_manager_pda.data.borrow())?;
    if *user.key!=lst_manager_data.admin{
        return Err(LSTErrors::OnlyAdminAllowed.into());
    }
    
    let lst_manager_vault_seeds=&["lst_manager_vault".as_bytes(), &lst_manager_pda.key.to_bytes(), &lst_manager_vault_bump.to_le_bytes()];
    let lst_manager_vault_derived=Pubkey::create_program_address(lst_manager_vault_seeds,program_id)?;
    msg!("lst manager vault derived : {}",lst_manager_vault_derived);
    if *lst_manager_vault_pda.key!=lst_manager_vault_derived{
        return Err(LSTErrors::LSTManagerVaultPdaMismatch.into());
    }
    msg!("a");
    let stake_registry_record_seeds=&["stake_registry_record".as_bytes(), lst_manager_pda.key.as_ref(), &stake_registry_record_bump.to_le_bytes()];
    let stake_registry_record_derived=Pubkey::create_program_address(stake_registry_record_seeds, program_id)?;
    msg!("b");
    if *stake_registry_record_pda.key!=stake_registry_record_derived{
        return Err(LSTErrors::StakeRegistryPdaMismatch.into());
    }
    msg!("c");
    
    let rent=Rent::get()?;
    let clock=Clock::get()?;
    
    let epoch_withdraw_seeds:&[&[u8]]=&[b"epoch_withdraw", &clock.epoch.to_le_bytes(), &[epoch_withdraw_bump]];
    msg!("d");
    let epoch_withdraw_derived=Pubkey::create_program_address(epoch_withdraw_seeds, program_id)?;
    if epoch_withdraw_derived!=*epoch_withdraw_pda.key{
        return Err(LSTErrors::EpochWithdrawPdaMismatch.into());
    }
    msg!("e");
    
    let mut stake_registry_record_data=StakeRegistryRecord::try_from_slice(&stake_registry_record_pda.data.borrow())?; 
    let stake_acc_seeds=&["stake_acc".as_bytes(), &stake_acc_index.to_le_bytes(), &lst_manager_pda.key.to_bytes(), &[stake_acc_bump]];
    let stake_acc_pda_derived=Pubkey::create_program_address(stake_acc_seeds, program_id)?;
    msg!("f");
    if *stake_acc.key!=stake_acc_pda_derived{
        return Err(LSTErrors::StakePdaMismatch.into());
    }
    msg!("g");
    
    //@q how about in this split stake acc we, use like a index count instead of epoch
    let split_stake_acc_seeds=&["split_stake_acc".as_bytes(), &stake_registry_record_data.next_split_index.to_le_bytes(), lst_manager_pda.key.as_ref(), &[split_stake_acc_bump]];
    let split_stake_acc_derived=Pubkey::create_program_address(split_stake_acc_seeds, program_id)?;
    msg!("h");
    if *split_stake_acc.key!=split_stake_acc_derived{
        return Err(LSTErrors::SplitStakePdaMismatch.into());
    }
    msg!("i");
    
    let mut epoch_withdraw_pda_data=EpochWithdraw::try_from_slice(&epoch_withdraw_pda.data.borrow())?;
    msg!("j");
    if epoch_withdraw_pda_data.finalised{
        return Err(LSTErrors::EpochWithdrawAlreadyFinalised.into());
    }    
    msg!("k");
    //steps:
    //another unstake ix for admin to call,     
    //admin check, then check if epoch withdraw is still not finalised
    // first, get epoch withdraw pda and set it as finalised so that no other user can request
    // for thus epoch now, now all withdraw requests must be stored in next epoch pda.
    //create a split account from main stake account with amount stored in epoch withdraw,
    //deactivate this split account so that we can withdraw from this split acc to withdraw wallet
    //update lst manager staked amount  
    
    
    
    //creating this split account 
    let create_split_stake_acc_ix=create_account(user.key, split_stake_acc.key,
        rent.minimum_balance(stake::state::StakeStateV2::size_of()),
        stake::state::StakeStateV2::size_of() as u64, &stake::program::ID);
    msg!("l");
    invoke_signed(&create_split_stake_acc_ix,
        &[user.clone(), split_stake_acc.clone(), system_prog.clone()],
        &[split_stake_acc_seeds])?;
    msg!("split stake account created!");
    
    //splitting thr main stake account
    let available_amount_to_split=stake_acc.lamports()-rent.minimum_balance(200) -1;
    let mut amount_to_split=epoch_withdraw_pda_data.sol_amount_to_unstake;
    msg!("sol amount to split from stake acc : {}",amount_to_split);
    msg!("available_amount_to_split : {}", available_amount_to_split);
    if amount_to_split > available_amount_to_split{
        amount_to_split=available_amount_to_split; 
        //     return Err(LSTErrors::EpochWithdrawAmountExceedsStakeDelegatedAmount.into());
    }

    let split_stake_acc_ix=Instruction::new_with_bincode(
        stake::program::ID,
        &stake::instruction::StakeInstruction::Split(amount_to_split),
        // &stake::instruction::StakeInstruction::Split(epoch_withdraw_pda_data.sol_amount_to_unstake),
        vec![
            AccountMeta{pubkey:*stake_acc.key, is_signer:false, is_writable:true},
            AccountMeta{pubkey:*split_stake_acc.key, is_signer:false, is_writable:true},
            AccountMeta::new(*lst_manager_pda.key, true)
    ]);
    invoke_signed(&split_stake_acc_ix,
        // &[stake_acc.clone()],
        &[stake_acc.clone(), split_stake_acc.clone(),lst_manager_pda.clone()],
        &[lst_manager_seeds])?; 
    msg!("splitted stake account!!");
    
    //deactivating the split stake account
    let deactivate_split_stake_acc_ix=Instruction::new_with_bincode(
        stake::program::ID,
        &stake::instruction::StakeInstruction::Deactivate,
        vec![
            AccountMeta::new(*split_stake_acc.key, false),
            AccountMeta::new_readonly(*sys_var_clock.key, false),
            AccountMeta::new_readonly(*lst_manager_pda.key, true)
    ]);
    invoke_signed(&deactivate_split_stake_acc_ix,
        &[split_stake_acc.clone(), sys_var_clock.clone(), lst_manager_pda.clone()],
        &[lst_manager_seeds])?;
    msg!("deactivated split stake acc account!!");
        
    stake_registry_record_data.next_split_index+=1;
    stake_registry_record_data.serialize(&mut *stake_registry_record_pda.data.borrow_mut())?;

    // lst_manager_data.total_sol_staked-=epoch_withdraw_pda_data.sol_amount_to_unstake;
    lst_manager_data.total_sol_staked-=amount_to_split;
    lst_manager_data.serialize(&mut *lst_manager_pda.data.borrow_mut())?;
    
    epoch_withdraw_pda_data.finalised=true; 
    epoch_withdraw_pda_data.serialize(&mut *epoch_withdraw_pda.data.borrow_mut())?;

    Ok(())
}