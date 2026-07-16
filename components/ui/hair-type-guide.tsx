/**
 * Hair type visual guide — SVG illustrations of coil/curl patterns
 * for the 1A–4C hair typing system. This is a domain-specific
 * differentiator: it shows we understand Black hair specifically.
 *
 * Each type gets a small SVG showing the characteristic pattern:
 * - Type 1: straight lines (fine/medium/coarse)
 * - Type 2: gentle S-waves
 * - Type 3: defined curls/loops
 * - Type 4: tight coils/Z-patterns
 */

interface HairTypeIconProps {
  type: string // e.g. "4C", "3B", "2A"
  size?: number
  className?: string
}

/** Draw a strand of straight hair */
function StraightStrand({ x, y, length, variant }: { x: number; y: number; length: number; variant: "fine" | "medium" | "coarse" }) {
  const width = variant === "fine" ? 0.8 : variant === "medium" ? 1.2 : 1.8
  return (
    <line
      x1={x}
      y1={y}
      x2={x}
      y2={y + length}
      stroke="currentColor"
      strokeWidth={width}
      strokeLinecap="round"
    />
  )
}

/** Draw a wavy strand — gentle S-curve */
function WavyStrand({ x, y, length, variant }: { x: number; y: number; length: number; variant: "fine" | "medium" | "coarse" }) {
  const width = variant === "fine" ? 0.8 : variant === "medium" ? 1.2 : 1.8
  const amp = variant === "fine" ? 3 : variant === "medium" ? 4 : 5
  const path = `M ${x} ${y} Q ${x + amp} ${y + length * 0.25} ${x} ${y + length * 0.5} Q ${x - amp} ${y + length * 0.75} ${x} ${y + length}`
  return <path d={path} stroke="currentColor" strokeWidth={width} fill="none" strokeLinecap="round" />
}

/** Draw a curly strand — defined loop */
function CurlyStrand({ x, y, length, variant }: { x: number; y: number; length: number; variant: "loose" | "springy" | "tight" }) {
  const width = 1.2
  const radius = variant === "loose" ? 5 : variant === "springy" ? 4 : 3
  const loops = variant === "loose" ? 2 : variant === "springy" ? 3 : 4
  const loopHeight = length / loops
  let path = `M ${x} ${y}`
  for (let i = 0; i < loops; i++) {
    const cy = y + loopHeight * i + loopHeight / 2
    const ey = y + loopHeight * (i + 1)
    path += ` Q ${x + radius} ${cy} ${x} ${ey}`
  }
  return <path d={path} stroke="currentColor" strokeWidth={width} fill="none" strokeLinecap="round" />
}

/** Draw a coily strand — tight Z-pattern / zigzag */
function CoilyStrand({ x, y, length, variant }: { x: number; y: number; length: number; variant: "soft" | "tight" | "dense" }) {
  const width = variant === "soft" ? 1.2 : variant === "tight" ? 1.5 : 1.8
  const zigs = variant === "soft" ? 4 : variant === "tight" ? 6 : 8
  const zigHeight = length / zigs
  const zigWidth = variant === "soft" ? 3 : variant === "tight" ? 2.5 : 2
  let path = `M ${x} ${y}`
  for (let i = 0; i < zigs; i++) {
    const dy = y + zigHeight * (i + 1)
    const dx = i % 2 === 0 ? x + zigWidth : x - zigWidth
    path += ` L ${dx} ${dy}`
  }
  return <path d={path} stroke="currentColor" strokeWidth={width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
}

export function HairTypeIcon({ type, size = 36, className = "" }: HairTypeIconProps) {
  const category = type[0] // 1, 2, 3, or 4
  const sub = type[1] // A, B, or C
  const strands = 5
  const spacing = size / (strands + 1)
  const strandLength = size * 0.65
  const startY = (size - strandLength) / 2

  const renderStrand = (i: number) => {
    const x = spacing * (i + 1)
    switch (category) {
      case "1":
        return <StraightStrand key={i} x={x} y={startY} length={strandLength} variant={sub === "A" ? "fine" : sub === "B" ? "medium" : "coarse"} />
      case "2":
        return <WavyStrand key={i} x={x} y={startY} length={strandLength} variant={sub === "A" ? "fine" : sub === "B" ? "medium" : "coarse"} />
      case "3":
        return <CurlyStrand key={i} x={x} y={startY} length={strandLength} variant={sub === "A" ? "loose" : sub === "B" ? "springy" : "tight"} />
      case "4":
        return <CoilyStrand key={i} x={x} y={startY} length={strandLength} variant={sub === "A" ? "soft" : sub === "B" ? "tight" : "dense"} />
      default:
        return null
    }
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      aria-label={`Hair type ${type} pattern illustration`}
    >
      {Array.from({ length: strands }, (_, i) => renderStrand(i))}
    </svg>
  )
}

/**
 * Full hair type guide — shows all 12 types in a grid with labels.
 * Used as a popover/expandable section next to the hair type selector.
 */
interface HairTypeGuideProps {
  selected: string
  onSelect: (type: string) => void
}

const ALL_TYPES = [
  { value: "1A", label: "Straight (fine)", example: "Slick back" },
  { value: "1B", label: "Straight (medium)", example: "Slick back" },
  { value: "1C", label: "Straight (coarse)", example: "Slick back" },
  { value: "2A", label: "Wavy (fine)", example: "Caesar cut" },
  { value: "2B", label: "Wavy (medium)", example: "Textured crop" },
  { value: "2C", label: "Wavy (coarse)", example: "Textured crop" },
  { value: "3A", label: "Curly (loose)", example: "Curly fade" },
  { value: "3B", label: "Curly (springy)", example: "Curly fade" },
  { value: "3C", label: "Curly (tight)", example: "Two-strand twists" },
  { value: "4A", label: "Coily (soft S)", example: "Wash & go" },
  { value: "4B", label: "Coily (tight Z)", example: "Two-strand twists" },
  { value: "4C", label: "Coily (dense)", example: "Afro / locs" },
]

export function HairTypeGuide({ selected, onSelect }: HairTypeGuideProps) {
  return (
    <div className="grid grid-cols-4 gap-2 p-3 bg-black/40 border border-white/10 rounded-lg border-gradient-warm">
      {ALL_TYPES.map((type) => (
        <button
          key={type.value}
          onClick={() => onSelect(type.value)}
          className={`flex flex-col items-center gap-1 p-2 rounded-md transition-all duration-150 press-scale ${
            selected === type.value
              ? "bg-amber/15 border border-amber/30"
              : "bg-transparent border border-transparent hover:bg-white/5 hover:border-white/10"
          }`}
        >
          <HairTypeIcon
            type={type.value}
            size={32}
            className={selected === type.value ? "text-amber" : "text-white/50"}
          />
          <span className={`text-[9px] tracking-wide font-medium ${selected === type.value ? "text-amber" : "opacity-50"}`}>
            {type.value}
          </span>
          <span className={`text-[8px] tracking-wide ${selected === type.value ? "text-amber/60" : "opacity-30"}`}>
            {type.example}
          </span>
        </button>
      ))}
    </div>
  )
}
