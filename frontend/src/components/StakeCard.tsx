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
//   const [stakeAmount, setStakeAmount] = useState<null|number>(null);
  const [stakeAmount, setStakeAmount] = useState(0);
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
            <label className="block text-sm font-medium text-blue-300 mb-2">Amount to Stake</label>
            <div className="relative">
                {/* <input type="number" value={stakeAmount? stakeAmount: ''} onChange={(e) => setStakeAmount(Number(e.target.value))} */}
                {/* <input type="number" min="0" value={stakeAmount} onChange={(e) => setStakeAmount( (Number(e.target.value)>=0) ? Number(e.target.value): (Number(e.target.value)*-1))} */}
                <input type="number" min="0" value={stakeAmount} onChange={(e) => setStakeAmount( (Number(e.target.value)>=0) ? Number(e.target.value): (Number(e.target.value)*-1))}
                    // placeholder="0.00" className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border-2 border-blue-500/30 text-white rounded-xl px-4 py-4 text-2xl font-semibold focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-all"/>
                    placeholder="0.00" className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border-2 border-blue-500/30 text-blue-300 rounded-xl px-4 py-4 text-2xl font-semibold focus:outline-none focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20 transition-all"/>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-blue-300 font-medium">SOL</span>
                    <button className="text-sm text-blue-400 hover:text-blue-300 font-medium cursor-pointer px-2 py-1 rounded hover:bg-blue-500/10 transition-colors" onClick={()=>{
                        setStakeAmount(userBalance/2);
                    }}>HALF</button>
                    <button className="text-sm text-blue-400 hover:text-blue-300 font-medium cursor-pointer px-2 py-1 rounded hover:bg-blue-500/10 transition-colors" onClick={()=>{
                        setStakeAmount(userBalance);
                    }}>MAX</button>
                </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>Balance: <span className="text-blue-300 font-medium">{userBalance} SOL</span></span>
                {/* <span>≈ $12,525.00</span> */}
            </div>
        </div>

        <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-full flex items-center justify-center border-2 border-blue-500/30 shadow-lg shadow-blue-500/10">
                <ArrowDownUp size={20} className="text-blue-400" />
            </div>  
        </div>

        <div>
            <label className="block text-sm font-medium text-blue-300 mb-2">You Will Receive</label>
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-2 border-blue-500/30 rounded-xl px-4 py-4 shadow-lg shadow-blue-500/10">
                <div className="text-2xl font-semibold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    {/* {stakeAmount ? (stakeAmount / parseFloat(stats.exchangeRate)).toFixed(4) : '0.00'} */}
                    {stakeAmount ? (stakeAmount / lstToSolExchangeRate).toFixed(4) : '0.00'}
                </div>
                <div className="text-sm text-gray-400 mt-1">dSOL LST Tokens</div>
            </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/20 border-2 border-purple-500/30 rounded-lg p-4 flex gap-3 shadow-lg shadow-purple-500/10">
            <Info size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Instant Liquidity</p>
                <p className="text-gray-400">Your dSOL LST tokens are immediately liquid and can be used in DeFi while earning staking rewards.</p>
            </div>
        </div>

        <button disabled={!userAddress.user_address || !stakeAmount} onClick={stakeSOLToLST}
             className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-semibold text-lg transition-all duration-200 cursor-pointer text-white shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30">
            {!userAddress.user_address? 'Connect Wallet' : 'Stake SOL'}
        </button>
    </div>
  )
}
export default StakeCard