"use client"

import { createConfig, http } from "wagmi"
import { injected, walletConnect } from "wagmi/connectors"
import { base, baseSepolia, lisk, liskSepolia } from "@/lib/chains"

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

export const config = createConfig({
  chains: [base, baseSepolia, lisk, liskSepolia],
  connectors: [
    injected(),
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId })]
      : []),
  ],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [lisk.id]: http(),
    [liskSepolia.id]: http(),
  },
  ssr: true,
})
