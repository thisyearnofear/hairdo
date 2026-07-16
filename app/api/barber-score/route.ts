import { NextRequest, NextResponse } from "next/server";
import {
  getBarberTrustProfile,
  getAllBarberTrustProfiles,
  findBarbersForStyle,
} from "@/lib/barber-trust";

export const runtime = "nodejs";

/**
 * POST /api/barber-score
 *
 * Barber Trust-Score ASP — returns a trust score for a barber
 * based on their verified onchain attestation history.
 *
 * Request body:
 * {
 *   address: string,     // barber's wallet address
 *   styleId?: string,    // optional: filter for barbers who can execute this style
 * }
 *
 * Response:
 * {
 *   profile: BarberTrustProfile | null,
 *   trustScore: number,
 *   breakdown: TrustScoreBreakdown,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { address, styleId } = await request.json();

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Barber wallet address is required" },
        { status: 400 }
      );
    }

    // If styleId is provided, return barbers who can execute that style
    if (styleId) {
      const barbers = findBarbersForStyle(styleId);
      return NextResponse.json({
        styleId,
        barbers: barbers.map((p) => ({
          barber: {
            id: p.barber.id,
            name: p.barber.name,
            address: p.barber.address,
            shop: p.barber.shop,
            city: p.barber.city,
            state: p.barber.state,
            basePrice: p.barber.basePrice,
            specialties: p.barber.specialties,
          },
          trustScore: p.trustScore,
          verifiedCuts: p.verifiedCuts,
          recommendedFor: p.recommendedFor,
        })),
        count: barbers.length,
      });
    }

    const profile = getBarberTrustProfile(address);

    if (!profile) {
      return NextResponse.json(
        { error: "Barber not found", address },
        { status: 404 }
      );
    }

    return NextResponse.json({
      profile,
      trustScore: profile.trustScore,
      breakdown: profile.breakdown,
    });
  } catch (e) {
    console.error("Barber-score API error:", e);
    return NextResponse.json(
      { error: "Failed to compute trust score" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/barber-score
 * Returns all barbers ranked by trust score.
 */
export async function GET() {
  try {
    const profiles = getAllBarberTrustProfiles();

    return NextResponse.json({
      barbers: profiles.map((p) => ({
        barber: {
          id: p.barber.id,
          name: p.barber.name,
          address: p.barber.address,
          shop: p.barber.shop,
          city: p.barber.city,
          state: p.barber.state,
          yearsExperience: p.barber.yearsExperience,
          licenseVerified: p.barber.licenseVerified,
          specialties: p.barber.specialties,
          basePrice: p.barber.basePrice,
          priceRange: p.barber.priceRange,
        },
        trustScore: p.trustScore,
        verifiedCuts: p.verifiedCuts,
        uniqueStyles: p.uniqueStyles,
        uniqueClients: p.uniqueClients,
        daysSinceLastCut: p.daysSinceLastCut,
        averageRating: p.breakdown.averageRating,
        recommendedFor: p.recommendedFor,
      })),
      count: profiles.length,
    });
  } catch (e) {
    console.error("Barber-score list API error:", e);
    return NextResponse.json(
      { error: "Failed to fetch barber scores" },
      { status: 500 }
    );
  }
}
