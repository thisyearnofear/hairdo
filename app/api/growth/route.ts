import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { getStyleById } from "@/lib/style-matcher";

export const runtime = "nodejs";

// ─── Redis setup (shared with attest route) ───────────────────────────
let redis: Redis | null = null;
function getRedis() {
  if (
    !redis &&
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN
  ) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
  }
  return redis;
}

// In-memory fallback
declare global {
  var attestations: Map<string, unknown> | undefined;
}
if (!global.attestations) {
  global.attestations = new Map();
}

// ─── Types ────────────────────────────────────────────────────────────

interface AttestationRecord {
  tokenId: string;
  styleId: string;
  styleName: string;
  styleCategory: string;
  userAddress: string;
  photoHash: string | null;
  attestationHash: string | null;
  timestamp: number;
  txVerified: boolean;
  explorerUrl: string;
  contractAddress: string;
}

interface GrowthStatus {
  hasHistory: boolean;
  totalCuts: number;
  latestCut: AttestationRecord | null;
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
  // Agentic insights
  averageRebookInterval: number | null; // days between cuts (learned)
  predictedOverdueDate: string | null;
  styleLoyalty: number | null; // % of cuts that were the same style
}

// ─── Growth estimation logic ──────────────────────────────────────────

/**
 * Estimate growth status based on days since last cut and the style's
 * maintenance frequency.
 *
 * Hair type affects growth rate:
 * - 4A-4C: ~0.5cm/month, but shrinkage makes it look shorter
 * - 3A-3C: ~1cm/month, shows length more visibly
 * - 1A-2C: ~1.2cm/month
 *
 * For fade styles, the "growing out" threshold is tighter because
 * the fade line becomes visible quickly.
 */
function computeGrowthStatus(
  daysSinceLastCut: number,
  maintenanceDays: number,
  hairType?: string
): { status: GrowthStatus["growthStatus"]; urgency: GrowthStatus["rebookUrgency"]; daysUntilOverdue: number } {
  // Adjust for hair type growth rate
  let adjustedMaintenanceDays = maintenanceDays;
  if (hairType) {
    if (hairType.startsWith("4")) {
      // Coily hair: shrinkage hides growth slightly, but the style
      // still loses its shape at the same rate
      adjustedMaintenanceDays = maintenanceDays;
    } else if (hairType.startsWith("3")) {
      // Curly hair: grows a bit faster, style loses shape sooner
      adjustedMaintenanceDays = Math.max(maintenanceDays - 2, 5);
    } else {
      // Straight/wavy: grows fastest
      adjustedMaintenanceDays = Math.max(maintenanceDays - 3, 5);
    }
  }

  const daysUntilOverdue = adjustedMaintenanceDays - daysSinceLastCut;

  if (daysSinceLastCut < adjustedMaintenanceDays * 0.5) {
    return { status: "fresh", urgency: "none", daysUntilOverdue };
  } else if (daysSinceLastCut < adjustedMaintenanceDays * 0.8) {
    return { status: "growing", urgency: "soon", daysUntilOverdue };
  } else if (daysSinceLastCut < adjustedMaintenanceDays) {
    return { status: "growing", urgency: "now", daysUntilOverdue };
  } else if (daysSinceLastCut < adjustedMaintenanceDays * 1.5) {
    return { status: "overdue", urgency: "overdue", daysUntilOverdue };
  } else {
    return { status: "critical", urgency: "overdue", daysUntilOverdue };
  }
}

/**
 * Generate a nudge message based on growth status and style.
 */
function generateNudge(
  status: GrowthStatus["growthStatus"],
  styleName: string,
  daysSinceLastCut: number,
  maintenanceDays: number
): string | null {
  switch (status) {
    case "fresh":
      return null;
    case "growing":
      return `Your ${styleName} is at day ${daysSinceLastCut}. It'll start growing out in about ${Math.max(0, maintenanceDays - daysSinceLastCut)} days. Worth booking soon.`;
    case "overdue":
      return `Your ${styleName} is probably growing out — you're at day ${daysSinceLastCut}, past the ${maintenanceDays}-day maintenance window. Time to rebook.`;
    case "critical":
      return `Your ${styleName} is well past due at day ${daysSinceLastCut}. It's time for a fresh cut.`;
    default:
      return null;
  }
}

/**
 * Compute the user's average rebook interval from their attestation history.
 * This is the agentic learning — we learn from actual behavior, not just
 * the style's recommended frequency.
 */
function computeAverageRebookInterval(attestations: AttestationRecord[]): number | null {
  if (attestations.length < 2) return null;

  const sorted = [...attestations].sort((a, b) => a.timestamp - b.timestamp);
  const intervals: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const intervalDays = (sorted[i].timestamp - sorted[i - 1].timestamp) / (1000 * 60 * 60 * 24);
    intervals.push(intervalDays);
  }
  return intervals.reduce((a, b) => a + b, 0) / intervals.length;
}

/**
 * Compute style loyalty — what percentage of cuts were the same style.
 * High loyalty means the user has found "their" style.
 */
function computeStyleLoyalty(attestations: AttestationRecord[]): number | null {
  if (attestations.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const a of attestations) {
    counts[a.styleId] = (counts[a.styleId] || 0) + 1;
  }
  const maxCount = Math.max(...Object.values(counts));
  return Math.round((maxCount / attestations.length) * 100);
}

// ─── Fetch user's attestations from Redis ─────────────────────────────

async function getUserAttestations(userAddress: string): Promise<AttestationRecord[]> {
  const r = getRedis();
  if (r) {
    // Scan for all attestations by this user.
    // We store attestations as `attestation:${tokenId}` → JSON.
    // To find a user's attestations, we scan keys and filter.
    // In production, we'd also maintain an index: `user:${address}:attestations` → set of tokenIds.
    const keys = await r.keys("attestation:*");
    const results: AttestationRecord[] = [];
    for (const key of keys) {
      const data = await r.get<AttestationRecord>(key);
      if (data && data.userAddress?.toLowerCase() === userAddress.toLowerCase()) {
        results.push(data);
      }
    }
    return results.sort((a, b) => b.timestamp - a.timestamp);
  }

  // In-memory fallback
  const results: AttestationRecord[] = [];
  for (const [, data] of global.attestations!) {
    const record = data as AttestationRecord;
    if (record.userAddress?.toLowerCase() === userAddress.toLowerCase()) {
      results.push(record);
    }
  }
  return results.sort((a, b) => b.timestamp - a.timestamp);
}

// ─── API handler ──────────────────────────────────────────────────────

/**
 * GET /api/growth?address=0x...
 *
 * Returns the user's hair growth status based on their attestation history.
 * The Hair Growth Agent calls this to determine when to nudge the user.
 *
 * Response:
 * {
 *   hasHistory: boolean,
 *   totalCuts: number,
 *   latestCut: AttestationRecord | null,
 *   daysSinceLastCut: number,
 *   styleMaintenanceDays: number,
 *   growthStatus: "fresh" | "growing" | "overdue" | "critical",
 *   daysUntilOverdue: number,
 *   rebookUrgency: "none" | "soon" | "now" | "overdue",
 *   nudgeMessage: string | null,
 *   styleHistory: Array<{ styleId, styleName, date, daysAgo }>,
 *   averageRebookInterval: number | null,
 *   predictedOverdueDate: string | null,
 *   styleLoyalty: number | null,
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get("address");
    const hairType = searchParams.get("hairType") || undefined;

    if (!address || !address.startsWith("0x")) {
      return NextResponse.json(
        { error: "Valid wallet address is required" },
        { status: 400 }
      );
    }

    const attestations = await getUserAttestations(address);

    if (attestations.length === 0) {
      return NextResponse.json<GrowthStatus>({
        hasHistory: false,
        totalCuts: 0,
        latestCut: null,
        daysSinceLastCut: 0,
        styleMaintenanceDays: 0,
        growthStatus: "fresh",
        daysUntilOverdue: 0,
        rebookUrgency: "none",
        nudgeMessage: null,
        recommendedBarbers: null,
        styleHistory: [],
        averageRebookInterval: null,
        predictedOverdueDate: null,
        styleLoyalty: null,
      });
    }

    const latestCut = attestations[0];
    const style = getStyleById(latestCut.styleId);
    const maintenanceDays = style?.maintenance?.barberFrequencyDays ?? 14;

    const now = Date.now();
    const daysSinceLastCut = Math.floor(
      (now - latestCut.timestamp) / (1000 * 60 * 60 * 24)
    );

    const { status, urgency, daysUntilOverdue } = computeGrowthStatus(
      daysSinceLastCut,
      maintenanceDays,
      hairType
    );

    const nudgeMessage = generateNudge(
      status,
      latestCut.styleName,
      daysSinceLastCut,
      maintenanceDays
    );

    const averageRebookInterval = computeAverageRebookInterval(attestations);
    const styleLoyalty = computeStyleLoyalty(attestations);

    // Predict overdue date based on learned interval or style default
    let predictedOverdueDate: string | null = null;
    const predictedDays = averageRebookInterval ?? maintenanceDays;
    if (daysUntilOverdue > 0) {
      const overdueMs = latestCut.timestamp + predictedDays * 24 * 60 * 60 * 1000;
      predictedOverdueDate = new Date(overdueMs).toISOString();
    }

    // Build style history (most recent first, max 20)
    const styleHistory = attestations.slice(0, 20).map((a) => {
      const daysAgo = Math.floor((now - a.timestamp) / (1000 * 60 * 60 * 24));
      return {
        styleId: a.styleId,
        styleName: a.styleName,
        date: new Date(a.timestamp).toISOString(),
        daysAgo,
      };
    });

    return NextResponse.json<GrowthStatus>({
      hasHistory: true,
      totalCuts: attestations.length,
      latestCut,
      daysSinceLastCut,
      styleMaintenanceDays: maintenanceDays,
      growthStatus: status,
      daysUntilOverdue,
      rebookUrgency: urgency,
      nudgeMessage,
      recommendedBarbers: null, // Phase 6: link to barber-score API
      styleHistory,
      averageRebookInterval,
      predictedOverdueDate,
      styleLoyalty,
    });
  } catch (e) {
    console.error("Growth API error:", e);
    return NextResponse.json(
      { error: "Failed to compute growth status" },
      { status: 500 }
    );
  }
}
