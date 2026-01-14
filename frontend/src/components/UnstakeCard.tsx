import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ArrowDownUp, Clock } from "lucide-react"
import { useEffect, useState } from "react";
import { lstManagerBump, lstManagerPda, lstManagerVaultBump, lstManagerVaultPda, lstMintBump, lstMintPda, PROGRAM_ID } from "../lib/constants";
import { useRecoilValue } from "recoil";
import { navState } from "../state/navState";
import * as spl from "@solana/spl-token";
import { Buffer } from "buffer";
import * as borsh from "borsh";
import { lstToSolExchangeRateState } from "../state/lstToSolExchangeRateState";

let serialisedU64Schema:borsh.Schema={
    struct:{value:'u64'}
}

const UnstakeCard = () => {
  const [unstakeAmount, setUnstakeAmount] = useState<null|number>(null);
  const [userLstBalance, setUserLstBalance] = useState(0);
  let {connection}=useConnection();
  let wallet=useWallet();

  let userAddress=useRecoilValue(navState);
  let lstToSolExchangeRate=useRecoilValue(lstToSolExchangeRateState);

  useEffect(()=>{
    async function getUserTokenBalance(){
        if(!userAddress.user_address){return;}
        let userLstAta=spl.getAssociatedTokenAddressSync(lstMintPda,userAddress.user_address,false,spl.TOKEN_PROGRAM_ID);
        let userLstBal=(await connection.getTokenAccountBalance(userLstAta)).value.uiAmount;
        if(!userLstBal){
            console.log("failed to fetch user lst balance");
            return;
        }
        setUserLstBalance(userLstBal);
    }
    getUserTokenBalance();
  },[connection,wallet,userAddress])

  async function unstakeLST(){
    if(!userAddress.user_address || !unstakeAmount || !wallet){return;}
    let userLstAta=spl.getAssociatedTokenAddressSync(lstMintPda,userAddress.user_address,false,spl.TOKEN_PROGRAM_ID);
    let [userWithdrawRequestPda,userWithdrawRequestBump]=PublicKey.findProgramAddressSync([Buffer.from("user_withdraw_request"), userAddress.user_address?.toBuffer()],PROGRAM_ID);
    
    let serialisedUnstakeAmount=borsh.serialize(serialisedU64Schema,{value:unstakeAmount*LAMPORTS_PER_SOL});    
    let epoch=(await connection.getEpochInfo()).epoch;
    let serialisedEpoch=borsh.serialize(serialisedU64Schema,{value:epoch});
    let [epochWithdrawPda,epochWithdrawBump]=PublicKey.findProgramAddressSync([Buffer.from("epoch_withdraw"), Buffer.from(serialisedEpoch)], PROGRAM_ID);
    
    let ix=new TransactionInstruction({
        programId:PROGRAM_ID,
        keys:[
            {pubkey:userAddress.user_address, isSigner:true, isWritable:true},
            {pubkey:lstManagerPda, isSigner:false, isWritable:true},
            {pubkey:lstManagerVaultPda, isSigner:false, isWritable:false},
            {pubkey:lstMintPda, isSigner:false, isWritable:true},
            {pubkey:userLstAta, isSigner:false, isWritable:true},
            {pubkey:userWithdrawRequestPda, isSigner:false, isWritable:true},
            {pubkey:epochWithdrawPda, isSigner:false, isWritable:true},
            {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
            {pubkey:spl.TOKEN_PROGRAM_ID, isSigner:false, isWritable:false},
        ],
        data:Buffer.concat([
            Buffer.from([3]),
            Buffer.from(serialisedUnstakeAmount),
            Buffer.from([lstManagerBump]),
            Buffer.from([lstManagerVaultBump]),
            Buffer.from([lstMintBump]),
            Buffer.from([userWithdrawRequestBump]),
            Buffer.from([epochWithdrawBump]),
        ])
    });
    let tx=new Transaction().add(ix);
    let txStatus=await wallet.sendTransaction(tx,connection);
    await connection.confirmTransaction(txStatus,"confirmed");
    console.log("unstake lst txStatus : ",txStatus);
  }

  return (
    <div className="space-y-6">
        <div>
            <label className="block text-sm font-medium text-red-300 mb-2">Amount to Unstake</label>
            <div className="relative">
                {/* <input type="number" min={0}  value={unstakeAmount? unstakeAmount: ''} onChange={(e) => setUnstakeAmount(Number(e.target.value))} */}
                {/* <input type="number" min={0}  value={unstakeAmount? unstakeAmount: ''} onChange={(e) => setUnstakeAmount(Number(e.target.value)>=0? Number(e.target.value): Number(e.target.value)*-1)} */}
                <input type="number" min={0}  value={unstakeAmount? unstakeAmount: 0} onChange={(e) => setUnstakeAmount(Number(e.target.value)>=0? Number(e.target.value): Number(e.target.value)*-1)}
                // placeholder="0.00" className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border-2 border-red-500/30 text-white rounded-xl px-4 py-4 text-2xl font-semibold focus:outline-none focus:border-red-500 focus:shadow-lg focus:shadow-red-500/20 transition-all"/>
                placeholder="0.00" className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border-1 border-red-500/30 text-red-300 rounded-xl px-4 py-4 text-2xl font-semibold focus:outline-none focus:border-red-300  transition-all"/>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-red-300 font-medium">dSOL</span>
                    <button className="text-sm text-red-400 hover:text-red-300 font-medium cursor-pointer px-2 py-1 rounded hover:bg-red-500/10 transition-colors" onClick={()=>{
                        setUnstakeAmount(userLstBalance/2);
                    }}>HALF</button>
                    <button className="text-sm text-red-400 hover:text-red-300 font-medium cursor-pointer px-2 py-1 rounded hover:bg-red-500/10 transition-colors" onClick={()=>{
                        setUnstakeAmount(userLstBalance);
                    }}>MAX</button>
                </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
                <span>Balance: <span className="text-red-300 font-medium">{userLstBalance} dSOL</span></span>
                {/* <span>≈ ${(parseFloat(stats.yourLST) * parseFloat(stats.exchangeRate) * 50).toFixed(2)}</span> */}
            </div>
        </div>

        <div className="flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-full flex items-center justify-center border-2 border-red-500/30 shadow-lg shadow-red-500/10">
                <ArrowDownUp size={20} className="text-red-400" />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-red-300 mb-2">You Will Receive (After Cooldown)</label>
            <div className="bg-gradient-to-br from-orange-900/20 to-red-900/20 border-2 border-orange-500/30 rounded-xl px-4 py-4 shadow-lg shadow-orange-500/10">
                {/* <div className="text-2xl font-semibold">{unstakeAmount ? (unstakeAmount * parseFloat(stats.exchangeRate)).toFixed(4) : '0.00'}</div> */}
                <div className="text-2xl font-semibold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{unstakeAmount ? (unstakeAmount * lstToSolExchangeRate).toFixed(4) : '0.00'}</div>
                <div className="text-sm text-gray-400 mt-1">SOL</div>
            </div>
        </div>

        <div className="bg-gradient-to-br from-orange-900/30 to-red-900/20 border-2 border-orange-500/30 rounded-lg p-4 flex gap-3 shadow-lg shadow-orange-500/10">
            <Clock size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Unstaking Period</p>
                <p className="text-gray-400">Unstaking requires 1 epoch (max 2 days). You can claim your SOL once the cooldown period ends.</p>
            </div>
        </div>

        <button disabled={!userAddress.user_address || !unstakeAmount} onClick={unstakeLST} className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-semibold text-lg transition-all duration-200 cursor-pointer text-white shadow-lg shadow-orange-500/20 hover:shadow-xl hover:shadow-orange-500/30">
            {!userAddress.user_address ? 'Connect Wallet' : 'Burn dSOL & Request Unstake'}
        </button>
    </div>
  )
}

export default UnstakeCard