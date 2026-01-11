import React, { useState } from 'react';
import { ArrowDownUp, Coins, TrendingUp, Wallet, Clock, CheckCircle, Info, ExternalLink } from 'lucide-react';

const LSTDApp2 = () => {
  const [activeTab, setActiveTab] = useState('stake');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  // Mock data
  const stats = {
    tvl: '12,450,000',
    apy: '7.2',
    exchangeRate: '1.042',
    yourStake: '150.5',
    yourLST: '144.3',
    pendingUnstake: '25.0'
  };

  const pendingWithdrawals = [
    { amount: '10.5', unlockEpoch: 534, currentEpoch: 532, status: 'pending' },
    { amount: '14.5', unlockEpoch: 533, currentEpoch: 532, status: 'ready' }
  ];

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
        activeTab === id
          ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg'
          : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-white'
      }`}
    >
      <Icon size={18} />
      {label}
    </button>
  );

  const StatCard = ({ label, value, subtext, icon: Icon, gradient }) => (
    <div className={`bg-gradient-to-br ${gradient} px-4 py-3 rounded-xl shadow-lg`}>
      <div className="flex items-start justify-between mb-1">
        <span className="text-white/80 text-xs font-medium">{label}</span>
        <Icon size={16} className="text-white/60" />
      </div>
      <div className="text-2xl font-bold text-white mb-0.5">{value}</div>
      {subtext && <div className="text-white/70 text-xs">{subtext}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">SolStake</h1>
              <p className="text-xs text-gray-400">Liquid Staking Protocol</p>
            </div>
          </div>
          <button
            onClick={() => setIsConnected(!isConnected)}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              isConnected
                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg'
            }`}
          >
            <Wallet size={18} />
            {isConnected ? '7jK9...xY2m' : 'Connect Wallet'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Total Value Locked"
            value={`${stats.tvl} SOL`}
            icon={Coins}
            gradient="from-purple-600/20 to-purple-800/20 border border-purple-600/20"
          />
          <StatCard
            label="Current APY"
            value={`${stats.apy}%`}
            subtext="Est. annual yield"
            icon={TrendingUp}
            gradient="from-blue-600/20 to-blue-800/20 border border-blue-600/20"
          />
          <StatCard
            label="Exchange Rate"
            value={stats.exchangeRate}
            subtext="LST per SOL"
            icon={ArrowDownUp}
            gradient="from-green-600/20 to-green-800/20 border border-green-600/20"
          />
          <StatCard
            label="Your Staked SOL"
            value={isConnected ? `${stats.yourStake} SOL` : '—'}
            subtext={isConnected ? `${stats.yourLST} LST` : 'Connect wallet'}
            icon={Wallet}
            gradient="from-pink-600/20 to-pink-800/20 border border-pink-600/20"
          />
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Staking Interface */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              {/* Tabs */}
              <div className="flex gap-3 mb-6">
                <TabButton id="stake" label="Stake SOL" icon={TrendingUp} />
                <TabButton id="unstake" label="Unstake" icon={ArrowDownUp} />
              </div>

              {activeTab === 'stake' ? (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount to Stake
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-2xl font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-gray-400 font-medium">SOL</span>
                        <button className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                      <span>Balance: 250.5 SOL</span>
                      <span>≈ $12,525.00</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border-2 border-gray-700">
                      <ArrowDownUp size={18} className="text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      You Will Receive
                    </label>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4">
                      <div className="text-2xl font-semibold">
                        {stakeAmount ? (parseFloat(stakeAmount) / parseFloat(stats.exchangeRate)).toFixed(4) : '0.00'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">LST Tokens</div>
                    </div>
                  </div>

                  <div className="bg-purple-900/20 border border-purple-600/30 rounded-lg p-4 flex gap-3">
                    <Info size={20} className="text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-300">
                      <p className="font-medium text-white mb-1">Instant Liquidity</p>
                      Your LST tokens are immediately liquid and can be used in DeFi while earning staking rewards.
                    </div>
                  </div>

                  <button
                    disabled={!isConnected || !stakeAmount}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-semibold text-lg transition-all"
                  >
                    {!isConnected ? 'Connect Wallet' : 'Stake SOL'}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      Amount to Unstake
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4 text-2xl font-semibold focus:outline-none focus:border-purple-500 transition-colors"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                        <span className="text-gray-400 font-medium">LST</span>
                        <button className="text-sm text-purple-400 hover:text-purple-300 font-medium">
                          MAX
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-400">
                      <span>Balance: {stats.yourLST} LST</span>
                      <span>≈ ${(parseFloat(stats.yourLST) * parseFloat(stats.exchangeRate) * 50).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center border-2 border-gray-700">
                      <ArrowDownUp size={18} className="text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                      You Will Receive (After Cooldown)
                    </label>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-4">
                      <div className="text-2xl font-semibold">
                        {unstakeAmount ? (parseFloat(unstakeAmount) * parseFloat(stats.exchangeRate)).toFixed(4) : '0.00'}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">SOL</div>
                    </div>
                  </div>

                  <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4 flex gap-3">
                    <Clock size={20} className="text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-300">
                      <p className="font-medium text-white mb-1">Unstaking Period</p>
                      Unstaking requires ~2-3 epochs (4-6 days). You can claim your SOL once the cooldown period ends.
                    </div>
                  </div>

                  <button
                    disabled={!isConnected || !unstakeAmount}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed py-4 rounded-xl font-semibold text-lg transition-all"
                  >
                    {!isConnected ? 'Connect Wallet' : 'Burn LST & Request Unstake'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Pending Withdrawals */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock size={20} />
                Pending Withdrawals
              </h3>

              {isConnected ? (
                <div className="space-y-3">
                  {pendingWithdrawals.map((withdrawal, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-900/50 rounded-lg p-4 border border-gray-700/50"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-xl font-semibold">{withdrawal.amount} SOL</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Unlock Epoch: {withdrawal.unlockEpoch}
                          </div>
                        </div>
                        {withdrawal.status === 'ready' ? (
                          <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs rounded-full border border-green-600/30 flex items-center gap-1">
                            <CheckCircle size={12} />
                            Ready
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-orange-600/20 text-orange-400 text-xs rounded-full border border-orange-600/30">
                            {withdrawal.unlockEpoch - withdrawal.currentEpoch} epochs
                          </span>
                        )}
                      </div>
                      <button
                        disabled={withdrawal.status !== 'ready'}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed py-2 rounded-lg text-sm font-medium transition-all"
                      >
                        {withdrawal.status === 'ready' ? 'Claim SOL' : 'Waiting...'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Wallet size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Connect wallet to view withdrawals</p>
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
              <h3 className="text-lg font-semibold mb-4">How It Works</h3>
              <div className="space-y-4 text-sm text-gray-300">
                <div>
                  <div className="font-medium text-white mb-1">1. Stake SOL</div>
                  <p className="text-gray-400">Deposit SOL and receive liquid LST tokens instantly.</p>
                </div>
                <div>
                  <div className="font-medium text-white mb-1">2. Earn Rewards</div>
                  <p className="text-gray-400">LST tokens automatically accrue staking rewards.</p>
                </div>
                <div>
                  <div className="font-medium text-white mb-1">3. Use in DeFi</div>
                  <p className="text-gray-400">Trade or use LST in DeFi while earning rewards.</p>
                </div>
                <div>
                  <div className="font-medium text-white mb-1">4. Unstake Anytime</div>
                  <p className="text-gray-400">Burn LST to unstake. Wait 2-3 epochs, then claim SOL.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-4">
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
              Documentation <ExternalLink size={14} />
            </a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
              Analytics <ExternalLink size={14} />
            </a>
            <span>•</span>
            <a href="#" className="hover:text-white transition-colors">Security Audit</a>
          </div>
        </div>
      </div>
    </div>
    </div>
)};

export default LSTDApp2;