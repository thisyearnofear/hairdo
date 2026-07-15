"use client"

export function Hero() {
  return (
    <section className="relative pt-32 pb-16 text-center overflow-hidden">
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 99px, #fff 99px, #fff 100px), repeating-linear-gradient(90deg, transparent, transparent 99px, #fff 99px, #fff 100px)",
          }}
        />
      </div>

      {/* Meta Info Top */}
      <div className="relative z-10 mb-12 flex justify-center gap-8 text-[10px] tracking-wider uppercase opacity-60">
        <span>STYLE_INTELLIGENCE</span>
        <span>LISK_L2</span>
        <span>v2.0</span>
      </div>

      {/* Main Title */}
      <div className="relative z-10 mb-8">
        <h1
          className="text-[clamp(3rem,12vw,8rem)] font-bold leading-none tracking-tighter mb-4"
          style={{
            fontFamily: "var(--font-sans)",
            letterSpacing: "-0.05em",
          }}
        >
          HAIRDO
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm tracking-widest uppercase opacity-80">
          <span>DISCOVER</span>
          <span className="w-1 h-1 bg-current rounded-full" />
          <span>VISUALIZE</span>
          <span className="w-1 h-1 bg-current rounded-full" />
          <span>ATTEST</span>
        </div>
      </div>

      {/* Subtitle */}
      <div className="relative z-10 max-w-2xl mx-auto mb-8">
        <p className="text-sm tracking-wide opacity-70 leading-relaxed">
          An agentic style advisor for Black men. Upload a photo, describe your
          lifestyle, and get ranked recommendations with real tradeoffs —
          maintenance, cost, comfort, climate fit.
        </p>
      </div>

      {/* Technical Descriptor */}
      <div className="relative z-10 max-w-2xl mx-auto mb-16">
        <p className="text-xs tracking-wider uppercase opacity-50 leading-relaxed">
          34_STYLES // TRADEOFF_DATABASE // REPLICATE_ENGINE // LISK_1135
        </p>
      </div>

      {/* Corner Markers */}
      <div className="absolute top-24 left-8 w-8 h-8 border-l border-t border-white/20" />
      <div className="absolute top-24 right-8 w-8 h-8 border-r border-t border-white/20" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-white/20" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-white/20" />
    </section>
  )
}
