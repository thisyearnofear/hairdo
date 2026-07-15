# HAIRDO — Usage Guide

## How to Use

### 1. Upload Your Photo
You have two options:
- **Upload Photo**: Select an image from your device
- **Take Selfie**: Use your device camera

### 2. Set Your Preferences
Describe your constraints so the style advisor can rank recommendations:
- **Hair type/texture**: 1A–4C coil/sieve scale
- **Climate**: humid, dry, hot, cold, temperate
- **Budget**: how much you're willing to spend per barber visit
- **Maintenance tolerance**: how often you can get to the barber (weekly, biweekly, monthly)
- **Lifestyle**: corporate, creative, athletic, casual

### 3. Get Ranked Recommendations
The style advisor reasons over the tradeoff database and returns ranked styles
with full metadata:
- Maintenance hours/week and barber visit frequency
- Typical cost range
- Comfort (itchiness, heat retention, helmet/headphone compatibility)
- Climate suitability
- Skill required (any barber vs specialist)
- Cultural context and face shape recommendations

### 4. Try On a Style
Click any recommendation to generate an AI visualization of the style on your
photo. Powered by Replicate (HairCLIP model).

### 5. (Optional) Attest Onchain
Connect your wallet and attest your style choice on Lisk. This creates a
verifiable onchain record of your style selection — a premium feature that
demos the attestation infrastructure. Never required to use the core product.

## Privacy & Security

- All photos are processed locally in your browser before being sent to Replicate
- No images are stored on our servers
- Onchain attestations store only a photo hash, never the image itself
- Your personal data is never collected or sold

## Technical Details

- Powered by HairCLIP AI model on Replicate
- Style intelligence via a curated tradeoff metadata database
- Built with Next.js 16, React 19, Tailwind CSS v4
- Onchain attestations via Lisk L2 (Chain ID: 1135)
- Deployed on Vercel
