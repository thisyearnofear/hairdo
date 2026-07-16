"use client"

import { use, useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { CheckCircle2, XCircle, ExternalLink, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Reveal } from "@/components/ui/reveal"

interface Attestation {
  tokenId: string
  styleId: string
  styleName: string
  styleCategory: string
  userAddress: string
  photoHash: string | null
  attestationHash: string | null
  timestamp: number
  txVerified: boolean
  explorerUrl: string
  contractAddress: string
}

export default function AttestationPage({
  params,
}: {
  params: Promise<{ tokenId: string }>
}) {
  const { tokenId } = use(params)
  const [attestation, setAttestation] = useState<Attestation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenId) return

    // Defer state updates to avoid synchronous setState in effect body
    Promise.resolve().then(() => {
      setLoading(true)
      setError(null)
    })

    fetch(`/api/attestations/${tokenId}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data: Attestation) => {
        setAttestation(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch attestation")
        setLoading(false)
      })
  }, [tokenId])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    })
  }

  const shortenHash = (hash: string) => {
    if (!hash || hash.length < 20) return hash
    return `${hash.substring(0, 12)}...${hash.substring(hash.length - 8)}`
  }

  return (
    <div className="container mx-auto max-w-7xl px-4">
      <Header />

      <main className="pt-16 pb-24 max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs tracking-wide opacity-50 hover:opacity-80 transition-opacity mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to advisor
        </Link>

        {/* Technical Header */}
        <Reveal direction="up" className="mb-12 text-center">
          <div className="flex items-center justify-center gap-6 text-[10px] tracking-wider uppercase opacity-50 mb-4">
            <span>Attestation Viewer</span>
            <span className="w-px h-3 bg-white/30" />
            <span>Lisk L2</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-2 font-display text-gradient-gold">
            Attestation
          </h1>
          <p className="text-[10px] tracking-wider opacity-50 break-all">
            {tokenId}
          </p>
          <div className="max-w-xs mx-auto space-y-1.5 mt-6">
            <div className="barbershop-divider" />
            <div className="cornrow-pattern" />
          </div>
        </Reveal>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="w-10 h-10 animate-spin opacity-50" />
            <p className="text-xs tracking-wide opacity-50">
              Fetching attestation...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="border border-red-500/20 bg-red-500/5 p-8 rounded-lg text-center">
            <XCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h2 className="text-sm tracking-wide text-red-400 mb-2">
              Attestation not found
            </h2>
            <p className="text-xs opacity-60 mb-4">{error}</p>
            <p className="text-xs opacity-40">
              The tokenId may be invalid or no attestation has been recorded for it.
            </p>
          </div>
        )}

        {/* Success state */}
        {attestation && !loading && (
          <div className="space-y-6">
            {/* Verification banner */}
            <Reveal direction="up">
            <div
              className={`border p-4 rounded-lg flex items-center gap-3 border-gradient-warm glass-warm ${
                attestation.txVerified
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-yellow-500/20 bg-yellow-500/5"
              }`}
            >
              {attestation.txVerified ? (
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              )}
              <div>
                <p
                  className={`text-xs tracking-wide uppercase ${
                    attestation.txVerified ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  {attestation.txVerified
                    ? "Verified onchain"
                    : "Unverified"}
                </p>
                <p className="text-[10px] opacity-50 mt-1">
                  {attestation.txVerified
                    ? "Payment confirmed via Lisk smart contract"
                    : "Onchain verification pending"}
                </p>
              </div>
            </div>
            </Reveal>

            {/* Style details */}
            <Reveal direction="up" delay={100}>
            <div className="border border-white/10 bg-black/20 p-6 rounded-lg space-y-4 border-gradient-warm glass-warm">
              <div>
                <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                  Style
                </p>
                <p className="text-xl font-display">{attestation.styleName}</p>
                <p className="text-[10px] tracking-wide uppercase opacity-40 mt-1">
                  {attestation.styleCategory}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div>
                  <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                    Attested by
                  </p>
                  <p className="text-xs font-mono break-all">
                    {attestation.userAddress.substring(0, 10)}...
                    {attestation.userAddress.substring(
                      attestation.userAddress.length - 8
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                    Timestamp
                  </p>
                  <p className="text-xs">{formatDate(attestation.timestamp)} UTC</p>
                </div>
              </div>

              {attestation.photoHash && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                    Photo hash (SHA-256)
                  </p>
                  <p className="text-xs font-mono break-all opacity-70">
                    {shortenHash(attestation.photoHash)}
                  </p>
                </div>
              )}

              {attestation.attestationHash && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                    Attestation hash
                  </p>
                  <p className="text-xs font-mono break-all opacity-70">
                    {shortenHash(attestation.attestationHash)}
                  </p>
                </div>
              )}
            </div>
            </Reveal>

            {/* Contract details */}
            <Reveal direction="up" delay={150}>
            <div className="border border-white/10 bg-black/20 p-4 rounded-lg space-y-2 border-gradient-warm glass-warm">
              <p className="text-[10px] tracking-wide uppercase opacity-50 mb-2">
                Onchain details
              </p>
              <div className="flex justify-between text-xs">
                <span className="opacity-50">Contract</span>
                <span className="font-mono opacity-70">
                  {attestation.contractAddress.substring(0, 10)}...
                  {attestation.contractAddress.substring(
                    attestation.contractAddress.length - 8
                  )}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="opacity-50">Network</span>
                <span className="opacity-70">Lisk L2 (1135)</span>
              </div>
            </div>
            </Reveal>

            {/* Explorer link */}
            <Reveal direction="up" delay={200}>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full text-xs tracking-wide border-gradient-warm"
            >
              <a
                href={`https://blockscout.lisk.com/address/${attestation.userAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                View on Blockscout
              </a>
            </Button>

            {/* Info */}
            <div className="text-center text-[10px] tracking-wide text-white/40 space-y-1 mt-4">
              <p>This attestation is public and verifiable by anyone</p>
              <p>
                Verify independently: check isTokenUsed({shortenHash(tokenId)}) on
                the Lisk contract
              </p>
            </div>
            </Reveal>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
