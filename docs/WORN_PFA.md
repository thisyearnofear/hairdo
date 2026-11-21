# Worn × Wardah PFA — HAIRDO on glasses

> **Active priority (Sat Nov 21, 2026):** HAIRDO's consultation engine on
> MicroLumin M6 waveguide display glasses for the Worn hardware hackathon —
> **Track 01 · Personal Insight**, entered in the **Wardah Personal Face
> Analysis challenge**. This file is the single source of truth for the
> glasses surface.

## Event

| Field          | Value                                                                       |
| -------------- | --------------------------------------------------------------------------- |
| **Event**      | Worn — MicroLumin M6 smart-glasses hackathon (theme: *Second nature*)       |
| **Venue**      | CUNY City Tech, 285 Jay St, Brooklyn, rooms A105/A103                       |
| **Track**      | 01 · Personal Insight — presented with **Wardah** (halal beauty, PT Paragon) |
| **PFA brief**  | Prototype a **hands-free consultation** from a sample PFA result:           |
|                | PFA result → one product recommendation → why it suits the desired look →   |
|                | the placement cue a Beauty Advisor could use                                |
| **Deadline**   | Sat Nov 21, 2:00 PM ET (Airtable, no late edits)                            |
| **Judging**    | Understands you · Adaptability (phone↔glasses) · Ergonomics · Works on      |
|                | glasses · Impact — 0–2 each /10. PFA projects are filmed and may be shared  |
|                | with Wardah (opt out by telling an organizer)                               |
| **Consent**    | Own face or clearly-consented people only — already HAIRDO's privacy posture |
| **Prior work** | HAIRDO predates the event → **disclose it** in the submission               |

## The reframe — the advisor wears the glasses, not the client

Every other team will pitch a consumer app: *your* face, *your*
recommendation, on *your* glasses. The PFA brief says the placement cue is
for a **Beauty Advisor** — so the honest read is a two-human consultation:

- The **Beauty Advisor wears the M6.** PFA result and product reasoning float
  in her vision while her hands and eyes stay on the client's face. She never
  looks down at a tablet mid-consult. That is the whole ergonomics answer.
- The **client holds the phone.** She sees her own PFA result and the try-on
  render — the surface meant for her.

Two people, two surfaces, one consultation — each person sees their layer.
Nobody else demos a two-human handoff, and it doubles as the Adaptability
score.

## What HAIRDO already is for this

- **`api/recommend`** — ranked recommendations with tradeoff metadata
  (maintenance, cost, comfort, climate fit). That metadata *is* the "why it
  suits" a BA would actually say out loud — the brief's hardest beat is the
  shipped feature.
- **`api/visualize`** — two-tier AI try-on. On the client's phone it's the
  payoff beat: recommendation lands as words on the glasses, as an image on
  her screen.
- **The Hair Growth Agent** — proactive rebook nudges from attested history.
  Maps directly to a "follow-up cue" the BA gets after the consult
  (*"shade match holds ~8 weeks — book the retouch"*).
- **Privacy posture** — photos processed locally, only hashes persisted.
  The PFA consent rule is already the product's stated rule.

## The glasses surface

The M6 display is monochrome green — text cards are its home turf, and this
design never needed color imagery on the glasses anyway. One consult card at
a time:

```
CONSULT ──────────────────────────
 Wardah Colorfit Lipstick · 03 Coral
 warm undertone match — office look
 sweep: center out, blur edges soft
```

- **Recommendation card** — product + shade + one-line reason (≤60 chars/line,
  3 lines max — waveguide budget).
- **Placement cue card** — the directive the BA executes: where, which
  direction, how much. Sticky until dismissed.
- **Follow-up cue** — post-consult nudge (retouch window, next visit) from
  the growth-agent logic.
- **Phase stamps** — `PFA → PICK → PLACE → DONE` so the BA always knows
  where in the consult she is.

## Pinned contract (consult card payload)

```
ConsultCard v1 (see lib/consult-cards.ts — makeCard factory, isConsultCard
boundary guard, isCardLive) = {
  id: string,               # stable identity (React keys + dismissal)
  version: 1,
  phase: "pfa" | "pick" | "place" | "done",
  headline: string,        # ≤ 60 chars — product + shade, or cue summary
  lines: string[],         # ≤ 3 lines, ≤ 60 chars each
  sticky: boolean,         # placement cues stick; recs auto-clear ~8s
  expiresAt: number | null # epoch ms; null = lives till phase advances
}

Phase A shipped (post-hackathon durability): lib/consult-session.ts
(advance/back/goTo/syncTo + useConsultSession w/ localStorage, Redis
helpers in lib/redis.ts) — /glasses runs on it, reload-safe, verified in
browser. lib/growth-cards.ts maps GrowthStatus → done-card;
useGrowthAgent.activeCard; GrowthNudge renders the card headline via the
shared components/consult-card-view.tsx (inline | waveguide variants).
StyleAdvisor's phaseForFlow now drives the shared machine via
syncSessionToPhase. POST /api/cards is the single mapping endpoint
(pfa.completed → 4 cards, retouch.due → 0-1 card; every card re-validated
with isConsultCard; verified live with curl).

PFA fixture (sample result, committed as `fixtures/pfa-sample.json`):
```json
{
  "face_shape": { "label": "Curved Thick", "description": "Fuller, rounded facial features with soft curves…" },
  "measurements": { "eye_width": 34.2, "eye_height": 12.1, "nose_length": 45.0, "nose_width": 36.8, "mouth_width": 52.4, "lips_thickness": 14.6 },
  "complexion": { "match": "#34W Warm Ivory", "one_tone_up": "#21W Pink Fair" },
  "placement": { "face_shape": "Oval", "highlight": "…", "contour": "…", "blush": "…" },
  "season": { "tone": "COOL", "season": "SUMMER" },
  "product": { "line": "Colorfit Velvet Matte Lip Mousse", "shade": "10 Lively Coral", "reason": "neutral coral, office look" }
}
```

Schema source: fetched live from `personalfaceanalysis.wardahbeauty.com`
(Sat Nov 21, Tavily research) — face-shape verdict + explanation, six
facial measurements, YOUR MATCH / ONE TONE UP shade codes, HIGHLIGHT /
CONTOUR / BLUSH placement zones, personal-color season, and a
"Wardah Colour Precision Intelligence · powered by PixieLab 2026"
product beat. No invented fields.

Verified product/shade names (judge-safe, same research pass):
- Complexion codes `#34W Warm Ivory` / `#21W Pink Fair` (number + undertone letter)
- *Colorfit Velvet Matte Lip Mousse* · **10 Lively Coral** (neutral coral) — do NOT use "03 Coral" (shade 03 verifies as mauve plum)
- Backup lip: *Colorfit Last All Day Lip Paint* 01–12 (mauvey/pink/tangerine/plum/berry-red)
- Base: *Instaperfect* 11 Fair Pink / 22 Light Ivory / 33 Warm Olive / 52 Almond
- Concern line: *Acnederm* (Spot Treatment Gel, Pure Foaming Cleanser, Pore Blackhead Balm)

Venue verification (5 min): run the PFA tool on the team's consented face,
replace the fixture's name/measurements/match code; confirm "10 Lively Coral"
is still current in the catalog.

## Hardware notes (confirmed Nov 21)

- **M6 is a full Android computer** (Android 9, Unisoc W527, 2GB) — APK
  sideload confirmed in the wild. Display is mono green waveguide, both eyes
  fed by one engine. On-device mic + camera + speakers; temple touch + voice
  input.
- **Companion app:** `MLVISION Secret Vision` — if it exposes a
  teleprompter/text push, consult cards ride it with zero SDK work. iOS
  notification mirroring is the second zero-build channel.
- **Dev environment:** macOS + iPhone only. `adb` works on Mac against the
  M6; prefer zero-build / SDK-push routes over writing an APK.
- SDK is private — distributed at the event. Confirm at the venue, in order:
  host-side push API → Secret Vision text push → notification mirroring →
  mic access → line width/font.

## Fallback ladder — every rung is a demo

1. Web recommend + visualize flow on the phone — works today (prior work,
   disclosed)
2. "Glasses preview" page (`/glasses`) — consult cards at waveguide size,
   mono green on black, driven from the committed PFA fixture via
   `lib/consult-cards.ts` (fixture → `ConsultCard[]` per the pinned
   contract). Phase stamps `PFA → PICK → PLACE → DONE` track the consult.
   Pure presentational rung: no camera, no SDK, no network past page load
3. M6 zero-build — scripted consult sequence via Secret Vision text push or
   iOS notification mirroring. No code, no SDK.
4. M6 scripted via SDK/APK — canned PFA→PICK→PLACE sequence pushed through
   the SDK or a sideloaded viewer reading canned JSON.
5. M6 live — real `api/recommend` output → card contract → glasses, advisor
   voice-drives the phase transitions.

Aim for rung 5. **Lock the rung at 1:00–1:15 PM for filming; wheels-up on
the form at 1:30.** Rung selection happens at the filming lock, not after.

1.5 Static-asset safety net — pre-generate before filming, carry offline:
try-on render as a plain image, the PFA fixture values, a screenshot of
`/glasses`. If the network dies mid-film, the two-person arc still plays
with static assets — nothing in the filmed arc should require a live
network call (especially `api/visualize` inference over venue wifi).

## Demo arc (three minutes, two people, filmed)

**Say:** "Beauty consults happen face to face — but the advisor keeps looking
down at a tablet. We put her notes in her eye, and her client's preview on the
phone."

1. **The result lands.** Sample PFA fixture loads on the phone (client side);
   `PFA` stamp and face-profile line appear on the glasses (advisor side).
2. **The pick.** Recommendation card on the glasses — product, shade, the
   one-line undertone reason. The advisor *says it to the client* while the
   card floats — she's reading her own notes, not a script.
3. **The place.** Placement cue card sticks — sweep direction, placement,
   edges. The advisor's hands mimic the motion on the client's face, eyes
   never leaving her.
4. **The close.** Try-on render lands on the client's phone; follow-up cue
   hits the glasses — *"shade holds ~8 weeks — book the retouch."*

**Solo fallback (60 seconds, rehearse once):** if the second person is
unavailable, one presenter plays the advisor — phone propped showing the
client view to camera, glasses/preview page on face, same four beats
compressed. Insurance against the most mundane failure mode there is.

## Persona and copy notes

- Wardah is a **halal beauty brand** and this track is **filmed** — voice is
  a professional Beauty Advisor: warm, precise, no snark. Do not port any
  existing persona voices.
- Product names in fixtures are real Wardah lines (Colorfit, Instaperfect,
  Acnederm) with verified shades — re-confirm the catalog at the venue before locking.
- Desired-look fixture should match what the PFA tool actually outputs —
  capture the real schema, don't invent one.

## Scoring read

| Criterion        | Read | Why                                                              |
| ---------------- | ---- | ---------------------------------------------------------------- |
| Understands you  | 2    | PFA result is literally a personal analysis — deepest possible   |
|                  |      | answer to this criterion                                          |
| Ergonomics       | 2    | Advisor's hands and eyes stay on the client — the scene is the   |
|                  |      | theme name                                                        |
| Works on glasses | 2    | Mono-green text cards are the display's native medium             |
| Adaptability     | 2    | Same consult state, two renderers: one card type, `inline` (web)  |
|                  |      | + `waveguide` (glasses) — new channels add a variant, not a map   |
| Impact & pitch   | 2    | Sponsor track, filmed, named-partner visibility                   |

Ceiling ~9–10 — the PFA brief and the glasses constraints line up unusually
well here.

**Two cases, priced honestly:**

- **With M6 (rung 3+):** ceiling holds, ~9–10. Ergonomics and Works-on-
  glasses are shown, not told.
- **Without hardware (rung 2):** realistic ceiling ~7–8. Pitch shifts to
  constraint-driven design: *"we designed to the waveguide budget —
  mono-green, 3 lines max, sticky cues — so the cards are push-ready the
  moment the SDK lands."* Constraint fluency still earns points from
  hardware judges even un-deployed. Write down which case you're in at the
  filming lock and pitch that case — don't pitch rung 5 while demoing
  rung 2.

## Day schedule (backwards from 2:00 PM ET)

- **On arrival:** open the Airtable form read-only — let its field list
  drive what you capture (video link format? repo URL? screenshots?). Then
  the 5-min venue verification (PFA run on a consented face, catalog
  re-confirm) — it determines card copy.
- **1:00–1:15:** lock the rung, film the arc (budget 3–4 takes for a
  two-person scene; get the teammate's explicit filming consent first — a
  text message counts — since footage may be shared with Wardah).
- **1:30:** wheels-up on the form. Assume the form fights you; the buffer
  is the deliverable.

## Risks

- **Fixture authenticity** — schema is sourced from the live tool, but the
  *values* must come from a consented team face run at the venue. If the
  site is down, the committed sample stands as the disclosed sample.
- **Product catalog accuracy** — card copy uses verified lines/shades only
  (10 Lively Coral, #34W codes, Instaperfect numbers above). Re-confirm at
  the venue; judges from Paragon will notice fakes.
- **Camera unknowns** — this demo needs no camera at all (fixture-driven),
  which is why it's lower-risk than a capture pipeline. Don't add one.
- **Scope** — attestation, barbers, commerce are all out of the demo. The
  surface is: PFA fixture → recommend → cards → try-on on phone.
- **Prior work** — disclose in the Airtable form; the delta is the consult
  card contract, the advisor/client two-surface flow, and the glasses surface.

## Mapping to existing docs

- [`PRODUCT_PLAN.md`](./PRODUCT_PLAN.md) — the tradeoff-metadata moat is the
  "why it suits" engine; this entry is that engine wearing glasses.
- [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) — consult cards inherit the
  restraint rules; mono green replaces the palette.
- [`USAGE_GUIDE.md`](./USAGE_GUIDE.md) — recommend → visualize flow is the
  phone-side half of the consult.
- `README.md` Privacy section — already the PFA consent posture; cite it.
