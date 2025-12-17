"use client"

import { WagmiProvider, createConfig, http, type Config } from "wagmi"
import { lisk } from "@/lib/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"

// Log environment variable for debugging
console.log("WalletConnect Project ID:", process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? "SET" : "NOT SET")
console.log("Full env check:", {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  hasPrefix: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.startsWith('3c6d'),
})

// Check if WalletConnect project ID is available
const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

// Create config with proper error handling
let config: Config
try {
  if (walletConnectProjectId) {
    config = createConfig(
      getDefaultConfig({
        chains: [lisk],
        transports: {
          [lisk.id]: http(),
        },
        walletConnectProjectId: walletConnectProjectId,
        appName: "HAIRDO",
        appDescription: "AI-powered hairstyle generator on LISK",
        appUrl: typeof window !== 'undefined' ? window.location.origin : "https://hairdo.vercel.app",
        appIcon: typeof window !== 'undefined' ? `${window.location.origin}/img/logo.svg` : "https://hairdo.vercel.app/img/logo.svg",
      })
    )
    console.log("Created config with WalletConnect")
  } else {
    // Fallback config without WalletConnect if project ID is missing
    config = createConfig({
      chains: [lisk],
      transports: {
        [lisk.id]: http(),
      },
    })
    console.log("Created fallback config without WalletConnect")
  }
} catch (error) {
  console.error("Error creating wagmi config:", error)
  // Fallback to basic config
  config = createConfig({
    chains: [lisk],
    transports: {
      [lisk.id]: http(),
    },
  })
}

const queryClient = new QueryClient()

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          mode="auto"
          options={{}}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}