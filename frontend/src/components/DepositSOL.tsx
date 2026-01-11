import { LAMPORTS_PER_SOL, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { useState } from "react"
import { lstManagerBump, lstManagerPda, lstManagerVaultBump, lstManagerVaultPda, lstMintBump, lstMintPda, PROGRAM_ID } from "../lib/constants";
import { Buffer } from "buffer";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import * as spl from "@solana/spl-token";
import * as borsh from "borsh";

let serialisedAmountSchema:borsh.Schema={
    struct:{
        amount:'u64'
    }
}

export default function DepositSOL(){
    let {connection}=useConnection();
    let [depositAmount,setDepositAmount]=useState(0);
    let wallet=useWallet();
    
    async function depositSOLToLST(){
        if(!wallet.publicKey){
            return;
        }
        console.log("user wallet key : ",wallet.publicKey.toBase58());

        let serialisedDepositAmount=borsh.serialize(serialisedAmountSchema,{amount: depositAmount*LAMPORTS_PER_SOL});
        console.log("serialisedDepositAmount :  ",serialisedDepositAmount);
        let userLstAta=spl.getAssociatedTokenAddressSync(lstMintPda, wallet.publicKey, false, spl.TOKEN_PROGRAM_ID);
        console.log("user lst ata : ",userLstAta.toBase58());
        let ix=new TransactionInstruction({
            programId:PROGRAM_ID,
            keys:[
                {pubkey:wallet.publicKey, isSigner:true, isWritable:true},
                {pubkey:lstManagerPda, isSigner:false, isWritable:true},
                {pubkey:lstManagerVaultPda, isSigner:false, isWritable:true},
                {pubkey:lstMintPda, isSigner:false, isWritable:true},
                {pubkey:userLstAta, isSigner:false, isWritable:true},
                {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
                {pubkey:spl.TOKEN_PROGRAM_ID, isSigner:false, isWritable:false},
            ],
            data:Buffer.concat([
                Buffer.from([1]),
                Buffer.from(serialisedDepositAmount),
                Buffer.from([lstManagerBump]),
                Buffer.from([lstManagerVaultBump]),
                Buffer.from([lstMintBump]),
            ])
        });
        let tx=new Transaction().add(ix);
        // tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
        let txStatus=await wallet.sendTransaction(tx,connection);
        // let txStatus=await connection.sendRawTransaction(tx.serialize());
        await connection.confirmTransaction(txStatus,"confirmed");
        console.log("tx status : ",txStatus);
    }
    return(
        <div>
            <h1>Deposit SOL</h1>
            <p>Enter SOL Amount</p>
            <input type="number" placeholder="enter sol" onChange={(e)=>{
                setDepositAmount(Number(e.target.value));
            }}/>
            <button onClick={depositSOLToLST}>Depsoit SOL in LST pool</button>
        </div>
    )
}