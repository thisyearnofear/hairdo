import { NextRequest, NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { activeChain, resolveChain } from "@/lib/chains";
import { PROTOCOL_CONTRACT_ADDRESS, PROTOCOL_ABI } from "@/lib/contract-config";
import { getRedis, attestationKey, userAttestationsKey } from "@/lib/redis";

export const runtime = "nodejs";

declare global {
  var attestations: Map<string, unknown> | undefined;
}
if (!global.attestations) {
  global.attestations = new Map();
}

function getClient(chainId: number) {
  return createPublicClient({ chain: resolveChain(chainId), transport: http() });
}

/**
 * POST /api/attest/mint — upgrade an offchain cut to an onchain credential.
 * Body: { attestationId, tokenId, txHash, userAddress, chainId }
 * Verifies ownerOf(tokenId) == userAddress, then links the offchain record.
 */
export async function POST(request: NextRequest) {
  try {
    const { attestationId, tokenId, txHash, userAddress, chainId } =
      await request.json();

    if (!attestationId || !tokenId || !userAddress) {
      return NextResponse.json(
        { error: "attestationId, tokenId and userAddress are required" },
        { status: 400 }
      );
    }

    const resolvedChainId = chainId || activeChain.id;
    const client = getClient(resolvedChainId);
    let owner: string;
    try {
      owner = await client.readContract({
        address: PROTOCOL_CONTRACT_ADDRESS,
        abi: PROTOCOL_ABI,
        functionName: "ownerOf",
        args: [BigInt(tokenId)],
      });
    } catch (e) {
      console.error("Mint verification failed:", e);
      return NextResponse.json(
        { error: "Token not found on-chain. Mint first via the contract." },
        { status: 402 }
      );
    }
    if (owner.toLowerCase() !== userAddress.toLowerCase()) {
      return NextResponse.json(
        { error: "Wallet does not own this token" },
        { status: 403 }
      );
    }

    const r = getRedis();
    const raw = r
      ? await r.get(attestationKey(attestationId))
      : global.attestations!.get(attestationId);
    if (!raw) {
      return NextResponse.json({ error: "Cut not found" }, { status: 404 });
    }
    const record =
      typeof raw === "string" ? JSON.parse(raw) : (raw as Record<string, unknown>);

    const upgraded = {
      ...record,
      tokenId,
      txHash: txHash || null,
      userAddress,
      txVerified: true,
      onchain: true,
      contractAddress: PROTOCOL_CONTRACT_ADDRESS,
      chainId: resolvedChainId,
      mintedAt: Date.now(),
      offchainId: attestationId,
    };

    if (r) {
      await r.set(attestationKey(tokenId), JSON.stringify(upgraded), {
        ex: 365 * 24 * 60 * 60,
      });
      const userKey =
        (record as { userKey?: string }).userKey ?? userAddress.toLowerCase();
      await r.sadd(userAttestationsKey(userKey), tokenId);
    } else {
      global.attestations!.set(tokenId, upgraded);
    }

    return NextResponse.json(upgraded);
  } catch (e) {
    console.error("Mint link error:", e);
    return NextResponse.json({ error: "Failed to link mint" }, { status: 500 });
  }
}
