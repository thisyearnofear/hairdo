# HAIRDO Differentiation Plan — Codrops Hub p.2 Steals + Ambitious Offchain-First UX

> **Status:** `P2 SHIPPED (beta) — 2026-11-21 (tsc clean, lint 0 errors, next build ok; P2-1b face-mesh shipped, MediaPipe dynamic-only)`
> **Last updated:** 2026-11-21
> **Owner:** HAIRDO team
> **Goal:** Make HAIRDO more ambitious (editorial, tactile, chair-centric) while keeping **onchain entirely optional**. Offchain-first attest via `/api/attest` + `/api/attest/mint` onchain upgrade. Lazy-load wagmi via `LazyWeb3Provider`.
>
> **How to use this doc:** work top-to-bottom through P0 → P1 → P2. Check off boxes in §6 as you land PRs. Each item has: *why*, *Codrops source + repo*, *HAIRDO mapping*, *concrete diff + starter code*, *acceptance criteria*.

---

## 1. Design principles (locked)

1. **Offchain-first, onchain optional.** No wallet wall. `SaveCutButton` (guestId + Redis) is the default save. `Mint onchain` only appears when `isConnected && chainId === activeChain.id` (env-selected track).
2. **Chair spotlight language.** Warm editorial theme in `app/globals.css` (`text-gradient-warm`, `border-gradient-warm`, `glass-warm`, `barbershop-divider`, `cornrow-pattern`). Preserve it — new effects must use amber/terracotta tokens, not Codrops neon.
3. **Consult phases, not funnels.** `PFA → PICK → PLACE → DONE` via `PhaseStamps` + `phaseForFlow({hasImage, hasRecs, hasVisual, hasCut})`. Every new UI must know which phase it belongs to.
4. **Growth as timeline.** `app/growth/page.tsx` stays a timeline of saved cuts, not a dashboard.
5. **No-wallet copy.** Never say "connect to continue". Say "Saved. Connect a wallet to mint it as a portable credential."
6. **Perf budget.** No `three` / `gsap` on first paint today (`package.json` has neither). P0 must be CSS + React only. P1 lazy-loads heavy deps.

Current stack reference (`package.json`):

```json
{
  "dependencies": {
    "next": "16.4.6",
    "react": "19.3.1",
    "viem": "2.58.4",
    "wagmi": "3.7.11",
    "@upstash/redis": "^1.41.0"
  }
}
```

> P1 adds `three` + `gsap` — do **not** add them for P0.

---

## 2. Codrops Hub page 2 audit (verified live via ego-browser)

| # | Codrops demo | What it does | Repo / source | HAIRDO steal |
|---|---|---|---|---|
| 1 | **Cinema Seat Preview** | SVG seat-map; hover a seat → camera flies to that seat's POV; selected state persists | `codrops/CinemaSeatPreview` | **P0-1 Seat-map lineup.** Recommendations grid becomes a "chair lineup" — pick a chair, camera/spotlight flies to it |
| 2 | **Pointer Square Lens Effect** | Tweakable square magnifier follows cursor; distortion + zoom sliders | `tomoyukinakata/pointer-square-lens-effect` | **P0-2 Lens comparator.** Upgrade `Output.tsx` before/after slider to draggable lens |
| 3 | **Interlude / Phase Wipes** (`codrops/interlude`) | Full-screen wipe panels between sections; staggered clip-path transitions | `codrops/interlude` | **P0-3 Phase wipes.** Animate `PFA→PICK→PLACE→DONE` transitions |
| 4 | **Liquid Lens** (metaball reveal) | Gooey metaball mask reveals image under cursor | `angelolibero/liquid-lens` | **P1-1 Liquid hover.** Card hover reveals texture via goo filter |
| 5 | **Relighting Images** | Drag light position → image relights (demo1-3: diffuse / specular / normal) | `DGFX/codrops-relightning-images` | **P1-2 Relight slider.** "Shop light" slider on result photo |
| 6 | **Atelier North** | Editorial nav, oversized serif, index numbers, quiet grid | `codrops/atelier-north` | **Applied already.** Our `text-gradient-gold` + `font-display` follows this — keep referencing for type scale |
| 7 | **Face Mask / MediaPipe demo** | Live face-mesh overlay (camera permission blocked in review — recovered via `takeOverTaskSpace(3)`) | `kaltwrk/experiment-001` family | **P2-1 Live mirror beta.** MediaPipe sidecar next to existing camera modal, never replacing it |
| 8 | **Cursor Shader Trail** | WebGL trail follows cursor | `BertovDev/cursor-shader-trail` | **P2-2 Cursor trail.** Ambient-only, `prefers-reduced-motion` respected |
| 9 | **Dreamfold / Data-mosh** | Smear / fold page transitions | `Makio64/dreamfold`, `niccolofanton/data-mosh` | **P2-3 Smear transitions.** Result reveal only |

---

## 3. Prioritized steal list

### P0 — ship now, CSS + React only, no new deps
- [x] **P0-1 Seat-map lineup** in recommendations grid
- [x] **P0-2 Lens comparator** in `Output.tsx`
- [x] **P0-3 Phase wipe transitions** for `PhaseStamps`

### P1 — needs `three` + `gsap`, lazy-loaded
- [ ] **P1-1 Liquid lens hover** on style cards
- [ ] **P1-2 Relight slider** on result photo

### P2 — spikes / beta, behind flags
- [ ] **P2-1 MediaPipe live mirror beta**
- [ ] **P2-2 Cursor shader trail (ambient)**
- [ ] **P2-3 Smear / fold reveal**

---

## 4. P0 detailed spec (build this first)

### P0-1 — Seat-map lineup (`components/StyleAdvisor.tsx` recommendations grid)

**Why:** Current grid (`grid grid-cols-1 md:grid-cols-2`) is a generic card list. CinemaSeatPreview teaches: *selection = sitting in a chair*. Hover spotlights, click flies the spotlight.

**Where:** `StyleAdvisor.tsx` § Recommendations — the `recommendations.map((rec, index) => ...)` block inside `<Reveal direction="up" delay={index * 60}>`.

**Behaviour:**
1. Top match becomes "In the chair" hero (already have the header: `In the chair` + `{recommendations[0]?.style.name}` — keep it).
2. Remaining recs become a horizontal lineup strip (chair row), not a 2-col grid.
3. Hover / focus moves a spotlight (amber glow + `shadow-gold-glow`); selected card gets `border-amber/40 bg-amber/5 shadow-gold-glow` (already the selected style — extend it with a translate/scale "fly-to").
4. Keyboard accessible: buttons, arrow keys, `aria-selected`.

**Starter diff (drop-in, no deps):**

```tsx
// components/StyleAdvisor.tsx — replace md:grid-cols-2 grid with lineup
// Keep existing Reveal + RadarChart + StatBar inside each card.

const [spotlightId, setSpotlightId] = useState<string | null>(null);
const activeId = selectedStyleId ?? spotlightId ?? recommendations[0]?.style.id;

// ... inside recommendations section:
<div
  role="listbox"
  aria-label="Style lineup — pick a chair"
  className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory
             [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
  onKeyDown={(e) => {
    // arrow-key fly-to: left/right moves spotlight
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const ids = recommendations.map((r) => r.style.id);
    const cur = ids.indexOf(activeId ?? ids[0]);
    const next = e.key === "ArrowRight"
      ? Math.min(ids.length - 1, cur + 1)
      : Math.max(0, cur - 1);
    setSpotlightId(ids[next]);
    document.getElementById(`chair-${ids[next]}`)?.scrollIntoView({
      behavior: "smooth", inline: "center", block: "nearest",
    });
  }}
>
  {recommendations.map((rec, index) => {
    const isActive = rec.style.id === activeId;
    return (
      <Reveal key={rec.style.id} direction="up" delay={index * 60}
        className="snap-center shrink-0 w-[280px] md:w-[320px]">
        <button
          id={`chair-${rec.style.id}`}
          role="option"
          aria-selected={isActive}
          onMouseEnter={() => setSpotlightId(rec.style.id)}
          onFocus={() => setSpotlightId(rec.style.id)}
          onClick={() => {
            setSpotlightId(rec.style.id);
            setSelectedStyleId(rec.style.id);
            play("toggle");
          }}
          className={[
            "w-full text-left border p-5 rounded-lg press-scale",
            "transition-[border-color,background-color,box-shadow,transform] duration-300",
            "border-gradient-warm glass-warm",
            isActive
              ? "border-amber/40 bg-amber/5 shadow-gold-glow -translate-y-1 scale-[1.02]"
              : "border-white/10 hover:border-amber/25 hover:shadow-warm hover:-translate-y-0.5",
          ].join(" ")}
        >
          {/* KEEP existing card interior:
              StyleIllustration + score + RadarChart + description +
              matchReasons + StatBar grid + Visualize + Find barbers + SaveCutButton */}
          <span className="text-[10px] tracking-[0.2em] uppercase opacity-40">
            Chair {String(index + 1).padStart(2, "0")} — {rec.style.category}
          </span>
        </button>
      </Reveal>
    );
  })}
</div>
```

**Styling notes:**
- Spotlight = existing tokens only: `shadow-gold-glow`, `bg-amber/5`, `border-amber/40`. No new colors.
- Honor `prefers-reduced-motion`: the `-translate-y-1` lift must be disabled (see §4.4 CSS).
- Mobile: horizontal snap scroll; desktop: allow wrap after 8 items (`limit: 8` already in `getRecommendations` prefs).

**Acceptance:**
- [ ] Hover/focus moves amber spotlight without layout jump
- [ ] Click sets `selectedStyleId` (existing `visualizeStyle` flow untouched)
- [ ] Arrow keys move spotlight + scroll into view
- [ ] No new dependencies; `tsc` clean

---

### P0-2 — Lens comparator (`components/Output.tsx`)

**Why:** Current before/after is a full-width `input[type=range]` with `clip-path: inset(0 ...)` — functional but flat. Square Lens teaches: *lens you drag* feels tactile and barbershop-mirror-like.

**Where:** `components/Output.tsx` — the `{showComparison && output.sourceImage ? ... : ...}` block. Current state to preserve:

```tsx
// existing — keep these names so StyleAdvisor history keeps working
const [sliderPosition, setSliderPosition] = useState(50);
const [showComparison, setShowComparison] = useState(false);
```

**Behaviour:**
1. Default stays "Result only" (existing toggle `Compare before / after →` preserved).
2. In compare mode: pointer drag moves a square lens (140–180px) over the After image; inside lens shows Before, outside shows After (inverse of today — feels like a loupe). Labels `Before` / `After` stay.
3. Touch + mouse via Pointer Events; keyboard: `<input type="range">` remains as fallback (hidden visually, not removed).
4. No canvas, no libs — pure CSS `clip-path` on two stacked `<Image>` layers.

**Starter implementation:**

```tsx
// components/Output.tsx — add inside Output(), alongside sliderPosition
const [lens, setLens] = useState<{ x: number; y: number } | null>(null);
const frameRef = useRef<HTMLDivElement>(null);

const moveLens = (clientX: number, clientY: number) => {
  const el = frameRef.current;
  if (!el) return;
  const r = el.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * 100;
  const y = ((clientY - r.top) / r.height) * 100;
  setLens({
    x: Math.max(0, Math.min(100, x)),
    y: Math.max(0, Math.min(100, y)),
  });
};

// ... replace the comparison block:
{showComparison && output.sourceImage ? (
  <div
    ref={frameRef}
    className="mt-2 relative w-full aspect-square overflow-hidden rounded-lg
               border border-white/10 cursor-crosshair touch-none select-none"
    onPointerDown={(e) => {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      moveLens(e.clientX, e.clientY);
    }}
    onPointerMove={(e) => {
      if (e.buttons > 0) moveLens(e.clientX, e.clientY);
    }}
    role="slider"
    aria-label="Before / after lens"
    aria-valuenow={Math.round(lens?.x ?? sliderPosition)}
    aria-valuemin={0}
    aria-valuemax={100}
    tabIndex={0}
    onKeyDown={(e) => {
      const step = 4;
      setLens((prev) => {
        const cur = prev ?? { x: sliderPosition, y: 50 };
        if (e.key === "ArrowLeft") return { ...cur, x: Math.max(0, cur.x - step) };
        if (e.key === "ArrowRight") return { ...cur, x: Math.min(100, cur.x + step) };
        if (e.key === "ArrowUp") return { ...cur, y: Math.max(0, cur.y - step) };
        if (e.key === "ArrowDown") return { ...cur, y: Math.min(100, cur.y + step) };
        return cur;
      });
    }}
  >
    {/* After (base) */}
    <div className="absolute inset-0">
      <Image src={output.output!} alt="Generated" fill className="object-contain" />
    </div>
    {/* Before (lens cutout) — square loupe */}
    <div
      className="absolute inset-0"
      style={
        lens
          ? {
              clipPath: `inset(${Math.max(0, lens.y - 14)}% ${Math.max(0, 100 - lens.x - 14)}% ${Math.max(0, 100 - lens.y - 14)}% ${Math.max(0, lens.x - 14)}% round 12px)`,
            }
          : { clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }
      }
    >
      <Image src={output.sourceImage} alt="Original" fill className="object-contain" />
    </div>
    {/* Lens frame */}
    {lens && (
      <div
        className="absolute w-[28%] aspect-square rounded-xl border border-amber/60 shadow-gold-glow pointer-events-none"
        style={{
          left: `calc(${lens.x}% - 14%)`,
          top: `calc(${lens.y}% - 14%)`,
        }}
      >
        <span className="absolute -top-6 left-1 text-[10px] tracking-wide bg-black/60 px-2 py-0.5 rounded opacity-80">
          Before
        </span>
      </div>
    )}
    {/* Keep old range input for a11y, visually hidden */}
    <input
      type="range" min={0} max={100} value={sliderPosition}
      onChange={(e) => setSliderPosition(Number(e.target.value))}
      className="sr-only"
      aria-hidden={false}
      tabIndex={-1}
    />
    <div className="absolute top-3 right-3 text-[10px] tracking-wide bg-amber/20 px-2 py-1 rounded text-amber/90">
      After
    </div>
  </div>
) : (
  /* Result only view — unchanged */
  <div className="mt-2 relative w-full aspect-square rounded-lg overflow-hidden border border-white/10">
    <Image src={output.output!} alt="Generated hairstyle" fill className="object-contain" />
  </div>
)}
```

**Acceptance:**
- [ ] Drag lens reveals Before inside square, After outside
- [ ] Falls back to old `sliderPosition` split when lens never moved (existing screenshots/tests keep passing)
- [ ] Keyboard arrows move lens; screen reader gets `role="slider"`
- [ ] Touch drag works (`touch-none`)

---

### P0-3 — Phase wipe transitions (`components/PhaseStamps.tsx` + CSS)

**Why:** `PFA→PICK→PLACE→DONE` currently swaps instantly. Interlude teaches: a 250ms wipe makes phase feel like walking to the next chair.

**Where:** `PhaseStamps` (pills) + section wrappers in `StyleAdvisor.tsx` (upload grid → recommendations → results). No router changes.

**Behaviour:**
1. When `phaseForFlow` advances, outgoing section wipes out (amber `clip-path` panel, 220ms), incoming wipes in.
2. Stamps themselves animate: active pill gets `shadow-gold-glow` + count-up; done pills dim.
3. Respects `prefers-reduced-motion` (instant swap).

**Starter code:**

```tsx
// components/PhaseStamps.tsx — add wipe key to force re-animation
export function PhaseStamps({ phase, compact = false }: { phase: ConsultPhase; compact?: boolean }) {
  // ... existing PHASES map
  return (
    <div key={phase} className="phase-wipe flex items-center gap-2 ...">
      {/* existing pills unchanged */}
    </div>
  );
}
```

```tsx
// components/StyleAdvisor.tsx — wrap each phase section so wipe has a target
// Upload grid (PFA):
<div key={`pfa-${consultPhase}`} className="phase-wipe">
  {/* existing upload + preferences grid */}
</div>

// Recommendations (PICK): add key so advancing phase re-triggers wipe
<div key={`pick-${consultPhase}`} ref={resultsRef} className="phase-wipe mt-16 max-w-6xl mx-auto scroll-mt-8">
  {/* ... */}
</div>

// Results (PLACE): same pattern
<div key={`place-${list.length > 0 ? "on" : "off"}`} className="phase-wipe mt-8 space-y-4 max-w-6xl mx-auto">
  {list.map(/* ... Output ... */)}
</div>
```

```css
/* app/globals.css — append to Animation Foundation section */
.phase-wipe {
  animation: phase-wipe-in 260ms cubic-bezier(0.2, 0, 0, 1) both;
}
@keyframes phase-wipe-in {
  from {
    opacity: 0;
    clip-path: inset(0 100% 0 0 round 12px);
    transform: translateX(12px);
  }
  to {
    opacity: 1;
    clip-path: inset(0 0 0 0 round 12px);
    transform: translateX(0);
  }
}
@media (prefers-reduced-motion: reduce) {
  .phase-wipe { animation: none; }
}
```

**Acceptance:**
- [ ] Phase advance plays ≤300ms wipe, no content flash
- [ ] Reduced-motion users see instant swap
- [ ] `PhaseStamps` + `phaseForFlow` API unchanged (no prop drilling)

---

### P0-4 — Shared CSS + a11y guardrails (append to `app/globals.css`)

```css
/* Lineup scrollbar hide + snap (P0-1) */
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.no-scrollbar::-webkit-scrollbar { display: none; }

/* Disable lift on reduced motion */
@media (prefers-reduced-motion: reduce) {
  .press-scale:active { transform: none; }
}
```

Keep using existing utilities — do not invent new accent colors:
`text-gradient-warm`, `border-gradient-warm`, `glass-warm`, `shadow-warm`, `shadow-gold-glow`, `barbershop-divider`, `cornrow-pattern`, `animate-enter-up`, `press-scale`.

---

## 5. P1 detailed spec (after P0 lands — needs new deps)

> Install only when starting P1: `npm i three gsap` (+ `@types/three -D` if needed). All P1 components must be `next/dynamic` with `ssr: false` + `LazyWeb3Provider`-style code-splitting so first paint stays light.

### P1-1 — Liquid lens hover (metaball reveal on style cards)

- **Source:** `angelolibero/liquid-lens` (SVG `feGaussianBlur` + `feColorMatrix` goo filter).
- **HAIRDO mapping:** On lineup card hover, a gooey amber blob reveals the `StyleIllustration` texture / description snippet. Decorative only — must not gate the Visualize button.
- **Starter sketch:**

```tsx
// components/ui/liquid-hover.tsx (new, dynamic-imported)
"use client";
export function LiquidHover({ children }: { children: React.ReactNode }) {
  return (
    <span className="group/liquid relative block overflow-hidden rounded-lg">
      <svg className="absolute inset-0 h-full w-full opacity-0 group-hover/liquid:opacity-100 transition-opacity duration-300" aria-hidden>
        <defs>
          <filter id="hairdo-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9" result="goo" />
          </filter>
        </defs>
        <g filter="url(#hairdo-goo)">
          <circle cx="30%" cy="60%" r="28" fill="hsl(38 70% 55% / 0.35)">
            <animate attributeName="cx" values="30%;70%;30%" dur="6s" repeatCount="indefinite" />
          </circle>
          <circle cx="70%" cy="40%" r="20" fill="hsl(18 55% 42% / 0.3)">
            <animate attributeName="cy" values="40%;65%;40%" dur="7s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}
```

- **Acceptance:** hover goo is subtle (<35% opacity amber), hidden on touch / reduced-motion, never blocks clicks.

### P1-2 — Relight slider ("shop light" on result photo)

- **Source:** `DGFX/codrops-relightning-images` demos 1–3.
- **HAIRDO mapping:** Under `Output.tsx` result view, a "Shop light" range slider moves a radial highlight (`mix-blend-overlay`) across the After image — simulates barbershop mirror light.
- **Starter sketch:**

```tsx
const [light, setLight] = useState({ x: 30, y: 25 });
<div className="relative">
  <Image src={output.output!} alt="Generated hairstyle" fill className="object-contain" />
  <div
    className="absolute inset-0 pointer-events-none mix-blend-overlay"
    style={{
      background: `radial-gradient(circle at ${light.x}% ${light.y}%, hsl(45 80% 65% / 0.55), transparent 55%)`,
    }}
  />
</div>
<label className="text-label">Shop light
  <input type="range" min={0} max={100} value={light.x}
    onChange={(e) => setLight((p) => ({ ...p, x: Number(e.target.value) }))} />
</label>
```

- For true normal-map relight (Relighting demo 3), add `three` plane + light position uniform — keep behind `P1-2b` flag; CSS overlay ships first.
- **Acceptance:** slider visibly sweeps warm highlight; zero effect on download (overlay is CSS only, `downloadImage` untouched).

---

## 6. P2 spikes (beta, flagged, non-blocking)

| ID | Spike | Flag / location | Notes |
|---|---|---|---|
| P2-1 | **MediaPipe live mirror** | `?mirror=beta` query, sidecar next to camera modal in `StyleAdvisor.tsx` (`showCamera` block) | Use `kaltwrk/experiment-001`-style face-mesh; never replace upload/capture fallback. Camera denial must fall back to upload (existing `startCamera` catch already does this). |
| P2-2 | **Cursor shader trail** | `<AmbientTrail />` in `app/layout.tsx`, `pointer: fine` only | Port `BertovDev/cursor-shader-trail` minimally; `prefers-reduced-motion` + `pointer: coarse` → render nothing. |
| P2-3 | **Smear / fold reveal** | `Output.tsx` success branch only | Port `Makio64/dreamfold` easing for result reveal; keep `LoadingAnimation` calm barbershop copy (`Preparing the chair...`, `Crafting your ...`). |

---

## 7. Task tracker (check off as you land)

### P0
- [x] P0-1 Seat-map lineup — `StyleAdvisor.tsx` lineup strip + spotlight + arrow keys
- [x] P0-2 Lens comparator — `Output.tsx` lens + a11y range fallback
- [x] P0-3 Phase wipes — `PhaseStamps.tsx` key + `globals.css` `.phase-wipe`
- [x] P0-4 Verify: `npx tsc --noEmit`, `npm run lint` (0 errors), `npm run build` success
- [ ] P0-5 Manual pass: keyboard only, touch drag, reduced-motion on, wallet-free save → mint upgrade still works (`/api/attest` → `/api/attest/mint`)

### P1 (do not start until P0-4 is green)
- [x] P1-0 `npm i three gsap` + dynamic-import audit (no first-paint regression — zero static `three`/`gsap` imports; gsap via `import("gsap")` in effect only)
- [x] P1-1 Liquid hover — `components/ui/liquid-hover.tsx` (SVG goo, touch + reduced-motion guards, wired around lineup illustration)
- [x] P1-2 Relight slider — `Output.tsx` shop-light overlay (CSS `mix-blend-overlay` only, download-identical; gsap one-time intro sweep; `three` normal-map reserved as P1-2b)

### P2 (beta)
- [x] P2-1 Mirror beta behind `?mirror=beta` — `components/ui/mirror-beta.tsx` (dynamic, ssr:false; own stream, oval framing guide, capture→photo, denial falls back to upload copy)
- [x] P2-1b Face mesh — lazily-imported MediaPipe FaceLandmarker (`@mediapipe/tasks-vision@1.2.3`, pinned wasm CDN) with RAF `detectForVideo` loop + sparse amber constellation canvas; model/wasm load only on panel mount, oval guide stays as fallback, torn down on unmount
- [x] P2-2 Ambient trail behind `pointer:fine` + reduced-motion guard — `components/ui/ambient-trail.tsx` (canvas dots, fixed, pointer-events-none) via `ambient-trail-lazy.tsx` Client wrapper (layout is a Server Component)
- [x] P2-3 Smear reveal on result only — `.smear-reveal` in `globals.css` + `Output.tsx` success `Card`, reduced-motion off

---

## 8. Verification commands

```bash
# type + lint + build (P0 must pass with zero new deps)
npx tsc --noEmit
npm run lint
npm run build

# P1 only — after adding three/gsap, confirm code-split:
npm run build
# check Output / StyleAdvisor chunks do NOT include three on first load
```

Manual checklist (each PR):
1. Wallet-free flow: upload → prefs → recs → visualize → `SaveCutButton` saves via guestId, no wallet prompt.
2. Optional mint: connect wallet on Base Sepolia → `Mint onchain (optional)` → `/api/attest/mint` upgrades the saved cut.
3. Keyboard: lineup arrows, lens arrows, modal `✕` reachable.
4. Reduced motion: wipes / goo / trail all off.
5. Theme: only amber/terracotta/gold tokens; `barbershop-divider` / `cornrow-pattern` dividers intact.

---

## 9. File map (where each change lands)

| File | Change |
|---|---|
| `components/StyleAdvisor.tsx` | P0-1 lineup strip; P0-3 `key={phase}` wrappers; P2-1 mirror sidecar (later) |
| `components/Output.tsx` | P0-2 lens; P1-2 relight overlay; P2-3 smear reveal |
| `components/PhaseStamps.tsx` | P0-3 wipe key (API unchanged) |
| `app/globals.css` | P0-3 `.phase-wipe` + P0-4 `.no-scrollbar` guards |
| `components/ui/liquid-hover.tsx` | **SHIPPED** P1-1 (SVG goo, no deps) |
| `components/ui/mirror-beta.tsx` | **SHIPPED** P2-1a (dynamic, ssr:false; P2-1b face-mesh open) |
| `components/ui/ambient-trail.tsx` + `ambient-trail-lazy.tsx` | **SHIPPED** P2-2 (Client wrapper — layout is a Server Component) |
| `package.json` | **SHIPPED** P1-0: `three@^0.187.0`, `gsap@^3.15.1`, `@types/three` (dev); zero static imports — gsap dynamic-only, three unbundled |
| `lib/identity.ts`, `lib/redis.ts`, `app/api/attest/route.ts`, `app/api/attest/mint/route.ts` | **Untouched** — offchain-first flow already landed |

---

## 10. Open questions (answer before P1)

1. Lineup orientation: horizontal snap-strip (spec'd) vs. curved arc (closer to CinemaSeatPreview)? Strip is cheaper + mobile-friendly — stick with strip unless user testing says arc.
2. Lens shape: square (Square Lens repo, barbershop-mirror feel) vs. circular loupe? Spec uses square with `round 12px` — easy to switch to `circle()` later.
3. Relight realism: is CSS overlay enough, or do we need the full `three` normal-map pass? Ship CSS first, measure delight.

---

*Next action: P2 spikes (mirror beta `?mirror=beta`, ambient trail, smear reveal) — all flagged, non-blocking.*
