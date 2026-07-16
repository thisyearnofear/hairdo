/**
 * Tradeoff bar indicators — visual bars for instant scannability.
 * Replaces text-only metadata with visual indicators.
 *
 * Usage:
 * <TradeoffBar label="COMFORT" value={3} max={5} color="green" />
 * <TradeoffBar label="MAINTENANCE" value={70} max={100} color="blue" />
 */

interface TradeoffBarProps {
  label: string
  value: number
  max?: number
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange"
  suffix?: string
  invertColor?: boolean // for metrics where lower is better
}

const colorMap = {
  blue: { bar: "bg-blue-500/50", text: "text-blue-400/70" },
  green: { bar: "bg-green-500/50", text: "text-green-400/70" },
  yellow: { bar: "bg-yellow-500/50", text: "text-yellow-400/70" },
  red: { bar: "bg-red-500/50", text: "text-red-400/70" },
  purple: { bar: "bg-purple-500/50", text: "text-purple-400/70" },
  orange: { bar: "bg-orange-500/50", text: "text-orange-400/70" },
}

export function TradeoffBar({
  label,
  value,
  max = 5,
  color = "blue",
  suffix,
  invertColor,
}: TradeoffBarProps) {
  const pct = Math.min(100, (value / max) * 100)
  const effectiveColor = invertColor
    ? pct < 40
      ? "green"
      : pct < 70
        ? "yellow"
        : "red"
    : color
  const colors = colorMap[effectiveColor]

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px] tracking-widest uppercase">
        <span className="opacity-50">{label}</span>
        <span className={`tabular-nums ${colors.text}`}>
          {value}
          {suffix ? `/${max}${suffix}` : ""}
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full animate-bar-grow ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

/**
 * Compact stat row — for the tradeoff grid on recommendation cards.
 * Shows a label + value + mini bar in a tight package.
 */
interface StatBarProps {
  label: string
  value: string
  barPct: number
  color?: "blue" | "green" | "yellow" | "red" | "purple" | "orange"
}

export function StatBar({ label, value, barPct, color = "blue" }: StatBarProps) {
  const colors = colorMap[color]
  return (
    <div className="bg-black/30 p-2.5 border border-white/5 rounded-md space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-widest uppercase opacity-40">
          {label}
        </span>
      </div>
      <span className="text-xs opacity-80 normal-case tracking-normal block">
        {value}
      </span>
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full animate-bar-grow ${colors.bar}`}
          style={{ width: `${Math.min(100, barPct)}%` }}
        />
      </div>
    </div>
  )
}
