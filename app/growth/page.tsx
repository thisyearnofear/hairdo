"use client"

import { useState, useEffect } from "react"
import { useConnection } from "wagmi"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Reveal } from "@/components/ui/reveal"
import {
  Calendar,
  TrendingUp,
  Clock,
  Scissors,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Activity,
} from "lucide-react"
import Link from "next/link"

interface StyleHistoryEntry {
  styleId: string
  styleName: string
  date: string
  daysAgo: number
}

interface GrowthStatus {
  hasHistory: boolean
  totalCuts: number
  latestCut: {
    styleId: string
    styleName: string
    timestamp: number
  } | null
  daysSinceLastCut: number
  styleMaintenanceDays: number
  growthStatus: "fresh" | "growing" | "overdue" | "critical"
  daysUntilOverdue: number
  rebookUrgency: "none" | "soon" | "now" | "overdue"
  nudgeMessage: string | null
  recommendedBarbers: unknown
  styleHistory: StyleHistoryEntry[]
  averageRebookInterval: number | null
  predictedOverdueDate: string | null
  styleLoyalty: number | null
}

const statusConfig = {
  fresh: {
    label: "Fresh cut",
    color: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/30",
    icon: Sparkles,
  },
  growing: {
    label: "Growing out",
    color: "text-amber",
    bg: "bg-amber/10",
    border: "border-amber/30",
    icon: TrendingUp,
  },
  overdue: {
    label: "Overdue",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    icon: Clock,
  },
  critical: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    icon: AlertCircle,
  },
}

export default function GrowthDashboardPage() {
  const { address, isConnected } = useConnection()
  const [status, setStatus] = useState<GrowthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isConnected || !address) {
      setLoading(false)
      return
    }

    let cancelled = false

    const fetchGrowth = async () => {
      try {
        const res = await fetch(
          `/api/growth?address=${address}`
        )
        if (!res.ok) throw new Error("Failed to fetch growth data")
        const data = await res.json()
        if (!cancelled) {
          setStatus(data)
          setLoading(false)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load")
          setLoading(false)
        }
      }
    }

    fetchGrowth()
    const interval = setInterval(fetchGrowth, 60000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [isConnected, address])

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-20">
          <Reveal>
            <div className="text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center mx-auto">
                <Activity className="w-8 h-8 text-amber" />
              </div>
              <h1 className="text-2xl font-display text-gradient-warm">
                Your hair growth dashboard
              </h1>
              <p className="text-sm opacity-60 max-w-md mx-auto leading-relaxed">
                Connect your wallet to see your attested cut history, growth
                status, and rebook nudges from the Hair Growth Agent.
              </p>
              <Button asChild variant="secondary" size="lg" className="mt-4">
                <Link href="/">Back home</Link>
              </Button>
            </div>
          </Reveal>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <Reveal>
          <Link
            href="/"
            className="text-xs tracking-wide opacity-50 hover:opacity-80 transition-opacity inline-flex items-center gap-1 mb-6"
          >
            <ArrowLeft className="w-3 h-3" />
            Back home
          </Link>

          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-amber" />
              <span className="text-[11px] tracking-wide uppercase opacity-50">
                Growth dashboard
              </span>
            </div>
            <h1 className="text-3xl font-display text-gradient-warm mb-2">
              Your hair history
            </h1>
            {address && (
              <p className="text-[10px] opacity-40 font-mono break-all max-w-xs mx-auto">
                {address}
              </p>
            )}
          </div>
        </Reveal>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-4 py-20">
            <div className="w-12 h-12 border-2 border-amber/20 border-t-amber rounded-full animate-spin" />
            <p className="text-sm font-display italic opacity-70">
              Reading your attestation history
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="bg-red-500/5 border border-red-500/20 p-4 rounded-lg text-center">
            <p className="text-xs text-red-400/80 tracking-wide">{error}</p>
          </div>
        )}

        {/* No history */}
        {status && !status.hasHistory && !loading && (
          <Reveal>
            <div className="text-center space-y-6 py-12">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                <Scissors className="w-8 h-8 opacity-40" />
              </div>
              <div>
                <h2 className="text-lg font-display mb-2">
                  No attested cuts yet
                </h2>
                <p className="text-sm opacity-60 max-w-md mx-auto leading-relaxed">
                  Attest your first cut onchain to start tracking your hair
                  growth history. The growth agent will nudge you when it&apos;s
                  time to rebook.
                </p>
              </div>
              <Button asChild variant="secondary" size="lg">
                <Link href="/">Find your style</Link>
              </Button>
            </div>
          </Reveal>
        )}

        {/* Dashboard */}
        {status && status.hasHistory && !loading && (
          <div className="space-y-6">
            {/* Status banner */}
            <Reveal>
              <div
                className={`${statusConfig[status.growthStatus].bg} ${statusConfig[status.growthStatus].border} border rounded-lg p-6 text-center`}
              >
                {(() => {
                  const cfg = statusConfig[status.growthStatus]
                  const Icon = cfg.icon
                  return (
                    <>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <Icon className={`w-5 h-5 ${cfg.color}`} />
                        <span
                          className={`text-[11px] tracking-wide uppercase ${cfg.color}`}
                        >
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-2xl font-display text-gradient-warm mb-2">
                        {status.daysSinceLastCut} days since last cut
                      </p>
                      {status.daysUntilOverdue > 0 ? (
                        <p className="text-xs opacity-60">
                          {status.daysUntilOverdue} days until overdue for a
                          rebook
                        </p>
                      ) : (
                        <p className="text-xs opacity-60">
                          You&apos;re overdue for a rebook
                        </p>
                      )}
                      {status.nudgeMessage && (
                        <p className="text-sm opacity-70 italic mt-3 max-w-md mx-auto leading-relaxed font-display">
                          {status.nudgeMessage}
                        </p>
                      )}
                    </>
                  )
                })()}
              </div>
            </Reveal>

            {/* Stats grid */}
            <Reveal>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <StatCard
                  icon={<Scissors className="w-4 h-4" />}
                  label="Total cuts"
                  value={status.totalCuts.toString()}
                />
                <StatCard
                  icon={<Calendar className="w-4 h-4" />}
                  label="Last cut"
                  value={status.latestCut?.styleName || "—"}
                  small
                />
                <StatCard
                  icon={<Clock className="w-4 h-4" />}
                  label="Avg rebook"
                  value={
                    status.averageRebookInterval
                      ? `${status.averageRebookInterval}d`
                      : "—"
                  }
                />
                <StatCard
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="Style loyalty"
                  value={
                    status.styleLoyalty !== null
                      ? `${status.styleLoyalty}%`
                      : "—"
                  }
                />
              </div>
            </Reveal>

            {/* Predicted overdue + maintenance */}
            {status.predictedOverdueDate && (
              <Reveal>
                <div className="bg-black/30 border border-white/10 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                      Predicted overdue date
                    </p>
                    <p className="text-sm font-display">
                      {new Date(status.predictedOverdueDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] tracking-wide uppercase opacity-50 mb-1">
                      Maintenance window
                    </p>
                    <p className="text-sm tabular-nums">
                      {status.styleMaintenanceDays} days
                    </p>
                  </div>
                </div>
              </Reveal>
            )}

            {/* Style history timeline */}
            <Reveal>
              <div className="bg-black/30 border border-amber/15 p-5 rounded-lg glass-warm">
                <h3 className="text-sm font-display mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-amber" />
                  Attested cut history
                </h3>
                <div className="space-y-3">
                  {status.styleHistory.map((entry, i) => (
                    <div
                      key={`${entry.styleId}-${entry.date}`}
                      className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${i === 0 ? "bg-amber" : "bg-white/20"}`}
                        />
                        <div>
                          <p className="text-sm tracking-wide">
                            {entry.styleName}
                          </p>
                          <p className="text-[10px] opacity-40">
                            {new Date(entry.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] opacity-40 tabular-nums">
                        {entry.daysAgo}d ago
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Rebook CTA */}
            {status.latestCut && (
              <Reveal>
                <div className="text-center pt-4">
                  <Button asChild variant="secondary" size="lg" className="h-12 text-sm tracking-wide">
                    <Link href={`/barbers?style=${status.latestCut.styleId}`}>
                      <Scissors className="w-4 h-4 mr-2" />
                      Find a barber for {status.latestCut.styleName}
                    </Link>
                  </Button>
                </div>
              </Reveal>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  small,
}: {
  icon: React.ReactNode
  label: string
  value: string
  small?: boolean
}) {
  return (
    <div className="bg-black/30 border border-white/10 p-4 rounded-lg text-center">
      <div className="flex items-center justify-center gap-1.5 mb-2 opacity-50">
        {icon}
        <span className="text-[9px] tracking-wide uppercase">{label}</span>
      </div>
      <p
        className={`tabular-nums ${small ? "text-xs" : "text-lg"} font-display`}
      >
        {value}
      </p>
    </div>
  )
}
