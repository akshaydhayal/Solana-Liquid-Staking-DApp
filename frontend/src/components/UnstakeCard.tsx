import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js";
import { ArrowDownUp, Clock } from "lucide-react"
import { useState } from "react";
import { lstManagerBump, lstManagerPda, lstManagerVaultBump, lstManagerVaultPda, lstMintBump, lstMintPda, PROGRAM_ID } from "../lib/constants";
import { useRecoilValue } from "recoil";
import { navState } from "../state/navState";
import * as spl from "@solana/spl-token";
import { Buffer } from "buffer";
import * as borsh from "borsh";

let serialisedU64Schema:borsh.Schema={
    struct:{value:'u64'}
}

const UnstakeCard = () => {
  const [unstakeAmount, setUnstakeAmount] = useState<null|number>(null);
  const [userLstBalance, setUserLstBalance] = useState(0);
  let {connection}=useConnection();
  let wallet=useWallet();

  let userAddress=useRecoilValue(navState);

    // Mock data
  const stats = {
    tvl: '12,450,000',
    apy: '7.2',
    exchangeRate: '1.042',
    yourStake: '150.5',
    yourLST: '144.3',
    pendingUnstake: '25.0'
  };

  async function getUserTokenBalance(){
    let userLstAta=spl.getAssociatedTokenAddressSync(lstMintPda,userAddress.user_address,false,spl.TOKEN_PROGRAM_ID);
    console.log("userLstAta : ",userLstAta.toBase58());
    let userLstBal=(await connection.getTokenAccountBalance(userLstAta)).value.uiAmount;
    console.log("user lst balance2 : ",userLstBal);
    setUserLstBalance(userLstBal);
  }
  getUserTokenBalance();

  async function unstakeLST(){
    if(!userAddress.user_address || !unstakeAmount || !wallet){
        return;
    }
    let userLstAta=spl.getAssociatedTokenAddressSync(lstMintPda,userAddress.user_address,false,spl.TOKEN_PROGRAM_ID);
    let [userWithdrawRequestPda,userWithdrawRequestBump]=PublicKey.findProgramAddressSync([Buffer.from("user_withdraw_request"), userAddress.user_address?.toBuffer()],PROGRAM_ID);
    
    let serialisedUnstakeAmount=borsh.serialize(serialisedU64Schema,{value:unstakeAmount*LAMPORTS_PER_SOL});
    console.log("serialisedUnstakeAmount : ", unstakeAmount,serialisedUnstakeAmount)
    
    let epoch=(await connection.getEpochInfo()).epoch;
    let serialisedEpoch=borsh.serialize(serialisedU64Schema,{value:epoch});
    console.log("epoch : ", epoch,serialisedEpoch)
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
            <label className="block text-sm font-medium text-gray-400 mb-2">Amount to Unstake</label>
            <div className="relative">
                <input type="number" value={unstakeAmount} onChange={(e) => setUnstakeAmount(Number(e.target.value))}
                placeholder="0.00" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-2xl font-semibold focus:outline-none focus:border-purple-500 transition-colors"/>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <span className="text-gray-400 font-medium">LST</span>
                    <button className="text-sm text-purple-400 hover:text-purple-300 font-medium cursor-pointer" onClick={()=>{
                        setUnstakeAmount(userLstBalance/2);
                    }}>HALF</button>
                    <button className="text-sm text-purple-400 hover:text-purple-300 font-medium cursor-pointer" onClick={()=>{
                        setUnstakeAmount(userLstBalance);
                    }}>MAX</button>
                </div>
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-400">
                {/* <span>Balance: {stats.yourLST} LST</span> */}
                <span>Balance: {userLstBalance} LST</span>
                <span>≈ ${(parseFloat(stats.yourLST) * parseFloat(stats.exchangeRate) * 50).toFixed(2)}</span>
            </div>
        </div>

        <div className="flex items-center justify-center">
            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border-2 border-gray-700">
                <ArrowDownUp size={18} className="text-gray-400" />
            </div>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">You Will Receive (After Cooldown)</label>
            <div className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4">
                {/* <div className="text-2xl font-semibold">{unstakeAmount ? (parseFloat(unstakeAmount) * parseFloat(stats.exchangeRate)).toFixed(4) : '0.00'}</div> */}
                <div className="text-2xl font-semibold">{unstakeAmount ? (unstakeAmount * parseFloat(stats.exchangeRate)).toFixed(4) : '0.00'}</div>
                <div className="text-sm text-gray-400 mt-1">SOL</div>
            </div>
        </div>

        <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4 flex gap-3">
            <Clock size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-gray-300">
                <p className="font-medium text-white mb-1">Unstaking Period</p>
                Unstaking requires 1 epoch (max 2 days). You can claim your SOL once the cooldown period ends.
            </div>
        </div>

        <button disabled={!userAddress.user_address || !unstakeAmount} onClick={unstakeLST} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-semibold text-lg transition-all cursor-pointer">
            {!userAddress.user_address ? 'Connect Wallet' : 'Burn LST & Request Unstake'}
        </button>
    </div>
  )
}

export default UnstakeCard