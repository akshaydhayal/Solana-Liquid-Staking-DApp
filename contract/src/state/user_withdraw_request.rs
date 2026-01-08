use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize)]
pub struct UserWithdrawRequest{
    pub user:Pubkey,
    pub sol_amount_to_withdraw:u64,
    pub requested_epoch:u64,
    pub withdraw_status:UserWithdrawStatus
}
impl UserWithdrawRequest{
    pub const LEN:usize=49;
}

#[derive(BorshSerialize, BorshDeserialize, PartialEq)]
pub enum UserWithdrawStatus{
    PENDING,
    COMPLETED
    // CANCELLED
}