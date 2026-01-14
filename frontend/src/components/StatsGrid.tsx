import { useConnection } from '@solana/wallet-adapter-react';
import { getLSTMintSupply, getProtocolTVL } from '../lib/helpers';
import StatCard from './StatCard'
import { useState } from 'react';
import { useRecoilState } from 'recoil';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ArrowDownUp, Coins, TrendingUp } from 'lucide-react';
import { lstToSolExchangeRateState } from '../state/lstToSolExchangeRateState';

const StatsGrid = () => {
  let {connection}=useConnection();
  const [protocolTVL, setProtocolTVL] = useState<null|number>(null);   
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
  
  async function getProtocolInfo(){
    let protocolTvl=await getProtocolTVL(connection);
    if(protocolTvl){
        setProtocolTVL(protocolTvl);
    }
    let lstMintSupply=await getLSTMintSupply(connection);
    setLstSupply(lstMintSupply);
    if(protocolTvl && lstMintSupply!=0){
      setLstToSolexchangeRate(protocolTvl/(LAMPORTS_PER_SOL*lstMintSupply));
    }
  }
  getProtocolInfo();
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">  
        <StatCard label="Total Value Locked (TVL)" value={`${protocolTVL?protocolTVL/LAMPORTS_PER_SOL:'0'} SOL`}
            icon={Coins} gradient=""/>
        <StatCard label="Total dSOL LST Supply" value={`${lstSupply} dSOL`}
            icon={Coins} gradient=""/>
        <StatCard label="Current APY" value={`${stats.apy}%`} subtext="Est. annual yield"
            icon={TrendingUp} gradient=""/>
        <StatCard label="Exchange Rate" value={lstToSolexchangeRate.toString()} subtext="dSOL per SOL"
            icon={ArrowDownUp} gradient=""/>
    </div>
  )
}

export default StatsGrid