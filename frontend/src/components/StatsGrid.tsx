import { useConnection } from '@solana/wallet-adapter-react';
import { getLSTMintSupply, getProtocolStats } from '../lib/helpers';
import StatCard from './StatCard'
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ArrowDownUp, Coins, TrendingUp } from 'lucide-react';
import { lstToSolExchangeRateState } from '../state/lstToSolExchangeRateState';

type protocolStatType={ protocolTVL: number, protocolActivePendingWithdrawls: number, protocolActiveStaked:number};
const StatsGrid = () => {
  let {connection}=useConnection();
  const [protocolStats, setProtocolStats] = useState<null| protocolStatType>(null);   
  const [lstSupply, setLstSupply] = useState<null|number>(null);
  let [lstToSolexchangeRate,setLstToSolexchangeRate]=useRecoilState(lstToSolExchangeRateState);

  const stats = {
    tvl: '12,450,000',
    apy: '7.2',
    exchangeRate: '1.042',
    yourStake: '150.5',
    yourLST: '144.3',
    pendingUnstake: '25.0'
  };
  
  useEffect(()=>{
    async function getProtocolInfo(){
      let protocolData=await getProtocolStats(connection);
      if(protocolData){
          setProtocolStats(protocolData);
      }
      let lstMintSupply=await getLSTMintSupply(connection);
      setLstSupply(lstMintSupply);
      if(protocolData?.protocolTVL && lstMintSupply!=0){
        setLstToSolexchangeRate(protocolData.protocolTVL/(LAMPORTS_PER_SOL*lstMintSupply));
      }
    }
    getProtocolInfo();
  },[connection])

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">  
        {/* <StatCard label="Total Value Locked (TVL)" value={`${protocolTVL?protocolTVL/LAMPORTS_PER_SOL:'0'} SOL`} */}
        <StatCard label="Total Value Locked (TVL)" value={`${protocolStats?.protocolTVL?protocolStats.protocolTVL/LAMPORTS_PER_SOL:'0'} SOL`}
            icon={Coins} gradient=""/>
        <StatCard label="Total dSOL LST Supply" value={`${lstSupply} dSOL`}
            icon={Coins} gradient=""/>
        <StatCard label="Current APY" value={`${stats.apy}%`} subtext="Est. annual yield"
            icon={TrendingUp} gradient=""/>
        {/* <StatCard label="Exchange Rate" value={lstToSolexchangeRate.toString()} subtext="dSOL per SOL" */}
        <StatCard label="Exchange Rate" value={lstToSolexchangeRate.toFixed(4)} subtext="dSOL per SOL"
            icon={ArrowDownUp} gradient=""/>

        <StatCard label="SOL Staked Currently" value={`${protocolStats?.protocolActiveStaked ? protocolStats.protocolActiveStaked/LAMPORTS_PER_SOL : '0'} SOL`}
            icon={ArrowDownUp} gradient=""/>
        <StatCard label="Active Pending Withdrawls Currently" value={`${protocolStats?.protocolActivePendingWithdrawls ? protocolStats.protocolActivePendingWithdrawls/LAMPORTS_PER_SOL : '0'} SOL`} 
            icon={ArrowDownUp} gradient=""/>
    </div>
  )
}

export default StatsGrid