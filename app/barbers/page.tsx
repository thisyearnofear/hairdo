"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import {
  Loader2,
  Star,
  CheckCircle2,
  MapPin,
  Scissors,
  ArrowLeft,
} from "lucide-react"
import Link from "next/link"

interface BarberSummary {
  barber: {
    id: string
    name: string
    address: string
    shop: string
    city: string
    state: string
    yearsExperience: number
    licenseVerified: boolean
    specialties: string[]
    basePrice: number
    priceRange: [number, number]
  }
  trustScore: number
  verifiedCuts: number
  uniqueStyles: number
  uniqueClients: number
  daysSinceLastCut: number | null
  averageRating: number
  recommendedFor: string[]
}

export default function BarbersPage() {
  const [barbers, setBarbers] = useState<BarberSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCity, setFilterCity] = useState<string>("")

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true)
      setError(null)
    })

    fetch("/api/barber-score")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((data) => {
        setBarbers(data.barbers)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message || "Failed to fetch barbers")
        setLoading(false)
      })
  }, [])

  const cities = [...new Set(barbers.map((b) => b.barber.city))].sort()
  const filtered = filterCity
    ? barbers.filter((b) => b.barber.city === filterCity)
    : barbers

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-green-400"
    if (score >= 50) return "text-yellow-400"
    if (score >= 25) return "text-orange-400"
    return "text-red-400"
  }

  const scoreBorder = (score: number) => {
    if (score >= 75) return "border-green-500/20"
    if (score >= 50) return "border-yellow-500/20"
    if (score >= 25) return "border-orange-500/20"
    return "border-red-500/20"
  }

  return (
    <div className="container mx-auto max-w-7xl px-4">
      <Header />

      <main className="pt-16 pb-24 max-w-5xl mx-auto">
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
            <span>BARBER_TRUST_DIRECTORY</span>
            <span className="w-px h-3 bg-white/40" />
            <span>LISK_L2</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tighter mb-2">
            VERIFIED_BARBERS
          </h1>
          <p className="text-sm opacity-60 max-w-xl mx-auto">
            Barbers ranked by onchain attestation history. Trust scores are
            computed from verified cuts, specialty coverage, consistency, and
            recency.
          </p>
        </div>

        {/* City filter */}
        {cities.length > 0 && (
          <div className="flex items-center gap-2 mb-8 justify-center flex-wrap">
            <button
              onClick={() => setFilterCity("")}
              className={`px-3 py-1 text-[10px] tracking-widest uppercase border rounded transition-all ${
                !filterCity
                  ? "border-white/30 bg-white/10 text-white/90"
                  : "border-white/10 text-white/50 hover:text-white/70"
              }`}
            >
              ALL_CITIES
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setFilterCity(city)}
                className={`px-3 py-1 text-[10px] tracking-widest uppercase border rounded transition-all ${
                  filterCity === city
                    ? "border-white/30 bg-white/10 text-white/90"
                    : "border-white/10 text-white/50 hover:text-white/70"
                }`}
              >
                {city}
              </button>
            ))}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 className="w-10 h-10 animate-spin opacity-50" />
            <p className="text-[10px] tracking-widest uppercase opacity-50">
              FETCHING_TRUST_SCORES...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="border border-red-500/20 bg-red-500/5 p-8 rounded text-center">
            <p className="text-xs text-red-400 tracking-wide uppercase">
              {error}
            </p>
          </div>
        )}

        {/* Barber cards */}
        {!loading && !error && (
          <div className="space-y-4">
            {filtered.map((entry, index) => (
              <Link
                key={entry.barber.id}
                href={`/barbers/${entry.barber.address}`}
                className={`block border ${scoreBorder(entry.trustScore)} bg-black/20 p-5 rounded-lg hover:bg-black/30 transition-[background-color,border-color] duration-200 group press-scale animate-enter-up`}
                style={{ animationDelay: `${index * 45}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: Barber info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] tracking-widest uppercase opacity-30">
                        #{index + 1}
                      </span>
                      <h3 className="text-lg font-medium group-hover:text-white transition-colors">
                        {entry.barber.name}
                      </h3>
                      {entry.barber.licenseVerified && (
                        <CheckCircle2 className="w-3 h-3 text-green-400/60" />
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs opacity-50 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.barber.city}, {entry.barber.state}
                      </span>
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        {entry.barber.shop}
                      </span>
                      <span>${entry.barber.basePrice}+</span>
                    </div>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {entry.barber.specialties.map((spec) => (
                        <span
                          key={spec}
                          className="px-2 py-0.5 text-[9px] tracking-widest uppercase border border-white/10 bg-white/5 rounded"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>

                    {/* Onchain proven styles */}
                    {entry.recommendedFor.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {entry.recommendedFor.slice(0, 5).map((styleId) => (
                          <span
                            key={styleId}
                            className="px-2 py-0.5 text-[9px] tracking-widest uppercase border border-green-500/20 bg-green-500/5 text-green-400/60 rounded"
                          >
                            {"✓"} {styleId.replace(/-/g, " ")}
                          </span>
                        ))}
                        {entry.recommendedFor.length > 5 && (
                          <span className="px-2 py-0.5 text-[9px] tracking-widest uppercase opacity-40">
                            +{entry.recommendedFor.length - 5} MORE
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Trust score + stats */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-3xl font-bold tabular-nums ${scoreColor(entry.trustScore)}`}>
                      {entry.trustScore}
                    </div>
                    <div className="text-[9px] tracking-widest uppercase opacity-40 mb-3">
                      TRUST_SCORE
                    </div>

                    <div className="space-y-1 text-[10px] tracking-wider uppercase opacity-50">
                      <div className="flex items-center justify-end gap-1.5">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        {entry.verifiedCuts} CUTS
                      </div>
                      <div className="flex items-center justify-end gap-1.5">
                        <Star className="w-2.5 h-2.5" />
                        {entry.averageRating > 0
                          ? entry.averageRating.toFixed(1)
                          : "—"}{" "}
                        RATING
                      </div>
                      <div>{entry.uniqueClients} CLIENTS</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <p className="text-xs opacity-50">
                  No barbers found in {filterCity}.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        {!loading && !error && barbers.length > 0 && (
          <div className="mt-12 text-center text-[10px] tracking-wider text-white/40 space-y-1">
            <p>TRUST_SCORES_COMPUTED_FROM_ONCHAIN_ATTESTATION_HISTORY</p>
            <p>CLICK_ANY_BARBER_TO_VIEW_FULL_TRUST_PROFILE</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
