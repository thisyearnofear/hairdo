import { NextRequest, NextResponse } from "next/server";
import { getRedis, attestationKey } from "@/lib/redis";

export const runtime = "nodejs";

declare global {
  var attestations: Map<string, unknown> | undefined;
}
if (!global.attestations) {
  global.attestations = new Map();
}

/**
 * GET /api/attestations/[tokenId]
 *
 * Retrieves an attestation by its tokenId. Returns the style choice,
 * user address, timestamp, and verification status.
 *
 * This endpoint is public — attestations are meant to be verifiable
 * by anyone. The onchain credential (ownerOf) can be independently
 * verified against the contract.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tokenId: string }> }
) {
  try {
    const { tokenId } = await params;

    if (!tokenId || !tokenId.startsWith("0x")) {
      return NextResponse.json(
        { error: "Invalid tokenId format (expected 0x-prefixed hex)" },
        { status: 400 }
      );
    }

    const r = getRedis();
    let attestation: unknown = null;

    if (r) {
      const result = await r.get(attestationKey(tokenId));
      attestation = result;
    } else {
      attestation = global.attestations!.get(tokenId);
    }

    if (!attestation) {
      return NextResponse.json(
        { error: "Attestation not found", tokenId },
        { status: 404 }
      );
    }

    // Parse if it's a string (Redis may return string or object)
    const parsed =
      typeof attestation === "string" ? JSON.parse(attestation) : attestation;

    return NextResponse.json(parsed);
  } catch (e) {
    console.error("Read attestation error:", e);
    return NextResponse.json(
      { error: "Failed to fetch attestation" },
      { status: 500 }
    );
  }
}
