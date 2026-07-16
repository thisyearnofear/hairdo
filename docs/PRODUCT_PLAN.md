# HAIRDO — Product Plan

## Vision

An agentic style advisor for Black men. Upload a photo, describe your lifestyle
and constraints, and get ranked style recommendations with real tradeoff
metadata — maintenance, cost, comfort, climate fit. Try on any style with AI
visualization. Optionally, attest your style choice onchain via Lisk.

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
- **No one has built the tradeoff metadata database.** This is the defensible
  asset: a curated, structured catalog of Black men's styles with maintenance,
  cost, comfort, climate, and skill-level metadata.
- **No one has built onchain attestation infrastructure for barber reputation.**
  Fake portfolios and unverifiable reviews are a documented industry problem.
  EAS-style attestations on Lisk solve this in a way Web2 platforms can't —
  portable, tamper-proof, platform-agnostic.

## Architecture

One repo, one deployment. Three layers:

### 1. Frontend (informational + interactive)
- **Landing page**: what the Style Intelligence ASP does, pricing per call,
  example responses, API docs
- **Interactive demo**: upload photo → set preferences (hair type, climate,
  budget, maintenance tolerance) → see ranked recommendations with tradeoffs
  → try-on visualization. Doubles as a test harness for the API.
- **Onchain premium (easter egg)**: a subtle "ONCHAIN" or Lisk indicator
  surfaces an opt-in premium — connect wallet, pay on Lisk, receive an onchain
  attestation of your style choice. Never gates the core experience. Visible
  to anyone who explores, but never interrupts.

### 2. Backend — Style Intelligence ASP (x402-paid on Lisk)
- `api/recommend` — takes photo + preferences, reasons over the style database,
  returns ranked styles with tradeoff metadata. x402-paid per call.
- `api/visualize` — takes photo + selected style, calls Replicate for try-on
  image generation. x402-paid per call.
- `api/attest` — takes style choice + photo hash, issues an onchain attestation
  on Lisk. x402-paid per call. This is the bridge to the attestation layer.

### 3. Data — Style Database (the moat)
- `data/styles.json` — 30-40+ Black men's styles with full tradeoff metadata:
  - Style name, category, description
  - Hair type compatibility (1A-4C coil/sieve scale)
  - Maintenance: hours/week, frequency of barber visits, daily routine
  - Cost: typical price range, frequency
  - Comfort: itchiness, heat retention, helmet/headphone compatibility
  - Climate: suitability for humid, dry, hot, cold environments
  - Skill required: can any barber do it, or does it need a specialist
  - Cultural context: origin, popularity, face shape recommendations
  - Replicate prompt parameters (hairstyle description, shade, color)

## Onchain Strategy

### Lisk Relationship
Lisk provided initial funding. The onchain layer pays homage to that
relationship while serving a real product purpose — not as a payment gate,
but as a premium attestation feature.

### Payment Network
x402 payments on Lisk mainnet. The ASP endpoints charge per call in LSK/ETH.
This keeps the narrative consistent: the style intelligence and the attestation
infrastructure are both on Lisk.

### The Barber Attestation Layer (grant-funded, longer build)
Separate from the ASP but designed to integrate. Onchain contracts
(EAS-style attestations, eventually SBTs) deployed on Lisk mainnet:

1. Barber completes a cut → issues an attestation with before/after photo
   hash on IPFS → timestamped and portable
2. Any platform can read and verify the attestation
3. The barber's portfolio becomes portable — no platform lock-in
4. Later: SBT credentials for barber licensing/training completion

**Why Lisk for this piece:** matches their funding mandate — digital identity
infrastructure for informal/underserved economies. Their portfolio includes
EduChain (tamper-proof credentials), lov.cash and Afrikabal (trust rails in
informal trade). Barbers are independent contractors in a fragmented-license
industry, disproportionately Black and African diaspora.

**Grant path:**
1. Lisk DAO Builder Grant — fund contracts + small pilot (one shop, real
   attestations)
2. Lisk DAO Fund — once early traction is demonstrated
3. EMpower Fund — if it scales toward Series A

### Integration Point (v2)
The ASP can read Lisk attestation data when making recommendations: "here's a
style, and here's a barber near you with a verified onchain track record of
executing it." Build each piece independently first, wire together once both
exist.

## Build Order

### Phase 1: Style Intelligence ASP ✅ COMPLETE
1. ✅ Build the style database (`data/styles.json`) — 34 styles with tradeoffs
2. ✅ Build the style matcher (`lib/style-matcher.ts`) — reasoning logic
3. ✅ Strip the web3 payment gate from the main flow (keep the infrastructure)
4. ✅ Build `api/recommend` — free during development, x402-paid on Lisk for production
5. ✅ Build `api/visualize` — Replicate integration (reuse existing model)
6. ✅ Transform the frontend — landing page + interactive demo

### Phase 2: Onchain Premium ✅ COMPLETE
7. ✅ Refactor `PaymentHandler` → `AttestationHandler` for attestation flow
8. ✅ Build `api/attest` — verifies onchain payment, records attestation metadata
9. ✅ Surface the onchain option as a subtle premium in the UI
10. ✅ Update docs and landing page to mention the onchain feature
11. ✅ Build attestation verification page (`/attestations/[tokenId]`)

### Phase 3: Barber Trust-Score ASP ✅ COMPLETE (data layer)
12. ✅ Build barber trust database (`data/barbers.json`) — 5 sample barbers
13. ✅ Build trust scoring engine (`lib/barber-trust.ts`) — 4-factor scoring
14. ✅ Build `api/barber-score` — trust score lookup + style-filtered search
15. ✅ Build `api/barbers/[address]` — full barber trust profile
16. ✅ Build barber trust profile page (`/barbers/[address]`)
17. ⬜ Deploy EAS-style attestation contracts on Lisk mainnet (future)
18. ⬜ Build barber-facing flow: issue attestation after a cut (future)
19. ⬜ Pilot with one barbershop — real attestations happening (future)
20. ⬜ Apply for Lisk DAO Builder Grant with pilot data (future)

### Phase 4: Integration ✅ COMPLETE (initial)
21. ✅ ASP surfaces barber recommendations — `FIND_VERIFIED_BARBERS` link on
    each style recommendation card
22. ✅ Barber browse page (`/barbers`) — all barbers ranked by trust score,
    filterable by city
23. ✅ Barber directory link in header navigation
24. ⬜ Style Matchmaker A2A (escrow) — "find me a barber who does X within Y
    budget in Z city" with onchain escrow (future)

## What Stays From the Current Codebase

- Next.js 16, React 19, Tailwind v4, shadcn/ui (the foundation)
- Replicate integration (model ID, image processing in `lib/image.ts`)
- Camera capture and image upload UI (repurpose for the demo)
- ESLint, husky precommit hooks, GitHub Actions CI (already set up)
- wagmi/viem infrastructure and Lisk chain config (repurposed for attestation)
- Smart contract (repurposed from payment-gate to attestation issuance)

## What Gets Removed or Transformed

- `PaymentHandler.tsx` → stripped of payment-gating, refactored for attestation
- `Hairstyle.tsx` → stripped of payment flow, becomes the interactive demo
- `app/api/create` → becomes `api/recommend` (style intelligence)
- `app/api/read` → becomes `api/visualize` (Replicate try-on)
- The pay-per-use model → becomes opt-in onchain attestation premium

## Competitive Landscape

| Competitor | What they do | Gap we fill |
|---|---|---|
| FaceApp ($150M rev, 180M users) | Generic AI photo editing | No tradeoff metadata, no Black hair specialization |
| HairAI Studio | 100+ styles, AI Match | No tradeoff metadata, no onchain layer |
| Glancely | Stylist-grade facial analysis | No tradeoff metadata, no onchain layer |
| theCut (10M users, $2B GMV) | Barber booking | No style discovery, no attestation infrastructure |
| Booksy ($65.9M rev) | Grooming SaaS | No style intelligence, no onchain layer |

**Our defensible assets:**
1. The tradeoff metadata database (no one has this)
2. Onchain attestation infrastructure (no one has this)
3. The conversational/agentic interface (the right paradigm for style discovery)

## Revenue Model

- **ASP endpoints**: x402-paid per call on Lisk (recommend, visualize, attest)
- **Onchain attestation premium**: users pay on Lisk to attest style choices
- **Future**: barber attestation issuance fees, marketplace escrow fees
