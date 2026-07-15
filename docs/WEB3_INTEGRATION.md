# Onchain Integration

## Role in the Product

The onchain layer is an **opt-in premium**, not a payment gate. The core
product (style recommendations + AI try-on) is frictionless and free. The
onchain layer provides:

1. **x402 payments** for the Style Intelligence ASP endpoints (production)
2. **Onchain attestation** of style choices (user-facing premium)
3. **Barber Attestation Layer** (grant-funded, longer build — see
   [PRODUCT_PLAN.md](PRODUCT_PLAN.md))

## Stack

- **Wagmi v3** — React hooks for Ethereum
- **Viem** — TypeScript Ethereum library
- **Custom ConnectButton** — Wallet connection UI (replaces ConnectKit)
- **Lisk Mainnet** — Primary chain (Chain ID: 1135)

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

## Smart Contract

- **Address**: [0x055cA743f0fFB9258ea7f8484794C293f32f2d4C](https://blockscout.lisk.com/address/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C)
- **Verified on Sourcify**: [View](https://repo.sourcify.dev/1135/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C/)

The contract is being repurposed from a payment gate to an attestation
issuance flow. The existing `payForService(bytes32 tokenId)` and
`isTokenUsed(bytes32 tokenId)` functions provide the foundation — the tokenId
mechanism maps naturally to attestation IDs.

## Wagmi v3 Hooks

The app uses the wagmi v3 hook API:
- `useConnection()` — connected address, chain, status (replaces deprecated `useAccount()`)
- `useChains()` — configured chains (replaces `useConfig().chains`)
- `useSwitchChain()` — switch network (use `mutate` / `mutateAsync`)
- `useWriteContract()` — write to smart contracts
- `useReadContract()` — read from smart contracts
- `useWaitForTransactionReceipt()` — wait for tx confirmation

## x402 Payment Integration

The ASP endpoints (`api/recommend`, `api/visualize`, `api/attest`) use x402
payment on Lisk mainnet. Agents calling the endpoints pay per request in
LSK/ETH. The facilitator handles payment negotiation automatically.

## Onchain Premium (Easter Egg)

The onchain attestation feature is surfaced as a subtle premium in the UI:
- A small "ONCHAIN" or Lisk indicator near style recommendations
- Wallet connection is opt-in, never required for the core flow
- Users who connect can attest their style choice on Lisk
- The attestation is a verifiable, portable onchain record

This keeps Lisk visible (honoring the funding relationship) while never adding
friction to the core product experience.
