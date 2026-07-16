"use client"

import { useScrollProgress } from "@/lib/hooks/useScroll"
import { Reveal } from "@/components/ui/reveal"
import { StyleIllustration } from "@/components/ui/style-illustration"

export function Hero() {
  const { scrollY } = useScrollProgress()

  return (
    <section className="relative pt-32 pb-20 text-center overflow-hidden">
      {/* Hairstyle illustrations backdrop — large, semi-transparent, parallax */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate3d(0, ${scrollY * 0.12}px, 0)`,
          willChange: "transform",
        }}
      >
        {/* Left side — fade illustration */}
        <div
          className="absolute top-[15%] left-[5%] text-amber/15 hidden md:block"
          style={{ animation: "drift-1 25s ease-in-out infinite alternate" }}
        >
          <StyleIllustration category="fade" size={180} />
        </div>
        {/* Right side — afro illustration */}
        <div
          className="absolute top-[10%] right-[5%] text-gold/12 hidden md:block"
          style={{ animation: "drift-2 30s ease-in-out infinite alternate" }}
        >
          <StyleIllustration category="natural" size={200} />
        </div>
        {/* Bottom left — cornrows */}
        <div
          className="absolute bottom-[10%] left-[8%] text-burnt-orange/10 hidden lg:block"
          style={{ animation: "drift-3 28s ease-in-out infinite alternate" }}
        >
          <StyleIllustration category="braids" size={160} />
        </div>
        {/* Bottom right — locs */}
        <div
          className="absolute bottom-[15%] right-[8%] text-caramel/10 hidden lg:block"
          style={{ animation: "drift-4 22s ease-in-out infinite alternate" }}
        >
          <StyleIllustration category="locs" size={170} />
        </div>
        {/* Mid left — line up */}
        <div
          className="absolute top-[45%] left-[2%] text-amber/8 hidden xl:block"
          style={{ animation: "drift-1 35s ease-in-out infinite alternate-reverse" }}
        >
          <StyleIllustration category="detail" size={140} />
        </div>
        {/* Mid right — buzz cut */}
        <div
          className="absolute top-[50%] right-[2%] text-gold/8 hidden xl:block"
          style={{ animation: "drift-2 32s ease-in-out infinite alternate-reverse" }}
        >
          <StyleIllustration category="short" size={140} />
        </div>
      </div>

      {/* Parallax decorative layer — warm orbs */}
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

      {/* Tagline — warm, human, staggered entrance */}
      <div className="relative z-10 mb-10 flex justify-center gap-3 text-[11px] tracking-wide opacity-50 animate-enter-fade">
        <span>For Black men</span>
        <span className="w-1 h-1 bg-amber/60 rounded-full self-center" />
        <span>Powered by AI</span>
        <span className="w-1 h-1 bg-amber/60 rounded-full self-center" />
        <span>Verified onchain</span>
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
      <Reveal direction="up" delay={200} className="relative z-10 max-w-xl mx-auto mb-6">
        <p className="text-base tracking-normal opacity-75 leading-relaxed font-display italic">
          An agentic style advisor for Black men. Upload a photo, describe your
          lifestyle, and get ranked recommendations with real tradeoffs —
          maintenance, cost, comfort, climate fit.
        </p>
      </Reveal>

      {/* Cultural homage — real hairstyle names as a subtle marquee */}
      <Reveal direction="fade" delay={300} className="relative z-10 max-w-2xl mx-auto mb-8">
        <p className="text-[11px] tracking-[0.2em] uppercase opacity-30 leading-relaxed">
          Skin Fade · Box Braids · Cornrows · Dread Locs · 360 Waves ·
          Afro · Shape Up · High Top Fade · Two-Strand Twists · Slick Back
        </p>
      </Reveal>

      {/* Soft CTA hint */}
      <Reveal direction="fade" delay={400} className="relative z-10 max-w-2xl mx-auto mb-12">
        <p className="text-xs tracking-wide opacity-40 leading-relaxed font-display italic">
          34 styles · real tradeoffs · see them on your face
        </p>
      </Reveal>

      {/* Barbershop stripe + cornrow pattern — cultural motifs */}
      <div className="relative z-10 max-w-xs mx-auto space-y-1.5">
        <div className="barbershop-divider" />
        <div className="cornrow-pattern" />
      </div>

      {/* Corner Markers — warm tone */}
      <div className="absolute top-24 left-8 w-8 h-8 border-l border-t border-amber/20" />
      <div className="absolute top-24 right-8 w-8 h-8 border-r border-t border-amber/20" />
      <div className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-amber/20" />
      <div className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-amber/20" />
    </section>
  )
}
