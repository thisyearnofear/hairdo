# Onchain Integration

## Role in the Product

The onchain layer is an **opt-in premium**, not a payment gate. The core
product (style recommendations + AI try-on) is frictionless and free. The
onchain layer provides:

1. **Style attestation** — users can mint their saved cut as a Style
   Credential on the active L2, creating a verifiable onchain record
   (user-facing premium, optional — saving works without a wallet)
2. **Barber trust-score** — barbers build portable reputation via onchain
   attestation history (grant-funded, Phase 3)
3. **Future: x402 payments** for the Style Intelligence ASP endpoints
   (production monetization)

## Stack

- **Wagmi v3** — React hooks for Ethereum
- **Viem** — TypeScript Ethereum library
- **Custom ConnectButton** — Wallet connection UI (replaces ConnectKit)
- **Env-selected L2** — `NEXT_PUBLIC_CHAIN` picks the deployment track:
  `base-sepolia` (default) | `base` | `celo-sepolia` | `celo` |
  `arbitrum-sepolia` | `arbitrum-one`
- **Upstash Redis** — Offchain attestation metadata storage (365-day TTL)

## Chain Details (env-selected)

- **Selector**: `NEXT_PUBLIC_CHAIN` (see `lib/chains.ts` — `activeChain`,
  `resolveChain`, explorer helpers)
- **Protocol address**: `NEXT_PUBLIC_PROTOCOL_ADDRESS` (+ optional
  `NEXT_PUBLIC_PROTOCOL_ADDRESS_<chainId>` per-track override)
- Until redeployed the address is unset and onchain verification fails
  closed; the offchain consult flow is unaffected.

## Configuration Files

- `lib/chains.ts` — chain definitions + `activeChain` / `resolveChain` /
  explorer URL helpers
- `lib/wagmi-config.ts` — Wagmi v3 config (live chains, connectors,
  transports)
- `lib/contract-config.ts` — `HairdoProtocol.sol` ABI + env-resolved address
- `components/LazyWeb3Provider.tsx` — lazily-loaded Wagmi provider (no
  wallet cost until connected) + `components/ConnectButton.tsx`
- `components/SaveCutButton.tsx` — guest-first save (guestId + Redis),
  optional onchain mint upgrade

## Smart Contract

`HairdoProtocol.sol` — `selfAttest` / `attestCut` mint soulbound Style
Credentials; `ownerOf(tokenId)` is what `/api/attest` and
`/api/attest/mint` verify before recording or linking an attestation.

## Attestation Flow

### User Flow (style attestation)

1. **Save first, no wallet needed** — the user saves a cut via
   `SaveCutButton` (guestId + Redis). This is the default path.
2. **Connect wallet** — user connects via the ConnectButton in the
   header. The app targets the active track (`activeChain`).
3. **Mint onchain (optional)** — the mint button appears on saved cuts
   when the wallet is on the active chain; it opens the AttestationHandler
   for the selected style.
4. **Mint credential** — the user calls `selfAttest` on HairdoProtocol,
   minting a soulbound Style Credential NFT.
5. **Link attestation** — after the mint confirms, the frontend calls
   `POST /api/attest/mint`, which verifies `ownerOf(tokenId)` onchain and
   links the credential to the offchain record. The API:
   - Verifies ownership onchain via `ownerOf(tokenId)`
   - Checks replay protection (token not already attested)
   - Computes a deterministic attestation hash
   - Stores the attestation metadata in Upstash Redis (365-day TTL)
6. **Success** — the UI shows the attestation details with a link to the
   active chain's explorer.

### Verification Flow

Anyone can verify an attestation without connecting a wallet:

1. **Visit** `/attestations/[tokenId]` with any attestation tokenId
2. **View** the attestation details: style name, category, wallet address,
   timestamp, photo hash, onchain verification status
3. **Verify independently** — check `ownerOf(tokenId)` on the protocol
   contract via the active chain's explorer
4. **Explorer link** — the page links to the user's address on the explorer

### API Endpoints

- `POST /api/attest` — records an offchain attestation, or verifies +
  records an onchain one (tokenId + userAddress verified via `ownerOf`)
- `POST /api/attest/mint` — links a minted credential to an offchain
  record (attestationId, tokenId, txHash, userAddress verified onchain)
- `GET /api/attestations/[tokenId]` — public read endpoint for any
  attestation by tokenId

### Attestation Data Schema

```typescript
interface Attestation {
  tokenId: string;          // 0x-prefixed 32-byte hex
  styleId: string;          // style ID from data/styles.json
  styleName: string;        // human-readable style name
  styleCategory: string;    // e.g. "fade", "natural", "braids"
  userAddress: string;      // wallet that paid the attestation fee
  photoHash: string | null; // SHA-256 hash of source photo (optional)
  attestationHash: string | null; // keccak256(tokenId:styleId:photoHash)
  timestamp: number;        // Unix timestamp (ms)
  txVerified: boolean;      // true once verified onchain before storage
  explorerUrl: string;      // explorer link to user address (active chain)
  contractAddress: string;  // the attestation contract address
}
```

## Barber Trust-Score (Phase 3)

A separate intelligence layer that computes trust scores for barbers based
on their onchain attestation history. See
[PRODUCT_PLAN.md](PRODUCT_PLAN.md) for the full strategy.

### Barber Attestation Flow (future)

1. Barber completes a cut → issues an attestation with before/after photo
   hashes on IPFS → timestamped and portable
2. Any platform can read and verify the attestation
3. The barber's portfolio becomes portable — no platform lock-in
4. Trust score computed from: verified cuts, specialty coverage,
   consistency, recency

### EAS Integration (future)

The barber attestation layer will use EAS (Ethereum Attestation Service)
schema for structured onchain attestations. The existing contract provides
the payment/verification foundation; EAS provides the schema layer.

### Trust-Score API Endpoints

- `POST /api/barber-score` — takes a barber address, returns trust score
  with breakdown
- `GET /api/barbers/[address]` — lookup a barber's full trust profile

## Wagmi v3 Hooks

The app uses the wagmi v3 hook API:
- `useConnection()` — connected address, chain, status (replaces deprecated `useAccount()`)
- `useChains()` — configured chains (replaces `useConfig().chains`)
- `useSwitchChain()` — switch network (use `mutate` / `mutateAsync`)
- `useWriteContract()` — write to smart contracts
- `useReadContract()` — read from smart contracts
- `useWaitForTransactionReceipt()` — wait for tx confirmation

## Onchain Premium (Easter Egg)

The onchain attestation feature is surfaced as a subtle premium in the UI:
- Cuts save without a wallet (`SaveCutButton`); the mint upgrade appears
  on saved cuts only when the wallet is on the active chain
- Wallet connection is opt-in, never required for the core flow
- The attestation is a verifiable, portable onchain record
