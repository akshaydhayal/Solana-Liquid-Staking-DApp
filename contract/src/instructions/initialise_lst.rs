use solana_program::{
    account_info::{AccountInfo, next_account_info}, entrypoint::ProgramResult, instruction::{AccountMeta, Instruction}, msg, program::invoke_signed, program_error::ProgramError, program_pack::Pack, pubkey::Pubkey, rent::Rent, system_instruction::{SystemInstruction, create_account}, sysvar::Sysvar
};
use spl_token::instruction::{initialize_mint2};
use borsh::{BorshDeserialize, BorshSerialize};

use crate::{error::LSTErrors, state::lst_manager::LSTManager};

pub fn initialise_lst(program_id:&Pubkey, accounts:&[AccountInfo], lst_manager_bump:u8, lst_manager_vault_bump:u8, lst_mint_bump:u8)->ProgramResult{
    let mut accounts_iter=accounts.iter();
    let user=next_account_info(&mut accounts_iter)?;
    let stake_manager_pda=next_account_info(&mut accounts_iter)?;
    let lst_manager_pda=next_account_info(&mut accounts_iter)?;
    let lst_manager_vault_pda=next_account_info(&mut accounts_iter)?;
    let lst_mint_pda=next_account_info(&mut accounts_iter)?;
    let system_prog=next_account_info(&mut accounts_iter)?;
    let token_prog=next_account_info(&mut accounts_iter)?;

    if !user.is_signer{
        return Err(ProgramError::MissingRequiredSignature);
    }
    if !lst_manager_pda.data_is_empty(){
        return Err(ProgramError::AccountAlreadyInitialized);
    }
    if *system_prog.key!=solana_program::system_program::ID{
        return Err(ProgramError::IncorrectProgramId);
    }

    let lst_manager_seeds=&["lst_manager".as_bytes(), &lst_manager_bump.to_le_bytes()];
    let lst_manager_derived=Pubkey::create_program_address(lst_manager_seeds,program_id)?;
    if *lst_manager_pda.key!=lst_manager_derived{
        return Err(LSTErrors::LSTManagerPdaMismatch.into());
    }

    let lst_manager_vault_seeds=&["lst_manager_vault".as_bytes(), lst_manager_pda.key.as_ref(), &lst_manager_vault_bump.to_le_bytes()];
    let lst_manager_vault_derived=Pubkey::create_program_address(lst_manager_vault_seeds, program_id)?;
    if *lst_manager_vault_pda.key!=lst_manager_vault_derived{
        return Err(LSTErrors::LSTManagerVaultPdaMismatch.into());
    }

    let lst_mint_seeds=&["lst_mint".as_bytes(), lst_manager_pda.key.as_ref(), &lst_mint_bump.to_le_bytes()];
    let lst_mint_derived=Pubkey::create_program_address(lst_mint_seeds, program_id)?;
    if *lst_mint_pda.key!=lst_mint_derived{
        return Err(LSTErrors::LSTMintPdaMismatch.into());
    }
    //@q do we need to derive stake manager pda
    // let stake_manager_seeds=&["manager".as_bytes(), &stake_manager_bump.to_le_bytes()];
    // let stake_manager_derived=Pubkey::create_program_address(stake_manager_seeds,program_id)?;
    // if *stake_manager_pda.key!=stake_manager_derived{
    //     return Err(LSTErrors::StakeManagerPdaMismatch.into());
    // }

    //create lst manager pda
    let rent=Rent::get()?;
    let create_lst_manager_ix=Instruction::new_with_bincode(
        *system_prog.key,
        &SystemInstruction::CreateAccount {
            lamports: rent.minimum_balance(LSTManager::LST_MANAGER_SIZE),
            space: LSTManager::LST_MANAGER_SIZE as u64,
            owner: *program_id
        },
        vec![
            AccountMeta{pubkey:*user.key, is_signer:true, is_writable:true},
            AccountMeta{pubkey:*lst_manager_pda.key, is_signer:true, is_writable:true}
        ]);
    invoke_signed(&create_lst_manager_ix,
        &[user.clone(), lst_manager_pda.clone(), system_prog.clone()],
        &[lst_manager_seeds])?;
    msg!("lst manager pda created");

    //create lst manager vault pda
    let create_lst_manager_vault_pda_ix=Instruction::new_with_bincode(
        *system_prog.key,
        &SystemInstruction::CreateAccount {
            // lamports: rent.minimum_balance(0), space: 0, owner: *lst_manager_pda.key
            // lamports: rent.minimum_balance(0), space: 0, owner: *program_id 
            lamports: rent.minimum_balance(0), space: 0, owner: *system_prog.key 
        },
        vec![
            AccountMeta{pubkey:*user.key, is_signer:true, is_writable:true},
            AccountMeta{pubkey:*lst_manager_vault_pda.key, is_signer:true, is_writable:true}
        ]);
    invoke_signed(&create_lst_manager_vault_pda_ix,
        &[user.clone(), lst_manager_vault_pda.clone(), system_prog.clone()],
        // &[lst_manager_seeds])?;  
        &[lst_manager_vault_seeds])?;  
    msg!("lst manager vault pda created");

    //create lst mint pda
    let create_lst_mint_pda_ix=Instruction::new_with_bincode(
        *system_prog.key,
        &SystemInstruction::CreateAccount {
            lamports: rent.minimum_balance(spl_token::state::Mint::LEN),
            space: spl_token::state::Mint::LEN as u64, 
            owner: spl_token::ID
         },
        vec![
            AccountMeta{pubkey:*user.key, is_signer:true, is_writable:true},
            AccountMeta{pubkey:*lst_mint_pda.key, is_signer:true, is_writable:true},
        ]
    );
    invoke_signed(&create_lst_mint_pda_ix,
        &[user.clone(), lst_mint_pda.clone(), system_prog.clone()],
        &[lst_mint_seeds])?;
    msg!("lst mint pda created");

    //now lets initialise the lst mint pda 
    let initialise_mint_ix=initialize_mint2(&spl_token::ID,
        lst_mint_pda.key, lst_manager_pda.key,
        Some(lst_manager_pda.key), 9)?;
    //@q can this be just invoke- i dont think so
    invoke_signed(&initialise_mint_ix,
        &[lst_mint_pda.clone(), token_prog.clone()],
        &[lst_manager_seeds])?;
    msg!("lst mint pda initialised");

    let lst_manager_pda_data=LSTManager{
        admin:*user.key,
        stake_manager:*stake_manager_pda.key,
        lst_mint:*lst_mint_pda.key,
        total_sol_staked:0,
        total_lst_supply:0
    };
    lst_manager_pda_data.serialize(&mut *lst_manager_pda.data.borrow_mut())?;
    Ok(())
}