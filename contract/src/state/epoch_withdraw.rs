use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize)]
pub struct EpochWithdraw{
    // pub user:Pubkey,
    pub sol_amount_to_unstake:u64,
    pub requested_epoch:u64,
    pub finalised:bool
}
impl EpochWithdraw{
    pub const LEN:usize=17;
}