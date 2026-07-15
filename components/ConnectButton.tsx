"use client"

import { useState } from "react"
import { useConnection, useDisconnect, useConnect, useConnectors } from "wagmi"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown, X } from "lucide-react"

export function ConnectButton() {
  const { isConnected, address } = useConnection()
  const { disconnect } = useDisconnect()
  const { connect, isPending: isConnecting } = useConnect()
  const connectors = useConnectors()
  const [showModal, setShowModal] = useState(false)
  const [showDisconnect, setShowDisconnect] = useState(false)

  const shortenAddress = (addr?: string) => {
    if (!addr) return ""
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`
  }

  if (isConnected && address) {
    return (
      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowDisconnect(!showDisconnect)}
          className="tracking-wider"
        >
          {shortenAddress(address)}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
        {showDisconnect && (
          <div className="absolute top-full right-0 mt-2 z-50">
            <div className="bg-black/95 border border-white/10 rounded-lg p-2 min-w-[140px]">
              <button
                onClick={() => {
                  disconnect()
                  setShowDisconnect(false)
                }}
                className="w-full text-left px-3 py-2 text-xs tracking-widest uppercase hover:bg-white/10 rounded text-red-400"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setShowModal(true)}
        disabled={isConnecting}
        className="tracking-wider"
      >
        {isConnecting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          "Connect Wallet"
        )}
      </Button>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-black/95 border border-white/10 p-6 w-full max-w-sm rounded-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-sm tracking-widest uppercase">Connect Wallet</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/60 hover:text-white/90"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {connectors.map((connector) => (
                <button
                  key={connector.uid}
                  onClick={() => {
                    connect({ connector })
                    setShowModal(false)
                  }}
                  className="w-full text-left px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors text-sm tracking-wide"
                >
                  {connector.name}
                </button>
              ))}
              {connectors.length === 0 && (
                <p className="text-xs text-white/60 text-center py-4">
                  No wallets available. Install a wallet extension.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
