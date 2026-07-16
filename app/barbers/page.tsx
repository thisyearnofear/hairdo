"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import {
  Loader2,
  Star,
  CheckCircle2,
  MapPin,
  Scissors,
  ArrowLeft,
  X,
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
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <BarbersContent />
    </Suspense>
  )
}

function BarbersContent() {
  const searchParams = useSearchParams()
  const styleFilter = searchParams.get("style") || ""

  const [barbers, setBarbers] = useState<BarberSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterCity, setFilterCity] = useState<string>("")
  const [styleCategory, setStyleCategory] = useState<string>("")

  useEffect(() => {
    Promise.resolve().then(() => {
      setLoading(true)
      setError(null)
    })

    // If we have a style filter, fetch the style to get its category
    if (styleFilter) {
      fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hairType: "4C", climate: "temperate", maintenanceTolerance: "medium", limit: 50 }),
      })
        .then((res) => res.json())
        .then((data) => {
          const style = data.recommendations?.find((r: { style: { id: string; category: string } }) => r.style.id === styleFilter)
          if (style) setStyleCategory(style.style.category)
        })
        .catch(() => {})
    }

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
  }, [styleFilter])

  const cities = [...new Set(barbers.map((b) => b.barber.city))].sort()

  // Filter by city AND style category if set
  const filtered = barbers.filter((b) => {
    const cityMatch = !filterCity || b.barber.city === filterCity
    const styleMatch = !styleCategory || b.barber.specialties.includes(styleCategory)
    return cityMatch && styleMatch
  })

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
          className="inline-flex items-center gap-2 text-xs tracking-wide opacity-50 hover:opacity-80 transition-opacity mb-8"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to advisor
        </Link>

        {/* Technical Header */}
        <div className="mb-12 text-center">
          <div className="flex items-center justify-center gap-6 text-[10px] tracking-wider uppercase opacity-50 mb-4">
            <span>Barber Trust Directory</span>
            <span className="w-px h-3 bg-white/30" />
            <span>Lisk L2</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tighter mb-3 font-display">
            Verified Barbers
          </h1>
          <p className="text-sm opacity-60 max-w-xl mx-auto leading-relaxed">
            Barbers ranked by onchain attestation history. Trust scores are
            computed from verified cuts, specialty coverage, consistency, and
            recency.
          </p>
        </div>

        {/* Style filter banner */}
        {styleFilter && styleCategory && (
          <div className="mb-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-amber/10 border border-amber/30 rounded-lg">
              <Scissors className="w-4 h-4 text-amber" />
              <span className="text-sm text-amber">
                Filtered by specialty: <strong className="font-medium">{styleCategory}</strong>
              </span>
              <Link
                href="/barbers"
                className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* No results for style filter */}
        {!loading && !error && filtered.length === 0 && styleCategory && (
          <div className="text-center py-12 border border-white/10 bg-black/20 rounded-lg mb-8">
            <p className="text-sm opacity-60 mb-2">
              No barbers found specializing in <strong className="text-amber">{styleCategory}</strong> styles.
            </p>
            <Link
              href="/barbers"
              className="text-xs text-amber underline hover:text-amber/80 transition-colors"
            >
              View all barbers
            </Link>
          </div>
        )}

        {/* City filter */}
        {cities.length > 0 && (
          <div className="flex items-center gap-2 mb-8 justify-center flex-wrap">
            <button
              onClick={() => setFilterCity("")}
              className={`px-3 py-1.5 text-xs tracking-wide border rounded-lg transition-all press-scale ${
                !filterCity
                  ? "border-amber/30 bg-amber/10 text-amber"
                  : "border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
              }`}
            >
              All cities
            </button>
            {cities.map((city) => (
              <button
                key={city}
                onClick={() => setFilterCity(city)}
                className={`px-3 py-1.5 text-xs tracking-wide border rounded-lg transition-all press-scale ${
                  filterCity === city
                    ? "border-amber/30 bg-amber/10 text-amber"
                    : "border-white/10 text-white/50 hover:text-white/70 hover:border-white/20"
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
            <p className="text-xs tracking-wide opacity-50">
              Fetching trust scores...
            </p>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="border border-red-500/20 bg-red-500/5 p-8 rounded-lg text-center">
            <p className="text-sm text-red-400 tracking-wide">
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
                          className={`px-2 py-0.5 text-[10px] tracking-wide border rounded ${
                            styleCategory === spec
                              ? "border-amber/40 bg-amber/10 text-amber"
                              : "border-white/10 bg-white/5 opacity-60"
                          }`}
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
                            className="px-2 py-0.5 text-[10px] tracking-wide border border-green-500/20 bg-green-500/5 text-green-400/60 rounded"
                          >
                            {"✓"} {styleId.replace(/-/g, " ")}
                          </span>
                        ))}
                        {entry.recommendedFor.length > 5 && (
                          <span className="px-2 py-0.5 text-[10px] tracking-wide opacity-40">
                            +{entry.recommendedFor.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right: Trust score + stats */}
                  <div className="flex-shrink-0 text-right">
                    <div className={`text-3xl font-bold tabular-nums font-display ${scoreColor(entry.trustScore)}`}>
                      {entry.trustScore}
                    </div>
                    <div className="text-[10px] tracking-wide opacity-40 mb-3">
                      Trust score
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
