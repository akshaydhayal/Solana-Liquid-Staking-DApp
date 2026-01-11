import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react"
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { clusterApiUrl } from "@solana/web3.js"
import "@solana/wallet-adapter-react-ui/styles.css";
import DepositSOL from "./components/DepositSOL";
import { Buffer } from "buffer";
import LSTDApp2 from "./components/LSTDapp2";

function App() {
  let endpoint=clusterApiUrl("devnet")
  return (
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={[]} autoConnect>
          <WalletModalProvider>
            {/* <p>Hello</p> */}
            {/* <WalletMultiButton/> */}
            {/* <DepositSOL/> */}
            <LSTDApp2/>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
  )
}
export default App
