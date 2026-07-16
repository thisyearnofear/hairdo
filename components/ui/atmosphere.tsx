"use client"

import { useScrollProgress } from "@/lib/hooks/useScroll"

/**
 * Atmosphere — the living, warm, textured background world.
 * Mounted globally behind all content.
 *
 * Layers (back to front):
 * 1. Base warm gradient (espresso → deep plum → warm dark)
 * 2. Ambient light blobs (amber, terracotta, gold, plum) — drift slowly, parallax
 * 3. Cultural geometric pattern — kente-inspired
 * 4. Film grain noise — tactile texture
 * 5. Vignette — subtle darkening at edges for cinematic focus
 *
 * All layers use CSS transforms for GPU acceleration.
 * Respects prefers-reduced-motion (static fallback).
 */
export function Atmosphere() {
  const { scrollY, progress } = useScrollProgress()

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Layer 1: Base warm gradient — rich espresso/plum, NOT black */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 0%, hsl(28 45% 12%) 0%, transparent 60%),
            radial-gradient(ellipse 70% 50% at 80% 100%, hsl(340 35% 10%) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 50% 50%, hsl(35 30% 8%) 0%, transparent 70%),
            linear-gradient(180deg, hsl(25 20% 7%) 0%, hsl(300 20% 6%) 50%, hsl(25 20% 7%) 100%)
          `,
        }}
      />

      {/* Layer 2: Ambient light blobs — warm, vibrant, drifting, parallax */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(0, ${scrollY * 0.08}px, 0)`,
          willChange: "transform",
        }}
      >
        {/* Amber blob — top left, large and warm */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-15%",
            left: "-10%",
            width: "60vw",
            height: "60vw",
            background: "radial-gradient(circle, hsl(38 85% 50% / 0.35) 0%, hsl(38 80% 45% / 0.15) 30%, transparent 65%)",
            filter: "blur(50px)",
            animation: "drift-1 20s ease-in-out infinite alternate",
          }}
        />
        {/* Terracotta blob — right side, rich and earthy */}
        <div
          className="absolute rounded-full"
          style={{
            top: "20%",
            right: "-15%",
            width: "50vw",
            height: "50vw",
            background: "radial-gradient(circle, hsl(18 70% 45% / 0.30) 0%, hsl(18 60% 40% / 0.12) 30%, transparent 65%)",
            filter: "blur(55px)",
            animation: "drift-2 25s ease-in-out infinite alternate",
          }}
        />
        {/* Gold blob — bottom center, warm glow */}
        <div
          className="absolute rounded-full"
          style={{
            bottom: "-20%",
            left: "25%",
            width: "55vw",
            height: "55vw",
            background: "radial-gradient(circle, hsl(45 80% 50% / 0.25) 0%, hsl(42 70% 45% / 0.10) 30%, transparent 65%)",
            filter: "blur(60px)",
            animation: "drift-3 30s ease-in-out infinite alternate",
          }}
        />
        {/* Deep plum blob — mid left, adds richness */}
        <div
          className="absolute rounded-full"
          style={{
            top: "45%",
            left: "-12%",
            width: "45vw",
            height: "45vw",
            background: "radial-gradient(circle, hsl(320 45% 35% / 0.25) 0%, hsl(320 35% 28% / 0.10) 30%, transparent 65%)",
            filter: "blur(50px)",
            animation: "drift-4 22s ease-in-out infinite alternate",
          }}
        />
        {/* Caramel blob — top right, warm highlight */}
        <div
          className="absolute rounded-full"
          style={{
            top: "5%",
            right: "10%",
            width: "35vw",
            height: "35vw",
            background: "radial-gradient(circle, hsl(32 60% 48% / 0.20) 0%, transparent 60%)",
            filter: "blur(45px)",
            animation: "drift-1 28s ease-in-out infinite alternate-reverse",
          }}
        />
      </div>

      {/* Layer 3: Cultural geometric pattern — kente-inspired crosshatch */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          transform: `translate3d(0, ${scrollY * 0.04}px, 0)`,
          willChange: "transform",
          backgroundImage: `
            repeating-linear-gradient(45deg, transparent, transparent 20px, hsl(38 70% 55%) 20px, hsl(38 70% 55%) 22px, transparent 22px, transparent 40px, hsl(18 55% 42%) 40px, hsl(18 55% 42%) 42px),
            repeating-linear-gradient(-45deg, transparent, transparent 30px, hsl(45 70% 50%) 30px, hsl(45 70% 50%) 32px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Layer 4: Film grain — tactile noise texture */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          mixBlendMode: "overlay",
        }}
      />

      {/* Layer 5: Vignette — gentle cinematic edge darkening */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 50%, hsl(25 20% 4%) 100%)",
          opacity: 0.4,
        }}
      />

      {/* Scroll progress glow — top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: "linear-gradient(90deg, hsl(38 85% 55%) 0%, hsl(18 70% 50%) 50%, hsl(45 80% 55%) 100%)",
          transform: `scaleX(${progress})`,
          transformOrigin: "left",
          opacity: 0.8,
          boxShadow: "0 0 8px hsl(38 80% 50% / 0.5)",
        }}
      />
    </div>
  )
}
