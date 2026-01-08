use borsh::{BorshSerialize, BorshDeserialize};
use solana_program::pubkey::Pubkey;

#[derive(BorshSerialize, BorshDeserialize)]
pub struct LSTManager{
    pub admin:Pubkey,
    pub stake_manager:Pubkey,
    pub lst_mint:Pubkey,
    pub total_sol_staked:u64,  
    pub total_lst_supply:u64 //@q required or not
}
impl LSTManager{
    pub const LST_MANAGER_SIZE:usize=32+32+32+8+8;
}