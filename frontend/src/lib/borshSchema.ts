import * as borsh from "borsh";

export let lstManagerPdaSchema:borsh.Schema={
    struct:{
        admin:{array:{type:'u8',len:32}},
        lst_mint:{array:{type:'u8',len:32}},
        total_sol_staked:'u64',  
        total_lst_supply:'u64',
        total_pending_withdrawl_sol:'u64'
    }
}

export let UserWithdrawRequestPdaSchema:borsh.Schema={
    struct:{
        user:{array:{type:'u8',len:32}},
        sol_amount_user_gets:'u64',  
        requested_epoch:'u64',  
        withdraw_status:'u8'
    }
}

export let StakeRegistryRecordSchema:borsh.Schema={
    struct:{
        next_stake_index:'u64',
        next_split_index:'u64'
    }
}

export let valueToU64Schema:borsh.Schema={
    struct:{value:'u64'}
}

//valid only for stake discrimintaor 2, staked type
export let stakeAccountsSchema:borsh.Schema={
    struct:{
        stake_discriminator:'u32',

        meta_rent_exempt_resever:'u64',
        meta_auth_staker:{array:{type:'u8',len:32}},
        meta_auth_withdrawer:{array:{type:'u8',len:32}},
        meta_lockup_unix_timestamp:'u64',
        meta_lockup_epoch:'u64',
        meta_lockup_custodian:{array:{type:'u8',len:32}},

        stake_delegation_voter_acc:{array:{type:'u8',len:32}},
        stake_delegation_stake_amount:'u64',
        stake_delegation_activation_epoch:'u64',
        stake_delegation_deactivation_epoch:'u64',
        stake_delegation_warmup_cooldown_rate:'u64',
        stake_credits_observed:'u64',

        stake_flags:'u32'
    }
}