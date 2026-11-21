import type { ConsultCard } from "@/lib/consult-cards";

/**
 * ConsultCardView — the single renderer for ConsultCards.
 * - `inline`: web surfaces that own their layout (GrowthNudge keeps its
 *   stats row + CTA; the card supplies the voice, i.e. the headline).
 * - `waveguide`: full card for constrained displays (/glasses) —
 *   headline + lines + sticky badge.
 * New channels add a variant here; nobody re-maps card fields per surface.
 */
export function ConsultCardView({
  card,
  fallback,
  variant,
}: {
  card: ConsultCard | null;
  /** Shown when card is null (e.g. pre-card legacy copy). */
  fallback?: string | null;
  variant: "inline" | "waveguide";
}) {
  const headline = card?.headline ?? fallback;
  if (!headline) return null;

  if (variant === "inline") {
    return (
      <p className="text-sm font-display leading-relaxed">{headline}</p>
    );
  }

  if (!card) return null;
  return (
    <div className="mt-6 border border-[#4dff6a]/50 rounded-sm p-5 min-h-44">
      <p className="text-lg leading-snug font-bold">{card.headline}</p>
      <div className="mt-3 space-y-1.5">
        {card.lines.map((line) => (
          <p key={line} className="text-sm leading-snug opacity-90">
            {line}
          </p>
        ))}
      </div>
      {card.sticky && (
        <p className="mt-4 text-[10px] tracking-[0.2em] uppercase border border-[#4dff6a]/60 inline-block px-2 py-0.5">
          Sticky until dismissed
        </p>
      )}
    </div>
  );
}
