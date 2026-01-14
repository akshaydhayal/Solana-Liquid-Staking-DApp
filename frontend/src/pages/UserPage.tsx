import { useState } from 'react';
import { ArrowDownUp, TrendingUp, type LucideProps } from 'lucide-react';
import InfoCard from '../components/InfoCard';
import PendingWithdrawlsCard from '../components/PendingWithdrawlsCard';
import StakeCard from '../components/StakeCard';
import UnstakeCard from '../components/UnstakeCard';
import StatsGrid from '../components/StatsGrid';

const UserPage = () => {
  const [activeTab, setActiveTab] = useState('stake');

  const TabButton = ({ id, label, icon: Icon }:{id:string, label:string, icon:React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>}) => (
    <button onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
        activeTab === id ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' : 'bg-gray-900/50 text-gray-400 hover:bg-gray-900 hover:text-white'
      }`}>
      <Icon size={18} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-950 to-gray-900 text-white">
      {/* <Navbar/> */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <StatsGrid/>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Staking Interface */}
            <div className="lg:col-span-2">
                <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/10 p-6">
                    {/* Tabs */}
                    <div className="flex gap-3 mb-6">
                        <TabButton id="stake" label="Stake SOL" icon={TrendingUp} />
                        <TabButton id="unstake" label="Unstake dSOL" icon={ArrowDownUp} />
                    </div>
                    {activeTab === 'stake' ? (<StakeCard/>) : (<UnstakeCard/>)}
                </div>
            </div>
            {/* Sidebar*/}
            <div className="space-y-6">
                <PendingWithdrawlsCard/>
                <InfoCard/>
            </div>
        </div>
        {/* <Footer/> */}
      </div>

    </div>
    </div>
)};

export default UserPage;