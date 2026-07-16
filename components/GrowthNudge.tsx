"use client";

import { useGrowthAgent } from "@/lib/hooks/useGrowthAgent";
import { useAccount } from "wagmi";
import { Scissors, X, Clock, TrendingUp } from "lucide-react";
import { Reveal } from "@/components/ui/reveal";
import { StyleIllustration } from "@/components/ui/style-illustration";
import { getStyleById } from "@/lib/style-matcher";
import Link from "next/link";

/**
 * GrowthNudge — surfaces proactive nudges from the Hair Growth Agent
 *
 * This is the user-facing component of the agentic engagement loop.
 * When the agent detects that the user's style is growing out, it
 * shows a warm, non-intrusive nudge with a link to find a barber.
 *
 * The nudge appears:
 * - On the main page (below the StyleAdvisor)
 * - Only when the user has a connected wallet with attestation history
 * - Only when the growth status is "growing", "overdue", or "critical"
 * - Dismissible (the agent won't re-nudge for the same status)
 */
export function GrowthNudge() {
  const { address } = useAccount();
  const { status, activeNudge, dismissNudge, isTracking } = useGrowthAgent({
    address,
    pollInterval: 60_000,
  });

  // Don't render if no wallet, no history, or no nudge
  if (!address || !isTracking || !activeNudge || !status?.latestCut) {
    return null;
  }

  const urgencyColor =
    status.growthStatus === "critical"
      ? "border-red-500/30 bg-red-500/5"
      : status.growthStatus === "overdue"
        ? "border-amber/30 bg-amber/5"
        : "border-white/10 bg-black/30";

  const style = getStyleById(status.latestCut.styleId);

  return (
    <Reveal direction="up" className="max-w-2xl mx-auto mt-8">
      <div
        className={`relative p-5 rounded-xl border ${urgencyColor} transition-all duration-300`}
      >
        {/* Dismiss button */}
        <button
          onClick={dismissNudge}
          className="absolute top-3 right-3 opacity-30 hover:opacity-60 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-amber/10 border border-amber/20 flex items-center justify-center">
            <StyleIllustration
              category={style?.category || "fade"}
              size={36}
              className="text-amber/70"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-amber/60" />
              <span className="text-[10px] tracking-wide uppercase opacity-50">
                Growth Agent
              </span>
            </div>
            <p className="text-sm font-display leading-relaxed">
              {activeNudge}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-[10px] tracking-wide opacity-40 mb-4 pl-15">
          <span>Day {status.daysSinceLastCut}</span>
          <span className="w-1 h-1 bg-white/30 rounded-full" />
          <span>Rebook every {status.styleMaintenanceDays} days</span>
          {status.averageRebookInterval && (
            <>
              <span className="w-1 h-1 bg-white/30 rounded-full" />
              <span>Your average: {Math.round(status.averageRebookInterval)} days</span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href={`/barbers?style=${status.latestCut.styleId}`}
            className="flex items-center gap-1.5 text-xs tracking-wide px-3 py-2 rounded-lg bg-amber/10 border border-amber/20 text-amber/90 hover:bg-amber/15 transition-colors"
          >
            <Scissors className="w-3 h-3" />
            Find a barber
          </Link>
          {status.styleLoyalty !== null && status.styleLoyalty >= 60 && (
            <span className="flex items-center gap-1 text-[10px] tracking-wide opacity-40">
              <TrendingUp className="w-3 h-3" />
              {status.styleLoyalty}% loyalty to this style
            </span>
          )}
        </div>
      </div>
    </Reveal>
  );
}
