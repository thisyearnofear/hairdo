"use client";

import { useEffect } from "react";
import {
  PHASE_LABEL,
  PHASE_ORDER,
  getSampleCards,
} from "@/lib/consult-cards";
import { useConsultSession } from "@/lib/consult-session";
import { ConsultCardView } from "@/components/consult-card-view";

/**
 * Rung-2 glasses preview — what the Beauty Advisor sees on the M6.
 * Monochrome green on black, one consult card at a time, driven from the
 * committed PFA fixture. Advisor voice-drives phase transitions (buttons +
 * arrow keys); placement cues stick until dismissed. No camera, no SDK, no
 * network past page load — this rung demos even if the venue falls over.
 */
// Fixture is static — compute once, outside the component.
const CARDS = getSampleCards();

export default function GlassesPage() {
  // Session persists across reload under consult:glasses:aura-sample —
  // the advisor picks up exactly where the consult left off.
  const { phase, advance, back } = useConsultSession(
    PHASE_ORDER,
    "glasses",
    "aura-sample"
  );
  const idx = PHASE_ORDER.indexOf(phase);
  const card = CARDS[idx];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") advance();
      if (e.key === "ArrowLeft") back();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  return (
    <main className="min-h-screen bg-black text-[#4dff6a] font-mono flex flex-col items-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between text-xs tracking-[0.2em] uppercase opacity-80">
          <span>Consult</span>
          <span>Aura · sample</span>
        </div>
        <div className="mt-1 h-px bg-[#4dff6a]/30" />

        {/* Phase stamps */}
        <div
          className="mt-4 flex items-center gap-2 text-[11px] tracking-[0.18em]"
          aria-label={`Consult phase: ${card.phase}`}
        >
          {PHASE_ORDER.map((p, i) => {
            const active = i === idx;
            const done = i < idx;
            return (
              <span key={p} className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-sm border ${
                    active
                      ? "border-[#4dff6a] bg-[#4dff6a]/15"
                      : done
                        ? "border-[#4dff6a]/40 opacity-70"
                        : "border-[#4dff6a]/20 opacity-40"
                  }`}
                >
                  {PHASE_LABEL[p]}
                </span>
                {i < PHASE_ORDER.length - 1 && (
                  <span className="w-4 h-px bg-[#4dff6a]/30" aria-hidden />
                )}
              </span>
            );
          })}
        </div>

        {/* Consult card */}
        <div key={card.phase}>
          <ConsultCardView card={card} variant="waveguide" />
        </div>

        {/* Controls */}
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={back}
            disabled={idx === 0}
            className="px-4 py-2 border border-[#4dff6a]/50 rounded-sm text-sm tracking-widest uppercase disabled:opacity-30"
          >
            ◀ Back
          </button>
          <span className="text-[11px] opacity-60">
            {idx + 1} / {CARDS.length}
          </span>
          <button
            onClick={advance}
            disabled={idx === CARDS.length - 1}
            className="px-4 py-2 border border-[#4dff6a] bg-[#4dff6a]/10 rounded-sm text-sm tracking-widest uppercase disabled:opacity-30"
          >
            Next ▶
          </button>
        </div>
        <p className="mt-4 text-[10px] opacity-50 tracking-wide">
          Advisor-driven — arrow keys work too. Placement cues stick; recs
          clear as the consult moves on.
        </p>
      </div>
    </main>
  );
}
