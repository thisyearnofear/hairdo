"use client"

import { WagmiProvider, createConfig, http, type Config } from "wagmi"
import { lisk } from "@/lib/chains"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ConnectKitProvider, getDefaultConfig } from "connectkit"
import { useState, useEffect } from "react"

// Log environment variable for debugging
console.log("WalletConnect Project ID:", process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ? "SET" : "NOT SET")
console.log("Full env check:", {
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
  hasPrefix: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.startsWith('3c6d'),
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<Config | null>(null)

  useEffect(() => {
    // Only initialize on client side to avoid SSR issues with indexedDB
    const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ""

    try {
      if (walletConnectProjectId) {
        const newConfig = createConfig(
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
        console.log("Config chains:", newConfig.chains)
        setConfig(newConfig)
      } else {
        // Fallback config without WalletConnect if project ID is missing
        const newConfig = createConfig({
          chains: [lisk],
          transports: {
            [lisk.id]: http(),
          },
        })
        console.log("Created fallback config without WalletConnect")
        console.log("Config chains:", newConfig.chains)
        setConfig(newConfig)
      }
    } catch (error) {
      console.error("Error creating wagmi config:", error)
      // Fallback to basic config
      const newConfig = createConfig({
        chains: [lisk],
        transports: {
          [lisk.id]: http(),
        },
      })
      console.log("Fallback config created")
      console.log("Config chains:", newConfig.chains)
      setConfig(newConfig)
    }
  }, [])

  const queryClient = new QueryClient()

  if (!config) {
    return <div>Loading Web3...</div>
  }

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