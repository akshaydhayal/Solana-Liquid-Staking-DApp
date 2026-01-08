import { clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, StakeProgram, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import {beforeAll, describe, it} from "bun:test";
import * as spl from "@solana/spl-token";
import * as borsh from "borsh";

let serialiseAmountSchema:borsh.Schema={
    struct:{
        amount:'u64'
    }
}

describe("lst manager tests",()=>{
    let user:Keypair;
    let lst_manager_prog:PublicKey;
    
    let lst_manager_pda:PublicKey;
    let stake_manager_pda:PublicKey;
    let lst_manager_bump:number;
    let lst_manager_pda_vault:PublicKey;
    let lst_manager_vault_bump:number;
    
    let lst_mint_pda:PublicKey;
    let lst_mint_pda_bump:number;
    let vote_acc:PublicKey;

    let connection:Connection;
    beforeAll(async()=>{
        user=Keypair.fromSecretKey(Uint8Array.from([48,182,182,234,169,224,236,113,52,199,47,66,39,2,163,52,183,44,45,27,127,49,133,151,64,70,248,16,46,218,234,198,42,180,5,68,243,235,189,56,197,37,17,85,205,189,100,191,64,74,171,3,37,193,199,195,213,54,156,198,228,15,248,188]));
        lst_manager_prog=new PublicKey("7SdQzBjEpvMjU397Nu3KtrzFB147mfjZopsYS56sZp2k");
        stake_manager_pda=new PublicKey("5AMSMnbG9ZcV5LsuwQNfBGxtqeBzoRuhJcggajkyqnu8");
    
        connection=new Connection(clusterApiUrl("devnet"),"confirmed");
        vote_acc=new PublicKey("DSQ5BLBM6UcuWP2SNpmf3TJeMbqbwTFGzVqFGufyNCgk");

        [lst_manager_pda,lst_manager_bump]=PublicKey.findProgramAddressSync([Buffer.from("lst_manager")],lst_manager_prog);
        [lst_manager_pda_vault,lst_manager_vault_bump]=PublicKey.findProgramAddressSync([Buffer.from("lst_manager_vault"), lst_manager_pda.toBuffer()], lst_manager_prog);
        [lst_mint_pda,lst_mint_pda_bump]=PublicKey.findProgramAddressSync([Buffer.from("lst_mint"), lst_manager_pda.toBuffer()],lst_manager_prog);

        console.log("user : ",user.publicKey.toBase58());
        console.log("lst manager prog : ",lst_manager_prog.toBase58());
        console.log("lst manager pda : ",lst_manager_pda.toBase58());
        console.log("lst manager pda vault : ",lst_manager_pda_vault.toBase58());
        console.log("lst mint pda : ",lst_mint_pda.toBase58());
    })

    it("initialise lst manager",async()=>{
        let ix=new TransactionInstruction({
            programId:lst_manager_prog,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                {pubkey:stake_manager_pda, isSigner:false, isWritable:true},
                {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
                {pubkey:lst_manager_pda_vault, isSigner:false, isWritable:true},
                {pubkey:lst_mint_pda, isSigner:false, isWritable:true},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
                {pubkey:spl.TOKEN_PROGRAM_ID, isSigner:false, isWritable:false}
            ],
            data:Buffer.concat([
                Buffer.from([0]),
                Buffer.from([lst_manager_bump]),
                Buffer.from([lst_manager_vault_bump]),
                Buffer.from([lst_mint_pda_bump]),
            ])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus);
        console.log("initialise lst manager tx status : ",txStatus);
    }),

    it("deposit sol test",async()=>{
        let user_lst_ata:PublicKey;
        async function createUserLstAta(){
            user_lst_ata=spl.getAssociatedTokenAddressSync(lst_mint_pda,user.publicKey, false, spl.TOKEN_PROGRAM_ID);
            let user_lst_ata_create_ix=spl.createAssociatedTokenAccountInstruction(user.publicKey, user_lst_ata,user.publicKey, lst_mint_pda, spl.TOKEN_PROGRAM_ID);
            let tx=new Transaction().add(user_lst_ata_create_ix);
            tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
            tx.sign(user);
            let txStatus=await connection.sendRawTransaction(tx.serialize());
            await connection.confirmTransaction(txStatus);
            console.log("user lst ata create tx : ", txStatus);
        }
        await createUserLstAta();

        let deposit_amount=0.1*LAMPORTS_PER_SOL;
        let serialised_deposit_amount=borsh.serialize(serialiseAmountSchema,{amount:deposit_amount});
        let ix=new TransactionInstruction({
            programId:lst_manager_prog,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                // {pubkey:stake_manager_pda, isSigner:false, isWritable:true},
                {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
                {pubkey:lst_manager_pda_vault, isSigner:false, isWritable:true},
                {pubkey:lst_mint_pda, isSigner:false, isWritable:true},
                {pubkey:user_lst_ata, isSigner:false, isWritable:true},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
                {pubkey:spl.TOKEN_PROGRAM_ID, isSigner:false, isWritable:false}
            ],
            data:Buffer.concat([
                Buffer.from([1]),
                Buffer.from(serialised_deposit_amount),
                Buffer.from([lst_manager_bump]),
                Buffer.from([lst_manager_vault_bump]),
                Buffer.from([lst_mint_pda_bump]),
            ])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus);
        console.log("deposit sol tx status : ",txStatus);
    }),

    it("stake vault test",async()=>{
        const STAKE_CONFIG_ID = new PublicKey("StakeConfig11111111111111111111111111111111");
        let epoch=(await connection.getEpochInfo()).epoch;
        let serialised_epoch=borsh.serialize(serialiseAmountSchema,{amount:epoch});
        console.log("epoch : ",epoch, serialised_epoch);
        let [stake_acc, stake_acc_bump]=PublicKey.findProgramAddressSync([Buffer.from("stake_acc"), Buffer.from(serialised_epoch), lst_manager_pda.toBuffer()], lst_manager_prog);

        console.log("stake acc : ",stake_acc.toBase58());
        let ix=new TransactionInstruction({
            programId:lst_manager_prog,
            keys:[
                {pubkey:user.publicKey, isSigner:true, isWritable:false},
                {pubkey:lst_manager_pda, isSigner:false, isWritable:true},
                {pubkey:lst_manager_pda_vault, isSigner:false, isWritable:true},
                {pubkey:stake_acc, isSigner:false, isWritable:true},
                {pubkey:vote_acc, isSigner:false, isWritable:false},
                
                {pubkey:SYSVAR_RENT_PUBKEY, isSigner:false, isWritable:false},
                {pubkey:SYSVAR_CLOCK_PUBKEY, isSigner:false, isWritable:false},
                {pubkey:SYSVAR_STAKE_HISTORY_PUBKEY, isSigner:false, isWritable:false},
                {pubkey:STAKE_CONFIG_ID, isSigner:false, isWritable:false},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
                {pubkey:StakeProgram.programId, isSigner:false, isWritable:false},
            ],
            data:Buffer.concat([
                Buffer.from([2]),
                Buffer.from([lst_manager_bump]),
                Buffer.from([lst_manager_vault_bump]),
                Buffer.from([stake_acc_bump]),
            ])
        });
        let tx=new Transaction().add(ix);
        tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        // tx.sign(user,stake_acc);
        tx.sign(user);
        let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus);
        console.log("Stake vault sol tx status : ",txStatus);
    })
})