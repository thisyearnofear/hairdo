/**
 * Flow progress steps — shows the user where they are in the style advisor flow.
 *
 * Steps: UPLOAD → PREFERENCES → RECOMMENDATIONS → VISUALIZE → ATTEST
 * The current step is highlighted, completed steps show a checkmark.
 * Animations: ease-out entrance, staggered step reveal.
 */

import { Check } from "lucide-react"

interface ProgressStepsProps {
  currentStep: number // 0-indexed
  steps?: string[]
}

const DEFAULT_STEPS = ["UPLOAD", "PREFERENCES", "RECOMMENDATIONS", "VISUALIZE", "ATTEST"]

export function ProgressSteps({
  currentStep,
  steps = DEFAULT_STEPS,
}: ProgressStepsProps) {
  return (
    <div className="flex items-center justify-center gap-1 max-w-2xl mx-auto">
      {steps.map((step, i) => {
        const isComplete = i < currentStep
        const isCurrent = i === currentStep

        return (
          <div
            key={step}
            className="flex items-center flex-1 last:flex-none"
            style={{
              animation: `enter-fade 200ms cubic-bezier(0.2, 0, 0, 1) both`,
              animationDelay: `${i * 40}ms`,
            }}
          >
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-200 ${
                  isComplete
                    ? "bg-green-500/20 border border-green-500/40 text-green-400"
                    : isCurrent
                      ? "bg-white/10 border border-white/30 text-white/90"
                      : "bg-transparent border border-white/10 text-white/30"
                } ${isCurrent ? "ring-2 ring-white/10 ring-offset-2 ring-offset-background" : ""}`}
              >
                {isComplete ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className="tabular-nums">{i + 1}</span>
                )}
              </div>
              <span
                className={`text-[8px] tracking-widest uppercase transition-opacity duration-200 ${
                  isCurrent ? "opacity-80" : isComplete ? "opacity-50" : "opacity-25"
                }`}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-px mx-2 mb-4 bg-white/5 relative overflow-hidden">
                <div
                  className={`absolute inset-0 transition-transform duration-300 ${
                    isComplete ? "translate-x-0" : "-translate-x-full"
                  }`}
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(0, 112, 227, 0.4), transparent)",
                  }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
