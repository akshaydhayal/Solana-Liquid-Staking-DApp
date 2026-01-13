import { useConnection } from '@solana/wallet-adapter-react';
import { CheckCircle, Database } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { stakeAccountsSchema, StakeRegistryRecordSchema, valueToU64Schema } from '../lib/borshSchema';
import * as borsh from "borsh";
import { lstManagerPda, PROGRAM_ID, stakeRegistryRecordPda } from '../lib/constants';
import { PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useRecoilState } from 'recoil';
import { splitAccountsState } from '../state/splitAccountsState';

export type splitAccountsType={index:number,pubkey:string, stakeAmount:number, activatedEpoch:number}[];

const AdminSplitStakeAccounts = () => {
  let {connection}=useConnection();
  // const [activeSplitAccounts,setActiveSplitAccounts]=useState<splitAccountsType[]>([]);
  const [activeSplitAccounts,setActiveSplitAccounts]=useRecoilState(splitAccountsState);
  
  useEffect(()=>{
    async function getAllActiveSplitStakeAccounts(){
      let stakeRegistryPdaData=await connection.getAccountInfo(stakeRegistryRecordPda);
      let deserialisedStakeRegistryPdaData=borsh.deserialize(StakeRegistryRecordSchema, stakeRegistryPdaData?.data);
      let totalSplitAccCount=Number(deserialisedStakeRegistryPdaData.next_split_index)-1; 
  
      let splitAccounts:splitAccountsType=[];
      // let splitAccount=[];
      for(let i=1; i<=totalSplitAccCount; i++){
          let serialisedSplitIndex=borsh.serialize(valueToU64Schema, {value:i});    
          let [splitAccPda,stakeAccBump]=PublicKey.findProgramAddressSync([Buffer.from("split_stake_acc"), Buffer.from(serialisedSplitIndex), lstManagerPda.toBuffer()], PROGRAM_ID)
          // splitAccount.push(splitAccPda.toBase58());

          let splitAccPdaData=await connection.getAccountInfo(splitAccPda);
          console.log("splitAccPda : ",splitAccPda.toBase58());
          console.log("splitAccPdaData : ",splitAccPdaData?.data);
          if(splitAccPdaData){
            let deserialisedSplitAccData=borsh.deserialize(stakeAccountsSchema, splitAccPdaData?.data);
            console.log("deserialisedSplitAccData : ",deserialisedSplitAccData);
            if(deserialisedSplitAccData.stake_discriminator==2){
              splitAccounts.push({
                index:i,
                pubkey:splitAccPda.toBase58(),
                stakeAmount:Number(deserialisedSplitAccData.stake_delegation_stake_amount),
                activatedEpoch:Number(deserialisedSplitAccData.stake_delegation_activation_epoch)
              });
            }
          }
        }
      setActiveSplitAccounts(splitAccounts);
      console.log("split accounts : ",splitAccounts);
    }
    getAllActiveSplitStakeAccounts();
  },[connection])

      const splitStakeAccounts = [
    { index: 0, address: '2vB5...xT9u', amount: 5000, status: 'deactivating', unlockEpoch: 1006, currentEpoch: 1005 },
    { index: 1, address: '8nC7...yW3v', amount: 7500, status: 'inactive', unlockEpoch: 1005, currentEpoch: 1005 },
    { index: 2, address: '5pD9...zX6w', amount: 3000, status: 'deactivating', unlockEpoch: 1007, currentEpoch: 1005 },
  ];
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Database size={20} className="text-purple-400" />Split Stake Accounts</h3>
        <div className="space-y-3">
        {/* {splitStakeAccounts.map((acc) => ( */}
        {activeSplitAccounts.map((acc) => (
            <div key={acc.index} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
            <div className="flex justify-between items-start mb-2">
                {/* <div className="font-mono text-xs text-gray-400">{acc.address}</div> */}
                <div className="font-mono text-xs text-gray-400">{acc.pubkey}</div>
                {acc.status === 'inactive' ? (
                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/30 flex items-center gap-1">
                    <CheckCircle size={10} /> Ready
                </span>
                ) : (
                <span className="px-2 py-0.5 bg-orange-600/20 text-orange-400 text-xs rounded-full border border-orange-600/30">
                    {acc.activatedEpoch - acc.activatedEpoch} epochs
                    {/* {acc.unlockEpoch - acc.currentEpoch} epochs */}
                </span>
                )}
            </div>
            {/* <div className="text-lg font-semibold">{acc.amount.toLocaleString()} SOL</div> */}
            <div className="text-lg font-semibold">{acc.stakeAmount} SOL</div>
            <div className="text-xs text-gray-400 mt-1">Unlock: Epoch {acc.activatedEpoch}</div>
            {/* <div className="text-xs text-gray-400 mt-1">Unlock: Epoch {acc.unlockEpoch}</div> */}
            </div>
        ))}
        </div>
    </div>
  )
}

export default AdminSplitStakeAccounts