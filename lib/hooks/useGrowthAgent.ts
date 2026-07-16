"use client";

import { useState, useEffect } from "react";

// ─── Types (mirror of api/growth/route.ts response) ───────────────────

export interface GrowthStatus {
  hasHistory: boolean;
  totalCuts: number;
  latestCut: {
    tokenId: string;
    styleId: string;
    styleName: string;
    styleCategory: string;
    userAddress: string;
    photoHash: string | null;
    timestamp: number;
    txVerified: boolean;
  } | null;
  daysSinceLastCut: number;
  styleMaintenanceDays: number;
  growthStatus: "fresh" | "growing" | "overdue" | "critical";
  daysUntilOverdue: number;
  rebookUrgency: "none" | "soon" | "now" | "overdue";
  nudgeMessage: string | null;
  recommendedBarbers: string | null;
  styleHistory: Array<{
    styleId: string;
    styleName: string;
    date: string;
    daysAgo: number;
  }>;
  averageRebookInterval: number | null;
  predictedOverdueDate: string | null;
  styleLoyalty: number | null;
}

interface UseGrowthAgentOptions {
  address?: string;
  hairType?: string;
  // Poll interval in ms (default: 60s — the agent checks periodically)
  pollInterval?: number;
}

interface UseGrowthAgentResult {
  status: GrowthStatus | null;
  loading: boolean;
  error: string | null;
  // The current nudge to show (null if no nudge or dismissed)
  activeNudge: string | null;
  // Dismiss the current nudge
  dismissNudge: () => void;
  // Manually refresh
  refresh: () => void;
  // Whether the agent is actively tracking (has address + history)
  isTracking: boolean;
}

/**
 * useGrowthAgent — client-side Hair Growth Agent
 *
 * This hook is the agentic primitive that creates the recurring engagement
 * loop. It:
 * - Polls the user's attestation history via /api/growth
 * - Estimates when their current style is growing out
 * - Surfaces proactive nudges when it's time to rebook
 * - Learns the user's actual rebook interval over time
 *
 * The agent runs in the background (polls every 60s by default) and
 * surfaces nudges through the `activeNudge` field. The UI component
 * decides how to display them.
 */
export function useGrowthAgent({
  address,
  hairType,
  pollInterval = 60_000,
}: UseGrowthAgentOptions = {}): UseGrowthAgentResult {
  const [status, setStatus] = useState<GrowthStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedNudge, setDismissedNudge] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setStatus(null);
      return;
    }

    let cancelled = false;

    const fetchGrowth = async () => {
      if (!address) return;

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ address });
        if (hairType) {
          params.set("hairType", hairType);
        }

        const res = await fetch(`/api/growth?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Growth API error: ${res.status}`);
        }
        const data: GrowthStatus = await res.json();
        if (!cancelled) {
          setStatus(data);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to fetch growth status");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchGrowth();

    const interval = setInterval(fetchGrowth, pollInterval);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, pollInterval]);

  const dismissNudge = () => {
    if (status?.nudgeMessage) {
      setDismissedNudge(status.nudgeMessage);
    }
  };

  const refresh = () => {
    // Trigger a re-fetch by toggling a state that the effect depends on
    // This is a simple way to force a refresh without duplicating fetch logic
    if (address) {
      setLoading(true);
      fetch(`/api/growth?address=${address}${hairType ? `&hairType=${hairType}` : ""}`)
        .then((res) => res.json())
        .then((data: GrowthStatus) => {
          setStatus(data);
          setLoading(false);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to fetch");
          setLoading(false);
        });
    }
  };

  // The active nudge is the current one, unless it's been dismissed
  const activeNudge =
    status?.nudgeMessage && status.nudgeMessage !== dismissedNudge
      ? status.nudgeMessage
      : null;

  const isTracking = Boolean(address && status?.hasHistory);

  return {
    status,
    loading,
    error,
    activeNudge,
    dismissNudge,
    refresh,
    isTracking,
  };
}
