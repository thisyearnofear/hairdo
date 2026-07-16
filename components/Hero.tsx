"use client"

import { useScrollProgress } from "@/lib/hooks/useScroll"
import { Reveal } from "@/components/ui/reveal"

export function Hero() {
  const { scrollY } = useScrollProgress()

  return (
    <section className="relative pt-32 pb-20 text-center overflow-hidden">
      {/* Parallax decorative layer — subtle geometric shapes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate3d(0, ${scrollY * 0.15}px, 0)`,
          willChange: "transform",
        }}
      >
        {/* Floating warm orbs — decorative depth */}
        <div
          className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(38 70% 55%) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full opacity-15"
          style={{
            background: "radial-gradient(circle, hsl(18 55% 42%) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* Meta Info Top — staggered entrance */}
      <div className="relative z-10 mb-10 flex justify-center gap-6 text-[10px] tracking-wider uppercase opacity-50">
        <span className="animate-enter-fade" style={{ animationDelay: "0ms" }}>Style Intelligence</span>
        <span className="w-px h-3 bg-white/30" />
        <span className="animate-enter-fade" style={{ animationDelay: "60ms" }}>Lisk L2</span>
        <span className="w-px h-3 bg-white/30" />
        <span className="animate-enter-fade" style={{ animationDelay: "120ms" }}>v2.0</span>
      </div>

      {/* Main Title — dramatic gradient typography, parallax */}
      <div
        className="relative z-10 mb-6"
        style={{
          transform: `translate3d(0, ${scrollY * -0.05}px, 0)`,
          willChange: "transform",
        }}
      >
        <h1
          className="text-[clamp(4rem,16vw,11rem)] font-bold leading-[0.85] tracking-tighter mb-4 animate-enter-scale font-display text-gradient-warm"
          style={{
            letterSpacing: "-0.045em",
          }}
        >
          HAIRDO
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm tracking-wide opacity-70 animate-enter-up" style={{ animationDelay: "100ms" }}>
          <span>Discover</span>
          <span className="w-1 h-1 bg-gold/60 rounded-full" />
          <span>Visualize</span>
          <span className="w-1 h-1 bg-gold/60 rounded-full" />
          <span>Attest</span>
        </div>
      </div>

      {/* Subtitle — warm, human, italic display serif */}
      <Reveal direction="up" delay={200} className="relative z-10 max-w-xl mx-auto mb-8">
        <p className="text-base tracking-normal opacity-75 leading-relaxed font-display italic">
          An agentic style advisor for Black men. Upload a photo, describe your
          lifestyle, and get ranked recommendations with real tradeoffs —
          maintenance, cost, comfort, climate fit.
        </p>
      </Reveal>

      {/* Technical Descriptor — kept as meta label */}
      <Reveal direction="fade" delay={300} className="relative z-10 max-w-2xl mx-auto mb-16">
        <p className="text-[10px] tracking-wider uppercase opacity-40 leading-relaxed">
          34 styles · tradeoff database · Replicate engine · Lisk 1135
        </p>
      </Reveal>

      {/* Barbershop stripe divider — cultural motif */}
      <div className="relative z-10 max-w-xs mx-auto barbershop-divider" />

      {/* Corner Markers — warm tone */}
      <div className="absolute top-24 left-8 w-8 h-8 border-l border-t border-amber/20" />
      <div className="absolute top-24 right-8 w-8 h-8 border-r border-t border-amber/20" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-amber/20" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-amber/20" />
    </section>
  )
}
