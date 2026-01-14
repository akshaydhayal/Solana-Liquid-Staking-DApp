import { AlertCircle, CheckCircle, Database } from 'lucide-react'
import { useState } from 'react'
import { useRecoilValue } from 'recoil';
import { splitAccountsState } from '../state/splitAccountsState';
import { LAMPORTS_PER_SOL, PublicKey, StakeProgram, SYSVAR_CLOCK_PUBKEY, SYSVAR_STAKE_HISTORY_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import { lstManagerBump, lstManagerPda, lstManagerWithdrawVaultBump, lstManagerWithdrawVaultPda, PROGRAM_ID } from '../lib/constants';
import { Buffer } from 'buffer';
import { navState } from '../state/navState';
import * as borsh from "borsh";
import { valueToU64Schema } from '../lib/borshSchema';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const AdminWithdraw = () => {
  let {connection}=useConnection();
  let wallet=useWallet();
  const [selectedSplitStake, setSelectedSplitStake] = useState('');
  let activeSplitAccounts=useRecoilValue(splitAccountsState);
  let userAddress=useRecoilValue(navState);

  console.log("lstManagerWithdrawVaultBump : ",lstManagerWithdrawVaultPda.toBase58());
//   const splitStakeAccounts = [
//     { index: 0, address: '2vB5...xT9u', amount: 5000, status: 'deactivating', unlockEpoch: 1006, currentEpoch: 1005 },
//     { index: 1, address: '8nC7...yW3v', amount: 7500, status: 'inactive', unlockEpoch: 1005, currentEpoch: 1005 },
//     { index: 2, address: '5pD9...zX6w', amount: 3000, status: 'deactivating', unlockEpoch: 1007, currentEpoch: 1005 },
//   ];

  async function withdrawToUserWithdrawVault(){
    if(!userAddress.user_address){return;}
    let splitStakeIndex=activeSplitAccounts[Number(selectedSplitStake)].index;
    let serialisedSplitStakeIndex=borsh.serialize(valueToU64Schema, {value:splitStakeIndex});

    // let splitStakeAcc=new PublicKey(activeSplitAccounts[Number(selectedSplitStake)]);
    let [splitStakePda, splitStakeBump]=PublicKey.findProgramAddressSync([Buffer.from("split_stake_acc"), Buffer.from(serialisedSplitStakeIndex), lstManagerPda.toBuffer()], PROGRAM_ID);
    let ix=new TransactionInstruction({
        programId:PROGRAM_ID,
        keys:[
            {pubkey:userAddress.user_address, isSigner:true, isWritable:true},
            {pubkey:lstManagerPda, isSigner:false, isWritable:true},
            {pubkey:lstManagerWithdrawVaultPda, isSigner:false, isWritable:true},
            {pubkey:splitStakePda, isSigner:false, isWritable:true},
            {pubkey:SYSVAR_CLOCK_PUBKEY, isSigner:false, isWritable:false},
            {pubkey:SYSVAR_STAKE_HISTORY_PUBKEY, isSigner:false, isWritable:false},
            {pubkey:StakeProgram.programId, isSigner:false, isWritable:false},
        ],
        data:Buffer.concat([
            Buffer.from([5]),
            Buffer.from(serialisedSplitStakeIndex),
            Buffer.from([lstManagerBump]),
            Buffer.from([lstManagerWithdrawVaultBump]),
            Buffer.from([splitStakeBump]),
        ])
    });
    let tx=new Transaction().add(ix);
    let txStatus=await wallet.sendTransaction(tx,connection);
    await connection.confirmTransaction(txStatus,"confirmed");
    console.log("withdraw to vault txStatus : ",txStatus); 
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-purple-500/20 shadow-lg shadow-purple-500/10 p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            <Database size={22} className="text-purple-400" />Withdraw from Split Stake
        </h3>
        <div className="space-y-4">
            <div>
                <label className="text-sm text-purple-300 mb-2 block">Select Split Stake Account</label>
                <select value={selectedSplitStake} onChange={(e) => setSelectedSplitStake(e.target.value)} className="w-full bg-gradient-to-br from-gray-900/60 to-gray-900/40 border-2 border-purple-500/30 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 focus:shadow-lg focus:shadow-purple-500/20 transition-all cursor-pointer">
                    <option value="" className="bg-gray-900">Choose a split stake account...</option>
                    {/* {splitStakeAccounts.map((acc) => ( */}
                    {activeSplitAccounts.map((acc,ind) => (
                    <option key={acc.index} value={ind} disabled={acc.withdrawReady == false} className="bg-gray-900">
                        {acc.pubkey} -- {acc.stakeAmount/LAMPORTS_PER_SOL} SOL ({acc.withdrawReady?'Withdrawable':'Not Withdrawable'})
                        {/* {acc.address} - {acc.amount.toLocaleString()} SOL ({acc.status}) */}
                    </option>
                    ))}
                </select>
            </div>

            {selectedSplitStake !== '' && (
                <div className="bg-gray-900/70 border border-gray-700/50 rounded-xl p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                            <div className="text-gray-400">Amount</div>
                            {/* <div className="text-lg font-semibold">{splitStakeAccounts[parseInt(selectedSplitStake)].amount.toLocaleString()} SOL</div> */}
                            <div className="text-lg font-semibold text-white">{activeSplitAccounts[Number(selectedSplitStake)].stakeAmount/LAMPORTS_PER_SOL} SOL</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Withdrawable Status</div>
                            <div className="text-lg font-semibold">
                                {/* {splitStakeAccounts[parseInt(selectedSplitStake)].status === 'inactive' ? ( */}
                                {activeSplitAccounts[Number(selectedSplitStake)].withdrawReady === true ? (
                                    <span className="text-green-400 flex items-center gap-1"><CheckCircle size={16} /> Ready</span>
                                ) : (
                                    <span className="text-orange-400">Deactivating</span>
                                )}
                            </div>
                        </div>
                        <div>
                            <div className="text-gray-400">Deactivation Epoch</div>
                            {/* <div className="text-lg font-semibold">{splitStakeAccounts[parseInt(selectedSplitStake)].unlockEpoch}</div> */}
                            <div className="text-lg font-semibold text-white">{activeSplitAccounts[Number(selectedSplitStake)].deactivationEpoch}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
                <div className="flex gap-2 text-sm">
                    <AlertCircle size={16} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-purple-300">Only inactive split stake accounts can be withdrawn. SOL will be transferred to the user withdrawal vault.</div>
                </div>
            </div>

            <button onClick={withdrawToUserWithdrawVault} className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-rose-500 hover:from-purple-500 hover:via-pink-500 hover:to-rose-400 hover:shadow-2xl hover:shadow-purple-500/50 py-4 rounded-xl text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-white"
                disabled={!selectedSplitStake || activeSplitAccounts[Number(selectedSplitStake)]?.withdrawReady !== true}>Withdraw to Vault
                {/* disabled={!selectedSplitStake || splitStakeAccounts[parseInt(selectedSplitStake)]?.status !== 'inactive'}>Withdraw to Vault */}
            </button>
        </div>
    </div>
  )
}

export default AdminWithdraw