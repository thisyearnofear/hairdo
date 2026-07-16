"use client"

export function Hero() {
  return (
    <section className="relative pt-32 pb-16 text-center overflow-hidden">
      {/* Technical Grid Overlay — subtle */}
      <div className="absolute inset-0 opacity-[0.04]">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 99px, #fff 99px, #fff 100px), repeating-linear-gradient(90deg, transparent, transparent 99px, #fff 99px, #fff 100px)",
          }}
        />
      </div>

      {/* Meta Info Top — staggered entrance, kept technical */}
      <div className="relative z-10 mb-10 flex justify-center gap-6 text-[10px] tracking-wider uppercase opacity-50">
        <span className="animate-enter-fade" style={{ animationDelay: "0ms" }}>Style Intelligence</span>
        <span className="w-px h-3 bg-white/30" />
        <span className="animate-enter-fade" style={{ animationDelay: "60ms" }}>Lisk L2</span>
        <span className="w-px h-3 bg-white/30" />
        <span className="animate-enter-fade" style={{ animationDelay: "120ms" }}>v2.0</span>
      </div>

      {/* Main Title — warm display serif */}
      <div className="relative z-10 mb-6">
        <h1
          className="text-[clamp(3.5rem,14vw,9rem)] font-bold leading-[0.9] tracking-tighter mb-4 animate-enter-scale font-display"
          style={{
            letterSpacing: "-0.04em",
          }}
        >
          HAIRDO
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm tracking-wide opacity-70 animate-enter-up" style={{ animationDelay: "100ms" }}>
          <span>Discover</span>
          <span className="w-1 h-1 bg-current rounded-full opacity-50" />
          <span>Visualize</span>
          <span className="w-1 h-1 bg-current rounded-full opacity-50" />
          <span>Attest</span>
        </div>
      </div>

      {/* Subtitle — warm, human, sentence case */}
      <div className="relative z-10 max-w-xl mx-auto mb-8">
        <p className="text-base tracking-normal opacity-75 leading-relaxed animate-enter-up font-display italic" style={{ animationDelay: "200ms" }}>
          An agentic style advisor for Black men. Upload a photo, describe your
          lifestyle, and get ranked recommendations with real tradeoffs —
          maintenance, cost, comfort, climate fit.
        </p>
      </div>

      {/* Technical Descriptor — kept as meta label */}
      <div className="relative z-10 max-w-2xl mx-auto mb-16">
        <p className="text-[10px] tracking-wider uppercase opacity-40 leading-relaxed animate-enter-fade" style={{ animationDelay: "300ms" }}>
          34 styles · tradeoff database · Replicate engine · Lisk 1135
        </p>
      </div>

      {/* Corner Markers — subtle warm tone */}
      <div className="absolute top-24 left-8 w-8 h-8 border-l border-t border-amber/20" />
      <div className="absolute top-24 right-8 w-8 h-8 border-r border-t border-amber/20" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-amber/20" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-amber/20" />
    </section>
  )
}
