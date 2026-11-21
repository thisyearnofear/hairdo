import type { GrowthStatus } from "@/lib/hooks/useGrowthAgent";
import { makeCard, type ConsultCard } from "@/lib/consult-cards";

/**
 * Growth agent → ConsultCard. A rebook nudge is a "done"-phase follow-up
 * card: the cue is the headline, the timing stats are the lines. Same type
 * the glasses surface renders — one voice across channels.
 * Deterministic id so dismissal + React keys stay stable across polls.
 */
export function growthToConsultCard(status: GrowthStatus): ConsultCard | null {
  if (!status.nudgeMessage || !status.latestCut) return null;

  const lines = [`day ${status.daysSinceLastCut} of ~${status.styleMaintenanceDays}`];
  if (status.averageRebookInterval !== null) {
    lines.push(`your avg rebook ${Math.round(status.averageRebookInterval)}d`);
  } else if (status.daysUntilOverdue > 0) {
    lines.push(`overdue in ~${status.daysUntilOverdue}d`);
  }

  return makeCard("done", status.nudgeMessage, lines, {
    id: `growth:${status.growthStatus}:${status.daysSinceLastCut}`,
    // Dismiss-driven, like sticky placement cues — never auto-expires.
    expiresAt: null,
  });
}
