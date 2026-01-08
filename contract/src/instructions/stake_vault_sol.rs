use solana_program::{
    account_info::{AccountInfo, next_account_info}, entrypoint::ProgramResult,
    instruction::{AccountMeta, Instruction}, msg, program::{invoke, invoke_signed},
    program_error::ProgramError, pubkey::Pubkey,
    system_instruction::{SystemInstruction, transfer, create_account},
    rent::Rent, clock::Clock, sysvar::Sysvar,
    stake
};
use spl_token::instruction::{mint_to_checked , initialize_mint2};
use borsh::{BorshDeserialize, BorshSerialize};

use crate::{error::LSTErrors, state::lst_manager::LSTManager};

pub fn stake_vault_sol(program_id:&Pubkey, accounts:&[AccountInfo], lst_manager_bump:u8, lst_manager_vault_bump:u8, stake_acc_bump:u8)->ProgramResult{
    let mut accounts_iter=accounts.iter();
    let user=next_account_info(&mut accounts_iter)?;
    let lst_manager_pda=next_account_info(&mut accounts_iter)?;
    let lst_manager_vault_pda=next_account_info(&mut accounts_iter)?;
    let stake_acc_pda=next_account_info(&mut accounts_iter)?;
    let validator_vote_acc=next_account_info(&mut accounts_iter)?;
    
    let sys_var_rent=next_account_info(&mut accounts_iter)?;
    let sys_var_clock=next_account_info(&mut accounts_iter)?;
    let sys_var_stake_history=next_account_info(&mut accounts_iter)?;
    let stake_config=next_account_info(&mut accounts_iter)?;
    let system_prog=next_account_info(&mut accounts_iter)?;
    let stake_prog=next_account_info(&mut accounts_iter)?;
    
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
    //@c a check that only admin of lst manager can call thus ix and not anyone, else he can misuse
    // it, like call before a epoch only, ideally this shoule be called just some time before epoch
    // ends so that most amount in vault is staked  
    let lst_manager_data=LSTManager::try_from_slice(&lst_manager_pda.data.borrow())?;
    if lst_manager_data.admin!=*user.key{
        return Err(LSTErrors::OnlyAdminAllowed.into());
    }

    let lst_manager_vault_seeds=&["lst_manager_vault".as_bytes(), &lst_manager_pda.key.to_bytes(), &lst_manager_vault_bump.to_le_bytes()];
    let lst_manager_vault_derived=Pubkey::create_program_address(lst_manager_vault_seeds,program_id)?;
    msg!("lst manager vault derived : {}",lst_manager_vault_derived);
    msg!("lst manager vault pda owner : {}",lst_manager_vault_pda.owner);
    
    if *lst_manager_vault_pda.key!=lst_manager_vault_derived{
        return Err(LSTErrors::LSTManagerVaultPdaMismatch.into());
    }

    let rent=Rent::get()?;
    let stake_amount=lst_manager_vault_pda.lamports() - rent.minimum_balance(0) - rent.minimum_balance(stake::state::StakeStateV2::size_of());
    msg!("stake amoutn : {}", stake_amount);
    msg!("stake amoutn : {}", lst_manager_vault_pda.lamports());

    //we will first create a stake pda account to whom rent+stake amount will be payed by vault pda
    let clock=Clock::get()?;
    let curr_epoch=clock.epoch;
    msg!("current epoch : {}",curr_epoch);
    let stake_acc_seeds=&["stake_acc".as_bytes(), &curr_epoch.to_le_bytes(), &lst_manager_pda.key.to_bytes(), &[stake_acc_bump]];
    let stake_acc_pda_derived=Pubkey::create_program_address(stake_acc_seeds, program_id)?;
    if *stake_acc_pda.key!=stake_acc_pda_derived{
        return Err(ProgramError::InvalidSeeds);
    }

    // let create_stake_acc_ix=create_account(lst_manager_vault_pda.key, stake_acc.key, 
    let create_stake_acc_ix=create_account(lst_manager_vault_pda.key, stake_acc_pda.key, 
        rent.minimum_balance(stake::state::StakeStateV2::size_of()) + stake_amount,
        stake::state::StakeStateV2::size_of() as u64, &stake::program::ID);
    invoke_signed(&create_stake_acc_ix,
         &[lst_manager_vault_pda.clone(), stake_acc_pda.clone(), system_prog.clone()],
        //  &[lst_manager_vault_seeds]
         &[lst_manager_vault_seeds, stake_acc_seeds]
    )?;
    msg!("stake account created!!");
    // **lst_manager_vault_pda.try_borrow_mut_lamports()?-=stake_amount;
    // **user.try_borrow_mut_lamports()?+=stake_amount;
    let init_stake_acc_ix=stake::instruction::initialize(stake_acc_pda.key,
        &stake::state::Authorized{staker:*lst_manager_pda.key, withdrawer:*lst_manager_pda.key}, 
        &stake::state::Lockup::default()
    );
    invoke(&init_stake_acc_ix,
        &[stake_acc_pda.clone(), sys_var_rent.clone(), stake_prog.clone()])?; 
    msg!("stake account initialised!!");

    let delegate_ix=stake::instruction::delegate_stake(stake_acc_pda.key,
        lst_manager_pda.key, validator_vote_acc.key);
    invoke_signed(&delegate_ix,
        &[stake_acc_pda.clone(),validator_vote_acc.clone(),sys_var_clock.clone(),
        sys_var_stake_history.clone(),stake_config.clone(), lst_manager_pda.clone(), stake_prog.clone()],
        &[lst_manager_seeds])?;
    msg!("delegated {} to validator {}",stake_amount, validator_vote_acc.key);

    let mut lst_manager_data=LSTManager::try_from_slice(&lst_manager_pda.data.borrow_mut())?;
    lst_manager_data.total_sol_staked+=stake_amount;
    lst_manager_data.serialize(&mut *lst_manager_pda.data.borrow_mut())?;
    Ok(())
}