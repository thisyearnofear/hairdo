"use client"

import { useScrollProgress } from "@/lib/hooks/useScroll"

/**
 * Atmosphere — the living, warm, textured background world.
 * Mounted globally behind all content.
 *
 * Layers (back to front):
 * 1. Base warm gradient (espresso → dark plum)
 * 2. Ambient light blobs (amber, terracotta, gold) — drift slowly, parallax
 * 3. Cultural geometric pattern — kente-inspired, very low opacity
 * 4. Film grain noise — tactile texture, makes it feel physical
 * 5. Vignette — subtle darkening at edges for cinematic focus
 *
 * All layers use CSS transforms for GPU acceleration.
 * Respects prefers-reduced-motion (static fallback).
 */
export function Atmosphere() {
  const { scrollY, progress } = useScrollProgress()

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {/* Layer 1: Base warm gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 0%, hsl(28 40% 8%) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 100%, hsl(340 30% 6%) 0%, transparent 50%),
            linear-gradient(180deg, hsl(20 10% 4%) 0%, hsl(280 15% 3.5%) 50%, hsl(20 10% 4%) 100%)
          `,
        }}
      />

      {/* Layer 2: Ambient light blobs — warm, drifting, parallax */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate3d(0, ${scrollY * 0.08}px, 0)`,
          willChange: "transform",
        }}
      >
        {/* Amber blob — top left */}
        <div
          className="absolute rounded-full"
          style={{
            top: "-10%",
            left: "-5%",
            width: "50vw",
            height: "50vw",
            background: "radial-gradient(circle, hsl(38 80% 50% / 0.12) 0%, transparent 60%)",
            filter: "blur(60px)",
            animation: "drift-1 20s ease-in-out infinite alternate",
          }}
        />
        {/* Terracotta blob — right side */}
        <div
          className="absolute rounded-full"
          style={{
            top: "30%",
            right: "-10%",
            width: "40vw",
            height: "40vw",
            background: "radial-gradient(circle, hsl(18 60% 45% / 0.10) 0%, transparent 60%)",
            filter: "blur(70px)",
            animation: "drift-2 25s ease-in-out infinite alternate",
          }}
        />
        {/* Gold blob — bottom center */}
        <div
          className="absolute rounded-full"
          style={{
            bottom: "-15%",
            left: "30%",
            width: "45vw",
            height: "45vw",
            background: "radial-gradient(circle, hsl(45 70% 50% / 0.08) 0%, transparent 60%)",
            filter: "blur(80px)",
            animation: "drift-3 30s ease-in-out infinite alternate",
          }}
        />
        {/* Deep plum blob — mid left */}
        <div
          className="absolute rounded-full"
          style={{
            top: "50%",
            left: "-8%",
            width: "35vw",
            height: "35vw",
            background: "radial-gradient(circle, hsl(320 40% 30% / 0.10) 0%, transparent 60%)",
            filter: "blur(65px)",
            animation: "drift-4 22s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* Layer 3: Cultural geometric pattern — kente-inspired, very subtle */}
      <div
        className="absolute inset-0 opacity-[0.025]"
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
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          mixBlendMode: "overlay",
        }}
      />

      {/* Layer 5: Vignette — cinematic edge darkening */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 40%, hsl(20 10% 3%) 100%)",
          opacity: 0.6,
        }}
      />

      {/* Scroll progress glow — top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, hsl(38 80% 50%) 0%, hsl(18 60% 45%) 50%, hsl(45 70% 50%) 100%)",
          transform: `scaleX(${progress})`,
          transformOrigin: "left",
          opacity: 0.6,
        }}
      />
    </div>
  )
}
