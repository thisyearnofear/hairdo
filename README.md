# HAIRDO

AI-powered hairstyle generator live on LISK.

## How it works

🚀 [Replicate](https://replicate.com) - ML model hosting platform

✂️ [HairCLIP](https://replicate.com/wty-ustc/hairclip) - AI hairstyle generation model

⛓️ [LISK](https://lisk.com) - Layer 2 blockchain

## Development

### Prerequisites

1. Get a [Replicate API token](https://replicate.com/account)
2. Get a [WalletConnect project ID](https://cloud.walletconnect.com)

Add both to `.env.local`:

```bash
REPLICATE_API_TOKEN=your_token_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

### Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Deploy

Deploy to Vercel:

```bash
vercel
```

Set `REPLICATE_API_TOKEN` in your deployment environment variables.

## Tech Stack

- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Vercel Edge Runtime
- Wagmi + ConnectKit (Web3)
- Lisk L2 (Chain ID: 1135)
