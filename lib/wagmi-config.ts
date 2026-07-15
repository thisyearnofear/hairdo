"use client"

import { createConfig, http } from "wagmi"
import { injected, walletConnect } from "wagmi/connectors"
import { lisk } from "@/lib/chains"

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

export const config = createConfig({
  chains: [lisk],
  connectors: [
    injected(),
    ...(walletConnectProjectId
      ? [walletConnect({ projectId: walletConnectProjectId })]
      : []),
  ],
  transports: {
    [lisk.id]: http(),
  },
  ssr: true,
})
