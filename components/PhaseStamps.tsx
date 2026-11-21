"use client";

export type ConsultPhase = "pfa" | "pick" | "place" | "done";

const PHASES: { id: ConsultPhase; label: string }[] = [
  { id: "pfa", label: "Profile" },
  { id: "pick", label: "Pick" },
  { id: "place", label: "Place" },
  { id: "done", label: "Done" },
];

/** PFA → PICK → PLACE → DONE. Advisor always knows where the consult is. */
export function PhaseStamps({
  phase,
  compact = false,
}: {
  phase: ConsultPhase;
  compact?: boolean;
}) {
  const activeIdx = PHASES.findIndex((p) => p.id === phase);
  return (
    <div
      key={phase}
      className={`phase-wipe flex items-center gap-2 ${compact ? "text-[10px]" : "text-[11px]"} tracking-[0.18em] uppercase`}
      aria-label={`Consult phase: ${phase}`}
    >
      {PHASES.map((p, i) => {
        const active = i === activeIdx;
        const done = i < activeIdx;
        return (
          <span key={p.id} className="flex items-center gap-2">
            <span
              className={`px-2 py-1 rounded-full border transition-colors ${
                active
                  ? "border-amber/60 text-amber bg-amber/10"
                  : done
                    ? "border-white/20 text-white/70"
                    : "border-white/10 text-white/30"
              }`}
            >
              {p.label}
            </span>
            {i < PHASES.length - 1 && (
              <span className="w-4 h-px bg-white/15" aria-hidden />
            )}
          </span>
        );
      })}
    </div>
  );
}

export function phaseForFlow(opts: {
  hasImage: boolean;
  hasRecs: boolean;
  hasVisual: boolean;
  hasCut: boolean;
}): ConsultPhase {
  if (opts.hasCut) return "done";
  if (opts.hasVisual) return "place";
  if (opts.hasRecs) return "pick";
  return "pfa";
}
