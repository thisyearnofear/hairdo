import sample from "@/fixtures/pfa-sample.json";

/**
 * Consult-card contract — the cross-surface voice of a consult.
 * Fixture (PFA sample) → ordered ConsultCards, one per consult phase.
 * Waveguide budget enforced here: headline + each line ≤ 60 chars,
 * max 3 lines per card. Presentation lives per surface (/glasses,
 * GrowthNudge, future channels) — all consume this type, never raw copy.
 *
 * v1 fields:
 * - id: stable identity for React keys + dismissal (deterministic per source)
 * - version: schema version, checked by isConsultCard at every boundary
 * - expiresAt: epoch ms, or null = lives until the phase advances / dismissed.
 *   Placement cues stick (null); recs carry REC_TTL_MS. Enforcement is the
 *   renderer's job — see isCardLive.
 */

export const CARD_SCHEMA_VERSION = 1;

/** Suggested time-to-live for non-sticky rec cards (~8s glance window). */
export const REC_TTL_MS = 8_000;

export type ConsultPhase = "pfa" | "pick" | "place" | "done";

export interface ConsultCard {
  id: string;
  version: typeof CARD_SCHEMA_VERSION;
  phase: ConsultPhase;
  headline: string;
  lines: string[];
  sticky: boolean;
  expiresAt: number | null;
}

export interface PfaSample {
  client_name: string;
  face_shape: { label: string; description: string };
  measurements: Record<string, number>;
  complexion: { match: string; one_tone_up: string };
  placement: { face_shape: string; highlight: string; contour: string; blush: string };
  season: { tone: string; season: string };
  product: { line: string; shade: string; reason: string };
  follow_up: { cue: string; retouch_weeks: number };
}

const MAX = 60;

function clip(s: string): string {
  return s.length <= MAX ? s : s.slice(0, MAX - 1) + "…";
}

export interface MakeCardOptions {
  id?: string;
  sticky?: boolean;
  /** Epoch ms; null = persists until phase advances / dismissed. */
  expiresAt?: number | null;
  /** Shorthand: expiresAt = now + ttlMs (ignored when sticky unless overridden). */
  ttlMs?: number;
  now?: number;
}

/** Single factory — every card in the app is born here, budget enforced. */
export function makeCard(
  phase: ConsultPhase,
  headline: string,
  lines: string[],
  opts: MakeCardOptions = {}
): ConsultCard {
  const now = opts.now ?? Date.now();
  const sticky = opts.sticky ?? false;
  return {
    id: opts.id ?? `${phase}-${now.toString(36)}`,
    version: CARD_SCHEMA_VERSION,
    phase,
    headline: clip(headline),
    lines: lines.slice(0, 3).map(clip),
    sticky,
    expiresAt:
      opts.expiresAt !== undefined
        ? opts.expiresAt
        : sticky
          ? null
          : now + (opts.ttlMs ?? REC_TTL_MS),
  };
}

const PHASES: readonly string[] = ["pfa", "pick", "place", "done"];

/** Boundary guard — validate unknown input (API, storage, postMessage). */
export function isConsultCard(v: unknown): v is ConsultCard {
  if (typeof v !== "object" || v === null) return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    c.id.length > 0 &&
    c.version === CARD_SCHEMA_VERSION &&
    typeof c.phase === "string" &&
    PHASES.includes(c.phase) &&
    typeof c.headline === "string" &&
    c.headline.length > 0 &&
    c.headline.length <= MAX &&
    Array.isArray(c.lines) &&
    c.lines.length <= 3 &&
    c.lines.every((l) => typeof l === "string" && l.length <= MAX) &&
    typeof c.sticky === "boolean" &&
    (c.expiresAt === null || typeof c.expiresAt === "number")
  );
}

/** A card is live while unexpired (sticky cards never expire on their own). */
export function isCardLive(card: ConsultCard, now: number = Date.now()): boolean {
  return card.expiresAt === null || now < card.expiresAt;
}

/** Map a PFA result to the four consult cards (PFA → PICK → PLACE → DONE). */
export function pfaToConsultCards(pfa: PfaSample): ConsultCard[] {
  return [
    makeCard(
      "pfa",
      `${pfa.placement.face_shape} · ${pfa.complexion.match}`,
      [
        `${pfa.face_shape.label} — ${pfa.season.tone} ${pfa.season.season}`,
        `match ${pfa.complexion.match}, up ${pfa.complexion.one_tone_up}`,
      ],
      { id: "pfa-sample:pfa" }
    ),
    makeCard(
      "pick",
      `${shortLine(pfa.product.line)} · ${pfa.product.shade}`,
      [
        pfa.product.reason,
        `for ${pfa.client_name}'s ${pfa.placement.face_shape.toLowerCase()} face`,
      ],
      { id: "pfa-sample:pick" }
    ),
    makeCard(
      "place",
      "sweep center-out, blur edges",
      [
        `highlight: ${pfa.placement.highlight}`,
        `contour: ${pfa.placement.contour}`,
        `blush: ${pfa.placement.blush}`,
      ],
      { id: "pfa-sample:place", sticky: true }
    ),
    makeCard(
      "done",
      pfa.follow_up.cue,
      [`retouch in ~${pfa.follow_up.retouch_weeks} weeks`],
      { id: "pfa-sample:done" }
    ),
  ];
}

function shortLine(line: string): string {
  return line
    .replace("Colorfit Velvet Matte Lip Mousse", "Colorfit Lip Mousse")
    .replace("Colorfit Last All Day Lip Paint", "Colorfit Lip Paint");
}

/** The committed venue-replaceable sample. */
export function getSampleCards(): ConsultCard[] {
  return pfaToConsultCards(sample as PfaSample);
}

export const PHASE_ORDER: ConsultPhase[] = ["pfa", "pick", "place", "done"];

export const PHASE_LABEL: Record<ConsultPhase, string> = {
  pfa: "PFA",
  pick: "PICK",
  place: "PLACE",
  done: "DONE",
};
