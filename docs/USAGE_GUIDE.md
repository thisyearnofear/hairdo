# HAIRDO — Usage Guide

## How to Use

### 1. Upload Your Photo
You have two options:
- **Upload Photo**: Select an image from your device
- **Take Selfie**: Use your device camera

Photos are processed locally in your browser. They are never stored on our
servers — they are only sent to Replicate's API for AI visualization.

### 2. Set Your Preferences
Describe your constraints so the style advisor can rank recommendations:
- **Hair type/texture**: 1A–4C coil/sieve scale (defaults to 4C)
- **Climate**: humid, dry, hot, cold, temperate
- **Budget**: how much you're willing to spend per barber visit (optional)
- **Maintenance tolerance**: low (monthly barber, minimal daily), medium
  (biweekly barber, some daily), high (weekly barber, daily styling OK)
- **Lifestyle**: corporate, creative, athletic, casual (optional)
- **Compatibility**: helmet-friendly, headphone-friendly (optional)

### 3. Get Ranked Recommendations
Click **GET_RECOMMENDATIONS**. The style advisor reasons over the tradeoff
database and returns ranked styles with full metadata:
- Match score (0-100) with reasons why it fits and where it falls short
- Maintenance: barber visit frequency and daily routine
- Typical cost per visit and monthly cost
- Comfort: itchiness, heat retention, helmet/headphone compatibility
- Climate suitability
- Skill required (any barber vs specialist)
- Cultural context and face shape recommendations

### 4. Try On a Style
Click **VISUALIZE** on any recommendation to generate an AI visualization of
the style on your photo. Powered by Replicate (HairCLIP model). You can
adjust the shade and color before visualizing.

The result includes a before/after comparison slider so you can see the
transformation side by side.

### 5. (Optional) Attest Onchain
If you connect your wallet to Lisk (Chain ID: 1135), an **ATTEST** button
appears on each recommendation. Clicking it opens the attestation flow:

1. **Approve** the contract to spend 1 LSK (one-time per attestation)
2. **Pay** the attestation fee on Lisk via `payForService(tokenId)`
3. **Record** — after the onchain tx confirms, the attestation metadata
   (styleId, styleName, your address, timestamp) is recorded
4. **Verify** — anyone can view the attestation at
   `/attestations/[tokenId]`

The attestation creates a verifiable onchain record of your style choice.
It costs ~1 LSK (a small fee that prevents spam and creates a permanent
record). Never required to use the core product.

### 6. (Optional) Verify an Attestation
Visit `/attestations/[tokenId]` with any attestation tokenId to view its
details:
- Style name and category
- Wallet address that created it
- Timestamp
- Photo hash (if provided)
- Onchain verification status
- Link to the Lisk explorer

This is a public endpoint — anyone can verify any attestation without
connecting a wallet.

## Barber Trust-Score

Barbers can build a portable, onchain reputation by issuing attestations
after real cuts. The trust-score system computes a score from:

- **Verified cuts**: number of onchain attestations issued
- **Specialty coverage**: how many style categories they can execute
- **Consistency**: regular attestation issuance vs sporadic
- **Recency**: recent activity weighted higher

To look up a barber's trust profile:
- Visit `/barbers/[address]` with their wallet address
- Or call `api/barber-score` with their address

## Privacy & Security

- All photos are processed locally in your browser before being sent to Replicate
- No images are stored on our servers
- Onchain attestations store only a photo hash, never the image itself
- Barber attestations store before/after photo hashes on IPFS, never the images
- Your personal data is never collected or sold
- Attestation records are public and verifiable by anyone

## Technical Details

- Powered by HairCLIP AI model on Replicate
- Style intelligence via a curated tradeoff metadata database (34 styles)
- Barber trust-scores via onchain attestation history analysis
- Built with Next.js 16, React 19, Tailwind CSS v4
- Onchain attestations via Lisk L2 (Chain ID: 1135)
- Attestation storage via Upstash Redis (365-day TTL)
- Deployed on Vercel
