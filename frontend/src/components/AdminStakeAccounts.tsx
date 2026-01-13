import { useConnection } from '@solana/wallet-adapter-react';
import { TrendingUp } from 'lucide-react'
import * as borsh from "borsh";
import { lstManagerPda, PROGRAM_ID, stakeRegistryRecordPda } from '../lib/constants';
import { stakeAccountsSchema, StakeRegistryRecordSchema, valueToU64Schema } from '../lib/borshSchema';
import { Buffer } from 'buffer';
import { LAMPORTS_PER_SOL, PublicKey, StakeProgram } from '@solana/web3.js';
import { useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { stakeAccountsState } from '../state/stakeAccountsState';

export type stakeAccountsType={index:number,pubkey:string, stakeAmount:number, activatedEpoch:number}[];

const AdminStakeAccounts = () => {
  let {connection}=useConnection();
  // const [activeStakeAccounts,setActiveStateAccounts]=useState<stakeAccountsType>([]);
  
  let [activeStakeAccounts,setActiveStateAccounts]=useRecoilState(stakeAccountsState);
  useEffect(()=>{
    async function getAllActiveStakeAccounts(){
      let stakeRegistryPdaData=await connection.getAccountInfo(stakeRegistryRecordPda);
      let deserialisedStakeRegistryPdaData=borsh.deserialize(StakeRegistryRecordSchema, stakeRegistryPdaData?.data);
      let totalStakeAccCount=Number(deserialisedStakeRegistryPdaData.next_stake_index)-1; 
  
      let stakeAccount:stakeAccountsType=[];
      for(let i=1; i<=totalStakeAccCount; i++){
          let serialisedStakeIndex=borsh.serialize(valueToU64Schema, {value:i});    
          let [stakeAccPda,stakeAccBump]=PublicKey.findProgramAddressSync([Buffer.from("stake_acc"), Buffer.from(serialisedStakeIndex), lstManagerPda.toBuffer()], PROGRAM_ID)
          
          let stakeAccPdaData=await connection.getAccountInfo(stakeAccPda);
          let deserialisedStakeAccData=borsh.deserialize(stakeAccountsSchema, stakeAccPdaData?.data);
          if(deserialisedStakeAccData.stake_discriminator==2){
            stakeAccount.push({
              index:i,
              pubkey:stakeAccPda.toBase58(),
              stakeAmount:Number(deserialisedStakeAccData.stake_delegation_stake_amount),
              activatedEpoch:Number(deserialisedStakeAccData.stake_delegation_activation_epoch)
            });
          }
        }
      setActiveStateAccounts(stakeAccount);
      console.log("stakeAccount : ",stakeAccount);
    }
    getAllActiveStakeAccounts();
  },[connection])

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-green-400" />Active Stake Accounts</h3>
        <div className="space-y-3">
          {activeStakeAccounts.map((acc) => (
              <div key={acc.index} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                <div className="flex justify-between items-start mb-2">
                    <div className="font-mono text-xs text-gray-400 truncate">{acc.pubkey}</div>
                    <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/30">Active</span>
                </div>
                <div className="text-lg font-semibold">{(acc.stakeAmount/LAMPORTS_PER_SOL)} SOL</div>
                <div className="text-xs text-gray-400 mt-1">Epoch: {acc.activatedEpoch}</div>
              </div>
          ))}
        </div>
    </div>
  )
}

export default AdminStakeAccounts