"use client"

import { use, useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import {
  Loader2,
  ArrowLeft,
  ExternalLink,
  CheckCircle2,
  Star,
  MapPin,
  Scissors,
  Award,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BarberAttestation {
  tokenId: string
  styleId: string
  styleName: string
  clientAddress: string
  timestamp: number
  rating: number
  txVerified: boolean
}

interface Barber {
  id: string
  name: string
  address: string
  shop: string
  city: string
  state: string
  yearsExperience: number
  licenseVerified: boolean
  specialties: string[]
  specialtyStyles: string[]
  allStylesExecuted: string[]
  attestationHistory: BarberAttestation[]
  basePrice: number
  priceRange: [number, number]
  bookingUrl: string
  socialProof: string[]
}

interface TrustScoreBreakdown {
  verifiedCuts: number
  verifiedCutsScore: number
  specialtyCoverage: number
  specialtyCoverageScore: number
  consistency: number
  consistencyScore: number
  recency: number
  recencyScore: number
  averageRating: number
}

interface BarberTrustProfile {
  barber: Barber
  trustScore: number
  breakdown: TrustScoreBreakdown
  verifiedCuts: number
  uniqueStyles: number
  uniqueClients: number
  lastActiveTimestamp: number | null
  daysSinceLastCut: number | null
  recommendedFor: string[]
}

export default function BarberProfilePage({
  params,
}: {
  params: Promise<{ address: string }>
}) {
  const { address } = use(params)
  const [profile, setProfile] = useState<BarberTrustProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!address) return

    Promise.resolve().then(() => {
      setLoading(true)
      setError(null)
    })

    fetch(`/api/barbers/${address}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || `HTTP ${res.status}`)
        }
        return res.json()
      })
      .then((data: BarberTrustProfile) => {
        setProfile(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch barber profile")
        setLoading(false)
      })
  }, [address])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const shortenAddress = (addr: string) => {
    if (!addr || addr.length < 20) return addr
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`
  }

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-green-400"
    if (score >= 50) return "text-yellow-400"
    if (score >= 25) return "text-orange-400"
    return "text-red-400"
  }

  const scoreBg = (score: number) => {
    if (score >= 75) return "border-green-500/30 bg-green-500/5"
    if (score >= 50) return "border-yellow-500/30 bg-yellow-500/5"
    if (score >= 25) return "border-orange-500/30 bg-orange-500/5"
    return "border-red-500/30 bg-red-500/5"
  }

  return (
    <div className="container mx-auto max-w-7xl px-4">
      <Header />

      <main className="pt-16 pb-24 max-w-3xl mx-auto">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[10px] tracking-widest uppercase opacity-50 hover:opacity-80 transition-opacity mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          BACK_TO_ADVISOR
        </Link>

        {/* Technical Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-6 text-[10px] tracking-widest uppercase opacity-60 mb-4">
            <span>BARBER_TRUST_PROFILE</span>
            <span className="w-px h-3 bg-white/40" />
            <span>LISK_L2</span>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="w-10 h-10 animate-spin opacity-50" />
            <p className="text-[10px] tracking-widest uppercase opacity-50">
              FETCHING_TRUST_PROFILE...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="border border-red-500/20 bg-red-500/5 p-8 rounded text-center">
            <h2 className="text-sm tracking-widest uppercase text-red-400 mb-2">
              BARBER_NOT_FOUND
            </h2>
            <p className="text-xs opacity-60 mb-4">{error}</p>
            <p className="text-[10px] tracking-wider uppercase opacity-40">
              No barber is registered with this wallet address.
            </p>
          </div>
        )}

        {/* Profile */}
        {profile && !loading && (
          <div className="space-y-6">
            {/* Trust Score Banner */}
            <div className={`border p-6 rounded-lg ${scoreBg(profile.trustScore)} animate-enter-up`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {profile.barber.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-2 text-xs opacity-60">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.barber.city}, {profile.barber.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Scissors className="w-3 h-3" />
                      {profile.barber.shop}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-4xl font-bold tabular-nums ${scoreColor(profile.trustScore)}`}>
                    {profile.trustScore}
                  </div>
                  <div className="text-[10px] tracking-widest uppercase opacity-50">
                    TRUST_SCORE
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-2 text-[10px] tracking-wider opacity-40 mb-4">
                <span className="font-mono break-all">
                  {shortenAddress(profile.barber.address)}
                </span>
                <a
                  href={`https://blockscout.lisk.com/address/${profile.barber.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-80"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* License verified */}
              {profile.barber.licenseVerified && (
                <div className="flex items-center gap-2 text-xs text-green-400/80">
                  <CheckCircle2 className="w-3 h-3" />
                  <span className="tracking-wider uppercase text-[10px]">
                    LICENSE_VERIFIED
                  </span>
                </div>
              )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <CheckCircle2 className="w-5 h-5 mx-auto mb-2 text-green-400/60" />, value: profile.verifiedCuts, label: "VERIFIED_CUTS" },
                { icon: <Award className="w-5 h-5 mx-auto mb-2 text-yellow-400/60" />, value: profile.uniqueStyles, label: "UNIQUE_STYLES" },
                { icon: <TrendingUp className="w-5 h-5 mx-auto mb-2 text-blue-400/60" />, value: profile.uniqueClients, label: "UNIQUE_CLIENTS" },
                { icon: <Star className="w-5 h-5 mx-auto mb-2 text-purple-400/60" />, value: profile.breakdown.averageRating > 0 ? profile.breakdown.averageRating.toFixed(1) : "—", label: "AVG_RATING" },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="border border-white/10 bg-black/20 p-4 rounded-lg text-center animate-enter-up"
                  style={{ animationDelay: `${i * 45 + 60}ms` }}
                >
                  {stat.icon}
                  <div className="text-xl font-bold tabular-nums">{stat.value}</div>
                  <div className="text-[10px] tracking-widest uppercase opacity-50 mt-1">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Score Breakdown */}
            <div className="border border-white/10 bg-black/20 p-6 rounded">
              <h2 className="text-xs tracking-widest uppercase opacity-60 mb-4">
                SCORE_BREAKDOWN
              </h2>
              <div className="space-y-3">
                {/* Verified Cuts */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="opacity-70">Verified Cuts</span>
                    <span className="opacity-50">
                      {profile.breakdown.verifiedCutsScore}/35
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full bg-green-500/60 rounded animate-bar-grow"
                      style={{
                        width: `${(profile.breakdown.verifiedCutsScore / 35) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Specialty Coverage */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="opacity-70">Specialty Coverage</span>
                    <span className="opacity-50">
                      {profile.breakdown.specialtyCoverageScore}/25
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full bg-yellow-500/60 rounded animate-bar-grow"
                      style={{
                        width: `${(profile.breakdown.specialtyCoverageScore / 25) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Consistency */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="opacity-70">Consistency</span>
                    <span className="opacity-50">
                      {profile.breakdown.consistencyScore}/20
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500/60 rounded animate-bar-grow"
                      style={{
                        width: `${(profile.breakdown.consistencyScore / 20) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Recency */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="opacity-70">Recency</span>
                    <span className="opacity-50">
                      {profile.breakdown.recencyScore}/20
                    </span>
                  </div>
                  <div className="h-2 bg-white/5 rounded overflow-hidden">
                    <div
                      className="h-full bg-purple-500/60 rounded animate-bar-grow"
                      style={{
                        width: `${(profile.breakdown.recencyScore / 20) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {profile.daysSinceLastCut !== null && (
                <p className="text-[10px] tracking-wider uppercase opacity-40 mt-4">
                  LAST_ACTIVE: {profile.daysSinceLastCut} DAYS AGO
                </p>
              )}
            </div>

            {/* Specialties */}
            <div className="border border-white/10 bg-black/20 p-6 rounded">
              <h2 className="text-xs tracking-widest uppercase opacity-60 mb-4">
                SPECIALTIES
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.barber.specialties.map((spec) => (
                  <span
                    key={spec}
                    className="px-3 py-1 text-[10px] tracking-widest uppercase border border-white/10 bg-white/5 rounded"
                  >
                    {spec}
                  </span>
                ))}
              </div>

              {profile.recommendedFor.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-[10px] tracking-widest uppercase opacity-50 mb-2">
                    RECOMMENDED_FOR (ONCHAIN_PROVEN)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {profile.recommendedFor.map((styleId) => (
                      <span
                        key={styleId}
                        className="px-3 py-1 text-[10px] tracking-widest uppercase border border-green-500/20 bg-green-500/5 text-green-400/70 rounded"
                      >
                        {styleId.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="border border-white/10 bg-black/20 p-6 rounded">
              <h2 className="text-xs tracking-widest uppercase opacity-60 mb-4">
                PRICING
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    ${profile.barber.basePrice}
                  </p>
                  <p className="text-[10px] tracking-widest uppercase opacity-50">
                    BASE_PRICE
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-70">
                    ${profile.barber.priceRange[0]} – ${profile.barber.priceRange[1]}
                  </p>
                  <p className="text-[10px] tracking-widest uppercase opacity-50">
                    TYPICAL_RANGE
                  </p>
                </div>
              </div>
            </div>

            {/* Social Proof */}
            {profile.barber.socialProof.length > 0 && (
              <div className="border border-white/10 bg-black/20 p-6 rounded">
                <h2 className="text-xs tracking-widest uppercase opacity-60 mb-4">
                  SOCIAL_PROOF
                </h2>
                <ul className="space-y-2">
                  {profile.barber.socialProof.map((proof, i) => (
                    <li
                      key={i}
                      className="text-xs opacity-70 flex items-start gap-2"
                    >
                      <span className="text-[8px] mt-1 opacity-50">●</span>
                      {proof}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Attestation History */}
            <div className="border border-white/10 bg-black/20 p-6 rounded">
              <h2 className="text-xs tracking-widest uppercase opacity-60 mb-4">
                ATTESTATION_HISTORY ({profile.barber.attestationHistory.length})
              </h2>
              <div className="space-y-2">
                {profile.barber.attestationHistory
                  .slice()
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((att, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-3 h-3 text-green-400/60 flex-shrink-0" />
                        <div>
                          <p className="text-xs">{att.styleName}</p>
                          <p className="text-[10px] opacity-40">
                            {formatDate(att.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3 h-3 ${
                                idx < att.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-white/10"
                              }`}
                            />
                          ))}
                        </div>
                        <Link
                          href={`/attestations/${att.tokenId}`}
                          className="text-[10px] tracking-widest uppercase opacity-40 hover:opacity-80 transition-opacity"
                        >
                          VIEW
                        </Link>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Explorer link */}
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full text-xs tracking-widest uppercase"
            >
              <a
                href={`https://blockscout.lisk.com/address/${profile.barber.address}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-3 h-3 mr-2" />
                VIEW_ON_BLOCKSCOUT
              </a>
            </Button>

            {/* Info */}
            <div className="text-center text-[10px] tracking-wider text-white/40 space-y-1">
              <p>TRUST_SCORE_COMPUTED_FROM_ONCHAIN_ATTESTATION_HISTORY</p>
              <p>SCORES_UPDATE_AS_NEW_ATTESTATIONS_ARE_RECORDED</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
