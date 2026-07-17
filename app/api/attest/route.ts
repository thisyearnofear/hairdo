import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, keccak256, toHex, parseAbi } from "viem";
import { Redis } from "@upstash/redis";
import { lisk, liskSepolia } from "@/lib/chains";
import { getStyleById } from "@/lib/style-matcher";
import { PROTOCOL_CONTRACT_ADDRESS, PROTOCOL_ABI } from "@/lib/contract-config";

export const runtime = "nodejs";

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

// Lazily create the viem public client for the appropriate chain
function getClient(chainId: number) {
  const chain = chainId === liskSepolia.id ? liskSepolia : lisk;
  return createPublicClient({ chain, transport: http() });
}

// Verify on-chain that the user owns the SBT token from the selfAttest tx
async function verifyCredentialOnChain(
  tokenId: string,
  userAddress: string,
  chainId: number
): Promise<boolean> {
  if (!tokenId || !tokenId.startsWith("0x")) {
    return false;
  }

  try {
    const client = getClient(chainId);

    // The tokenId from the event is a 32-byte hex (uint256 as topic).
    // Convert to a bigint for the ownerOf call.
    const tokenIdBigInt = BigInt(tokenId);

    const owner = await client.readContract({
      address: PROTOCOL_CONTRACT_ADDRESS,
      abi: PROTOCOL_ABI,
      functionName: "ownerOf",
      args: [tokenIdBigInt],
    });

    return owner.toLowerCase() === userAddress.toLowerCase();
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
 * already called selfAttest() on HairdoProtocol, which mints a soulbound
 * Style Credential NFT. This endpoint verifies the SBT ownership and
 * stores the attestation metadata.
 *
 * Request body:
 * {
 *   styleId: string,       // style ID from data/styles.json
 *   styleName: string,     // display name of the style
 *   hairType: string,      // user's hair type (e.g. "4C")
 *   photoHash?: string,    // SHA-256 hash of the source photo (optional)
 *   tokenId: string,       // SBT tokenId from the CredentialMinted event
 *   txHash: string,        // transaction hash of the selfAttest call
 *   userAddress: string,   // wallet address that attested
 *   chainId: number,       // chain ID (4202 for testnet, 1135 for mainnet)
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
    const {
      styleId,
      styleName,
      hairType,
      photoHash,
      tokenId,
      txHash,
      userAddress,
      chainId,
    } = await request.json();

    // Validate required fields
    if (!styleId || typeof styleId !== "string") {
      return NextResponse.json(
        { error: "styleId is required" },
        { status: 400 }
      );
    }

    if (!tokenId || typeof tokenId !== "string") {
      return NextResponse.json(
        { error: "tokenId is required (the SBT tokenId from the CredentialMinted event)" },
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
    const existing = await getExistingAttestation(tokenId);
    if (existing) {
      return NextResponse.json(
        { error: "This credential token has already been recorded" },
        { status: 409 }
      );
    }

    // Verify the SBT ownership on-chain
    const resolvedChainId = chainId || lisk.id;
    const isVerified = await verifyCredentialOnChain(
      tokenId,
      userAddress,
      resolvedChainId
    );

    if (!isVerified) {
      return NextResponse.json(
        { error: "Style Credential not found on-chain. Please attest first via the contract." },
        { status: 402 }
      );
    }

    // Compute a deterministic attestation hash if photoHash is provided
    const attestationHash = photoHash
      ? keccak256(toHex(`${tokenId}:${styleId}:${photoHash}`))
      : null;

    const timestamp = Date.now();
    const explorerBase =
      resolvedChainId === liskSepolia.id
        ? "https://sepolia-blockscout.lisk.com"
        : "https://blockscout.lisk.com";

    const attestation = {
      tokenId,
      txHash: txHash || null,
      styleId,
      styleName: style.name,
      styleCategory: style.category,
      hairType: hairType || null,
      userAddress,
      photoHash: photoHash || null,
      attestationHash,
      timestamp,
      txVerified: true,
      explorerUrl: `${explorerBase}/address/${userAddress}`,
      contractAddress: PROTOCOL_CONTRACT_ADDRESS,
      chainId: resolvedChainId,
    };

    // Store the attestation
    await storeAttestation(tokenId, attestation);

    return NextResponse.json(attestation);
  } catch (e) {
    console.error("Attest API error:", e);
    return NextResponse.json(
      { error: "Failed to record attestation" },
      { status: 500 }
    );
  }
}
