use solana_program::{
    account_info::{AccountInfo, next_account_info},
    pubkey::Pubkey, entrypoint::ProgramResult,
    program_error::ProgramError, msg
};
use borsh::{BorshDeserialize};
use crate::instruction::InstructionType;
use crate::instructions::{
    initialise_lst::initialise_lst,
    deposit_sol_to_vault::deposit_sol_to_vault,
    burn_lst_to_redeem_sol::burn_lst_to_redeem_sol,
    claim_sol_from_withdraw_vault::claim_sol_from_withdraw_vault,

    stake_vault_sol_to_validator::stake_vault_sol_to_validator,
    unstake_sol_from_validator::unstake_sol_from_validator,
    withdraw_from_split_stake::withdraw_from_split_stake
};

pub fn process_instruction(program_id:&Pubkey, accounts:&[AccountInfo], instruction_data:&[u8])->ProgramResult{
    let ix=InstructionType::try_from_slice(instruction_data)
        .map_err(|_| ProgramError::InvalidInstructionData)?;
    match ix{
        InstructionType::InitialiseLST { lst_manager_bump, lst_manager_vault_bump,lst_manager_user_withdrawl_vault_bump,lst_mint_bump,stake_registry_record_bump}=>{
            msg!("initialise LST ix called");
            initialise_lst(program_id, accounts, lst_manager_bump, lst_manager_vault_bump,lst_manager_user_withdrawl_vault_bump, lst_mint_bump, stake_registry_record_bump)?;
        },
        // InstructionType::DepositSOL { deposit_amount ,lst_manager_bump,lst_manager_vault_bump,lst_mint_bump, user_position_bump}=>{
        InstructionType::DepositSOLToVault { deposit_amount ,lst_manager_bump,lst_manager_vault_bump,lst_mint_bump}=>{
            msg!("deposit SOL ix called");
            deposit_sol_to_vault(program_id, accounts, deposit_amount, lst_manager_bump, lst_manager_vault_bump, lst_mint_bump)?;
        },
        InstructionType::StakeVaultSOLToValidator { lst_manager_bump, lst_manager_vault_bump,stake_acc_bump ,stake_registry_record_bump}=>{
            msg!("stake vault sol ix called");
            stake_vault_sol_to_validator(program_id, accounts, lst_manager_bump, lst_manager_vault_bump,stake_acc_bump, stake_registry_record_bump)?;
        },
        InstructionType::BurnLstToRedeemSOL { burn_lst_amount, lst_manager_bump, lst_manager_vault_bump, lst_mint_bump ,user_withdraw_request_bump, epoch_withdraw_bump}=>{
            msg!("burn LST ix called");
            burn_lst_to_redeem_sol(program_id, accounts, burn_lst_amount, lst_manager_bump, lst_manager_vault_bump, lst_mint_bump, user_withdraw_request_bump, epoch_withdraw_bump)?;
        },
        InstructionType::UnstakeSOLFromValidator {stake_acc_index, lst_manager_bump,lst_manager_vault_bump, lst_manager_user_withdrawl_vault_bump, epoch_withdraw_bump, stake_acc_bump ,split_stake_acc_bump,stake_registry_record_bump}=>{
            unstake_sol_from_validator(program_id, accounts, stake_acc_index, lst_manager_bump, lst_manager_vault_bump, lst_manager_user_withdrawl_vault_bump, epoch_withdraw_bump, stake_acc_bump, split_stake_acc_bump, stake_registry_record_bump)?;
        },
        InstructionType::WithdrawFromSplitStake {split_stake_acc_index, lst_manager_bump, lst_manager_user_withdrawl_vault_bump, split_stake_acc_bump}=>{
            msg!("withdraw from split stake ix called");
            withdraw_from_split_stake(program_id, accounts,split_stake_acc_index, lst_manager_bump, lst_manager_user_withdrawl_vault_bump, split_stake_acc_bump)?;
        },
        InstructionType::ClaimSOLFromWithdrawVault { lst_manager_bump, lst_manager_user_withdrawl_vault_bump, user_withdraw_request_bump }=>{
            msg!("claim sol from withdraw vault ix called!!");
            claim_sol_from_withdraw_vault(program_id, accounts, lst_manager_bump, lst_manager_user_withdrawl_vault_bump, user_withdraw_request_bump)?;
        }
    }
    Ok(())
}