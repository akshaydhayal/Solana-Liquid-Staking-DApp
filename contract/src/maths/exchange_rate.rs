use solana_program::{program_error::ProgramError};

pub const SCALE_RATE:u128=1_000_000_000;

    // EXCHANGE MATHS , 
    //  if Total LST supply==0 , 1slt = 1sol, rate=1
    //  else, rate of 1 lst = (Total SOL staked + Vault SOL) / Total LST supply
    //  else, rate of 1 sol= Total LST supply / (Total SOL staked + Vault SOL) 
    //  to_mint_lst_tokens =  deposit_amount / rate of 1 lst
    //  to_mint_lst_tokens =  deposit_amount * rate of 1 sol 
    
//@c add prop tests also here

pub fn lst_to_sol_rate(total_sol_lamports:u64, total_lst_supply_atomic:u64)->Result<u128,ProgramError>{
    if total_lst_supply_atomic==0{
        return Ok(SCALE_RATE);
    }
    let ans=(total_sol_lamports as u128).checked_mul(SCALE_RATE).ok_or(ProgramError::ArithmeticOverflow)?
        .checked_div(total_lst_supply_atomic as u128).ok_or(ProgramError::ArithmeticOverflow)?;
    Ok(ans)
}


pub fn calculate_lst_to_sol_amounts(lst_amount_atomic:u64, rate:u128)->Result<u64, ProgramError>{
    let sol_amount=(lst_amount_atomic as u128).checked_mul(rate).ok_or(ProgramError::ArithmeticOverflow)?;

    let sol_amount_descaled=sol_amount.checked_div(SCALE_RATE).ok_or(ProgramError::ArithmeticOverflow)?;
    Ok(sol_amount_descaled as u64)
}

pub fn sol_to_lst_rate(total_sol_lamports:u64, total_lst_supply_atomic:u64)->Result<u128,ProgramError>{
    let rate=(total_lst_supply_atomic as u128).checked_mul(SCALE_RATE).ok_or(ProgramError::ArithmeticOverflow)?
    .checked_div(total_sol_lamports as u128).ok_or(ProgramError::ArithmeticOverflow)?;
    Ok(rate)
}

pub fn calculate_sol_to_lst_amounts(sol_amount_lamports:u64, sol_to_lst_rate:u128)->Result<u64, ProgramError>{
    let lst_amount=(sol_amount_lamports as u128).checked_mul(sol_to_lst_rate).ok_or(ProgramError::ArithmeticOverflow)?;
    let lst_amount_descaled=lst_amount.checked_div(SCALE_RATE).ok_or(ProgramError::ArithmeticOverflow)?;
    Ok(lst_amount_descaled as u64)
}

//
// ============================ UNIT TESTS =============================
//
#[cfg(test)]
mod tests{
    use super::*;
    #[test]
    pub fn test_lst_to_sol_rate_fn(){
        let sol_lamports:u64=1e9 as u64;
        let lst_atomic_units:u64=2e9 as u64;
        let rate=lst_to_sol_rate(sol_lamports, lst_atomic_units).unwrap();
        assert_eq!(rate, 5e8 as u128);
    }
    #[test]
    pub fn test_lst_to_sol_rate_fn2(){
        let sol_lamports:u64=100e9 as u64;
        let lst_atomic_units:u64=90e9 as u64;
        let rate=lst_to_sol_rate(sol_lamports, lst_atomic_units).unwrap();
        assert_eq!(rate, 1111111111);
        // 100e9 lamports, 90e9 lst units , 1 lst = 100e9/90e9=1.11sol
        // 100e9*1000000000/90e9 = 1.11*10^9= 1111111111 lamports
    }
    
    #[test]
    pub fn test_overflow_for_lst_to_sol_rate(){
        let rate=lst_to_sol_rate(u64::MAX, u64::MAX);
        assert!(rate.is_ok());
    }

    #[test]
    pub fn test_calculate_lst_to_sol_amounts(){
        let rate=5e8 as u128;
        let lst_amount=15e9 as u64;
        let sol_amount=calculate_lst_to_sol_amounts(lst_amount, rate).unwrap();
        // 5e8*15e9/e9=75e8 = 7.5lst
        assert_eq!(sol_amount,7.5e9 as u64)
    }

    #[test]
    fn test_calculate_overflow() {
        let rate = u128::MAX; //rate we have assumed in protocols to be max u64::max, just casrung to u128
        let result = calculate_lst_to_sol_amounts(u64::MAX, rate);
        assert!(result.is_err());
    }

    #[test]
    pub fn test_rate_for_zero_lst_supply(){
       let sol_amount=4e9 as u64;
       let lst_supply:u64=0;
       let rate=lst_to_sol_rate(sol_amount, lst_supply).unwrap();
       assert_eq!(rate,1e9 as u128); 
    }
}


