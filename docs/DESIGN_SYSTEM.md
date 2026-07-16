# HAIRDO Design System

A warm, magazine-grade aesthetic for style discovery, paired with a polished,
trust-forward treatment for onchain verification. The product speaks in plain,
human, sentence-case language — never terminal-style ALL_CAPS_UNDERSCORES.

## Core Principles

### 1. Warm Editorial Voice
- Sentence-case labels for user-facing content ("Your photo", "Your
  preferences", "Get recommendations", "Find a barber")
- Display serif (`--font-display`, Georgia fallback) for headings and
  personality moments — warm, italic, editorial
- Plain language at the onchain seam too: "Attest your cut", "Your LSK",
  "Attest fee" — never `ATTEST_FOR_1_LSK` or `LOADING_WALLET`
- Small uppercase tracking only for quiet meta labels
  (`text-[10px] tracking-wide uppercase opacity-50`)

### 2. Warm Dark Palette
- Base: `hsl(25 15% 5%)` (warm near-black, not pure black)
- Foreground: `hsl(40 15% 96%)` (warm off-white)
- Amber accent: `hsl(38 70% 55%)` — the primary warm signal
- Rich palette for depth: espresso, caramel, gold, burnt-orange, plum, sage,
  terracotta
- White at 10-40% opacity for neutral UI surfaces

### 3. Gradient Typography
- `text-gradient-warm` — gold → caramel → terracotta (hero, primary headings)
- `text-gradient-gold` — gold → amber → burnt-orange (section titles)
- `text-gradient-sunset` — amber → burnt-orange → plum (accent moments)
- Used on display-serif headings for dramatic, warm fills

### 4. Cultural Motifs
- `barbershop-divider` — repeating amber/terracotta/cream stripe (3px)
- `cornrow-pattern` — converging row motif for section dividers (6px)
- `fade-stripe` — vertical skin-to-hair gradient bar (40px)
- Hairstyle SVG illustrations as parallax backdrop and card accents

### 5. Glass + Warm Borders
- `glass-warm` — frosted warm glass (`hsl(25 15% 6% / 0.6)` + blur + saturate)
- `border-gradient-warm` — subtle amber→terracotta gradient border on cards
- `shadow-warm` / `shadow-gold-glow` — colored depth, shadows over borders

### 6. Micro-Interactions (Disney 12 + tactile)
- `press-scale` — `scale(0.96)` on active, 120ms ease-out (never below 0.95)
- Staggered entrances: `animate-enter-up` (280ms), `animate-enter-scale`
  (240ms), `animate-enter-fade` (200ms) — all `cubic-bezier(0.2, 0, 0, 1)`
- `animate-count-up` — spring-settle for score numbers (320ms)
- `animate-bar-grow` / `animate-radar-draw` — data viz reveals
- Drift animations (`drift-1`…`drift-4`) for ambient parallax orbs
- Shimmer skeletons, pulse rings for live indicators
- `prefers-reduced-motion` respected globally

## Color Tokens (`globals.css` `@theme`)

```css
--color-background:   hsl(20 8% 3.5%);
--color-foreground:   hsl(40 15% 96%);
--color-card:         hsl(20 6% 5%);
--color-border:       hsl(20 5% 14%);
--color-ring:         hsl(38 60% 70%);

/* Warm accents */
--color-amber:        hsl(38 70% 55%);
--color-amber-soft:   hsl(38 50% 45%);
--color-terracotta:   hsl(18 55% 42%);
--color-sage:         hsl(140 20% 45%);

/* Rich warm palette */
--color-espresso:     hsl(25 30% 8%);
--color-caramel:      hsl(32 50% 45%);
--color-gold:         hsl(45 75% 52%);
--color-burnt-orange: hsl(22 65% 42%);
--color-plum:         hsl(320 35% 28%);
```

## Typography

```css
--font-sans:    system-ui sans stack (body, UI)
--font-display: Georgia, serif (headings, personality, italic moments)

text-[10px] tracking-wide uppercase opacity-50  // quiet meta labels
text-xs tracking-wide font-medium opacity-60     // form labels (text-label)
text-sm tracking-wide                            // inputs, buttons
text-lg font-display                             // card titles
text-2xl font-display text-gradient-gold         // section titles
text-[clamp(4rem,16vw,11rem)] font-display text-gradient-warm  // hero
```

## Utilities (`@utility` in `globals.css`)

| Utility | Purpose |
|---|---|
| `font-display` | Display serif stack |
| `text-label` | Soft sentence-case form label |
| `text-amber` / `text-gold` / `text-caramel` / `text-burnt-orange` / `text-plum` / `text-sage` / `text-terracotta` | Warm accent text |
| `text-gradient-warm` / `text-gradient-gold` / `text-gradient-sunset` | Gradient-filled headings |
| `glass-warm` | Frosted warm glass background |
| `border-gradient-warm` | Amber→terracotta gradient border |
| `shadow-warm` / `shadow-gold-glow` / `shadow-layered` | Colored depth |
| `barbershop-divider` / `cornrow-pattern` / `fade-stripe` | Cultural motifs |
| `press-scale` | Tactile active feedback |
| `shimmer` | Loading skeleton |
| `pulse-ring` | Live status indicator |

## Component Patterns

### Upload Zone
- Aspect-square, `glass-warm` + `border-gradient-warm`
- Corner brackets in `border-amber/20` (warm, not white)
- Grid overlay at 5% opacity
- `press-scale` on the container, `group-hover:scale-105` on the image
- Section label above: italic display serif "Your photo"

### Form / Preferences
- `text-label` for labels (sentence-case, opacity-60)
- `bg-black/40` select backgrounds, `border-white/10` → `hover:border-white/30`
- Hair type guide toggle ("Not sure?") in `text-amber/70`
- Compatibility toggles use `accent-amber` checkboxes

### Recommendation Card
- `glass-warm` + `border-gradient-warm`, `press-scale`
- Selected state: `border-amber/40 bg-amber/5 shadow-gold-glow`
- Style illustration in amber-tinted rounded square
- Score in `text-gradient-warm` with `animate-count-up`
- Radar chart (80px) for tradeoff shape
- Match reasons in `text-green-400/70`, tradeoffs in `text-yellow-500/60`
- StatBars for maintenance / cost / comfort / skill

### Attestation Handler
- Same warm voice as the rest of the app — sentence-case, plain language
- Value-prop explainer at top: what a Style Credential is, why it matters
- `glass-warm` cards for "Attesting" / "Your LSK" / "Attest fee"
- Amber spinner (`border-amber/20 border-t-amber`) for all loading states
- Completed state: amber check in amber-tinted circle, gradient headline
- Footer in `font-display italic` — "Pays a small fee on Lisk L2" etc.

### Barber Directory
- `text-gradient-gold` title, `barbershop-divider` + `cornrow-pattern` under
- Trust score in `font-display`, color-coded (green/yellow/orange/red)
- Specialty chips, onchain-proven styles as green checkmarks
- `glass-warm` + `border-gradient-warm` cards, `hover:shadow-warm`

### Growth Nudge
- Urgency-colored border (red/amber/neutral) on `glass-warm` card
- Style illustration in amber-tinted rounded square
- "Growth Agent" meta label, nudge copy in `font-display`
- "Find a barber" CTA in amber-tinted button

## Animation Timing

```css
120ms  // press-scale active feedback
200ms  // enter-fade
240ms  // enter-scale
280ms  // enter-up
320ms  // count-up (spring settle)
400ms  // bar-grow
360ms  // radar-draw
700ms  // shimmer sweep on buttons
2s     // pulse-ring
25-35s // drift ambient orbs
```

All entrances use `cubic-bezier(0.2, 0, 0, 1)` (ease-out). Exits use ease-in.

## Grid System

- Max container: `7xl` / `1400px` (`--container` utility)
- 2-column layout on desktop (upload | preferences; recommendation grid)
- Single column mobile
- `gap-8` between major sections, `gap-4` between cards

## Accessibility

- Minimum 40px touch targets (buttons `h-12` / `h-14`)
- `prefers-reduced-motion` collapses all animations to 0.01ms
- ARIA labels on icon-only buttons
- Focus-visible states via shadcn/ui primitives
- Semantic HTML (`<main>`, `<section>`, `<header>`, `<footer>`)
- Color contrast: warm foreground on warm dark base meets WCAG AA

## Voice Rules (do / don't)

**Do:**
- "Your photo", "Your preferences", "Get recommendations"
- "See it on me", "Find a barber", "Attest your cut"
- "Reading your wallet", "Recording your credential"
- "Your Style Credential is onchain"

**Don't:**
- `LOADING_WALLET`, `ATTEST_FOR_1_LSK`, `INSUFFICIENT_LSK`
- `PARAM_01`, `CONFIG_v1.0`, `MODEL_v2`
- ALL_CAPS_UNDERSCORES anywhere user-facing
- Pure `#000` black backgrounds (use `hsl(25 15% 5%)`)
