// ═══════════════════════════════════════════════════════════════════════
// HairdoProtocol — Contract Configuration
// ═══════════════════════════════════════════════════════════════════════
//
// The HairdoProtocol contract is the onchain trust graph for HAIRDO.
// It replaces the proof-of-concept HairdoPayment.sol.
//
// Contract: HairdoProtocol.sol
// Chain: env-selected live L2 (see lib/chains.ts NEXT_PUBLIC_CHAIN).
// Fee token: set at redeploy time (LSK below is the retired placeholder).
//
// The contract handles:
// 1. Style Registry — maintenance windows onchain
// 2. Style Credentials — soulbound NFTs for each attested cut
// 3. Barber Registry — barbers stake LSK, declare specialties
// 4. Cut Attestation — barbers attest cuts for clients
// 5. Trust Score — computed onchain from attestation events
// 6. Staking + Slashing — economic security
// 7. Growth Tracking — isOverdue() view function for the agent

// Protocol address — env-driven per deployment track.
// (Lisk shut down with no users and no history — there is no fallback
// address. Until redeployed, the zero address fails every onchain
// verification closed, which is the honest state.)
//
//   NEXT_PUBLIC_PROTOCOL_ADDRESS            applies to the active chain
//   NEXT_PUBLIC_PROTOCOL_ADDRESS_<chainId>   per-chain override, e.g.
//     _84532 (Base Sepolia), _8453 (Base), _11142220 (Celo Sepolia),
//     _42220 (Celo), _421614 (Arbitrum Sepolia), _42161 (Arbitrum One)
//
// Set NEXT_PUBLIC_CHAIN (see lib/chains.ts) + the matching address entry
// to move the deployment track. No code changes.
import { activeChain } from "@/lib/chains";

export const UNSET_PROTOCOL_ADDRESS =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

function readProtocolAddress(): `0x${string}` {
  const perChain =
    process.env[`NEXT_PUBLIC_PROTOCOL_ADDRESS_${activeChain.id}`];
  return ((perChain ||
    process.env.NEXT_PUBLIC_PROTOCOL_ADDRESS ||
    UNSET_PROTOCOL_ADDRESS) as `0x${string}`);
}

export const PROTOCOL_CONTRACT_ADDRESS = readProtocolAddress();

// Fee-token addresses (retired LSK placeholder — replaced at redeploy).
// Mainnet and testnet differ
export const LSK_TOKEN_ADDRESS_MAINNET =
  "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24" as `0x${string}`;
export const LSK_TOKEN_ADDRESS_TESTNET =
  "0x8a21CF9Ba08Ae709D64Cb25AfAA951183EC9FF6D" as `0x${string}`;

// Default to mainnet fee-token address (production). Testnet deployments
// use the testnet address.
export const LSK_TOKEN_ADDRESS = LSK_TOKEN_ADDRESS_MAINNET;

// ─── ABI ────────────────────────────────────────────────────────────────

export const PROTOCOL_ABI = [
  // ─── Style Registry ──────────────────────────────────────────────────
  {
    inputs: [
      { name: "styleId", type: "string" },
      { name: "styleName", type: "string" },
      { name: "maintenanceDays", type: "uint16" },
    ],
    name: "registerStyle",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "styleId", type: "string" },
      { name: "maintenanceDays", type: "uint16" },
    ],
    name: "updateStyleMaintenance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "styleId", type: "string" }],
    name: "getStyle",
    outputs: [
      { name: "styleName", type: "string" },
      { name: "maintenanceDays", type: "uint16" },
      { name: "exists", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "styleId", type: "string" }],
    name: "styleExists",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "styleCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ─── Hair Type Encoding ──────────────────────────────────────────────
  {
    inputs: [{ name: "hairType", type: "string" }],
    name: "encodeHairType",
    outputs: [{ name: "", type: "uint16" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [{ name: "code", type: "uint16" }],
    name: "decodeHairType",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "pure",
    type: "function",
  },

  // ─── Barber Registry ─────────────────────────────────────────────────
  {
    inputs: [
      { name: "shop", type: "string" },
      { name: "city", type: "string" },
      { name: "state", type: "string" },
      { name: "specialties", type: "string[]" },
      { name: "stakeAmount", type: "uint256" },
    ],
    name: "registerBarber",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "styleId", type: "string" }],
    name: "addSpecialty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "styleId", type: "string" }],
    name: "removeSpecialty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "barber", type: "address" },
      { name: "styleId", type: "string" },
    ],
    name: "hasSpecialty",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "requestUnstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawStake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "cancelUnstake",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "barber", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "client", type: "address" },
      { name: "reason", type: "string" },
    ],
    name: "slashBarber",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "address" }],
    name: "barbers",
    outputs: [
      { name: "registered", type: "bool" },
      { name: "stake", type: "uint256" },
      { name: "registeredAt", type: "uint64" },
      { name: "lastActiveAt", type: "uint64" },
      { name: "verifiedCutCount", type: "uint256" },
      { name: "slashedCount", type: "uint256" },
      { name: "shop", type: "string" },
      { name: "city", type: "string" },
      { name: "state", type: "string" },
      { name: "unstakeRequestAt", type: "uint64" },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ─── Cut Attestation + Credential Minting ────────────────────────────
  {
    inputs: [
      { name: "client", type: "address" },
      { name: "styleId", type: "string" },
      { name: "hairType", type: "string" },
      { name: "photoHash", type: "bytes32" },
      { name: "tokenURI_", type: "string" },
    ],
    name: "attestCut",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "styleId", type: "string" },
      { name: "hairType", type: "string" },
      { name: "photoHash", type: "bytes32" },
      { name: "tokenURI_", type: "string" },
    ],
    name: "selfAttest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ─── Growth Tracking ─────────────────────────────────────────────────
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "isOverdue",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "daysUntilOverdue",
    outputs: [{ name: "", type: "int256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "daysSinceCut",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ─── Trust Score ─────────────────────────────────────────────────────
  {
    inputs: [{ name: "barber", type: "address" }],
    name: "computeTrustScore",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "barber", type: "address" }],
    name: "getBarberProfile",
    outputs: [
      { name: "registered", type: "bool" },
      { name: "shop", type: "string" },
      { name: "city", type: "string" },
      { name: "state", type: "string" },
      { name: "stake", type: "uint256" },
      { name: "verifiedCutCount", type: "uint256" },
      { name: "slashedCount", type: "uint256" },
      { name: "registeredAt", type: "uint64" },
      { name: "lastActiveAt", type: "uint64" },
      { name: "trustScore", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllBarbers",
    outputs: [
      { name: "addresses", type: "address[]" },
      { name: "trustScores", type: "uint256[]" },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ─── Credential Reads ────────────────────────────────────────────────
  {
    inputs: [{ name: "user", type: "address" }],
    name: "tokensOfOwner",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getCredential",
    outputs: [
      { name: "styleId", type: "string" },
      { name: "styleName", type: "string" },
      { name: "barber", type: "address" },
      { name: "client", type: "address" },
      { name: "timestamp", type: "uint64" },
      { name: "hairType", type: "string" },
      { name: "photoHash", type: "bytes32" },
      { name: "barberAttested", type: "bool" },
      { name: "overdue", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "user", type: "address" }],
    name: "getLatestCredential",
    outputs: [
      { name: "tokenId", type: "uint256" },
      { name: "timestamp", type: "uint64" },
      { name: "styleId", type: "string" },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ─── ERC-721 Views ───────────────────────────────────────────────────
  {
    inputs: [{ name: "user", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "barberCount",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ─── Admin ───────────────────────────────────────────────────────────
  {
    inputs: [{ name: "newFee", type: "uint256" }],
    name: "setCredentialFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "togglePause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdrawLSK",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ─── Constants ───────────────────────────────────────────────────────
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "credentialFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "MIN_STAKE",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "paused",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  // ─── Events ──────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "tokenId", type: "uint256" },
      { indexed: true, name: "client", type: "address" },
      { indexed: true, name: "barber", type: "address" },
      { indexed: false, name: "styleId", type: "string" },
      { indexed: false, name: "timestamp", type: "uint64" },
      { indexed: false, name: "barberAttested", type: "bool" },
    ],
    name: "CredentialMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "barber", type: "address" },
      { indexed: false, name: "shop", type: "string" },
      { indexed: false, name: "city", type: "string" },
      { indexed: false, name: "stake", type: "uint256" },
    ],
    name: "BarberRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "barber", type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "reason", type: "string" },
    ],
    name: "StakeSlashed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "styleId", type: "string" },
      { indexed: false, name: "styleName", type: "string" },
      { indexed: false, name: "maintenanceDays", type: "uint16" },
    ],
    name: "StyleRegistered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;

// ─── Fee-token ABI (for approvals) ──────────────────────────────────────

export const LSK_TOKEN_ABI = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// ─── Backward compatibility exports ─────────────────────────────────────
// Existing code imports CONTRACT_ADDRESS and CONTRACT_ABI.
// Now pointing to the env-selected HairdoProtocol deployment.

export const CONTRACT_ADDRESS = PROTOCOL_CONTRACT_ADDRESS;
export const CONTRACT_ABI = PROTOCOL_ABI;
