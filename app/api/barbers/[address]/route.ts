import { NextRequest, NextResponse } from "next/server";
import { getBarberTrustProfile } from "@/lib/barber-trust";

export const runtime = "nodejs";

/**
 * GET /api/barbers/[address]
 *
 * Returns a barber's full trust profile including:
 * - Barber details (name, shop, location, specialties, pricing)
 * - Trust score with breakdown (verified cuts, specialty coverage, consistency, recency)
 * - Full attestation history
 * - Recommended styles based on onchain proof
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    if (!address || !address.startsWith("0x") || address.length !== 42) {
      return NextResponse.json(
        { error: "Invalid address format (expected 0x-prefixed 20-byte hex)" },
        { status: 400 }
      );
    }

    const profile = getBarberTrustProfile(address);

    if (!profile) {
      return NextResponse.json(
        { error: "Barber not found", address },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (e) {
    console.error("Barber lookup error:", e);
    return NextResponse.json(
      { error: "Failed to fetch barber profile" },
      { status: 500 }
    );
  }
}
