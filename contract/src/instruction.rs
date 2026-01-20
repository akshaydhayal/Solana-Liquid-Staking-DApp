use borsh::{BorshSerialize, BorshDeserialize};
#[derive(BorshDeserialize, BorshSerialize)]
pub enum InstructionType{
    InitialiseLST{ lst_manager_bump:u8, lst_manager_vault_bump:u8, lst_manager_user_withdrawl_vault_bump:u8, lst_mint_bump:u8, stake_registry_record_bump:u8},
    DepositSOLToVault{ deposit_amount:u64, lst_manager_bump:u8, lst_manager_vault_bump:u8, lst_mint_bump:u8},
    StakeVaultSOLToValidator{lst_manager_bump:u8, lst_manager_vault_bump:u8, stake_acc_bump:u8, stake_registry_record_bump:u8},
    
    BurnLstToRedeemSOL{burn_lst_amount:u64, lst_manager_bump:u8, lst_manager_vault_bump:u8, lst_mint_bump:u8, user_withdraw_request_bump:u8, epoch_withdraw_bump:u8}, //by user
    UnstakeSOLFromValidator{stake_acc_index:u64, lst_manager_bump:u8, lst_manager_vault_bump:u8, lst_manager_user_withdrawl_vault_bump:u8, epoch_withdraw_bump:u8, stake_acc_bump:u8, split_stake_acc_bump:u8, stake_registry_record_bump:u8}, // by admin

    WithdrawFromSplitStake{split_stake_acc_index:u64, lst_manager_bump:u8, lst_manager_user_withdrawl_vault_bump:u8, split_stake_acc_bump:u8}, //by admin after split acc enter deactivated state  
    ClaimSOLFromWithdrawVault{lst_manager_bump:u8, lst_manager_user_withdrawl_vault_bump:u8, user_withdraw_request_bump:u8} //by user to get sol redemeed on burning LST Tokens
}