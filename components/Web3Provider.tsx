"use client"

import { WagmiProvider, createConfig, http } from "wagmi"
import { lisk } from "@/lib/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"

const config = createConfig(
  getDefaultConfig({
    chains: [lisk],
    transports: {
      [lisk.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    appName: "HAIRDO",
    appDescription: "AI-powered hairstyle generator on LISK",
    appUrl: "https://hairdo.lisk.com",
    appIcon: "https://hairdo.lisk.com/img/logo.svg",
  })
)

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
