import { CheckCircle, Clock, TrendingUp, Wallet } from 'lucide-react'

const AdminStats = () => {
    // Mock data
  const vaultBalance = 10000.5;
  const totalStaked = 85000.25;
  const pendingUnstakes = 15;
  const readyWithdrawals = 5;
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-xl border-2 border-purple-500/30 shadow-lg shadow-purple-500/10 p-4">
            <div className="flex items-center gap-2 text-purple-300 text-sm mb-2">
              <Wallet size={16} className="text-purple-400" />
              Vault Balance
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{vaultBalance.toLocaleString()} SOL</div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-xl border-2 border-blue-500/30 shadow-lg shadow-blue-500/10 p-4">
            <div className="flex items-center gap-2 text-blue-300 text-sm mb-2">
              <TrendingUp size={16} className="text-blue-400" />
              Total Staked
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{totalStaked.toLocaleString()} SOL</div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-xl border-2 border-orange-500/30 shadow-lg shadow-orange-500/10 p-4">
            <div className="flex items-center gap-2 text-orange-300 text-sm mb-2">
              <Clock size={16} className="text-orange-400" />
              Pending Unstakes
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">{pendingUnstakes}</div>
          </div>

          <div className="bg-gradient-to-br from-gray-800/90 via-gray-800/80 to-gray-800/90 backdrop-blur-sm rounded-xl border-2 border-green-500/30 shadow-lg shadow-green-500/10 p-4">
            <div className="flex items-center gap-2 text-green-300 text-sm mb-2">
              <CheckCircle size={16} className="text-green-400" />
              Ready Withdrawals
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{readyWithdrawals}</div>
          </div>
        </div>
  )
}

export default AdminStats