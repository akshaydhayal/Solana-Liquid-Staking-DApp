import { CheckCircle, Clock, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil';
import { navState } from '../state/navState';
import {getUserWithdrawRequest } from '../lib/helpers';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { lstManagerWithdrawVaultBump, lstManagerWithdrawVaultPda } from '../lib/constants';

type userWithdrawDataType={
    user:number[],
    sol_amount_user_gets:bigint,
    requested_epoch:bigint,  
    withdraw_status:number
};

const PendingWithdrawlsCard = () => {
    const [userWithdrawData, setUserWithdrawData] = useState(null);
    const [currentEpoch, setCurrentEpoch] = useState(0);
    let {connection}=useConnection();
    let userAddress=useRecoilValue(navState);
    console.log("userWithdrawData : ",userWithdrawData);
    console.log("userWithdrawData requested_epoch : ",userWithdrawData?.requested_epoch);

    console.log("lstManagerWithdrawVaultPda : ",lstManagerWithdrawVaultPda.toBase58());
    useEffect(()=>{
        async function getWithdrawData(){
            console.log("getWithdrawData run");
            if(!userAddress.user_address){return;}
            let userWithdrawRequestData=await getUserWithdrawRequest(userAddress.user_address,connection);
            console.log("data : ",userWithdrawRequestData);
            setUserWithdrawData(userWithdrawRequestData);
        }
        async function getCurrentEpoch(){
            let epoch=(await connection.getEpochInfo()).epoch;
            setCurrentEpoch(epoch);
        }
        getCurrentEpoch();
        getWithdrawData();
    },[userAddress, connection])

    // Mock data
    const pendingWithdrawals = [
    { amount: '10.5', unlockEpoch: 534, currentEpoch: 532, status: 'pending' },
    { amount: '14.5', unlockEpoch: 533, currentEpoch: 532, status: 'ready' }];

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Clock size={20} />Pending Withdrawals</h3>

        {userAddress.user_address ? (
        <div className="space-y-3">
            {userWithdrawData ? (<div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <div className="text-xl font-semibold">{Number(userWithdrawData?.sol_amount_user_gets)/LAMPORTS_PER_SOL} SOL</div>
                        <div className="text-xs text-gray-400 mt-1">Requested Epoch: {Number(userWithdrawData.requested_epoch)}</div>
                        <div className="text-xs text-gray-400 mt-1">Unlock Epoch: {Number(userWithdrawData.requested_epoch)+1}</div>
                        {/* <div className="text-xs text-gray-400 mt-1">Current Epoch: {currentEpoch}</div> */}
                    </div>
                    {/* {withdrawal.status === 'ready' ? ( */}
                    {currentEpoch >= (Number(userWithdrawData.requested_epoch) +1) ? (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/30 flex items-center gap-1">
                        <CheckCircle size={12} />Ready</span>
                    ) : (
                        <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full border border-orange-600/30">
                        {/* {withdrawal.unlockEpoch - withdrawal.currentEpoch} epochs</span> */}
                        {/* Claim after {currentEpoch - Number(userWithdrawData.requested_epoch)} epoch</span> */}
                        Claim after 1 epoch</span>
                    )}
                </div>

                 <button disabled={currentEpoch < (Number(userWithdrawData.requested_epoch)+1)}
                     className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed py-2 rounded-lg text-sm font-medium transition-all">
                     {currentEpoch >= (Number(userWithdrawData.requested_epoch)+1) ? 'Claim SOL Now' : 'Waiting for epoch end...'}
                 </button>
            </div>
        ) : (
            <p className="ml-8 w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-light transition-all">
                No Pending Withdrawls for User
            </p>
        )
        }
        </div>
        ) : (
        <div className="text-center py-8 text-gray-400">
            <Wallet size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Connect wallet to view withdrawals</p>
        </div>
        )}
    </div>
)}

export default PendingWithdrawlsCard