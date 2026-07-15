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
5. (Optional) Attest your style choice onchain via Lisk

## Architecture

- **Frontend**: Landing page + interactive demo (also serves as API test harness)
- **Backend**: Style Intelligence ASP — x402-paid API endpoints on Lisk
  - `api/recommend` — ranked style recommendations with tradeoffs
  - `api/visualize` — AI try-on via Replicate
  - `api/attest` — onchain attestation of style choice (Lisk premium)
- **Data**: `data/styles.json` — curated tradeoff metadata for 30-40+ Black
  men's styles (the defensible moat)
- **Onchain**: Lisk mainnet — x402 payments + attestation infrastructure

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Replicate (HairCLIP model for AI try-on)
- Wagmi v3 + Viem (Web3)
- Lisk L2 (Chain ID: 1135) — x402 payments + onchain attestations
- Vercel (deployment)

## Development

### Prerequisites

1. Get a [Replicate API token](https://replicate.com/account)
2. Get a [WalletConnect project ID](https://cloud.walletconnect.com) (for the onchain premium)
3. (Production) Create an [Upstash Redis](https://upstash.com) instance for replay protection

Add to `.env.local`:

```bash
REPLICATE_API_TOKEN=your_token_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional — persistent replay protection (recommended for production)
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

### Smart Contract (existing — being repurposed)
- **Address**: [0x055cA743f0fFB9258ea7f8484794C293f32f2d4C](https://blockscout.lisk.com/address/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C)
- **Payment Token**: LSK ERC-20 Token [0xac48...1A24](https://blockscout.lisk.com/token/0xac485391EB2d7D88253a7F1eF18C37f4242D1A24)
- **Verified on Sourcify**: [View on Sourcify](https://repo.sourcify.dev/1135/0x055cA743f0fFB9258ea7f8484794C293f32f2d4C/)

The existing smart contract is being repurposed from a payment gate to an
attestation issuance flow. See [docs/PRODUCT_PLAN.md](docs/PRODUCT_PLAN.md)
for the full onchain strategy and Lisk grant path.

See `contracts/README.md` for contract details.

## Documentation

- [Product Plan](docs/PRODUCT_PLAN.md) — vision, architecture, build order, onchain strategy
- [Design System](docs/DESIGN_SYSTEM.md) — UI principles and component patterns
- [Web3 Integration](docs/WEB3_INTEGRATION.md) — wagmi/viem configuration
- [Usage Guide](docs/USAGE_GUIDE.md) — how to use the app
- [Troubleshooting](docs/TROUBLESHOOTING.md) — common issues

## Privacy

- Photos are processed locally in your browser
- No images are stored on our servers
- Images are only sent to Replicate's API for processing
- Onchain attestations store only a photo hash, never the image itself
