# HAIRDO

An agentic style advisor for Black men — upload a photo, describe your
lifestyle and constraints, and get ranked style recommendations with real
tradeoff metadata (maintenance, cost, comfort, climate fit). Try on any style
with AI visualization (two tiers: basic free, refined premium). Attest your
style choice onchain as a Style Credential — a soulbound NFT that builds your
verifiable hair history. A Hair Growth Agent monitors your attested cuts and
proactively nudges you when it's time to rebook.

**Full product plan: [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md)**

## How it works

1. Upload a photo or take a selfie
2. Set your preferences — hair type, climate, budget, maintenance tolerance
3. Get ranked style recommendations with tradeoff metadata
4. Try on any style with AI visualization (two tiers: basic free, refined premium)
5. Attest your style choice onchain — mints a Style Credential (soulbound NFT)
6. The Hair Growth Agent tracks your attested cuts and nudges you to rebook
7. Verify any attestation by tokenId at `/attestations/[tokenId]`

## Architecture

- **Frontend**: Landing page + interactive demo + growth dashboard
  + attestation verification page at `/attestations/[tokenId]`
  + barber directory at `/barbers`
- **Backend**: Style Intelligence + Growth Agent — API endpoints
  - `api/recommend` — ranked style recommendations with tradeoffs (POST + GET)
  - `api/visualize` — AI try-on via Replicate, two tiers (POST)
  - `api/attest` — mints Style Credential SBT on Lisk (POST)
  - `api/growth` — growth estimation + rebook nudges from attestation history (GET)
  - `api/attestations/[tokenId]` — public read endpoint for any attestation (GET)
  - `api/barber-score` — barber trust-score from verified onchain history (POST + GET)
  - `api/barbers/[address]` — lookup a barber's trust profile (GET)
- **Data**: `data/styles.json` — curated tradeoff metadata for 34 Black
  men's styles across 8 categories (the knowledge base)
- **Data**: `data/barbers.json` — barber trust database with onchain attestation
  history, specialty styles, and computed trust scores
- **Onchain**: Lisk mainnet — Style Credential protocol (soulbound NFTs)
  + barber trust graph

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Replicate (HairCLIP basic + SDXL LoRA refined for AI try-on)
- Wagmi v3 + Viem (Web3)
- Lisk L2 (Chain ID: 1135) — Style Credentials + trust graph
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
- **Payment Token**: LSK ERC-20 [0xac48...1A24](https://blockscout.lisk.com/token/0xac485391EB2d7D88253a7F1eF18C37f4242D1A24)

### HairdoProtocol (building)

The old `HairdoPayment.sol` was a proof-of-concept payment recorder. It's being
replaced by `HairdoProtocol.sol` — a unified protocol contract that IS the
trust graph, not just a payment processor with an NFT bolted on.

**Old contract (legacy, being replaced):**
- **Address**: [0x055cA743f0fFB9258ea7f8484794C293f32f2d4C](https://blockscout.lisk.com/address/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C)
- **Verified on Sourcify**: [View on Sourcify](https://repo.sourcify.dev/1135/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C/)

**New contract (in development):**
- `HairdoProtocol.sol` — a unified protocol handling:
  - **Style Registry** — maintenance windows onchain, `isOverdue()` view
  - **Style Credentials** — soulbound NFTs for each attested cut
  - **Barber Registry** — barbers stake LSK, declare specialties
  - **Cut Attestation** — barbers attest cuts for clients (two-sided trust)
  - **Trust Score** — computed onchain from real attestation events
  - **Staking + Slashing** — economic security for the trust graph
  - **Growth Tracking** — `isOverdue()`, `daysUntilOverdue()`, `daysSinceCut()`

The attestation flow (new):
1. User pays the credential fee in LSK (or barber pays for barber-attested cuts)
2. Contract mints a Style Credential SBT to the user's wallet
3. Onchain metadata: styleId, barber, timestamp, hairType, photoHash
4. The Hair Growth Agent reads `isOverdue(tokenId)` from the contract
5. Anyone can verify a credential by reading the contract or visiting
   `/attestations/[tokenId]`

See `contracts/HairdoProtocol.sol` for the full contract source.

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
- Style Credentials store only a photo hash (SHA-256), never the image itself
- Barber attestations store before/after photo hashes on IPFS, never the images
- Your attestation history is tied to your wallet — you control it
