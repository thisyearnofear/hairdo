# HAIRDO — Product Plan

## Vision

An agentic style advisor for Black men. Upload a photo, describe your lifestyle
and constraints, and get ranked style recommendations with real tradeoff
metadata — maintenance, cost, comfort, climate fit. Try on any style with AI
visualization. Attest your style choice onchain via Lisk as a Style Credential —
a soulbound NFT that builds your verifiable hair history. A Hair Growth Agent
monitors your attested cuts and proactively nudges you when it's time to rebook,
creating a recurring engagement loop that compounds with every attestation.

The core problem: Black men's barbershop culture is rich and culturally
significant, but the digital tooling is generic. FaceApp doesn't understand a
burst fade vs a shadow fade. No one has structured the tradeoff metadata
(maintenance hours/week, cost per visit, climate suitability, comfort) that
would let a man make an informed decision about a new style. The barbershop
imagination gap is real — users default to "the usual" because they lack the
vocabulary, visual reference, and tradeoff information to explore.

## What's Novel

Research confirms:
- AI try-on for Black hair exists (HairAI Studio, Glancely, Cutify) — the
  generation layer is not a moat
- Barber booking is dominated by theCut (10M users, $2B in haircuts booked)
- **No one has built the tradeoff metadata database.** This is the first
  defensible asset: a curated, structured catalog of Black men's styles with
  maintenance, cost, comfort, climate, and skill-level metadata.
- **No one has built onchain attestation infrastructure for barber reputation.**
  Fake portfolios and unverifiable reviews are a documented industry problem.
  EAS-style attestations on Lisk solve this in a way Web2 platforms can't —
  portable, tamper-proof, platform-agnostic.
- **No one has built a recurring engagement loop around hair care.** Style
  discovery is a one-shot experience on every competitor. The Hair Growth Agent
  turns it into a compounding relationship — every attested cut makes the agent
  smarter and the next recommendation better.

## The Moat

Three layers, each compounding:

### 1. Tradeoff Metadata Database (built, static)
34 Black men's styles with full tradeoff metadata. This is the knowledge base
that powers recommendations. It's curated, not generated — every entry reflects
real barbershop knowledge. Competitors would need months of research to
replicate. But it's static: it doesn't grow on its own.

### 2. Style Credentials (building now)
Every attested cut mints a soulbound NFT — a non-transferable Style Credential
that records: the style, the barber, the date, the user's hair type at the time.
This is the user's verifiable hair history onchain. It's portable (any platform
can read it), tamper-proof (onchain), and personal (tied to the user's wallet).

The credential layer is the foundation for the trust graph. Each credential:
- Adds to the barber's verified cut count (trust score input)
- Records the user's style history (recommendation refinement input)
- Creates a timestamped data point for growth estimation

### 3. Hair Growth Agent (building now)
An autonomous agent that runs in the background. It reads the user's Style
Credentials and the style database's maintenance metadata to estimate when
their current style is growing out. It proactively nudges the user to rebook,
recommends barbers with verified experience in their style, and (in later
phases) can book and escrow payment onchain.

The agent creates the **compounding engagement loop**:

```
Discover → Visualize → Attest (mint SBT) → Agent tracks growth
  → Nudges to rebook → User attests next cut → Agent learns
  → Better recommendations → Higher retention → More attestations
```

This loop is the moat. Each cycle:
- Makes the agent smarter (learns actual growth rates, not just averages)
- Strengthens barber trust scores (more verified cuts)
- Refines recommendations (attestation history feeds back into matching)
- Increases switching costs (your hair history is onchain and portable)

Competitors can copy the UI, the AI try-on, even the style database. They can't
copy the accumulated attestation history and the agent that learns from it.

## Architecture

One repo, one deployment. Four layers:

### 1. Frontend (informational + interactive)
- **Landing page**: what HAIRDO does, the agentic loop, style credentials
- **Interactive demo**: upload photo → set preferences → ranked recommendations
  with tradeoffs → try-on visualization → attest as Style Credential
- **Growth dashboard**: shows your attested cut history, estimated growth status,
  rebook urgency, and proactive nudges from the agent
- **Barber directory**: verified barbers ranked by onchain trust scores

### 2. Backend — Style Intelligence + Growth Agent
- `api/recommend` — ranked style recommendations with tradeoffs. Reads
  attestation history (when available) to refine recommendations.
- `api/visualize` — AI try-on via Replicate (two tiers: basic + refined)
- `api/attest` — mints a Style Credential SBT on Lisk and records metadata
- `api/growth` — reads attestation history, estimates growth based on style
  maintenance data and hair type, returns rebook urgency and nudge content
- `api/attestations/[tokenId]` — public read endpoint for any attestation
- `api/barber-score` — barber trust-score from verified onchain history
- `api/barbers/[address]` — lookup a barber's trust profile

### 3. Onchain — Style Credential Protocol
- **StyleCredential.sol** — soulbound NFT contract. Each attested cut mints a
  non-transferable NFT with embedded metadata: styleId, barberAddress,
  timestamp, hairType, photoHash. Implements ERC-721 with transfer disabled.
- **Lisk L2 (Chain ID: 1135)** — all onchain operations on Lisk mainnet
- **LSK token** — used for attestation fees and (future) barber staking
- Replaces the old `HairdoPayment.sol` which only recorded payment receipts

### 4. Data — Style Database + Trust Graph
- `data/styles.json` — 34 Black men's styles with full tradeoff metadata
  (the knowledge base)
- Attestation history (Redis + onchain) — the growing trust graph that feeds
  the growth agent and refines recommendations
- `data/barbers.json` — barber directory (transitions to onchain-derived data
  as real attestations accumulate)

## Onchain Strategy

### Lisk Relationship
Lisk provided initial funding. The onchain layer serves a real product purpose
— Style Credentials and the trust graph — not just payment recording.

### Style Credential Protocol

The old `HairdoPayment.sol` was a proof-of-concept payment recorder: users paid
1 LSK, the contract marked a tokenId as used, and the attestation metadata lived
in Redis. It worked but it didn't create a moat — nothing onchain was reusable
or portable.

The new `StyleCredential.sol` is a soulbound NFT contract:

1. User pays the attestation fee in LSK
2. Contract mints a non-transferable NFT to the user's wallet
3. NFT metadata includes: styleId, styleName, barberAddress (if applicable),
   timestamp, hairType, photoHash (SHA-256, never the image itself)
4. Token URI resolves to attestation metadata (stored on IPFS or Redis)
5. Anyone can verify a credential by reading the contract
6. The user's wallet becomes their portable hair history

**Why soulbound (non-transferable):** Your hair history is personal. If
credentials were transferable, they'd be sellable, which destroys trust. SBTs
ensure each credential represents a real cut by a real person.

**Why this is the moat:** Every credential is a data point. After 6 months of
use, a user has 6-12 credentials showing their style journey — what they tried,
what stuck, how often they rebook. The growth agent uses this to personalize.
Barbers use this to understand new clients. No competitor can copy this
accumulated history.

### Hair Growth Agent

The agent is the agentic primitive that creates recurring engagement:

**What it knows:**
- Your last attested cut (style, date, barber) — from your Style Credentials
- How long that style lasts before growing out — from the style database's
  `maintenance.barberFrequencyDays` field
- Your hair type and its growth characteristics — 4C hair grows ~0.5cm/month
  but shrinks visibly; 3A grows faster and shows length differently
- Your barber's trust score and specialties — from the barber trust engine

**What it does:**
- Polls your attestation history daily (client-side)
- Estimates days until your style grows out
- When you cross the maintenance threshold, surfaces a nudge:
  "Your skin fade is at day 9 — it's probably growing out. Marcus at Fade
  Kings has 47 verified cuts in this style and has openings this week."
- Tracks whether you act on nudges (rebook + attest) or ignore them
- Feeds this back into recommendations (if you consistently rebook late,
  suggests lower-maintenance styles)

**Why it's agentic, not just a notification:**
- It reasons about your specific situation, not just a timer
- It cross-references barber availability and trust scores
- It learns from your behavior patterns
- In later phases: it can autonomously book and escrow payment

### Barber Attestation Layer (Phase 6, grant-funded)
Once the credential layer is live and the growth agent is driving recurring
attestations from the client side, we build the barber side:

1. Barber completes a cut → issues an attestation with before/after photo
   hash on IPFS → timestamped and portable
2. The attestation links to the client's Style Credential, creating a
   two-sided trust relationship
3. Barber's portfolio becomes portable — no platform lock-in
4. Barbers stake LSK to list themselves; slashed stakes go to clients for
   disputed cuts (economic security layer)

**Why Lisk for this piece:** matches their funding mandate — digital identity
infrastructure for informal/underserved economies. Their portfolio includes
EduChain (tamper-proof credentials), lov.cash and Afrikabal (trust rails in
informal trade). Barbers are independent contractors in a fragmented-license
industry, disproportionately Black and African diaspora.

**Grant path:**
1. Lisk DAO Builder Grant — fund Style Credential contract deployment + small
   pilot (one shop, real attestations via the growth agent loop)
2. Lisk DAO Fund — once early traction is demonstrated through credential
   minting volume and rebook rates
3. EMpower Fund — if it scales toward Series A

## Build Order

### Phase 1: Style Intelligence ASP ✅ COMPLETE
1. ✅ Build the style database (`data/styles.json`) — 34 styles with tradeoffs
2. ✅ Build the style matcher (`lib/style-matcher.ts`) — reasoning logic
3. ✅ Strip the web3 payment gate from the main flow (keep the infrastructure)
4. ✅ Build `api/recommend` — free during development, x402-paid on Lisk for production
5. ✅ Build `api/visualize` — Replicate integration (two tiers: basic + refined)
6. ✅ Transform the frontend — landing page + interactive demo

### Phase 2: Onchain Attestation ✅ COMPLETE (legacy)
7. ✅ Refactor `PaymentHandler` → `AttestationHandler` for attestation flow
8. ✅ Build `api/attest` — verifies onchain payment, records attestation metadata
9. ✅ Surface the onchain option as a subtle premium in the UI
10. ✅ Build attestation verification page (`/attestations/[tokenId]`)
11. ⚠️ `HairdoPayment.sol` is a proof-of-concept — replaced by StyleCredential.sol

### Phase 3: Barber Trust-Score ASP ✅ COMPLETE (data layer)
12. ✅ Build barber trust database (`data/barbers.json`) — 5 sample barbers
13. ✅ Build trust scoring engine (`lib/barber-trust.ts`) — 4-factor scoring
14. ✅ Build `api/barber-score` — trust score lookup + style-filtered search
15. ✅ Build `api/barbers/[address]` — full barber trust profile
16. ✅ Build barber trust profile page (`/barbers/[address]`)

### Phase 4: UI/UX Overhaul ✅ COMPLETE
17. ✅ Culturally relevant hairstyle illustrations (SVG)
18. ✅ Warm/magazine aesthetic for style discovery
19. ✅ Technical/trust aesthetic for barber verification
20. ✅ Tiered visualization (Basic free + Refined premium)
21. ✅ Hybrid design shift — friendlier labels, removed technical jargon

### Phase 5: Style Credentials + Growth Agent ← CURRENT
22. ⬜ Write `StyleCredential.sol` — soulbound NFT contract with style metadata
23. ⬜ Deploy `StyleCredential.sol` on Lisk mainnet
24. ⬜ Update `lib/contract-config.ts` with new contract ABI
25. ⬜ Upgrade `api/attest` to mint SBT instead of recording payment receipt
26. ⬜ Upgrade `AttestationHandler` to mint SBT through new contract
27. ⬜ Build `api/growth` — reads attestation history, estimates growth,
    returns rebook urgency and nudge content
28. ⬜ Build client-side growth agent — polls attestation history, surfaces
    proactive nudges in the UI
29. ⬜ Build growth dashboard — shows attested cut history, growth status,
    rebook urgency, barber recommendations
30. ⬜ Feed attestation history back into style matcher for recommendation
    refinement (users who liked X also tried Y; you rebook late, try Z)

### Phase 6: Barber Attestation Protocol (grant-funded, future)
31. ⬜ Deploy barber attestation contract on Lisk mainnet
32. ⬜ Build barber-facing flow: issue attestation after a cut
33. ⬜ Link barber attestations to client Style Credentials (two-sided trust)
34. ⬜ Barber staking + slashing (economic security layer)
35. ⬜ Pilot with one barbershop — real attestations happening
36. ⬜ Apply for Lisk DAO Builder Grant with pilot data

### Phase 7: Agentic Booking + Escrow (future)
37. ⬜ Agent finds verified barbers who specialize in recommended style
38. ⬜ Agent negotiates a slot and escrows payment onchain
39. ⬜ Payment released after user attests satisfaction
40. ⬜ Dispute resolution based on attestation evidence

## What Stays From the Current Codebase

- Next.js 16, React 19, Tailwind v4, shadcn/ui (the foundation)
- Replicate integration (two-tier: HairCLIP basic + SDXL LoRA refined)
- Camera capture and image upload UI
- ESLint, husky precommit hooks, GitHub Actions CI
- wagmi/viem infrastructure and Lisk chain config
- Style database (`data/styles.json`) — 34 styles with tradeoffs
- Barber trust scoring engine (`lib/barber-trust.ts`)
- All API routes (recommend, visualize, attest, barber-score, barbers)
- Attestation verification page (`/attestations/[tokenId]`)

## What Gets Replaced

- `HairdoPayment.sol` → `StyleCredential.sol` (soulbound NFT, not just payment)
- `lib/contract-config.ts` → new ABI for StyleCredential contract
- `api/attest` → mints SBT instead of just recording payment receipt
- `AttestationHandler.tsx` → calls mint on new contract instead of payForService
- Static recommendations → attestation-history-aware recommendations

## Competitive Landscape

| Competitor | What they do | Gap we fill |
|---|---|---|
| FaceApp ($150M rev, 180M users) | Generic AI photo editing | No tradeoff metadata, no Black hair specialization, no onchain layer |
| HairAI Studio | 100+ styles, AI Match | No tradeoff metadata, no onchain layer, no engagement loop |
| Glancely | Stylist-grade facial analysis | No tradeoff metadata, no onchain layer, no engagement loop |
| theCut (10M users, $2B GMV) | Barber booking | No style discovery, no attestation infrastructure, no growth agent |
| Booksy ($65.9M rev) | Grooming SaaS | No style intelligence, no onchain layer, no growth agent |

**Our defensible assets:**
1. The tradeoff metadata database (no one has this) — static but curated
2. Style Credentials (no one has this) — compounding, portable, onchain
3. The Hair Growth Agent (no one has this) — creates the engagement loop
4. Barber trust graph (no one has this) — network effects from attestations

## Revenue Model

- **Refined visualization tier**: premium AI try-on (SDXL LoRA), monetizable
  per generation
- **Style Credential minting**: small fee per SBT (LSK on Lisk)
- **Future**: barber attestation issuance fees, marketplace escrow fees,
  barber staking/slashing protocol fees
- **Future**: premium growth agent features (autonomous booking, style
  journals, seasonal recommendations)
