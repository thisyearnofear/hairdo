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
ConsultCard = {
  phase: "pfa" | "pick" | "place" | "done",
  headline: string,        # ≤ 60 chars — product + shade, or cue summary
  lines: string[],         # ≤ 3 lines, ≤ 60 chars each
  sticky: boolean          # placement cues stick; recs auto-clear ~8s
}

PFA fixture (sample result, committed):
  { undertone, skin_tone, face_shape, concerns: string[], desired_look }
```

The seed is a **sample PFA result captured by running
`personalfaceanalysis.wardahbeauty.com` on our own face** — consented, real,
and exactly what the brief asks for. Commit it as
`fixtures/pfa-sample.json` the way other fixtures are committed.

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
2. "Glasses preview" page — consult cards at waveguide size, mono green on
   black, driven from the committed PFA fixture
3. M6 zero-build — scripted consult sequence via Secret Vision text push or
   iOS notification mirroring. No code, no SDK.
4. M6 scripted via SDK/APK — canned PFA→PICK→PLACE sequence pushed through
   the SDK or a sideloaded viewer reading canned JSON.
5. M6 live — real `api/recommend` output → card contract → glasses, advisor
   voice-drives the phase transitions.

Aim for rung 5. Ship whatever the top working rung is at 1:30 PM.

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

## Persona and copy notes

- Wardah is a **halal beauty brand** and this track is **filmed** — voice is
  a professional Beauty Advisor: warm, precise, no snark. Do not port any
  existing persona voices.
- Product names in fixtures should be real Wardah lines (Colorfit, Instaperfect,
  Acnederm) — check the current catalog before locking fixture copy.
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
| Adaptability     | 1–2  | Two-surface consult: cue on glasses, visual on phone              |
| Impact & pitch   | 2    | Sponsor track, filmed, named-partner visibility                   |

Ceiling ~9–10 — the PFA brief and the glasses constraints line up unusually
well here.

## Risks

- **Fixture authenticity** — the demo hinges on a real PFA result. Run the
  tool on a consented team face first thing; if the site is down, capture
  whatever schema it shows and build the fixture to match.
- **Product catalog accuracy** — recommendations must name real Wardah SKUs
  or judges from Paragon will notice. Verify against the live catalog.
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
