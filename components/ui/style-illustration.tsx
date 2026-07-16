/**
 * Style category illustrations — simple, stylized SVG representations
 * of each hairstyle category. These give a visual sense of the style
 * beyond just the name, making recommendation cards more intuitive.
 *
 * Categories: fade, short, medium, natural, braids, locs, edgy, detail
 * Each is a head silhouette with the characteristic style rendered.
 */

interface StyleIllustrationProps {
  category: string
  size?: number
  className?: string
}

const STROKE = "currentColor"
const FILL = "currentColor"

/** Base head silhouette — side profile */
function HeadBase({ size }: { size: number }) {
  // Simple head silhouette — rounded shape
  return (
    <ellipse
      cx={size * 0.5}
      cy={size * 0.45}
      rx={size * 0.28}
      ry={size * 0.32}
      fill="none"
      stroke={STROKE}
      strokeWidth={1}
      opacity={0.15}
    />
  )
}

export function StyleIllustration({ category, size = 48, className = "" }: StyleIllustrationProps) {
  const s = size
  const cx = s * 0.5
  const cy = s * 0.4

  return (
    <svg
      width={s}
      height={s}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      aria-label={`${category} hairstyle illustration`}
    >
      <HeadBase size={s} />
      {renderCategory(category, s, cx, cy)}
    </svg>
  )
}

function renderCategory(category: string, s: number, cx: number, cy: number) {
  switch (category) {
    case "fade":
      // Fade — short on sides, gradient up
      return (
        <g>
          {/* Top hair mass */}
          <path
            d={`M ${cx - s*0.22} ${cy - s*0.05} Q ${cx} ${cy - s*0.35} ${cx + s*0.22} ${cy - s*0.05} L ${cx + s*0.22} ${cy + s*0.02} L ${cx - s*0.22} ${cy + s*0.02} Z`}
            fill={FILL}
            opacity={0.5}
          />
          {/* Fade gradient on sides — dotted lines getting denser */}
          {[0.15, 0.12, 0.09, 0.06].map((opacity, i) => (
            <line
              key={i}
              x1={cx - s*0.22 + i * 2}
              y1={cy + s*0.02}
              x2={cx - s*0.22 + i * 2}
              y2={cy + s*0.1}
              stroke={STROKE}
              strokeWidth={0.5}
              opacity={opacity}
            />
          ))}
          {[0.15, 0.12, 0.09, 0.06].map((opacity, i) => (
            <line
              key={`r${i}`}
              x1={cx + s*0.22 - i * 2}
              y1={cy + s*0.02}
              x2={cx + s*0.22 - i * 2}
              y2={cy + s*0.1}
              stroke={STROKE}
              strokeWidth={0.5}
              opacity={opacity}
            />
          ))}
        </g>
      )

    case "short":
      // Short — close-cropped, uniform
      return (
        <g>
          <path
            d={`M ${cx - s*0.25} ${cy - s*0.02} Q ${cx} ${cy - s*0.32} ${cx + s*0.25} ${cy - s*0.02} L ${cx + s*0.25} ${cy + s*0.05} L ${cx - s*0.25} ${cy + s*0.05} Z`}
            fill={FILL}
            opacity={0.35}
          />
          {/* Texture dots */}
          {Array.from({ length: 8 }, (_, i) => (
            <circle
              key={i}
              cx={cx - s*0.18 + i * s*0.05}
              cy={cy - s*0.12 + (i % 2) * s*0.04}
              r={0.8}
              fill={STROKE}
              opacity={0.4}
            />
          ))}
        </g>
      )

    case "medium":
      // Medium — more volume on top, some length
      return (
        <g>
          <path
            d={`M ${cx - s*0.28} ${cy + s*0.05} Q ${cx - s*0.3} ${cy - s*0.25} ${cx} ${cy - s*0.38} Q ${cx + s*0.3} ${cy - s*0.25} ${cx + s*0.28} ${cy + s*0.05} Z`}
            fill={FILL}
            opacity={0.4}
          />
          {/* Texture lines */}
          {[-0.15, 0, 0.15].map((offset, i) => (
            <path
              key={i}
              d={`M ${cx + offset * s} ${cy - s*0.3} Q ${cx + offset * s + 3} ${cy - s*0.15} ${cx + offset * s} ${cy}`}
              stroke={STROKE}
              strokeWidth={0.6}
              fill="none"
              opacity={0.3}
            />
          ))}
        </g>
      )

    case "natural":
      // Natural / afro — rounded volume
      return (
        <g>
          <circle
            cx={cx}
            cy={cy - s*0.12}
            r={s*0.28}
            fill={FILL}
            opacity={0.3}
          />
          {/* Texture — small circles for coil definition */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * Math.PI * 2
            const r = s * 0.2
            return (
              <circle
                key={i}
                cx={cx + r * Math.cos(angle)}
                cy={cy - s*0.12 + r * Math.sin(angle) * 0.7}
                r={1.5}
                fill={STROKE}
                opacity={0.35}
              />
            )
          })}
        </g>
      )

    case "braids":
      // Braids — vertical lines with segment marks
      return (
        <g>
          {/* Top coverage */}
          <path
            d={`M ${cx - s*0.25} ${cy + s*0.02} Q ${cx} ${cy - s*0.3} ${cx + s*0.25} ${cy + s*0.02} Z`}
            fill={FILL}
            opacity={0.2}
          />
          {/* Braid strands */}
          {[-0.18, -0.06, 0.06, 0.18].map((offset, i) => (
            <g key={i}>
              <line
                x1={cx + offset * s}
                y1={cy - s*0.2}
                x2={cx + offset * s}
                y2={cy + s*0.15}
                stroke={STROKE}
                strokeWidth={1.2}
                opacity={0.5}
              />
              {/* Braid segment marks */}
              {[-0.15, -0.05, 0.05].map((dy, j) => (
                <line
                  key={j}
                  x1={cx + offset * s - 2}
                  y1={cy + dy * s}
                  x2={cx + offset * s + 2}
                  y2={cy + dy * s}
                  stroke={STROKE}
                  strokeWidth={0.6}
                  opacity={0.4}
                />
              ))}
            </g>
          ))}
        </g>
      )

    case "locs":
      // Locs — thicker vertical strands, rounded tips
      return (
        <g>
          <path
            d={`M ${cx - s*0.25} ${cy + s*0.02} Q ${cx} ${cy - s*0.3} ${cx + s*0.25} ${cy + s*0.02} Z`}
            fill={FILL}
            opacity={0.2}
          />
          {/* Loc strands — thicker than braids, rounded */}
          {[-0.18, -0.06, 0.06, 0.18].map((offset, i) => (
            <g key={i}>
              <line
                x1={cx + offset * s}
                y1={cy - s*0.22}
                x2={cx + offset * s}
                y2={cy + s*0.18}
                stroke={STROKE}
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.5}
              />
            </g>
          ))}
        </g>
      )

    case "edgy":
      // Edgy — asymmetric, spiky
      return (
        <g>
          <path
            d={`M ${cx - s*0.25} ${cy + s*0.02}
                L ${cx - s*0.2} ${cy - s*0.15}
                L ${cx - s*0.1} ${cy - s*0.3}
                L ${cx} ${cy - s*0.2}
                L ${cx + s*0.08} ${cy - s*0.35}
                L ${cx + s*0.18} ${cy - s*0.18}
                L ${cx + s*0.25} ${cy - s*0.05}
                L ${cx + s*0.25} ${cy + s*0.05}
                L ${cx - s*0.25} ${cy + s*0.05}
                Z`}
            fill={FILL}
            opacity={0.4}
          />
        </g>
      )

    case "detail":
      // Detail — line-up / design, sharp lines
      return (
        <g>
          <path
            d={`M ${cx - s*0.25} ${cy - s*0.02} Q ${cx} ${cy - s*0.3} ${cx + s*0.25} ${cy - s*0.02} L ${cx + s*0.25} ${cy + s*0.05} L ${cx - s*0.25} ${cy + s*0.05} Z`}
            fill={FILL}
            opacity={0.3}
          />
          {/* Sharp hairline — crisp line at forehead */}
          <line
            x1={cx - s*0.22}
            y1={cy + s*0.03}
            x2={cx + s*0.22}
            y2={cy + s*0.03}
            stroke={STROKE}
            strokeWidth={1.5}
            opacity={0.6}
          />
          {/* Design element — small triangle */}
          <path
            d={`M ${cx - s*0.05} ${cy + s*0.08} L ${cx} ${cy + s*0.12} L ${cx + s*0.05} ${cy + s*0.08} Z`}
            fill="none"
            stroke={STROKE}
            strokeWidth={0.8}
            opacity={0.5}
          />
        </g>
      )

    default:
      return null
  }
}
