# HAIRDO

AI-powered hairstyle generator live on LISK.

## How it works

🚀 [Replicate](https://replicate.com) - ML model hosting platform

✂️ [HairCLIP](https://replicate.com/wty-ustc/hairclip) - AI hairstyle generation model

⛓️ [LISK](https://lisk.com) - Layer 2 blockchain

💰 Pay-per-use with LISK blockchain integration

## Features

- Upload a photo or take a selfie with your device camera
- Generate AI-modified versions with different hairstyles
- Choose from various hairstyles, shades, and colors
- Powered by the HairCLIP model on Replicate
- Built with Next.js, Tailwind CSS, and Lisk blockchain
- Pay-per-use system with Lisk blockchain integration
- Privacy-focused - photos are processed locally and never stored

## Quick Start

1. Visit [hairdo.vercel.app](https://hairdo.vercel.app)
2. Choose to upload a photo or take a selfie
3. Select your desired hairstyle, shade, and color
4. Connect your wallet and pay the small fee (0.001 ETH)
5. View your transformed hairstyle!

For detailed instructions, see our [Usage Guide](docs/USAGE_GUIDE.md).

## Development

### Prerequisites

1. Get a [Replicate API token](https://replicate.com/account)
2. Get a [WalletConnect project ID](https://cloud.walletconnect.com)
3. Deploy the smart contract (see `contracts/README.md`)

Add to `.env.local`:

```bash
REPLICATE_API_TOKEN=your_token_here
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

**Important**: Make sure to set your `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in the environment variables. Without this, wallet connections will fail.

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

Set `REPLICATE_API_TOKEN` and `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in your deployment environment variables.

Also remember to:
1. Deploy the smart contract (see `contracts/README.md`)
2. Update the contract address in `lib/contract-config.ts`

## Blockchain Integration

HAIRDO now integrates with the Lisk blockchain for a pay-per-use model:

1. Users must connect their wallet and pay a small fee (0.001 ETH) on Lisk
2. Payment is processed through our smart contract
3. After payment confirmation, users can generate a hairstyle
4. Each payment token can only be used once for security

### Smart Contract Information

- **Address**: [0x7Cc87B3717973D2fF477515C790859180F5139f0](https://blockscout.lisk.com/address/0x7Cc87B3717973D2fF477515C790859180F5139f0)
- **Verified on Sourcify**: [View on Sourcify](https://repo.sourcify.dev/1135/0x7Cc87B3717973D2fF477515C790859180F5139f0/)

See `contracts/README.md` for deployment instructions and contract details.

## Troubleshooting Wallet Issues

If you're experiencing wallet connection issues:

1. Make sure your `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is set in `.env.local`
2. Clear your browser cache and localStorage
3. Try using a different browser or incognito mode
4. Check browser console for specific error messages
5. Ensure you're using a Lisk-compatible wallet

## Privacy Policy

We prioritize your privacy:
- Photos are processed locally in your browser
- No images are stored on our servers
- Images are only sent to Replicate's API for processing
- All processing happens in real-time and is not retained

## Tech Stack

- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS + shadcn/ui
- Vercel Edge Runtime
- Wagmi + ConnectKit (Web3)
- Lisk L2 (Chain ID: 1135)