import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { AlertCircle, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { lstManagerBump, lstManagerPda, lstManagerVaultBump, lstManagerVaultPda, PROGRAM_ID, stakeRegistryRecordBump, stakeRegistryRecordPda } from '../lib/constants';
import { LAMPORTS_PER_SOL, PublicKey, StakeProgram, SystemProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_RENT_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useRecoilValue } from 'recoil';
import { navState } from '../state/navState';
import { getNextStakePdaAccount } from '../lib/helpers';

const AdminStake = () => {
  let {connection}=useConnection();
  let wallet=useWallet();
  //const [stakeAmount, setStakeAmount] = useState<null|number>(null);  
  const [vaultBalance, setVaultBalnce] = useState(0);
  let userAddress=useRecoilValue(navState);

  useEffect(()=>{
    async function getVaultBal(){ 
        let lstManagerVaultPdaBal=await connection.getBalance(lstManagerVaultPda,"confirmed") - await connection.getMinimumBalanceForRentExemption(0,"confirmed");
        setVaultBalnce(lstManagerVaultPdaBal);
    }
    getVaultBal();
},[connection])

async function stakeVaultSolToValidator(){
    if(!userAddress.user_address){return;}
    // let {nextStakeAccPda,nextStakeAccBump}=await getNextStakePdaAccount(connection);
    let nextStakeAcc=await getNextStakePdaAccount(connection);
    if(!nextStakeAcc){return;}

    //@c here we should have a selector that which validator to vote insteda of single validator only, maybe later
    let validatorVoteAcc=new PublicKey("DSQ5BLBM6UcuWP2SNpmf3TJeMbqbwTFGzVqFGufyNCgk");
    const STAKE_CONFIG_ID = new PublicKey("StakeConfig11111111111111111111111111111111");

    let ix=new TransactionInstruction({
        programId:PROGRAM_ID,
        keys:[
            {pubkey:userAddress.user_address, isSigner:true, isWritable:true},
            {pubkey:lstManagerPda, isSigner:false, isWritable:true},
            {pubkey:lstManagerVaultPda, isSigner:false, isWritable:true},
            // {pubkey:nextStakeAccPda, isSigner:fa lse, isWritable:true},
            {pubkey:nextStakeAcc?.nextStakeAccPda, isSigner:false, isWritable:true},
            {pubkey:validatorVoteAcc, isSigner:false, isWritable:false},
            {pubkey:stakeRegistryRecordPda, isSigner:false, isWritable:true},
            
            {pubkey:SYSVAR_RENT_PUBKEY, isSigner:false, isWritable:false},
            {pubkey:SYSVAR_CLOCK_PUBKEY, isSigner:false, isWritable:false},
            {pubkey:SYSVAR_STAKE_HISTORY_PUBKEY, isSigner:false, isWritable:false},
            {pubkey:STAKE_CONFIG_ID, isSigner:false, isWritable:false},
            {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
            {pubkey:StakeProgram.programId, isSigner:false, isWritable:false},
        ],
        data:Buffer.concat([
            Buffer.from([2]),
            Buffer.from([lstManagerBump]),
            Buffer.from([lstManagerVaultBump]),
            // Buffer.from([nextStakeAccBump]),
            Buffer.from([nextStakeAcc.nextStakeAccBump]),
            Buffer.from([stakeRegistryRecordBump]),
        ])
    });
    let tx=new Transaction().add(ix);
    let txStatus=await wallet.sendTransaction(tx,connection);
    await connection.confirmTransaction(txStatus,"confirmed");
    console.log("stake SOL txStatus : ",txStatus);
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-green-500/20 shadow-lg shadow-green-500/10 p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            <TrendingUp size={22} className="text-green-400" />Stake Vault SOL</h3>

        <div className="space-y-4">
            <div>
                <label className="text-sm text-green-300 mb-2 block">Available Vault Balance</label>
                <div className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{vaultBalance/LAMPORTS_PER_SOL} SOL</div>
            </div>

            {/* <div>
                <label className="text-sm text-gray-400 mb-2 block">Stake Amount</label>
                <div className="relative">
                    <input type="number" value={stakeAmount} onChange={(e) => setStakeAmount(Number(e.target.value))}
                        placeholder="0.00" className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-xl font-semibold focus:outline-none focus:border-green-500 transition-colors"/>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                        <span className="text-gray-400">SOL</span>
                        <button onClick={() => setStakeAmount(vaultBalance/(2*LAMPORTS_PER_SOL))} className="text-green-400 text-sm font-medium hover:text-green-300 cursor-pointer">
                            HALF
                        </button>
                        <button onClick={() => setStakeAmount(vaultBalance/LAMPORTS_PER_SOL)} className="text-green-400 text-sm font-medium hover:text-green-300 cursor-pointer">
                            MAX
                        </button>
                    </div>
                </div>
            </div> */}

            <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                <div className="flex gap-2 text-sm">
                    <AlertCircle size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-blue-300">This will create a new stake account and delegate SOL from the vault to a validator.Ensure you have selected a validator before proceeding.</div>
                </div>
            </div>

            <button className="w-full bg-gradient-to-r from-green-600 via-emerald-600 to-teal-500 hover:from-green-500 hover:via-emerald-500 hover:to-teal-400 hover:shadow-2xl hover:shadow-green-500/50 py-4 rounded-xl text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white"
                onClick={stakeVaultSolToValidator}>Stake Vault SOL to Validator
                {/* disabled={!stakeAmount || parseFloat(stakeAmount) <= 0}>Stake Vault SOL to Validator */}
            </button>
        </div>
    </div>
  )
}
export default AdminStake