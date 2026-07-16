# HAIRDO

An agentic style advisor for Black men — upload a photo, describe your
lifestyle and constraints, and get ranked style recommendations with real
tradeoff metadata (maintenance, cost, comfort, climate fit). Try on any style
with AI visualization. Optionally, attest your style choice onchain via Lisk.

**Full product plan: [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md)**

## How it works

1. Upload a photo or take a selfie
2. Set your preferences — hair type, climate, budget, maintenance tolerance
3. Get ranked style recommendations with tradeoff metadata
4. Try on any style with AI visualization (Replicate)
5. (Optional) Attest your style choice onchain via Lisk — creates a verifiable record
6. (Optional) Verify any attestation by tokenId at `/attestations/[tokenId]`

## Architecture

- **Frontend**: Landing page + interactive demo (also serves as API test harness)
  + attestation verification page at `/attestations/[tokenId]`
- **Backend**: Style Intelligence ASP — API endpoints on Lisk
  - `api/recommend` — ranked style recommendations with tradeoffs (POST + GET)
  - `api/visualize` — AI try-on via Replicate (POST)
  - `api/attest` — records onchain attestation of style choice (POST)
  - `api/attestations/[tokenId]` — public read endpoint for any attestation (GET)
  - `api/barber-score` — barber trust-score from verified onchain history (POST + GET)
  - `api/barbers/[address]` — lookup a barber's trust profile (GET)
- **Data**: `data/styles.json` — curated tradeoff metadata for 34 Black
  men's styles across 8 categories (the defensible moat)
- **Data**: `data/barbers.json` — barber trust database with onchain attestation
  history, specialty styles, and computed trust scores
- **Onchain**: Lisk mainnet — attestation infrastructure via existing smart
  contract + EAS-style offchain attestation schema

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Replicate (HairCLIP model for AI try-on)
- Wagmi v3 + Viem (Web3)
- Lisk L2 (Chain ID: 1135) — onchain attestations
- Upstash Redis (attestation storage + replay protection)
- Vercel (deployment)

## Development

### Prerequisites

1. Get a [Replicate API token](https://replicate.com/account)
2. Get a [WalletConnect project ID](https://cloud.walletconnect.com) (for the onchain premium)
3. (Production) Create an [Upstash Redis](https://upstash.com) instance for
   attestation storage and replay protection

Add to `.env.local`:

```bash
REPLICATE_API_TOKEN=your_token_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Attestation storage + replay protection (recommended for production)
KV_REST_API_URL=your_upstash_redis_url
KV_REST_API_TOKEN=your_upstash_token
```

### Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Linting

```bash
npm run lint
```

A precommit hook (husky + lint-staged) automatically lints staged files and
scans for secrets (API keys, private keys, tokens) before each commit.

### Deploy

Deploy to Vercel:

```bash
vercel
```

Set `REPLICATE_API_TOKEN` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in your
deployment environment variables.

## Onchain Integration

### Lisk Mainnet
- **Chain ID**: 1135
- **RPC**: https://rpc.api.lisk.com
- **Explorer**: https://blockscout.lisk.com
- **Currency**: ETH

### Smart Contract (attestation fee + onchain record)
- **Address**: [0x055cA743f0fFB9258ea7f8484794C293f32f2d4C](https://blockscout.lisk.com/address/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C)
- **Payment Token**: LSK ERC-20 Token [0xac48...1A24](https://blockscout.lisk.com/token/0xac485391EB2d7D88253a7F1eF18C37f4242D1A24)
- **Verified on Sourcify**: [View on Sourcify](https://repo.sourcify.dev/1135/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C/)

The smart contract's `payForService(bytes32 tokenId)` creates an onchain record
tied to a unique tokenId. The `isTokenUsed(bytes32 tokenId)` function provides
onchain verification. The attestation flow:

1. User pays the attestation fee on Lisk (1 LSK) via `payForService(tokenId)`
2. Frontend passes the tokenId + style metadata to `api/attest`
3. The API verifies the payment onchain via `isTokenUsed(tokenId)`
4. If verified, the attestation metadata is stored in Upstash Redis
5. Anyone can verify the attestation at `/attestations/[tokenId]`

See `contracts/README.md` for contract details.

## Barber Trust-Score ASP

A separate intelligence layer that computes trust scores for barbers based on
their verified onchain attestation history. Barbers who issue attestations
after real cuts build a portable, platform-agnostic reputation.

- `data/barbers.json` — barber database with specialties, location, and
  computed trust scores
- `api/barber-score` — takes a barber address, returns trust score with
  breakdown (verified cuts, specialty coverage, consistency, recency)
- `api/barbers/[address]` — lookup a barber's full trust profile

Trust scores are computed from:
- Number of verified onchain attestations (cut records)
- Specialty coverage (how many styles they can execute)
- Consistency (regular attestation issuance vs sporadic)
- Recency (recent activity weighted higher)

## Documentation

- [Product Plan](docs/PRODUCT_PLAN.md) — vision, architecture, build order, onchain strategy
- [Design System](docs/DESIGN_SYSTEM.md) — UI principles and component patterns
- [Web3 Integration](docs/WEB3_INTEGRATION.md) — wagmi/viem configuration, attestation flow
- [Usage Guide](docs/USAGE_GUIDE.md) — how to use the app
- [Troubleshooting](docs/TROUBLESHOOTING.md) — common issues

## Privacy

- Photos are processed locally in your browser
- No images are stored on our servers
- Images are only sent to Replicate's API for processing
- Onchain attestations store only a photo hash, never the image itself
- Barber attestations store before/after photo hashes on IPFS, never the images
