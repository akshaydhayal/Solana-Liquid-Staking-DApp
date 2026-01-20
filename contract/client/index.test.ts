import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, StakeProgram, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import {beforeAll, describe, it} from "bun:test";
import * as spl from "@solana/spl-token";
import * as borsh from "borsh";

let serialiseAmountSchema:borsh.Schema={
    struct:{
        amount:'u64'
    }
}
let stakeRegistryRecordSchema:borsh.Schema={
    struct:{
        next_stake_index:'u64',
        next_split_index:'u64',
    }
};

describe("lst manager tests",()=>{
    let user:Keypair;
    let lst_manager_prog:PublicKey;
    
    let lst_manager_pda:PublicKey;
    let lst_manager_pda_vault:PublicKey;
    let lst_manager_user_withdrawl_pda_vault:PublicKey;
    let stake_registry_record_pda:PublicKey;
    
    let lst_manager_bump:number;
    let lst_manager_vault_bump:number;
    let lst_manager_user_withdrawl_vault_bump:number;
    let stake_registry_record_bump:number;
    
    let lst_mint_pda:PublicKey;
    let lst_mint_pda_bump:number;
    let vote_acc:PublicKey;

    let connection:Connection;
    beforeAll(async()=>{ 
        user=Keypair.fromSecretKey(Uint8Array.from([48,182,182,234,169,224,236,113,52,199,47,66,39,2,163,52,183,44,45,27,127,49,133,151,64,70,248,16,46,218,234,198,42,180,5,68,243,235,189,56,197,37,17,85,205,189,100,191,64,74,171,3,37,193,199,195,213,54,156,198,228,15,248,188]));
        // lst_manager_prog=new PublicKey("8zmqASz5ix2FkcqSHn9C5ZpsWGSuiApGW8XEkxhNZ6Nu");  //deployed site program
        lst_manager_prog=new PublicKey("4LmHLiVM1CXuNxKwpHMepnDQyzDjp4hvRY1KHBqovgbt");   //test localhost
    
        connection=new Connection(clusterApiUrl("devnet"),"confirmed");
        vote_acc=new PublicKey("DSQ5BLBM6UcuWP2SNpmf3TJeMbqbwTFGzVqFGufyNCgk");

        [lst_manager_pda,lst_manager_bump]=PublicKey.findProgramAddressSync([Buffer.from("lst_manager")],lst_manager_prog);
        [lst_manager_pda_vault,lst_manager_vault_bump]=PublicKey.findProgramAddressSync([Buffer.from("lst_manager_vault"), lst_manager_pda.toBuffer()], lst_manager_prog);
        [lst_manager_user_withdrawl_pda_vault,lst_manager_user_withdrawl_vault_bump]=PublicKey.findProgramAddressSync([Buffer.from("lst_manager_user_withdrawl_vault"), lst_manager_pda.toBuffer()], lst_manager_prog);
        
        [stake_registry_record_pda,stake_registry_record_bump]=PublicKey.findProgramAddressSync([Buffer.from("stake_registry_record"), lst_manager_pda.toBuffer()], lst_manager_prog);
        [lst_mint_pda,lst_mint_pda_bump]=PublicKey.findProgramAddressSync([Buffer.from("lst_mint"), lst_manager_pda.toBuffer()],lst_manager_prog);

        console.log("user : ",user.publicKey.toBase58());
        console.log("lst manager prog : ",lst_manager_prog.toBase58());
        console.log("lst manager pda : ",lst_manager_pda.toBase58());
        console.log("lst manager pda vault : ",lst_manager_pda_vault.toBase58());
        console.log("lst_manager_user_withdrawl_pda_vault : ",lst_manager_user_withdrawl_pda_vault.toBase58());
        console.log("stake_registry_record_pda : ",stake_registry_record_pda.toBase58());
        console.log("lst mint pda : ",lst_mint_pda.toBase58());
    })

    it("initialise lst manager",async()=>{
        let ix=new TransactionInstruction({
            programId:lst_manager_prog,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                // {pubkey:stake_manager_pda, isSigner:false, isWritable:true},
                {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
                {pubkey:lst_manager_pda_vault, isSigner:false, isWritable:true},
                {pubkey:lst_manager_user_withdrawl_pda_vault, isSigner:false, isWritable:true},

                {pubkey:lst_mint_pda, isSigner:false, isWritable:true},
                {pubkey:stake_registry_record_pda, isSigner:false, isWritable:true},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
                {pubkey:spl.TOKEN_PROGRAM_ID, isSigner:false, isWritable:false}
            ],
            data:Buffer.concat([
                Buffer.from([0]),
                Buffer.from([lst_manager_bump]),
                Buffer.from([lst_manager_vault_bump]),
                Buffer.from([lst_manager_user_withdrawl_vault_bump]),
                Buffer.from([lst_mint_pda_bump]),
                Buffer.from([stake_registry_record_bump]),
            ])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus);
        console.log("initialise lst manager tx status : ",txStatus);
    })

    // it("deposit sol test",async()=>{
    //     let user_lst_ata:PublicKey;
    //     async function createUserLstAta(){
    //         user_lst_ata=spl.getAssociatedTokenAddressSync(lst_mint_pda,user.publicKey, false, spl.TOKEN_PROGRAM_ID);
    //         let user_lst_ata_create_ix=spl.createAssociatedTokenAccountInstruction(user.publicKey, user_lst_ata,user.publicKey, lst_mint_pda, spl.TOKEN_PROGRAM_ID);
    //         let tx=new Transaction().add(user_lst_ata_create_ix);
    //         tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
    //         tx.sign(user);
    //         let txStatus=await connection.sendRawTransaction(tx.serialize());
    //         await connection.confirmTransaction(txStatus);
    //         console.log("user lst ata create tx : ", txStatus);
    //     }
    //     await createUserLstAta();

    //     let deposit_amount=0.1*LAMPORTS_PER_SOL;
    //     let serialised_deposit_amount=borsh.serialize(serialiseAmountSchema,{amount:deposit_amount});
    //     let ix=new TransactionInstruction({
    //         programId:lst_manager_prog,
    //         keys:[
    //             {pubkey:user.publicKey, isSigner:true, isWritable:false},
    //             {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
    //             {pubkey:lst_manager_pda_vault, isSigner:false, isWritable:true},
    //             {pubkey:lst_mint_pda, isSigner:false, isWritable:true},
    //             {pubkey:user_lst_ata, isSigner:false, isWritable:true},
    //             {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
    //             {pubkey:spl.TOKEN_PROGRAM_ID, isSigner:false, isWritable:false}
    //         ],
    //         data:Buffer.concat([
    //             Buffer.from([1]),
    //             Buffer.from(serialised_deposit_amount),
    //             Buffer.from([lst_manager_bump]),
    //             Buffer.from([lst_manager_vault_bump]),
    //             Buffer.from([lst_mint_pda_bump]),
    //         ])
    //     });
    //     let tx=new Transaction().add(ix);
    //     tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
    //     tx.sign(user);
    //     let txStatus=await connection.sendRawTransaction(tx.serialize());
    //     await connection.confirmTransaction(txStatus);
    //     console.log("deposit sol tx status : ",txStatus);
    // }),

    // it("stake vault test",async()=>{
    //     const STAKE_CONFIG_ID = new PublicKey("StakeConfig11111111111111111111111111111111");
    //     let epoch=(await connection.getEpochInfo()).epoch;
    //     let serialised_epoch=borsh.serialize(serialiseAmountSchema,{amount:epoch});
    //     console.log("epoch : ",epoch, serialised_epoch);

    //     let stake_registry_record_pda_data=await connection.getAccountInfo(stake_registry_record_pda,"confirmed");
    //     let deserialised_stake_registry_record_pda_data=borsh.deserialize(stakeRegistryRecordSchema, stake_registry_record_pda_data?.data);
    //     console.log("deserialised_stake_registry_record_pda_data : ",deserialised_stake_registry_record_pda_data);
    //     let next_stake_index=deserialised_stake_registry_record_pda_data.next_stake_index;
    //     let serialised_next_stake_index=borsh.serialize(serialiseAmountSchema, {amount:next_stake_index});
    //     console.log("serialised_next_stake_index : ",serialised_next_stake_index);

    //     // let [stake_acc, stake_acc_bump]=PublicKey.findProgramAddressSync([Buffer.from("stake_acc"), Buffer.from(serialised_epoch), lst_manager_pda.toBuffer()], lst_manager_prog);
    //     let [stake_acc, stake_acc_bump]=PublicKey.findProgramAddressSync([Buffer.from("stake_acc"), Buffer.from(serialised_next_stake_index), lst_manager_pda.toBuffer()], lst_manager_prog);

    //     console.log("stake acc : ",stake_acc.toBase58());
    //     let ix=new TransactionInstruction({
    //         programId:lst_manager_prog,
    //         keys:[
    //             {pubkey:user.publicKey, isSigner:true, isWritable:false},
    //             {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
    //             {pubkey:lst_manager_pda_vault, isSigner:false, isWritable:true},
    //             {pubkey:stake_acc, isSigner:false, isWritable:true},
    //             {pubkey:vote_acc, isSigner:false, isWritable:false},
    //             {pubkey:stake_registry_record_pda, isSigner:false, isWritable:true},
                
    //             {pubkey:SYSVAR_RENT_PUBKEY, isSigner:false, isWritable:false},
    //             {pubkey:SYSVAR_CLOCK_PUBKEY, isSigner:false, isWritable:false},
    //             {pubkey:SYSVAR_STAKE_HISTORY_PUBKEY, isSigner:false, isWritable:false},
    //             {pubkey:STAKE_CONFIG_ID, isSigner:false, isWritable:false},
    //             {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
    //             {pubkey:StakeProgram.programId, isSigner:false, isWritable:false},
    //         ],
    //         data:Buffer.concat([
    //             Buffer.from([2]),
    //             Buffer.from([lst_manager_bump]), 
    //             Buffer.from([lst_manager_vault_bump]),
    //             Buffer.from([stake_acc_bump]),
    //             Buffer.from([stake_registry_record_bump]),
    //         ])
    //     });
    //     let tx=new Transaction().add(ix);
    //     tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
    //     // tx.sign(user,stake_acc);
    //     tx.sign(user);
    //     let txStatus=await connection.sendRawTransaction(tx.serialize());
    //     await connection.confirmTransaction(txStatus);
    //     console.log("Stake vault sol tx status : ",txStatus);
    // }),

    // it("burn lst tokens to get sol back",async()=>{
    //     let user_lst_ata=spl.getAssociatedTokenAddressSync(lst_mint_pda, user.publicKey, false,spl.TOKEN_PROGRAM_ID);
    //     let [user_withdraw_request_pda,user_withdraw_request_bump]=PublicKey.findProgramAddressSync([Buffer.from("user_withdraw_request"), user.publicKey.toBuffer()], lst_manager_prog);
        
    //     let epoch=(await connection.getEpochInfo()).epoch;
    //     let serialised_epoch=borsh.serialize(serialiseAmountSchema, {amount:epoch});
    //     let [epoch_withdraw_pda, epoch_withdraw_bump]=PublicKey.findProgramAddressSync([Buffer.from("epoch_withdraw"), Buffer.from(serialised_epoch)], lst_manager_prog);
        
    //     console.log("user_withdraw_request_pda : ",user_withdraw_request_pda.toBase58());
    //     console.log("epoch_withdraw_pda : ",epoch_withdraw_pda.toBase58());
    //     console.log("user lst ata : ",user_lst_ata.toBase58());

    //     let burn_lst_amount=0.1*LAMPORTS_PER_SOL;
    //     let serialised_burn_lst_amount=borsh.serialize(serialiseAmountSchema,{amount:burn_lst_amount});
    //     let ix=new TransactionInstruction({
    //         programId:lst_manager_prog,
    //         keys:[
    //             {pubkey:user.publicKey, isSigner:true, isWritable:true},
    //             {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
    //             {pubkey:lst_manager_pda_vault, isSigner:false, isWritable:false},
    //             {pubkey:lst_mint_pda, isSigner:false, isWritable:true},
    //             {pubkey:user_lst_ata, isSigner:false, isWritable:true},
    //             {pubkey:user_withdraw_request_pda, isSigner:false, isWritable:true},
    //             {pubkey:epoch_withdraw_pda, isSigner:false, isWritable:true},
    //             {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
    //             {pubkey:spl.TOKEN_PROGRAM_ID, isSigner:false, isWritable:false},
    //         ],
    //         data:Buffer.concat([
    //             Buffer.from([3]),
    //             Buffer.from(serialised_burn_lst_amount),
    //             Buffer.from([lst_manager_bump]),
    //             Buffer.from([lst_manager_vault_bump]),
    //             Buffer.from([lst_mint_pda_bump]),
    //             Buffer.from([user_withdraw_request_bump]),
    //             Buffer.from([epoch_withdraw_bump]),
    //         ])
    //     })
    //     let tx=new Transaction().add(ix);
    //     tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
    //     tx.sign(user);
    //     let txStatus=await connection.sendRawTransaction(tx.serialize());
    //     await connection.confirmTransaction(txStatus,"confirmed");
    //     console.log("burn lst tokens : ",txStatus);
    // }),

    // it("unstake sol from vote accounts",async()=>{
    //     let epoch=(await connection.getEpochInfo()).epoch;
    //     let serialised_epoch=borsh.serialize(serialiseAmountSchema, {amount:epoch});
    //     let [epoch_withdraw_pda, epoch_withdraw_bump]=PublicKey.findProgramAddressSync([Buffer.from("epoch_withdraw"), Buffer.from(serialised_epoch)], lst_manager_prog);
        
    //     console.log("epoch_withdraw_pda : ",epoch_withdraw_pda.toBase58());

    //     let stake_registry_record_pda_data=await connection.getAccountInfo(stake_registry_record_pda,"confirmed");
    //     let deserialised_stake_registry_record_pda_data=borsh.deserialize(stakeRegistryRecordSchema, stake_registry_record_pda_data?.data);
    //     console.log("deserialised_stake_registry_record_pda_data : ",deserialised_stake_registry_record_pda_data);
    //     let next_split_index=deserialised_stake_registry_record_pda_data.next_split_index;
    //     let serialised_next_split_index=borsh.serialize(serialiseAmountSchema, {amount:next_split_index});
    //     console.log("serialised_next_split_index : ",serialised_next_split_index);
        
    //     let serialised_stake_acc_index=borsh.serialize(serialiseAmountSchema, {amount:1});
    //     let [stake_acc_pda, stake_acc_pda_bump]=PublicKey.findProgramAddressSync([Buffer.from("stake_acc"), Buffer.from(serialised_stake_acc_index), lst_manager_pda.toBuffer()],lst_manager_prog);
    //     let [split_stake_acc_pda, split_stake_acc_bump]=PublicKey.findProgramAddressSync([Buffer.from("split_stake_acc"), Buffer.from(serialised_next_split_index), lst_manager_pda.toBuffer()],lst_manager_prog);
        
    //     console.log("stake_acc_pda : ",stake_acc_pda.toBase58());
    //     console.log("split stake_acc_pda : ",split_stake_acc_pda.toBase58());

    //     let ix=new TransactionInstruction({
    //         programId:lst_manager_prog,
    //         keys:[
    //             {pubkey:user.publicKey, isSigner:true, isWritable:true},
    //             {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
    //             {pubkey:lst_manager_pda_vault, isSigner:false, isWritable:false},

    //             {pubkey:epoch_withdraw_pda, isSigner:false, isWritable:true},
    //             {pubkey:stake_acc_pda, isSigner:false, isWritable:true},
    //             {pubkey:split_stake_acc_pda, isSigner:false, isWritable:true},
    //             {pubkey:stake_registry_record_pda, isSigner:false, isWritable:true},
    //             {pubkey:SYSVAR_CLOCK_PUBKEY, isSigner:false, isWritable:false},
    //             {pubkey:StakeProgram.programId, isSigner:false, isWritable:false},
    //             {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
    //         ],
    //         data:Buffer.concat([
    //             Buffer.from([4]),
    //             Buffer.from(serialised_stake_acc_index),
    //             Buffer.from([lst_manager_bump]),
    //             Buffer.from([lst_manager_vault_bump]),
    //             Buffer.from([epoch_withdraw_bump]),
    //             Buffer.from([stake_acc_pda_bump]),
    //             Buffer.from([split_stake_acc_bump]),
    //             Buffer.from([stake_registry_record_bump]),
    //         ])
    //     })
    //     let tx=new Transaction().add(ix);
    //     tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
    //     tx.sign(user);
    //     let txStatus=await connection.sendRawTransaction(tx.serialize());
    //     await connection.confirmTransaction(txStatus,"confirmed");
    //     console.log("unstake sol from vote account tx : ",txStatus);
    // }),

    // it("withdraw sol from deactivated split accounts by admin",async()=>{
    //     //@c FIND THE SPLIT STAKE ACC INDEX FRO WHICH WE HAVE TO WITHDRAW,
    //     // FOR NOW MOCKING FOR SPLIT INDEX 1
    //     // client work here: check which split stake account is in deactivate state. and make it to
    //     // withdraw to user withdraw vault, simpe like split 1 , split 2, split 3 all in deactivate
    //     // state, send each split account index to this ix simply. and this will with withdraw to withdrawl vault
    //     //client can make a optimsation like check from index 1 to split index index in stake registry pda.
    //     // for all these index, make admin to call this instruction.
    
    //     let withdrawl_split_stake_acc_index=1;
    //     let serialised_split_acc_index=borsh.serialize(serialiseAmountSchema, {amount:withdrawl_split_stake_acc_index});
    //     console.log("serialised_split_acc_index : ",serialised_split_acc_index);
    //     let [split_stake_acc_pda, split_stake_acc_bump]=PublicKey.findProgramAddressSync([Buffer.from("split_stake_acc"), Buffer.from(serialised_split_acc_index), lst_manager_pda.toBuffer()],lst_manager_prog);        
    //     console.log("split stake_acc_pda : ",split_stake_acc_pda.toBase58());

    //     let ix=new TransactionInstruction({
    //         programId:lst_manager_prog,
    //         keys:[
    //             {pubkey:user.publicKey, isSigner:true, isWritable:true},
    //             {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
    //             {pubkey:lst_manager_user_withdrawl_pda_vault, isSigner:false, isWritable:true},
    //             {pubkey:split_stake_acc_pda, isSigner:false, isWritable:true},

    //             {pubkey:SYSVAR_CLOCK_PUBKEY, isSigner:false, isWritable:false},
    //             {pubkey:SYSVAR_STAKE_HISTORY_PUBKEY, isSigner:false, isWritable:false},
    //             {pubkey:StakeProgram.programId, isSigner:false, isWritable:false}
    //         ],
    //         data:Buffer.concat([
    //             Buffer.from([5]),
    //             Buffer.from(serialised_split_acc_index),
    //             Buffer.from([lst_manager_bump]),
    //             Buffer.from([lst_manager_user_withdrawl_vault_bump]),
    //             Buffer.from([split_stake_acc_bump]),
    //         ])
    //     })
    //     let tx=new Transaction().add(ix);
    //     tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
    //     tx.sign(user);
    //     let txStatus=await connection.sendRawTransaction(tx.serialize());
    //     await connection.confirmTransaction(txStatus,"confirmed");
    //     console.log("withdraw sol from split stake account tx : ",txStatus);
    // })

})