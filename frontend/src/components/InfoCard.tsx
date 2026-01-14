const InfoCard = () => {
  return (
    <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-2xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10 p-6">
        <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">How It Works</h3>
        <div className="space-y-4 text-sm">
            <div className="border-l-2 border-purple-500/50 pl-3">
                <div className="font-medium text-white mb-1">1. Stake SOL</div>
                <p className="text-gray-400">Deposit SOL and receive liquid LST tokens instantly.</p>
            </div>
            <div className="border-l-2 border-blue-500/50 pl-3">
                <div className="font-medium text-white mb-1">2. Earn Rewards</div>
                <p className="text-gray-400">LST tokens automatically accrue staking rewards.</p>
            </div>
            <div className="border-l-2 border-cyan-500/50 pl-3">
                <div className="font-medium text-white mb-1">3. Use in DeFi</div>
                <p className="text-gray-400">Trade or use LST in DeFi while earning rewards.</p>
            </div>
            <div className="border-l-2 border-green-500/50 pl-3">
                <div className="font-medium text-white mb-1">4. Unstake Anytime</div>
                <p className="text-gray-400">Burn LST to unstake. Wait 2-3 epochs, then claim SOL.</p>
            </div>
        </div>
    </div>
)}

export default InfoCard