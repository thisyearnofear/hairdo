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

// Fetch a user's attestation history from the in-memory store.
// In production with Redis, this would scan Redis keys.
function getUserAttestations(userAddress: string): AttestationEntry[] {
  if (!global.attestations) return [];

  const entries: AttestationEntry[] = [];
  for (const [, value] of global.attestations) {
    const att = value as {
      styleId: string;
      styleName: string;
      userAddress: string;
      timestamp: number;
    };
    if (
      att &&
      att.userAddress &&
      att.userAddress.toLowerCase() === userAddress.toLowerCase()
    ) {
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
 * gated by x402 payment on Lisk mainnet.
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

    // If userAddress is provided, fetch attestation history and use
    // the history-aware recommender for personalized adjustments
    const userAddress = body.userAddress as string | undefined;
    let history: AttestationEntry[] = [];

    if (userAddress && userAddress.startsWith("0x")) {
      history = getUserAttestations(userAddress);
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
