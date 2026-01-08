use solana_program::{
    account_info::{AccountInfo, next_account_info}, entrypoint::ProgramResult, instruction::{AccountMeta, Instruction}, msg, program::{invoke, invoke_signed}, program_error::ProgramError, program_pack::Pack, pubkey::Pubkey, rent::Rent, system_instruction::{SystemInstruction, transfer}, sysvar::Sysvar
};
use spl_token::{instruction::{initialize_mint2, mint_to_checked}, state::Mint};
use borsh::{BorshDeserialize, BorshSerialize};

use crate::{error::LSTErrors, maths::exchange_rate::{calculate_sol_to_lst_amounts, sol_to_lst_rate}, state::lst_manager::LSTManager};

// pub fn deposit_sol(program_id:&Pubkey, accounts:&[AccountInfo],deposit_amount:u64, lst_manager_bump:u8, lst_manager_vault_bump:u8, lst_mint_bump:u8, user_position_bump:u8)->ProgramResult{
pub fn deposit_sol(program_id:&Pubkey, accounts:&[AccountInfo],deposit_amount:u64, lst_manager_bump:u8, lst_manager_vault_bump:u8, lst_mint_bump:u8)->ProgramResult{
    let mut accounts_iter=accounts.iter();
    let user=next_account_info(&mut accounts_iter)?;
    let lst_manager_pda=next_account_info(&mut accounts_iter)?;
    let lst_manager_vault_pda=next_account_info(&mut accounts_iter)?;
    let lst_mint_pda=next_account_info(&mut accounts_iter)?;
    // let user_position_pda=next_account_info(&mut accounts_iter)?;
    let user_lst_ata=next_account_info(&mut accounts_iter)?;
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

    let mut lst_manager_data=LSTManager::try_from_slice(&lst_manager_pda.data.borrow())?;
    let total_sol_in_protocol=lst_manager_data.total_sol_staked + lst_manager_vault_pda.lamports();
    let total_lst_in_protocol=Mint::unpack(&lst_mint_pda.data.borrow())?.supply;

    //exchange rates
    let sol_to_lst_rate=sol_to_lst_rate(total_sol_in_protocol, total_lst_in_protocol)?;
    let lst_tokens_to_mint=calculate_sol_to_lst_amounts(deposit_amount, sol_to_lst_rate)?;
    
    // let rate_of_1_sol:u64;
    // if lst_manager_data.total_lst_supply==0{
    //     rate_of_1_sol=1; 
    // }else{
    //     //@c total sol supply=total sol staked + sol present in vault
    //     rate_of_1_sol=lst_manager_data.total_lst_supply / lst_manager_data.total_sol_staked;
    // }
    // let lst_tokens_to_mint=deposit_amount * rate_of_1_sol;
    
    //transfer deposit amount to lst_manager_vault_pda
    let transfer_to_vault_ix=transfer(user.key,
        lst_manager_vault_pda.key, deposit_amount);
    invoke(&transfer_to_vault_ix,
        &[user.clone(), lst_manager_vault_pda.clone()])?;

    //mint lst tokens to user's ata
    let mint_to_user_ata_ix=mint_to_checked(&spl_token::ID,
        lst_mint_pda.key, user_lst_ata.key, lst_manager_pda.key,
        &[], lst_tokens_to_mint, 9)?;
    invoke_signed(&mint_to_user_ata_ix,
        &[lst_mint_pda.clone(), user_lst_ata.clone(), lst_manager_pda.clone()],
        &[lst_manager_seeds])?;
    msg!("minted {} lst tokens to user's ata",lst_tokens_to_mint);

    lst_manager_data.total_lst_supply+=lst_tokens_to_mint;
    lst_manager_data.serialize(&mut *lst_manager_pda.data.borrow_mut())?;
    Ok(())
}