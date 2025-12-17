"use client"

import { WagmiProvider, createConfig, http } from "wagmi"
import { lisk } from "@/lib/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"

// Use getDefaultConfig which handles the configuration properly
const config = createConfig(
  getDefaultConfig({
    chains: [lisk],
    transports: {
      [lisk.id]: http(),
    },
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
    appName: "HAIRDO",
    appDescription: "AI-powered hairstyle generator on LISK",
    appUrl: typeof window !== 'undefined' ? window.location.origin : "https://hairdo.vercel.app",
    appIcon: typeof window !== 'undefined' ? `${window.location.origin}/img/logo.svg` : "https://hairdo.vercel.app/img/logo.svg",
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