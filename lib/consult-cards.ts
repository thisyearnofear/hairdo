import sample from "@/fixtures/pfa-sample.json";

/**
 * Rung-2 consult-card contract for the Worn glasses surface.
 * Fixture (PFA sample) → ordered ConsultCards, one per consult phase.
 * Waveguide budget enforced here: headline + each line ≤ 60 chars,
 * max 3 lines per card. Mono-green presentation lives in /glasses.
 */

export type ConsultPhase = "pfa" | "pick" | "place" | "done";

export interface ConsultCard {
  phase: ConsultPhase;
  headline: string;
  lines: string[];
  sticky: boolean;
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

/** Map a PFA result to the four consult cards (PFA → PICK → PLACE → DONE). */
export function pfaToConsultCards(pfa: PfaSample): ConsultCard[] {
  const raw: Array<{
    phase: ConsultPhase;
    headline: string;
    lines: string[];
    sticky: boolean;
  }> = [
    {
      phase: "pfa",
      headline: `${pfa.placement.face_shape} · ${pfa.complexion.match}`,
      lines: [
        `${pfa.face_shape.label} — ${pfa.season.tone} ${pfa.season.season}`,
        `match ${pfa.complexion.match}, up ${pfa.complexion.one_tone_up}`,
      ],
      sticky: false,
    },
    {
      phase: "pick",
      headline: `${shortLine(pfa.product.line)} · ${pfa.product.shade}`,
      lines: [pfa.product.reason, `for ${pfa.client_name}'s ${pfa.placement.face_shape.toLowerCase()} face`],
      sticky: false,
    },
    {
      phase: "place",
      headline: "sweep center-out, blur edges",
      lines: [
        `highlight: ${pfa.placement.highlight}`,
        `contour: ${pfa.placement.contour}`,
        `blush: ${pfa.placement.blush}`,
      ],
      sticky: true,
    },
    {
      phase: "done",
      headline: pfa.follow_up.cue,
      lines: [`retouch in ~${pfa.follow_up.retouch_weeks} weeks`],
      sticky: false,
    },
  ];
  return raw.map((c) => ({
    ...c,
    headline: clip(c.headline),
    lines: c.lines.slice(0, 3).map(clip),
  }));
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
