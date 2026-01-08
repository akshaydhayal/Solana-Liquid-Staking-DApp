use solana_program::{
    account_info::{AccountInfo, next_account_info},
    pubkey::Pubkey, entrypoint::ProgramResult,
    program_error::ProgramError, msg
};
use borsh::{BorshDeserialize};
use crate::instruction::InstructionType;
use crate::instructions::{
    initialise_lst::initialise_lst,
    deposit_sol::deposit_sol,
    stake_vault_sol::stake_vault_sol,
    burn_lst::burn_lst
};

pub fn process_instruction(program_id:&Pubkey, accounts:&[AccountInfo], instruction_data:&[u8])->ProgramResult{
    let ix=InstructionType::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    match ix{
        InstructionType::InitialiseLST { lst_manager_bump, lst_manager_vault_bump,lst_mint_bump}=>{
            msg!("initialise LST ix called");
            initialise_lst(program_id, accounts, lst_manager_bump, lst_manager_vault_bump,lst_mint_bump)?;
        },
        // InstructionType::DepositSOL { deposit_amount ,lst_manager_bump,lst_manager_vault_bump,lst_mint_bump, user_position_bump}=>{
        InstructionType::DepositSOL { deposit_amount ,lst_manager_bump,lst_manager_vault_bump,lst_mint_bump}=>{
            msg!("deposit SOL ix called");
            // deposit_sol(program_id, accounts, deposit_amount, lst_manager_bump, lst_manager_vault_bump, lst_mint_bump, user_position_bump)?;
            deposit_sol(program_id, accounts, deposit_amount, lst_manager_bump, lst_manager_vault_bump, lst_mint_bump)?;
        },
        InstructionType::StakeVaultSOL { lst_manager_bump, lst_manager_vault_bump,stake_acc_bump }=>{
            msg!("stake vault sol ix called");
            stake_vault_sol(program_id, accounts, lst_manager_bump, lst_manager_vault_bump,stake_acc_bump)?;
        },
        InstructionType::BurnLST { burn_lst_amount, lst_manager_bump, lst_manager_vault_bump, lst_mint_bump ,user_withdraw_request_bump, epoch_withdraw_bump}=>{
            msg!("burn LST ix called");
            burn_lst(program_id, accounts, burn_lst_amount, lst_manager_bump, lst_manager_vault_bump, lst_mint_bump, user_withdraw_request_bump,epoch_withdraw_bump)?;
        }
    }
    Ok(())
}