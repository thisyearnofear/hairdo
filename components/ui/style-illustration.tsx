/**
 * Style category illustrations — detailed, recognizable SVG representations
 * of real iconic Black hairstyles.
 *
 * Categories: fade, short, medium, natural, braids, locs, edgy, detail
 * Each renders a front-facing head with the characteristic style.
 *
 * References:
 * - Fade: gradient from skin to hair on sides
 * - Cornrows: geometric parting lines with raised braid texture
 * - Afro: rounded volume with coil texture
 * - Locs: hanging cylindrical strands
 * - Mohawk: central strip with shaved sides
 * - Line up: crisp geometric hairline
 */

"use client"

import { useId } from "react"

interface StyleIllustrationProps {
  category: string
  size?: number
  className?: string
}

export function StyleIllustration({ category, size = 48, className = "" }: StyleIllustrationProps) {
  const s = size
  // Unique gradient IDs per instance to avoid collisions
  const rawId = useId()
  const uid = rawId.replace(/[:]/g, "")

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 100 100"
      className={className}
      aria-label={`${category} hairstyle illustration`}
    >
      <defs>
        {/* Fade gradient — skin tone to hair color */}
        <linearGradient id={`fade-${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.05} />
          <stop offset="30%" stopColor="currentColor" stopOpacity={0.15} />
          <stop offset="60%" stopColor="currentColor" stopOpacity={0.4} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.6} />
        </linearGradient>
        {/* Afro volume gradient */}
        <radialGradient id={`afro-${uid}`} cx="0.5" cy="0.4" r="0.5">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.5} />
          <stop offset="70%" stopColor="currentColor" stopOpacity={0.35} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.15} />
        </radialGradient>
        {/* Skin tone for shaved areas */}
        <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.08} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0.03} />
        </linearGradient>
      </defs>

      {/* Head shape — front facing, slightly rounded */}
      <HeadShape />

      {renderCategory(category, uid)}
    </svg>
  )
}

/** Front-facing head silhouette — consistent base for all styles */
function HeadShape() {
  return (
    <g opacity={0.08}>
      <path
        d="M 50 28
           C 38 28, 32 36, 32 48
           C 32 58, 34 68, 38 75
           C 42 82, 46 85, 50 85
           C 54 85, 58 82, 62 75
           C 66 68, 68 58, 68 48
           C 68 36, 62 28, 50 28 Z"
        fill="currentColor"
      />
      {/* Ears */}
      <ellipse cx="30" cy="55" rx="3" ry="6" fill="currentColor" />
      <ellipse cx="70" cy="55" rx="3" ry="6" fill="currentColor" />
    </g>
  )
}

function renderCategory(category: string, uid: string) {
  switch (category) {
    case "fade":
      return <FadeCut uid={uid} />
    case "short":
      return <BuzzCut />
    case "medium":
      return <SlickBack uid={uid} />
    case "natural":
      return <Afro uid={uid} />
    case "braids":
      return <Cornrows />
    case "locs":
      return <Locs />
    case "edgy":
      return <Mohawk uid={uid} />
    case "detail":
      return <LineUp />
    default:
      return null
  }
}

/* ═══════════════════════════════════════════════════════════════
 * FADE — gradient from skin to hair on the sides
 * The signature look: bald/skin at the bottom, blending up to
 * full hair length on top. Visible gradient band.
 * ═══════════════════════════════════════════════════════════════ */
function FadeCut({ uid }: { uid: string }) {
  return (
    <g>
      {/* Hair on top — full coverage */}
      <path
        d="M 28 48
           C 28 38, 35 28, 50 26
           C 65 28, 72 38, 72 48
           L 72 52
           L 28 52 Z"
        fill="currentColor"
        opacity={0.45}
      />
      {/* Fade gradient on sides — the signature */}
      <path
        d="M 28 48
           C 28 38, 35 28, 50 26
           C 65 28, 72 38, 72 48
           L 72 62
           C 72 65, 70 67, 68 67
           L 32 67
           C 30 67, 28 65, 28 62 Z"
        fill={`url(#fade-${uid})`}
      />
      {/* Fade line — the visible blend point */}
      <line x1="28" y1="52" x2="72" y2="52" stroke="currentColor" strokeWidth={0.5} opacity={0.3} />
      {/* Texture dots on top — hair grain */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = 32 + (i % 7) * 5.5
        const y = 32 + Math.floor(i / 7) * 6
        return <circle key={i} cx={x} cy={y} r={0.7} fill="currentColor" opacity={0.3} />
      })}
    </g>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * BUZZ CUT — uniform short hair with visible grain
 * Very short, even length all over. Military-style.
 * ═══════════════════════════════════════════════════════════════ */
function BuzzCut() {
  return (
    <g>
      {/* Hair coverage — close to the head shape */}
      <path
        d="M 30 50
           C 30 39, 36 29, 50 27
           C 64 29, 70 39, 70 50
           L 70 55
           C 70 57, 68 58, 66 58
           L 34 58
           C 32 58, 30 57, 30 55 Z"
        fill="currentColor"
        opacity={0.3}
      />
      {/* Hair grain — short vertical strokes representing buzzed hair */}
      {Array.from({ length: 40 }, (_, i) => {
        const col = i % 8
        const row = Math.floor(i / 8)
        const x = 34 + col * 4.5
        const y = 32 + row * 4
        // Skip rows that would be on the face
        if (y > 52) return null
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x}
            y2={y + 2}
            stroke="currentColor"
            strokeWidth={0.6}
            opacity={0.35}
          />
        )
      })}
    </g>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * SLICK BACK / UNDERCUT — length on top, short sides
 * Hair swept back with visible length, disconnected sides.
 * ═══════════════════════════════════════════════════════════════ */
function SlickBack({ uid }: { uid: string }) {
  return (
    <g>
      {/* Longer hair on top — swept back */}
      <path
        d="M 26 52
           C 24 42, 30 28, 50 24
           C 70 28, 76 42, 74 52
           C 74 55, 72 56, 70 55
           L 30 55
           C 28 56, 26 55, 26 52 Z"
        fill="currentColor"
        opacity={0.4}
      />
      {/* Slick-back direction lines — hair swept backward */}
      {[-12, -6, 0, 6, 12].map((offset, i) => (
        <path
          key={i}
          d={`M ${50 + offset} 28
              C ${50 + offset + 2} 35, ${50 + offset + 4} 42, ${50 + offset + 5} 50`}
          stroke="currentColor"
          strokeWidth={0.7}
          fill="none"
          opacity={0.25}
        />
      ))}
      {/* Short sides — undercut */}
      <path
        d="M 26 52
           C 26 55, 28 58, 30 58
           L 32 58
           L 32 52 Z
           M 74 52
           C 74 55, 72 58, 70 58
           L 68 58
           L 68 52 Z"
        fill={`url(#skin-${uid})`}
      />
    </g>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * AFRO — rounded volume with coil texture
 * The iconic natural: full, round, textured.
 * ═══════════════════════════════════════════════════════════════ */
function Afro({ uid }: { uid: string }) {
  return (
    <g>
      {/* Main afro volume — large rounded shape */}
      <circle
        cx="50"
        cy="40"
        r="26"
        fill={`url(#afro-${uid})`}
      />
      {/* Coil texture — small circles around the perimeter */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * Math.PI * 2
        const r = 22
        const x = 50 + r * Math.cos(angle)
        const y = 40 + r * Math.sin(angle) * 0.85
        return <circle key={i} cx={x} cy={y} r={2} fill="currentColor" opacity={0.2} />
      })}
      {/* Inner coil texture */}
      {Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2
        const r = 14
        const x = 50 + r * Math.cos(angle)
        const y = 40 + r * Math.sin(angle) * 0.85
        return <circle key={i} cx={x} cy={y} r={1.5} fill="currentColor" opacity={0.15} />
      })}
      {/* Center coils */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const r = 6
        const x = 50 + r * Math.cos(angle)
        const y = 40 + r * Math.sin(angle) * 0.85
        return <circle key={i} cx={x} cy={y} r={1.2} fill="currentColor" opacity={0.1} />
      })}
    </g>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * CORNROWS — geometric parting lines with raised braid texture
 * The signature: rows of braids laid flat against the scalp,
 * geometric patterns radiating from the crown.
 * ═══════════════════════════════════════════════════════════════ */
function Cornrows() {
  return (
    <g>
      {/* Hair base coverage */}
      <path
        d="M 28 50
           C 28 38, 35 28, 50 26
           C 65 28, 72 38, 72 50
           L 72 58
           L 28 58 Z"
        fill="currentColor"
        opacity={0.2}
      />
      {/* Cornrow rows — converging from crown to front */}
      {[-18, -12, -6, 0, 6, 12, 18].map((offset, i) => (
        <g key={i}>
          {/* Parting line — the groove between braids */}
          <path
            d={`M ${50 + offset} 28
                C ${50 + offset * 0.7} 38, ${50 + offset * 0.5} 48, ${50 + offset * 0.4} 56`}
            stroke="currentColor"
            strokeWidth={0.4}
            fill="none"
            opacity={0.15}
          />
          {/* Braid body — raised texture */}
          <path
            d={`M ${50 + offset + 2} 28
                C ${50 + offset * 0.7 + 2} 38, ${50 + offset * 0.5 + 2} 48, ${50 + offset * 0.4 + 2} 56`}
            stroke="currentColor"
            strokeWidth={1.5}
            fill="none"
            opacity={0.4}
            strokeLinecap="round"
          />
          {/* Braid segment marks — the visible criss-cross */}
          {[32, 38, 44, 50].map((y, j) => (
            <line
              key={j}
              x1={50 + offset * (1 - (y - 28) / 30) + 1}
              y1={y}
              x2={50 + offset * (1 - (y - 28) / 30) + 3}
              y2={y}
              stroke="currentColor"
              strokeWidth={0.5}
              opacity={0.3}
            />
          ))}
        </g>
      ))}
    </g>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * LOCS — cylindrical hanging strands with texture
 * Dreadlocks: thick, rounded strands hanging down.
 * ═══════════════════════════════════════════════════════════════ */
function Locs() {
  return (
    <g>
      {/* Hair base — top coverage */}
      <path
        d="M 26 50
           C 26 38, 34 28, 50 26
           C 66 28, 74 38, 74 50
           L 74 55
           L 26 55 Z"
        fill="currentColor"
        opacity={0.2}
      />
      {/* Loc strands — thick, rounded, hanging */}
      {[-20, -13, -6, 1, 8, 15, 22].map((offset, i) => {
        const x = 50 + offset
        const length = 18 + (i % 3) * 4 // varying lengths
        return (
          <g key={i}>
            {/* Loc body */}
            <line
              x1={x}
              y1={28}
              x2={x + (i % 2 === 0 ? 2 : -2)}
              y2={28 + length}
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.4}
            />
            {/* Loc texture — segments */}
            {[4, 9, 14].map((dy, j) => (
              <circle
                key={j}
                cx={x + (i % 2 === 0 ? (dy / 18) * 2 : -(dy / 18) * 2)}
                cy={28 + dy}
                r={1.3}
                fill="currentColor"
                opacity={0.2}
              />
            ))}
          </g>
        )
      })}
    </g>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * MOHAWK — central strip of hair with shaved sides
 * The punk: a strip of hair running front to back,
 * sides completely shaved.
 * ═══════════════════════════════════════════════════════════════ */
function Mohawk({ uid }: { uid: string }) {
  return (
    <g>
      {/* Shaved sides — skin tone */}
      <path
        d="M 28 50
           C 28 40, 33 30, 42 28
           L 42 55
           L 32 55
           C 30 55, 28 53, 28 50 Z
           M 72 50
           C 72 40, 67 30, 58 28
           L 58 55
           L 68 55
           C 70 55, 72 53, 72 50 Z"
        fill={`url(#skin-${uid})`}
      />
      {/* Central mohawk strip — the hair */}
      <path
        d="M 42 28
           C 44 24, 47 22, 50 22
           C 53 22, 56 24, 58 28
           L 58 55
           L 42 55 Z"
        fill="currentColor"
        opacity={0.45}
      />
      {/* Mohawk texture — vertical strokes in the strip */}
      {[-5, -2, 1, 4].map((offset, i) => (
        <line
          key={i}
          x1={50 + offset}
          y1={24}
          x2={50 + offset}
          y2={52}
          stroke="currentColor"
          strokeWidth={0.6}
          opacity={0.3}
        />
      ))}
      {/* Spike tips — pointed top */}
      <path
        d="M 44 26 L 46 20 L 48 25 L 50 18 L 52 25 L 54 20 L 56 26"
        stroke="currentColor"
        strokeWidth={0.8}
        fill="none"
        opacity={0.35}
      />
    </g>
  )
}

/* ═══════════════════════════════════════════════════════════════
 * LINE UP / SHAPE UP — crisp geometric hairline
 * The barbershop signature: sharp, squared-off hairline.
 * ═══════════════════════════════════════════════════════════════ */
function LineUp() {
  return (
    <g>
      {/* Hair coverage */}
      <path
        d="M 30 50
           C 30 39, 36 29, 50 27
           C 64 29, 70 39, 70 50
           L 70 55
           L 30 55 Z"
        fill="currentColor"
        opacity={0.3}
      />
      {/* The signature: crisp, sharp hairline — squared off */}
      <path
        d="M 30 50
           L 30 48
           L 34 48
           L 34 46
           L 66 46
           L 66 48
           L 70 48
           L 70 50"
        stroke="currentColor"
        strokeWidth={1.5}
        fill="none"
        opacity={0.6}
      />
      {/* Sharp corners — the points that make it a shape up */}
      <circle cx="30" cy="48" r={1} fill="currentColor" opacity={0.5} />
      <circle cx="70" cy="48" r={1} fill="currentColor" opacity={0.5} />
      {/* Texture dots */}
      {Array.from({ length: 12 }, (_, i) => {
        const x = 34 + (i % 6) * 5.5
        const y = 33 + Math.floor(i / 6) * 5
        return <circle key={i} cx={x} cy={y} r={0.6} fill="currentColor" opacity={0.25} />
      })}
    </g>
  )
}
