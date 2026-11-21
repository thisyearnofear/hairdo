import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http, keccak256, toHex } from "viem";
import { base, baseSepolia, lisk, liskSepolia } from "@/lib/chains";
import { getStyleById } from "@/lib/style-matcher";
import { PROTOCOL_CONTRACT_ADDRESS, PROTOCOL_ABI } from "@/lib/contract-config";
import { getRedis, attestationKey, userAttestationsKey } from "@/lib/redis";
import { normalizeUserKey, newOffchainId } from "@/lib/identity";

export const runtime = "nodejs";

// In-memory fallback for local development
declare global {
  var attestations: Map<string, unknown> | undefined;
}
if (!global.attestations) {
  global.attestations = new Map();
}

// Lazily create the viem public client for the appropriate chain
function getClient(chainId: number) {
  const chain =
    chainId === baseSepolia.id
      ? baseSepolia
      : chainId === base.id
        ? base
        : chainId === liskSepolia.id
          ? liskSepolia
          : lisk;
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

async function getExistingAttestation(
  tokenId: string
): Promise<unknown | null> {
  const r = getRedis();
  if (r) {
    const result = await r.get(attestationKey(tokenId));
    return result ?? null;
  }
  return global.attestations!.get(tokenId) ?? null;
}

async function storeAttestation(
  tokenId: string,
  data: Record<string, unknown> & { userKey: string }
): Promise<void> {
  const r = getRedis();
  if (r) {
    await r.set(attestationKey(tokenId), JSON.stringify(data), {
      ex: 365 * 24 * 60 * 60,
    });
    await r.sadd(userAttestationsKey(data.userKey), tokenId);
  } else {
    global.attestations!.set(tokenId, data);
  }
}

/**
 * POST /api/attest — offchain-first. No wallet required.
 *
 * Body:
 * {
 *   styleId: string (required),
 *   hairType?: string,
 *   photoHash?: string,
 *   // Optional onchain upgrade in the same call:
 *   tokenId?: string, userAddress?: string, txHash?: string, chainId?: number,
 *   // Guest identity when no wallet:
 *   userId?: string
 * }
 *
 * - Without tokenId: creates an offchain record (txVerified:false).
 *   Returns { tokenId: "offchain:...", txVerified:false, onchain:false }.
 * - With tokenId + userAddress: verifies SBT ownership, stores onchain
 *   record (txVerified:true, onchain:true).
 */
export async function POST(request: NextRequest) {
  try {
    const {
      styleId,
      hairType,
      photoHash,
      tokenId,
      txHash,
      userAddress,
      userId,
      chainId,
    } = await request.json();

    if (!styleId || typeof styleId !== "string") {
      return NextResponse.json({ error: "styleId is required" }, { status: 400 });
    }

    const style = getStyleById(styleId);
    if (!style) {
      return NextResponse.json({ error: `Style not found: ${styleId}` }, { status: 404 });
    }

    const userKey = normalizeUserKey({ userAddress, userId });
    if (!userKey) {
      return NextResponse.json(
        { error: "Provide userAddress (0x…) or userId (guest id from localStorage)" },
        { status: 400 }
      );
    }

    // Onchain path — verify then store.
    if (tokenId && typeof tokenId === "string") {
      const existing = await getExistingAttestation(tokenId);
      if (existing) {
        return NextResponse.json(
          { error: "This credential token has already been recorded" },
          { status: 409 }
        );
      }
      if (!userAddress || typeof userAddress !== "string") {
        return NextResponse.json(
          { error: "userAddress is required for onchain attestations" },
          { status: 400 }
        );
      }
      const resolvedChainId = chainId || baseSepolia.id;
      const isVerified = await verifyCredentialOnChain(tokenId, userAddress, resolvedChainId);
      if (!isVerified) {
        return NextResponse.json(
          { error: "Style Credential not found on-chain. Mint first, then record." },
          { status: 402 }
        );
      }
      const attestationHash = photoHash
        ? keccak256(toHex(`${tokenId}:${styleId}:${photoHash}`))
        : null;
      const timestamp = Date.now();
      const explorerBase =
        resolvedChainId === base.id
          ? "https://basescan.org"
          : resolvedChainId === baseSepolia.id
            ? "https://sepolia.basescan.org"
            : resolvedChainId === liskSepolia.id
              ? "https://sepolia-blockscout.lisk.com"
              : "https://blockscout.lisk.com";
      const attestation = {
        tokenId,
        txHash: txHash || null,
        styleId,
        styleName: style.name,
        styleCategory: style.category,
        hairType: hairType || null,
        userAddress: userAddress || null,
        userId: userId || null,
        userKey,
        photoHash: photoHash || null,
        attestationHash,
        timestamp,
        txVerified: true,
        onchain: true,
        explorerUrl: userAddress ? `${explorerBase}/address/${userAddress}` : null,
        contractAddress: PROTOCOL_CONTRACT_ADDRESS,
        chainId: resolvedChainId,
      };
      await storeAttestation(tokenId, attestation);
      return NextResponse.json(attestation);
    }

    // Offchain path — no chain interaction.
    const offchainId = newOffchainId();
    const timestamp = Date.now();
    const attestationHash = photoHash
      ? keccak256(toHex(`${offchainId}:${styleId}:${photoHash}`))
      : null;
    const attestation = {
      tokenId: offchainId,
      txHash: null,
      styleId,
      styleName: style.name,
      styleCategory: style.category,
      hairType: hairType || null,
      userAddress: userAddress || null,
      userId: userId || null,
      userKey,
      photoHash: photoHash || null,
      attestationHash,
      timestamp,
      txVerified: false,
      onchain: false,
      explorerUrl: null,
      contractAddress: null,
      chainId: null,
    };
    await storeAttestation(offchainId, attestation);
    return NextResponse.json(attestation, { status: 201 });
  } catch (e) {
    console.error("Attest API error:", e);
    return NextResponse.json({ error: "Failed to record attestation" }, { status: 500 });
  }
}
