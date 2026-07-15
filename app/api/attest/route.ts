import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, parseAbiItem, keccak256, toHex } from "viem";
import { Redis } from "@upstash/redis";
import { lisk } from "@/lib/chains";
import { getStyleById } from "@/lib/style-matcher";

export const runtime = "nodejs";

const CONTRACT_ADDRESS = "0x055cA743f0fFB9258ea7f8484794C293f32f2d4C";

// Upstash Redis for attestation storage.
// Falls back to in-memory if env vars are not set (local dev only).
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

// In-memory fallback for local development
declare global {
  var attestations: Map<string, unknown> | undefined;
}
if (!global.attestations) {
  global.attestations = new Map();
}

// Lazily create the viem public client
let client: ReturnType<typeof createPublicClient> | null = null;
function getClient() {
  if (!client) {
    client = createPublicClient({
      chain: lisk,
      transport: http(),
    });
  }
  return client;
}

// Verify on-chain that the token was used in a real payment transaction
async function verifyPaymentOnChain(tokenId: string): Promise<boolean> {
  if (!tokenId || !tokenId.startsWith("0x") || tokenId.length !== 66) {
    return false;
  }

  try {
    const isUsed = await getClient().readContract({
      address: CONTRACT_ADDRESS,
      abi: [parseAbiItem("function isTokenUsed(bytes32 tokenId) view returns (bool)")],
      functionName: "isTokenUsed",
      args: [tokenId as `0x${string}`],
    });
    return isUsed === true;
  } catch (e) {
    console.error("On-chain verification failed:", e);
    return false;
  }
}

// Check if an attestation already exists for this token (replay protection)
async function getExistingAttestation(
  tokenId: string
): Promise<unknown | null> {
  const r = getRedis();
  if (r) {
    const result = await r.get(`attestation:${tokenId}`);
    return result ?? null;
  }
  return global.attestations!.get(tokenId) ?? null;
}

// Store the attestation
async function storeAttestation(
  tokenId: string,
  data: Record<string, unknown>
): Promise<void> {
  const r = getRedis();
  if (r) {
    // TTL of 365 days — attestations are meant to be persistent
    await r.set(`attestation:${tokenId}`, JSON.stringify(data), {
      ex: 365 * 24 * 60 * 60,
    });
  } else {
    global.attestations!.set(tokenId, data);
  }
}

/**
 * POST /api/attest
 *
 * Records an onchain attestation of a style choice. The user must have
 * already paid the attestation fee on Lisk via the smart contract
 * (payForService), which creates an onchain record tied to a tokenId.
 * This endpoint verifies the payment and stores the attestation metadata.
 *
 * Request body:
 * {
 *   styleId: string,       // style ID from data/styles.json
 *   photoHash?: string,    // SHA-256 hash of the source photo (optional)
 *   paymentToken: string,  // tokenId used in the payForService call
 *   userAddress: string,   // wallet address that paid
 * }
 *
 * Response:
 * {
 *   tokenId: string,
 *   styleId: string,
 *   styleName: string,
 *   userAddress: string,
 *   photoHash: string | null,
 *   timestamp: number,
 *   txVerified: boolean,
 *   explorerUrl: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { styleId, photoHash, paymentToken, userAddress } =
      await request.json();

    // Validate required fields
    if (!styleId || typeof styleId !== "string") {
      return NextResponse.json(
        { error: "styleId is required" },
        { status: 400 }
      );
    }

    if (!paymentToken || typeof paymentToken !== "string") {
      return NextResponse.json(
        { error: "paymentToken is required (the tokenId from payForService)" },
        { status: 400 }
      );
    }

    if (!userAddress || typeof userAddress !== "string") {
      return NextResponse.json(
        { error: "userAddress is required" },
        { status: 400 }
      );
    }

    // Validate the style exists
    const style = getStyleById(styleId);
    if (!style) {
      return NextResponse.json(
        { error: `Style not found: ${styleId}` },
        { status: 404 }
      );
    }

    // Check replay protection — has this token already been attested?
    const existing = await getExistingAttestation(paymentToken);
    if (existing) {
      return NextResponse.json(
        { error: "This payment token has already been used for an attestation" },
        { status: 409 }
      );
    }

    // Verify the payment on-chain
    const isPaymentValid = await verifyPaymentOnChain(paymentToken);
    if (!isPaymentValid) {
      return NextResponse.json(
        { error: "Payment not found on-chain. Please pay the attestation fee first." },
        { status: 402 }
      );
    }

    // Compute a deterministic attestation hash if photoHash is provided
    const attestationHash = photoHash
      ? keccak256(toHex(`${paymentToken}:${styleId}:${photoHash}`))
      : null;

    const timestamp = Date.now();

    const attestation = {
      tokenId: paymentToken,
      styleId,
      styleName: style.name,
      styleCategory: style.category,
      userAddress,
      photoHash: photoHash || null,
      attestationHash,
      timestamp,
      txVerified: true,
      explorerUrl: `https://blockscout.lisk.com/address/${userAddress}`,
      contractAddress: CONTRACT_ADDRESS,
    };

    // Store the attestation
    await storeAttestation(paymentToken, attestation);

    return NextResponse.json(attestation);
  } catch (e) {
    console.error("Attest API error:", e);
    return NextResponse.json(
      { error: "Failed to record attestation" },
      { status: 500 }
    );
  }
}
