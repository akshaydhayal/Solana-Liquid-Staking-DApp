import { useConnection } from '@solana/wallet-adapter-react';
import { CheckCircle, CircleX, CrossIcon, Database, WatchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { stakeAccountsSchema, StakeRegistryRecordSchema, valueToU64Schema } from '../lib/borshSchema';
import * as borsh from "borsh";
import { lstManagerPda, PROGRAM_ID, stakeRegistryRecordPda } from '../lib/constants';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { Buffer } from 'buffer';
import { useRecoilState } from 'recoil';
import { splitAccountsState } from '../state/splitAccountsState';

export type splitAccountsType={
  index:number,
  pubkey:string,
  stakeAmount:number,
  deactivationEpoch:number,
  withdrawReady:boolean
}[];

const AdminSplitStakeAccounts = () => {
  let {connection}=useConnection();
  const [activeSplitAccounts,setActiveSplitAccounts]=useRecoilState(splitAccountsState);
  const [currentEpoch,setCurrentEpoch]=useState(0);
  
  useEffect(()=>{
    async function getAllActiveSplitStakeAccounts(){
      let stakeRegistryPdaData=await connection.getAccountInfo(stakeRegistryRecordPda);
      if(!stakeRegistryPdaData){return;}
      let deserialisedStakeRegistryPdaData=borsh.deserialize(StakeRegistryRecordSchema, stakeRegistryPdaData?.data);
      //@ts-ignore
      let totalSplitAccCount=Number(deserialisedStakeRegistryPdaData?.next_split_index)-1; 
      
      let epoch=(await connection.getEpochInfo()).epoch;
      setCurrentEpoch(epoch);

      let splitAccounts:splitAccountsType=[];
      for(let i=1; i<=totalSplitAccCount; i++){
          let serialisedSplitIndex=borsh.serialize(valueToU64Schema, {value:i});    
          let [splitAccPda, _]=PublicKey.findProgramAddressSync([Buffer.from("split_stake_acc"), Buffer.from(serialisedSplitIndex), lstManagerPda.toBuffer()], PROGRAM_ID)

          let splitAccPdaData=await connection.getAccountInfo(splitAccPda);
          console.log("splitAccPda : ",splitAccPda.toBase58());
          console.log("splitAccPdaData : ",splitAccPdaData?.data);
          if(splitAccPdaData){
            let deserialisedSplitAccData=borsh.deserialize(stakeAccountsSchema, splitAccPdaData?.data);
            console.log("deserialisedSplitAccData : ",deserialisedSplitAccData);
            //@ts-ignore
            if(deserialisedSplitAccData?.stake_discriminator==2){
              splitAccounts.push({
                index:i,
                pubkey:splitAccPda.toBase58(),
                //@ts-ignore
                stakeAmount:Number(deserialisedSplitAccData.stake_delegation_stake_amount),
                //@ts-ignore
                deactivationEpoch:Number(deserialisedSplitAccData.stake_delegation_deactivation_epoch),
                //@ts-ignore
                // withdrawReady:(epoch >= Number(deserialisedSplitAccData.stake_delegation_deactivation_epoch))
                withdrawReady:(epoch >= Number(deserialisedSplitAccData.stake_delegation_deactivation_epoch)+1)
              });
            }
          }
        }
      setActiveSplitAccounts(splitAccounts);
      console.log("split accounts : ",splitAccounts);
    }
    getAllActiveSplitStakeAccounts();
  },[connection])

  //   const splitStakeAccounts = [
  //   { index: 0, address: '2vB5...xT9u', amount: 5000, status: 'deactivating', unlockEpoch: 1006, currentEpoch: 1005 },
  //   { index: 1, address: '8nC7...yW3v', amount: 7500, status: 'inactive', unlockEpoch: 1005, currentEpoch: 1005 },
  //   { index: 2, address: '5pD9...zX6w', amount: 3000, status: 'deactivating', unlockEpoch: 1007, currentEpoch: 1005 },
  // ];
  return (
    <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-purple-500/20 shadow-lg shadow-purple-500/10 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        <Database size={20} className="text-purple-400" />Split Stake Accounts</h3>
        <div className="space-y-3">
        {/* {splitStakeAccounts.map((acc) => ( */}
        {activeSplitAccounts.length>0 && activeSplitAccounts.map((acc) => (
            <div key={acc.index} className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
            <div className="flex justify-between items-start mb-2"> 
                {/* <div className="font-mono text-xs text-gray-400">{acc.address}</div> */}
                <div className="font-mono text-xs text-gray-400 truncate">{acc.pubkey}</div>
                {/* {acc.status === 'inactive' ? ( */}
                {acc.withdrawReady ===true ? (
                <span className="px-2 py-0.5 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/30 flex items-center gap-1">
                    <CheckCircle size={10} /> Ready
                </span>
                ) : (
                <span className="px-2 py-0.5 bg-orange-600/20 text-orange-400 text-xs rounded-full border border-orange-600/30 flex items-center gap-1">
                    <CircleX size={10}/> Deactivating
                    {/* {acc.unlockEpoch - acc.currentEpoch} epochs */}
                </span>
                )}
            </div>
            {/* <div className="text-lg font-semibold">{acc.amount.toLocaleString()} SOL</div> */}
            <div className="text-lg font-semibold text-white">{acc.stakeAmount/LAMPORTS_PER_SOL} SOL</div>
            <div className="text-xs text-gray-400 mt-1">Deactivation Epoch : {acc.deactivationEpoch}</div>
            <div className="text-xs text-gray-400 mt-1">Current Epoch : {currentEpoch}</div>
            {/* <div className="text-xs text-gray-400 mt-1">Unlock: Epoch {acc.unlockEpoch}</div> */}
            <div className="text-xs text-gray-400 mt-1">Split Index: {acc.index}</div>
            </div>
        ))}
        </div>
    </div>
  )
}

export default AdminSplitStakeAccounts