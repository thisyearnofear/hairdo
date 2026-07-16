# Onchain Integration

## Role in the Product

The onchain layer is an **opt-in premium**, not a payment gate. The core
product (style recommendations + AI try-on) is frictionless and free. The
onchain layer provides:

1. **Style attestation** — users can attest their style choice on Lisk,
   creating a verifiable onchain record (user-facing premium)
2. **Barber trust-score** — barbers build portable reputation via onchain
   attestation history (grant-funded, Phase 3)
3. **Future: x402 payments** for the Style Intelligence ASP endpoints
   (production monetization)

## Stack

- **Wagmi v3** — React hooks for Ethereum
- **Viem** — TypeScript Ethereum library
- **Custom ConnectButton** — Wallet connection UI (replaces ConnectKit)
- **Lisk Mainnet** — Primary chain (Chain ID: 1135)
- **Upstash Redis** — Offchain attestation metadata storage (365-day TTL)

## Lisk Mainnet Details

- **Chain ID**: 1135
- **RPC**: https://rpc.api.lisk.com
- **Explorer**: https://blockscout.lisk.com
- **Currency**: ETH
- **LSK Token**: 0xac485391EB2d7D88253a7F1eF18C37f4242D1A24

## Configuration Files

- `lib/chains.ts` — Lisk chain configuration
- `lib/wagmi-config.ts` — Wagmi v3 config (chains, connectors, transports)
- `lib/contract-config.ts` — Smart contract ABI and address
- `components/Web3Provider.tsx` — Wagmi + React Query provider
- `components/ConnectButton.tsx` — Custom wallet connect/disconnect button
  with "ONCHAIN_PREMIUM" label

## Smart Contract

- **Address**: [0x055cA743f0fFB9258ea7f8484794C293f32f2d4C](https://blockscout.lisk.com/address/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C)
- **Verified on Sourcify**: [View](https://repo.sourcify.dev/1135/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C/)

The contract's `payForService(bytes32 tokenId)` and `isTokenUsed(bytes32
tokenId)` functions provide the onchain attestation foundation. The tokenId
mechanism maps to attestation IDs — each attestation has a unique, verifiable
onchain record.

## Attestation Flow

### User Flow (style attestation)

1. **Connect wallet** — user connects to Lisk via the ConnectButton in the
   header. The app auto-switches to Lisk if needed.
2. **Browse recommendations** — the ATTEST button appears on each
   recommendation card when the wallet is connected to Lisk.
3. **Click ATTEST** — opens the AttestationHandler modal for the selected
   style.
4. **Approve LSK spending** — the user approves the contract to spend 1 LSK
   (ERC-20 `approve` call). This is a one-time approval per attestation.
5. **Pay attestation fee** — the user calls `payForService(tokenId)` on the
   contract, which transfers 1 LSK and marks the tokenId as used onchain.
6. **Record attestation** — after the onchain tx confirms, the frontend
   calls `POST /api/attest` with the tokenId, styleId, styleName, and
   userAddress. The API:
   - Verifies the payment onchain via `isTokenUsed(tokenId)`
   - Checks replay protection (token not already attested)
   - Computes a deterministic attestation hash
   - Stores the attestation metadata in Upstash Redis (365-day TTL)
7. **Success** — the UI shows the attestation details with a link to the
   Lisk explorer.

### Verification Flow

Anyone can verify an attestation without connecting a wallet:

1. **Visit** `/attestations/[tokenId]` with any attestation tokenId
2. **View** the attestation details: style name, category, wallet address,
   timestamp, photo hash, onchain verification status
3. **Verify independently** — check `isTokenUsed(tokenId)` on the Lisk
   contract via Blockscout
4. **Explorer link** — the page links to the user's address on Blockscout

### API Endpoints

- `POST /api/attest` — records an attestation (requires paymentToken,
  styleId, userAddress; verifies onchain payment)
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
  txVerified: boolean;      // always true (verified onchain before storage)
  explorerUrl: string;      // Blockscout link to user address
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
- The ConnectButton in the header has an "ONCHAIN_PREMIUM" label
- The ATTEST button appears on recommendation cards only when the wallet
  is connected to Lisk
- A subtle hint appears after recommendations load if the wallet is NOT
  connected: "WANT_TO_ATTEST_YOUR_STYLE_ONCHAIN? // LISK_L2"
- Wallet connection is opt-in, never required for the core flow
- The attestation is a verifiable, portable onchain record

This keeps Lisk visible (honoring the funding relationship) while never adding
friction to the core product experience.
