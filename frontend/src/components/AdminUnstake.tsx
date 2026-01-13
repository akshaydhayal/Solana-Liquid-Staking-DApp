import { AlertCircle, TrendingDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil';
import { stakeAccountsState } from '../state/stakeAccountsState';
import { LAMPORTS_PER_SOL, PublicKey, StakeProgram, SystemProgram, SYSVAR_CLOCK_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { navState } from '../state/navState';
import { lstManagerBump, lstManagerPda, lstManagerVaultBump, lstManagerVaultPda, PROGRAM_ID, stakeRegistryRecordBump, stakeRegistryRecordPda } from '../lib/constants';
import { Buffer } from 'buffer';
import * as borsh from "borsh";
import { valueToU64Schema } from '../lib/borshSchema';
import { getNextSplitPdaAccount } from '../lib/helpers';

const AdminUnstake = () => {
  let {connection}=useConnection();
  let wallet=useWallet();
  let userAddress=useRecoilValue(navState);

  let stakeAccounts=useRecoilValue(stakeAccountsState);
  const [selectedStakeAccount, setSelectedStakeAccount] = useState('');
  const [epochWithdrawExists, setEpochWithdrawExists] = useState(false);

  useEffect(()=>{
    async function checkIfEpochWithdrawExists(){
        let epoch=(await connection.getEpochInfo()).epoch;
        let serialisedEpoch=borsh.serialize(valueToU64Schema, {value:epoch});
        let [epochWithdrawPda,epochWithdrawBump]=PublicKey.findProgramAddressSync([Buffer.from("epoch_withdraw"), Buffer.from(serialisedEpoch)], PROGRAM_ID);
        let epochWithdrawPdaData=await connection.getAccountInfo(epochWithdrawPda,"confirmed");
        if(epochWithdrawPdaData){
            setEpochWithdrawExists(true);
        }
    }
    checkIfEpochWithdrawExists();
  },[connection,wallet])

  async function unstakeSOLbySplitStake(){
    if(!userAddress.user_address){return;}
    
    let epoch=(await connection.getEpochInfo()).epoch;
    let serialisedEpoch=borsh.serialize(valueToU64Schema, {value:epoch});
    let [epochWithdrawPda,epochWithdrawBump]=PublicKey.findProgramAddressSync([Buffer.from("epoch_withdraw"), Buffer.from(serialisedEpoch)], PROGRAM_ID);

    let serialisedStakeIndex=borsh.serialize(valueToU64Schema, {value:Number(selectedStakeAccount)});
    let [stakeAccPda, stakeAccBump]=PublicKey.findProgramAddressSync([Buffer.from("stake_acc"), Buffer.from(serialisedStakeIndex), lstManagerPda.toBuffer()],PROGRAM_ID);

    let nextSplitAcc=await getNextSplitPdaAccount(connection);
    if(!nextSplitAcc){
        console.log("next split stake account is null");
        return;
    }
    
    let ix=new TransactionInstruction({
        programId:PROGRAM_ID,
        keys:[
            {pubkey:userAddress.user_address, isSigner:true, isWritable:true},
            {pubkey:lstManagerPda, isSigner:false, isWritable:true},
            {pubkey:lstManagerVaultPda, isSigner:false, isWritable:false},
            {pubkey:epochWithdrawPda, isSigner:false, isWritable:true},

            {pubkey:stakeAccPda, isSigner:false, isWritable:true},
            {pubkey:nextSplitAcc.nextSplitAccPda, isSigner:false, isWritable:true},
            {pubkey:stakeRegistryRecordPda, isSigner:false, isWritable:true},
            {pubkey:SYSVAR_CLOCK_PUBKEY, isSigner:false, isWritable:false},
            {pubkey:StakeProgram.programId, isSigner:false, isWritable:false},
            {pubkey:SystemProgram.programId, isSigner:false, isWritable:false},
        ],
        data:Buffer.concat([
            Buffer.from([4]),
            Buffer.from(serialisedStakeIndex),
            Buffer.from([lstManagerBump]),
            Buffer.from([lstManagerVaultBump]),
            Buffer.from([epochWithdrawBump]),
            Buffer.from([stakeAccBump]),
            Buffer.from([nextSplitAcc.nextSplitAccBump]),
            Buffer.from([stakeRegistryRecordBump]),
        ])
    });
    let tx=new Transaction().add(ix);
    tx.recentBlockhash=await (await connection.getLatestBlockhash()).blockhash;
    tx.feePayer=userAddress.user_address;
    let sig=await connection.simulateTransaction(tx);
    console.log("sig",sig.value);
    let txStatus=await wallet.sendTransaction(tx,connection);
    await connection.confirmTransaction(txStatus,"confirmed");
    console.log("unstake sol by split accounts txStatus",txStatus);
  }

  console.log("selectedStakeAccount : ",selectedStakeAccount);
  return (
    <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingDown size={22} className="text-orange-400" />Unstake SOL
        </h3>

        <div className="space-y-4">
            <div>
                <label className="text-sm text-gray-400 mb-2 block">Select Stake Account</label>
                <select value={selectedStakeAccount} onChange={(e) => setSelectedStakeAccount(e.target.value)}
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer">
                    <option value="">Choose a stake account...</option>
                    {/* {stakeAccounts0.map((acc) => ( */}
                    {stakeAccounts.map((acc) => (
                        <option key={acc.index} value={acc.index}>
                            {/* {acc.address} - {acc.amount.toLocaleString()} SOL */}
                            {acc.pubkey}  --  {acc.stakeAmount/LAMPORTS_PER_SOL} SOL
                        </option>
                    ))}
                </select>
            </div>

            {selectedStakeAccount !== '' && stakeAccounts.length>0 && (
                <div className="bg-gray-900/70 border border-gray-700/50 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <div className="text-gray-400">Stake Amount</div>
                            {/* <div className="text-lg font-semibold">{stakeAccounts0[parseInt(selectedStakeAccount)].amount.toLocaleString()} SOL</div> */}
                            <div className="text-lg font-semibold">{(stakeAccounts[selectedStakeAccount-1].stakeAmount)/LAMPORTS_PER_SOL} SOL</div>
                        </div>
                        <div>
                            <div className="text-gray-400">Current Epoch</div>
                            {/* <div className="text-lg font-semibold">{stakeAccounts0[parseInt(selectedStakeAccount)].epoch}</div> */}
                            <div className="text-lg font-semibold">{stakeAccounts[selectedStakeAccount-1].activatedEpoch}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-orange-600/10 border border-orange-500/30 rounded-lg p-4">
                <div className="flex gap-2 text-sm">
                    <AlertCircle size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-orange-300">Unstaking will create a new split stake account and deactivate this newly created split stake account. SOL will be available for withdrawal after 2-3 epochs from this split stake account.</div>
                </div>
            </div>

            {epochWithdrawExists === false ? (
                <div className="bg-red-600/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex gap-2 text-sm">
                        <AlertCircle size={16} className="text-red-400 mt-0.5" />
                        <div className="text-red-300">No withdraw request found for the current epoch.<br /> At least one user must request a withdraw before unstaking is allowed.</div>
                    </div>
                </div>
            ): (
                <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-4 text-green-300 text-sm">Withdraw request detected for this epoch. Unstake is allowed.</div>
            )}

            <button onClick={unstakeSOLbySplitStake} className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-xl py-4 rounded-xl text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={!selectedStakeAccount || epochWithdrawExists === false}>Deactivate & Split Stake
            </button>

            {/* <button onClick={unstakeSOLbySplitStake} disabled={!selectedStakeAccount || epochWithdrawExists === false}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:shadow-xl py-4 rounded-xl text-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                Deactivate & Split Stakee  
            </button> */}

        </div>
    </div>
  )
}

export default AdminUnstake