"use client"

import { createConfig, http } from "wagmi"
import { injected, walletConnect } from "wagmi/connectors"
import {
  activeChain,
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  celo,
  celoSepolia,
  liveChains,
} from "@/lib/chains"

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

// Wallet-facing chains: every live L2 target (dead Lisk excluded —
// MiniPay/WalletConnect users arrive on Celo, grant tracks on the rest).
// The deployment track itself is NEXT_PUBLIC_CHAIN (see lib/chains.ts).
export const config = createConfig({
  chains: liveChains,
  connectors: [
    injected(),
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId })]
      : []),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
    [celoSepolia.id]: http(),
    [celo.id]: http(),
    [arbitrumSepolia.id]: http(),
    [arbitrum.id]: http(),
  },
  ssr: true,
})

export { activeChain }
