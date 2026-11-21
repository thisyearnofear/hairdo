import { NextRequest, NextResponse } from "next/server";
import {
  recommendStyles,
  recommendStylesWithHistory,
  type UserPreferences,
  type AttestationEntry,
} from "@/lib/style-matcher";

export const runtime = "nodejs";

// In-memory attestation store (shared with /api/attest route)
declare global {
  var attestations: Map<string, unknown> | undefined;
}

// Fetch a user's attestation history — Redis index first, memory fallback.
// Accepts a normalized userKey: wallet address (lowercased) or `guest:<id>`.
async function getUserAttestations(userKey: string): Promise<AttestationEntry[]> {
  const { getRedis, attestationKey, userAttestationsKey } = await import(
    "@/lib/redis"
  );
  const { normalizeUserKey } = await import("@/lib/identity");
  const key = normalizeUserKey({ userAddress: userKey, userId: userKey }) ?? userKey.toLowerCase();
  const r = getRedis();
  if (r) {
    const tokenIds = await r.smembers(userAttestationsKey(key));
    const entries: AttestationEntry[] = [];
    for (const tokenId of tokenIds) {
      const raw = await r.get(attestationKey(tokenId as string));
      const att =
        typeof raw === "string"
          ? (JSON.parse(raw) as {
              styleId: string;
              styleName: string;
              timestamp: number;
            })
          : (raw as {
              styleId: string;
              styleName: string;
              timestamp: number;
            } | null);
      if (att) {
        entries.push({
          styleId: att.styleId,
          styleName: att.styleName,
          timestamp: att.timestamp,
        });
      }
    }
    entries.sort((a, b) => b.timestamp - a.timestamp);
    // Fall back to memory for local-dev records written without Redis.
    if (entries.length > 0 || !global.attestations) return entries;
  }

  if (!global.attestations) return [];
  const entries: AttestationEntry[] = [];
  for (const [, value] of global.attestations) {
    const att = value as {
      styleId: string;
      styleName: string;
      userAddress?: string;
      userKey?: string;
      timestamp: number;
    };
    const attKey = att.userKey ?? att.userAddress?.toLowerCase();
    if (att && attKey === key) {
      entries.push({
        styleId: att.styleId,
        styleName: att.styleName,
        timestamp: att.timestamp,
      });
    }
  }

  // Sort by timestamp descending (most recent first)
  entries.sort((a, b) => b.timestamp - a.timestamp);
  return entries;
}

/**
 * POST /api/recommend
 *
 * Style Intelligence ASP — returns ranked style recommendations
 * with tradeoff metadata based on user preferences.
 *
 * Request body:
 * {
 *   hairType?: string,         // e.g. "4C"
 *   faceShape?: string,        // e.g. "oval"
 *   climate?: string,          // "humid" | "dry" | "hot" | "cold" | "temperate"
 *   budgetPerVisit?: number,   // max USD per barber visit
 *   monthlyBudget?: number,    // max USD per month
 *   maintenanceTolerance?: "low" | "medium" | "high",
 *   maxBarberFrequencyDays?: number,
 *   lifestyle?: "corporate" | "creative" | "athletic" | "casual",
 *   helmetFriendly?: boolean,
 *   headphoneFriendly?: boolean,
 *   preferredCategories?: string[],
 *   excludeCategories?: string[],
 *   limit?: number             // max results (default 10)
 * }
 *
 * Response:
 * {
 *   recommendations: StyleRecommendation[],
 *   preferences: UserPreferences
 * }
 *
 * During development this endpoint is free. In production it will be
 * gated by x402 payment on the active L2.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract preferences
    const prefs: UserPreferences = {
      hairType: body.hairType,
      faceShape: body.faceShape,
      climate: body.climate,
      budgetPerVisit: body.budgetPerVisit,
      monthlyBudget: body.monthlyBudget,
      maintenanceTolerance: body.maintenanceTolerance,
      maxBarberFrequencyDays: body.maxBarberFrequencyDays,
      lifestyle: body.lifestyle,
      helmetFriendly: body.helmetFriendly,
      headphoneFriendly: body.headphoneFriendly,
      preferredCategories: body.preferredCategories,
      excludeCategories: body.excludeCategories,
    };

    const limit = body.limit && body.limit > 0 && body.limit <= 34
      ? body.limit
      : 10;

    // Guest-first: userAddress (wallet) or userId (guest) feeds history-aware ranking.
    const userAddress = body.userAddress as string | undefined;
    const userId = body.userId as string | undefined;
    let history: AttestationEntry[] = [];

    const { normalizeUserKey: normalizeKey } = await import("@/lib/identity");
    const historyKey = normalizeKey({ userAddress, userId });
    if (historyKey) {
      history = await getUserAttestations(historyKey);
    }

    const recommendations =
      history.length > 0
        ? recommendStylesWithHistory(prefs, history, limit)
        : recommendStyles(prefs, limit);

    return NextResponse.json({
      recommendations,
      preferences: prefs,
      count: recommendations.length,
      historyAdjusted: history.length > 0,
    });
  } catch (e) {
    console.error("Recommend API error:", e);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/recommend
 * Returns the full style catalog (for browsing without preferences).
 */
export async function GET() {
  try {
    // Import here to avoid circular dependency at module level
    const { getAllStyles, getCategories, getHairTypes } = await import(
      "@/lib/style-matcher"
    );

    return NextResponse.json({
      styles: getAllStyles(),
      categories: getCategories(),
      hairTypes: getHairTypes(),
      count: getAllStyles().length,
    });
  } catch (e) {
    console.error("Catalog API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch style catalog" },
      { status: 500 }
    );
  }
}
