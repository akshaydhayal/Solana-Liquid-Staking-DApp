import { PublicKey } from "@solana/web3.js";
import { Buffer } from "buffer";

export const PROGRAM_ID=new PublicKey("4LmHLiVM1CXuNxKwpHMepnDQyzDjp4hvRY1KHBqovgbt");  //test localhost program
// export const PROGRAM_ID=new PublicKey("8zmqASz5ix2FkcqSHn9C5ZpsWGSuiApGW8XEkxhNZ6Nu");   //deployed vercel program

export const [lstManagerPda, lstManagerBump]=PublicKey.findProgramAddressSync([Buffer.from("lst_manager")], PROGRAM_ID);
export const [lstManagerVaultPda, lstManagerVaultBump]=PublicKey.findProgramAddressSync([Buffer.from("lst_manager_vault"), lstManagerPda.toBuffer()], PROGRAM_ID);
export const [lstManagerWithdrawVaultPda, lstManagerWithdrawVaultBump]=PublicKey.findProgramAddressSync([Buffer.from("lst_manager_user_withdrawl_vault"), lstManagerPda.toBuffer()], PROGRAM_ID);
export const [lstMintPda, lstMintBump]=PublicKey.findProgramAddressSync([Buffer.from("lst_mint"), lstManagerPda.toBuffer()], PROGRAM_ID);

export const [stakeRegistryRecordPda, stakeRegistryRecordBump]=PublicKey.findProgramAddressSync([Buffer.from("stake_registry_record"), lstManagerPda.toBuffer()], PROGRAM_ID);




//main stake account 40 sol delegate at start, now rem 10 sol delegated : https://explorer.solana.com/address/Hz7LM2jZVerADAtQkHPJXAdQDnk2juMe9yDVd8KHkVnw?cluster=devnet
//split account has 30.94560219 SOL, deactivating state: https://explorer.solana.com/address/6QmXWVAzALsj1j8ucFyG3GqBVBQZp4g5ZpJQRGhusrge/rewards?cluster=devnet

// and bk user has request withdra of 30.94560219 SOL, that he should be withdraw about epoch 1007 ends
