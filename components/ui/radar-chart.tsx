/**
 * Lightweight SVG radar chart — dither-kit inspired, zero dependencies.
 * Renders a multi-dimensional match visualization as a radar/spider chart.
 *
 * Usage:
 * <RadarChart
 *   data={[
 *     { label: "Match", value: 85 },
 *     { label: "Comfort", value: 70 },
 *     { label: "Climate", value: 90 },
 *     { label: "Cost", value: 60 },
 *     { label: "Maint.", value: 75 },
 *     { label: "Skill", value: 80 },
 *   ]}
 *   size={120}
 * />
 */

interface RadarDatum {
  label: string
  value: number // 0-100
}

interface RadarChartProps {
  data: RadarDatum[]
  size?: number
  color?: string
  max?: number
}

export function RadarChart({
  data,
  size = 120,
  color = "rgba(0, 112, 227, 0.8)",
  max = 100,
}: RadarChartProps) {
  const center = size / 2
  const radius = size / 2 - 18 // padding for labels
  const n = data.length
  const angleStep = (Math.PI * 2) / n

  // Calculate points for each axis
  const points = data.map((d, i) => {
    const angle = i * angleStep - Math.PI / 2 // start from top
    const r = (d.value / max) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      labelX: center + (radius + 10) * Math.cos(angle),
      labelY: center + (radius + 10) * Math.sin(angle),
      label: d.label,
      value: d.value,
    }
  })

  // Grid rings (3 levels)
  const rings = [0.33, 0.66, 1.0]

  // Axis lines
  const axes = data.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2
    return {
      x2: center + radius * Math.cos(angle),
      y2: center + radius * Math.sin(angle),
    }
  })

  // Polygon path for the data
  const polygonPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ") + " Z"

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="animate-radar-draw"
      style={{ overflow: "visible" }}
    >
      {/* Grid rings */}
      {rings.map((ring, i) => (
        <circle
          key={i}
          cx={center}
          cy={center}
          r={radius * ring}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {axes.map((axis, i) => (
        <line
          key={i}
          x1={center}
          y1={center}
          x2={axis.x2}
          y2={axis.y2}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={0.5}
        />
      ))}

      {/* Data polygon */}
      <path
        d={polygonPath}
        fill={color.replace("0.8", "0.12")}
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Data points */}
      {points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={2}
          fill={color}
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={0.5}
        />
      ))}

      {/* Labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white/40"
          style={{
            fontSize: 7,
            fontWeight: 500,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {p.label}
        </text>
      ))}
    </svg>
  )
}
