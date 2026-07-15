import { NextRequest, NextResponse } from "next/server";
import {
  recommendStyles,
  type UserPreferences,
} from "@/lib/style-matcher";

export const runtime = "nodejs";

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

    const recommendations = recommendStyles(prefs, limit);

    return NextResponse.json({
      recommendations,
      preferences: prefs,
      count: recommendations.length,
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
