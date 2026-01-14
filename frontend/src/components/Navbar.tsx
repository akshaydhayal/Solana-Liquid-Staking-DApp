import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { TrendingUp, Wallet } from 'lucide-react'
import { useRecoilState, useSetRecoilState } from 'recoil'
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
    if (wallet.publicKey){
        setUserAddress({user_address:wallet.publicKey})
    }else{
        setUserAddress({user_address:null})
    }
  },[wallet]);

//   if (wallet.publicKey){
//     console.log(wallet.publicKey);
//     setUserAddress({user_address:wallet.publicKey})
//   }
  return (
    <div className="border-b border-gray-800/50 backdrop-blur-sm bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold">Devnet SolStake</h1>
                    <p className="text-xs text-gray-400">Liquid Staking Protocol</p>
                </div>
            </div>
            <WalletMultiButton/>
        </div>
    </div>
)}

export default Navbar