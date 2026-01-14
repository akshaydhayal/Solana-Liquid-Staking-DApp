import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { TrendingUp } from 'lucide-react'
import { useRecoilState } from 'recoil'
import { navState } from '../state/navState'
import { useWallet } from '@solana/wallet-adapter-react'
import { useEffect } from 'react'
import { lstManagerPda, lstManagerVaultPda, lstMintPda } from '../lib/constants'

const Navbar = () => {
  let wallet=useWallet();
  let [userAddress,setUserAddress]=useRecoilState(navState);
  console.log("user address : ",userAddress.user_address?.toBase58());
  console.log("lst manager pda : ",lstManagerPda?.toBase58());
  console.log("lst manager vault pda : ",lstManagerVaultPda?.toBase58());
  console.log("lst mint pda : ",lstMintPda?.toBase58());
  
  useEffect(()=>{
    // if (wallet.publicKey){
    //     setUserAddress({user_address:wallet.publicKey})
    // }else{
    //     setUserAddress({user_address:null})
    // }
    wallet.publicKey? setUserAddress({user_address:wallet.publicKey}) : setUserAddress({user_address:null});
  },[wallet]);
  return (
    <div className="border-b border-purple-500/20 backdrop-blur-sm bg-gradient-to-r from-gray-900/95 via-gray-900/90 to-gray-900/95 shadow-lg shadow-purple-500/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <TrendingUp size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Devnet SolStake</h1>
                    <p className="text-xs text-gray-400">Liquid Staking Protocol</p>
                </div>
            </div>
            <WalletMultiButton/>
        </div>
    </div>
)}

export default Navbar