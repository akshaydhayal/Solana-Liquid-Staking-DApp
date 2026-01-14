import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { ArrowDownUp, Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil';
import { navState } from '../state/navState';
import { Buffer } from 'buffer';
import * as borsh from "borsh";
import { lstManagerBump, lstManagerPda, lstManagerVaultBump, lstManagerVaultPda, lstMintBump, lstMintPda, PROGRAM_ID } from '../lib/constants';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from '@solana/web3.js';
import * as spl from "@solana/spl-token";
import { lstToSolExchangeRateState } from '../state/lstToSolExchangeRateState';

let serialisedAmountSchema:borsh.Schema={
    struct:{amount:'u64'}
}

const StakeCard = () => {
  const [stakeAmount, setStakeAmount] = useState<null|number>(null);
  const [userBalance, setUserBalance] = useState(0);
  let {connection}=useConnection();
  let wallet=useWallet();

  let userAddress=useRecoilValue(navState);
  let lstToSolExchangeRate=useRecoilValue(lstToSolExchangeRateState);
  console.log("user address : ",userAddress);

  async function stakeSOLToLST(){ 
    if(!userAddress.user_address || !stakeAmount){return;}
    let serialisedDepositAmount=borsh.serialize(serialisedAmountSchema,{amount: stakeAmount*LAMPORTS_PER_SOL});
    let userLstAta=spl.getAssociatedTokenAddressSync(lstMintPda, userAddress.user_address, false, spl.TOKEN_PROGRAM_ID);

    //need to create user lst ata here if not exist
    let userLstAtaDetails=await connection.getAccountInfo(userLstAta,"confirmed");
    let tx=new Transaction();
    if(!userLstAtaDetails){
        let userLstAtaCreateIx=spl.createAssociatedTokenAccountInstruction(userAddress.user_address,userLstAta,userAddress.user_address,lstMintPda,spl.TOKEN_PROGRAM_ID);
        tx.add(userLstAtaCreateIx);
    }

    let ix=new TransactionInstruction({
        programId:PROGRAM_ID,
        keys:[
            {pubkey:userAddress.user_address, isSigner:true, isWritable:true},
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
    tx.add(ix);
    // tx.recentBlockhash=(await connection.getLatestBlockhash()).blockhash;
    let txStatus=await wallet.sendTransaction(tx,connection);
    // let txStatus=await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(txStatus,"confirmed");
    console.log("user deposit sol tx status : ",txStatus);
}

  useEffect(()=>{
    async function getUserBalance(user:PublicKey){
        let userBal=await connection.getBalance(user);
        console.log("user balance : ",userBal/LAMPORTS_PER_SOL);
        setUserBalance(userBal/LAMPORTS_PER_SOL);
    }
    if(userAddress.user_address){
        getUserBalance(userAddress.user_address);
    }
  },[connection,wallet,userAddress])

  return (
    <div className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount to Stake</label>
            <div className="relative">
                <input type="number" value={stakeAmount? stakeAmount: ''} onChange={(e) => setStakeAmount(Number(e.target.value))}
                    placeholder="0.00" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-2xl font-semibold focus:outline-none focus:border-purple-500 transition-colors"/>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-gray-400 font-medium">SOL</span>
                    <button className="text-sm text-purple-400 hover:text-purple-300 font-medium cursor-pointer" onClick={()=>{
                        setStakeAmount(userBalance/2);
                    }}>HALF</button>
                    <button className="text-sm text-purple-400 hover:text-purple-300 font-medium cursor-pointer" onClick={()=>{
                        setStakeAmount(userBalance);
                    }}>MAX</button>
                </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>Balance: {userBalance} SOL</span>
                {/* <span>≈ $12,525.00</span> */}
            </div>
        </div>

        <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border-2 border-gray-700">
                <ArrowDownUp size={18} className="text-gray-400" />
            </div>  
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">You Will Receive</label>
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4">
                <div className="text-2xl font-semibold">
                    {/* {stakeAmount ? (stakeAmount / parseFloat(stats.exchangeRate)).toFixed(4) : '0.00'} */}
                    {stakeAmount ? (stakeAmount / lstToSolExchangeRate).toFixed(4) : '0.00'}
                </div>
                <div className="text-sm text-gray-400 mt-1">dSOL LST Tokens</div>
            </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4 flex gap-3">
            <Info size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Instant Liquidity</p>
                <p>Your dSOL LST tokens are immediately liquid and can be used in DeFi while earning staking rewards.</p>
            </div>
        </div>

        <button disabled={!userAddress.user_address || !stakeAmount} onClick={stakeSOLToLST}
             className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-semibold text-lg transition-all">
            {!userAddress.user_address? 'Connect Wallet' : 'Stake SOL'}
        </button>
    </div>
  )
}
export default StakeCard