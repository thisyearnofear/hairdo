import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  celo,
  celoSepolia,
} from "viem/chains";
import type { Chain } from "viem";

// ─── Live L2 targets ────────────────────────────────────────────────────
// HairdoProtocol redeploys per grant track (Celo/MiniPay, Arbitrum).
// (Lisk L2 shut down 2 Nov 2026 with no users and no history worth
// preserving — all Lisk definitions were removed outright.)
export { arbitrum, arbitrumSepolia, base, baseSepolia, celo, celoSepolia };

// ─── Env-driven chain selection ──────────────────────────────────────────
// NEXT_PUBLIC_CHAIN selects the active deployment target. Values:
//   "base-sepolia" (default) | "base" | "celo-sepolia" | "celo" |
//   "arbitrum-sepolia" | "arbitrum-one"
// Switching grant/deployment track = changing one env var + the matching
// NEXT_PUBLIC_PROTOCOL_ADDRESS(_<chainId>) entry. No code changes.
const CHAIN_ALIASES = {
  "base-sepolia": baseSepolia,
  base: base,
  "celo-sepolia": celoSepolia,
  celo: celo,
  "arbitrum-sepolia": arbitrumSepolia,
  "arbitrum-one": arbitrum,
} as const;

export type ChainAlias = keyof typeof CHAIN_ALIASES;

function readChainAlias(): ChainAlias {
  const raw = (
    process.env.NEXT_PUBLIC_CHAIN || "base-sepolia"
  ).toLowerCase() as ChainAlias;
  return raw in CHAIN_ALIASES ? raw : "base-sepolia";
}

export const ACTIVE_CHAIN_ALIAS = readChainAlias();

/** The chain HairdoProtocol is currently deployed to (env-selected). */
export const activeChain = CHAIN_ALIASES[ACTIVE_CHAIN_ALIAS];

/** All live chains the wallet may connect to (dead Lisk excluded). */
export const liveChains: [Chain, ...Chain[]] = [
  baseSepolia,
  base,
  celoSepolia,
  celo,
  arbitrumSepolia,
  arbitrum,
];

/** Resolve a chain id to its definition; unknown ids fall back to active. */
export function resolveChain(chainId: number | undefined) {
  if (!chainId) return activeChain;
  return liveChains.find((c) => c.id === chainId) ?? activeChain;
}

/** Explorer base URL for a chain id. */
export function explorerBaseUrl(chainId: number | undefined): string {
  const chain = resolveChain(chainId);
  return (
    chain.blockExplorers?.default.url ??
    activeChain.blockExplorers!.default.url
  );
}

/** Explorer URL for an address on a chain id. */
export function explorerAddressUrl(
  chainId: number | undefined,
  address: string
): string {
  return `${explorerBaseUrl(chainId)}/address/${address}`;
}

/** Explorer URL for a tx hash on a chain id. */
export function explorerTxUrl(
  chainId: number | undefined,
  txHash: string
): string {
  return `${explorerBaseUrl(chainId)}/tx/${txHash}`;
}
