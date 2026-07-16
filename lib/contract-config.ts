// ═══════════════════════════════════════════════════════════════════════
// HairdoProtocol — Contract Configuration
// ═══════════════════════════════════════════════════════════════════════
//
// The HairdoProtocol contract is the onchain trust graph for HAIRDO.
// It replaces the proof-of-concept HairdoPayment.sol.
//
// Contract: HairdoProtocol.sol
// Chain: Lisk L2 (Chain ID: 1135)
// Token: LSK (ERC-20, 0xac485391EB2d7D88253a7F1eF18C37f4242D1A24)
//
// The contract handles:
// 1. Style Registry — maintenance windows onchain
// 2. Style Credentials — soulbound NFTs for each attested cut
// 3. Barber Registry — barbers stake LSK, declare specialties
// 4. Cut Attestation — barbers attest cuts for clients
// 5. Trust Score — computed onchain from attestation events
// 6. Staking + Slashing — economic security
// 7. Growth Tracking — isOverdue() view function for the agent

// Contract address — will be set after deployment
export const PROTOCOL_CONTRACT_ADDRESS =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

// Legacy contract (proof-of-concept, being replaced)
export const LEGACY_CONTRACT_ADDRESS =
  "0x055cA743f0fFB9258ea7f8484794C293f32f2d4C" as `0x${string}`;

// LSK token address
export const LSK_TOKEN_ADDRESS =
  "0xac485391EB2d7D88253a7F1eF18C37f4242D1A24" as `0x${string}`;

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

// ─── Legacy ABI (HairdoPayment.sol — proof of concept) ──────────────────
// Kept for backward compatibility with existing attestation flow.
// Will be removed once the new protocol is deployed and wired up.

export const LEGACY_ABI = [
  {
    inputs: [{ name: "tokenId", type: "bytes32" }],
    name: "isTokenUsed",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "bytes32" }],
    name: "payForService",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "serviceFee",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// ─── LSK Token ABI (for approvals) ──────────────────────────────────────

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
// These point to the legacy contract until the new one is deployed.

export const CONTRACT_ADDRESS = LEGACY_CONTRACT_ADDRESS;
export const CONTRACT_ABI = LEGACY_ABI;
