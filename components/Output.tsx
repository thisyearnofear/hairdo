"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { generateImageFilename, downloadImage } from "@/lib/image"
import { StyleIllustration } from "@/components/ui/style-illustration"

interface OutputProps {
  output: {
    status: string
    output?: string
    hairstyle?: string
    shade?: string
    color?: string
    sourceImage?: string
    tier?: string
  }
}

export function Output({ output }: OutputProps) {
  const isSuccess = output.status === 'succeeded'
  const isFail = output.status === 'failed'
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDownloading, setIsDownloading] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  // P0-2 square-lens comparator (Pointer Square Lens steal): drag a loupe to
  // reveal Before inside a square; After stays outside. Falls back to the
  // slider split until the lens is first moved.
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null)
  const frameRef = useRef<HTMLDivElement>(null)
  // P1-2 shop light (RelightingImages steal, CSS overlay only): sweeps a warm
  // radial highlight across the After photo. Overlay is pointer-events-none +
  // mix-blend-overlay, so downloads (downloadImage) are pixel-identical.
  const [light, setLight] = useState({ x: 30, y: 25 })
  const sweptRef = useRef(false)

  // One-time gsap intro sweep to hint the slider exists. gsap is dynamically
  // imported so it never lands in the first-paint chunk; three stays
  // installed-but-unbundled for the future P1-2b normal-map pass.
  useEffect(() => {
    if (!isSuccess || !output.output || sweptRef.current) return
    sweptRef.current = true
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    let cancelled = false
    import("gsap").then(({ gsap }) => {
      if (cancelled) return
      const proxy = { x: 75 }
      gsap.to(proxy, {
        x: 30,
        duration: 1.2,
        ease: "power2.out",
        delay: 0.4,
        onUpdate: () => setLight((p) => ({ ...p, x: proxy.x })),
      })
    }).catch(() => {})
    return () => { cancelled = true }
  }, [isSuccess, output.output])

  const moveLens = (clientX: number, clientY: number) => {
    const el = frameRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const x = ((clientX - r.left) / r.width) * 100
    const y = ((clientY - r.top) / r.height) * 100
    setLens({
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    })
  }

  const handleDownload = async () => {
    if (!output.output) return

    setIsDownloading(true)
    try {
      const filename = generateImageFilename(
        output.hairstyle || 'hairstyle',
        output.color || 'color',
        output.shade || 'shade'
      )
      await downloadImage(output.output, filename)
    } catch (error) {
      console.error('Download failed:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Card className={`rounded-2xl border-gradient-warm glass-warm overflow-hidden ${isSuccess ? "smear-reveal" : ""}`}>

      <CardContent className="p-6 text-center">
        {isSuccess && (
          <>
            <div className="mb-4">
              <h3 className="text-2xl font-normal font-display capitalize text-gradient-warm mb-1">
                {output.hairstyle}
              </h3>
              <p className="text-sm opacity-50">
                {output.shade} {output.color}
              </p>
              {output.tier && (
                <span className="inline-block mt-2 text-[9px] tracking-wide opacity-30">
                  {output.tier === "refined" ? "Refined quality" : "Basic preview"}
                </span>
              )}
            </div>

            {output.output && (
              <>
                {/* Toggle button for comparison view */}
                {output.sourceImage && (
                  <button
                    onClick={() => setShowComparison(!showComparison)}
                    className="text-xs tracking-wide opacity-50 hover:opacity-80 transition-opacity mb-4 font-display italic"
                  >
                    {showComparison ? '← Result only' : 'Compare before / after →'}
                  </button>
                )}

                {/* Before/After Comparison Slider */}
                {showComparison && output.sourceImage ? (
                  <div
                    ref={frameRef}
                    className="mt-2 relative w-full aspect-square overflow-hidden rounded-lg border border-white/10 cursor-crosshair touch-none select-none"
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture?.(e.pointerId)
                      moveLens(e.clientX, e.clientY)
                    }}
                    onPointerMove={(e) => {
                      if (e.buttons > 0) moveLens(e.clientX, e.clientY)
                    }}
                    role="slider"
                    aria-label="Before / after lens — drag to reveal original photo"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(lens?.x ?? sliderPosition)}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      const step = 4
                      setLens((prev) => {
                        const cur = prev ?? { x: sliderPosition, y: 50 }
                        if (e.key === "ArrowLeft") return { ...cur, x: Math.max(0, cur.x - step) }
                        if (e.key === "ArrowRight") return { ...cur, x: Math.min(100, cur.x + step) }
                        if (e.key === "ArrowUp") return { ...cur, y: Math.max(0, cur.y - step) }
                        if (e.key === "ArrowDown") return { ...cur, y: Math.min(100, cur.y + step) }
                        return cur
                      })
                      if (e.key.startsWith("Arrow")) e.preventDefault()
                    }}
                  >
                    {/* After (base layer) + shared shop-light overlay */}
                    <div className="absolute inset-0">
                      <Image
                        src={output.output}
                        alt="Generated"
                        fill
                        className="object-contain"
                      />
                      <div
                        className="absolute inset-0 pointer-events-none mix-blend-overlay"
                        style={{
                          background: `radial-gradient(circle at ${light.x}% ${light.y}%, hsl(45 80% 65% / 0.55), transparent 55%)`,
                        }}
                      />
                    </div>

                    {/* Before (lens cutout) — square loupe once dragged,
                        full-height split as fallback before first drag */}
                    <div
                      className="absolute inset-0"
                      style={
                        lens
                          ? {
                              clipPath: `inset(${Math.max(0, lens.y - 14)}% ${Math.max(0, 100 - lens.x - 14)}% ${Math.max(0, 100 - lens.y - 14)}% ${Math.max(0, lens.x - 14)}% round 12px)`,
                            }
                          : { clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }
                      }
                    >
                      <Image
                        src={output.sourceImage}
                        alt="Original"
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Square lens frame */}
                    {lens ? (
                      <div
                        className="absolute w-[28%] aspect-square rounded-xl border border-amber/60 shadow-gold-glow pointer-events-none"
                        style={{
                          left: `calc(${lens.x}% - 14%)`,
                          top: `calc(${lens.y}% - 14%)`,
                        }}
                      >
                        <span className="absolute -top-6 left-0 text-[10px] tracking-wide bg-black/60 px-2 py-0.5 rounded opacity-80">
                          Before
                        </span>
                      </div>
                    ) : (
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-amber/60 pointer-events-none"
                        style={{ left: `${sliderPosition}%` }}
                      />
                    )}

                    {/* A11y fallback — visually hidden, keeps old slider behavior */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="sr-only"
                      tabIndex={-1}
                      aria-label="Before / after split position"
                    />

                    <div className="absolute top-3 left-3 text-[10px] tracking-wide bg-black/60 px-2 py-1 rounded opacity-70 pointer-events-none">
                      {lens ? "Drag the lens" : "Before"}
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] tracking-wide bg-amber/20 px-2 py-1 rounded text-amber/90 pointer-events-none">
                      After
                    </div>
                  </div>
                ) : (
                  /* Result only view + shop-light overlay */
                  <div className="mt-2 relative w-full aspect-square rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={output.output}
                      alt="Generated hairstyle"
                      fill
                      className="object-contain"
                    />
                    <div
                      className="absolute inset-0 pointer-events-none mix-blend-overlay"
                      style={{
                        background: `radial-gradient(circle at ${light.x}% ${light.y}%, hsl(45 80% 65% / 0.55), transparent 55%)`,
                      }}
                    />
                  </div>
                )}

                {/* P1-2 shop-light slider — CSS overlay only, never touches download */}
                <div className="mt-3 flex items-center gap-3">
                  <label htmlFor="shop-light" className="text-[10px] tracking-[0.15em] uppercase opacity-50 whitespace-nowrap">
                    Shop light
                  </label>
                  <input
                    id="shop-light"
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(light.x)}
                    onChange={(e) => setLight((p) => ({ ...p, x: Number(e.target.value) }))}
                    className="w-full accent-amber"
                    aria-label="Shop light position"
                  />
                </div>

                {/* Download button */}
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  variant="secondary"
                  size="sm"
                  className="w-full mt-4 text-xs tracking-wide"
                >
                  <Download className="w-3 h-3 mr-2" />
                  {isDownloading ? 'Saving...' : 'Save result'}
                </Button>
              </>
            )}
          </>
        )}

        {isFail && (
          <div className="py-8">
            <p className="text-lg font-display opacity-60 mb-2">
              Something went wrong
            </p>
            <p className="text-xs opacity-40">
              The AI couldn&apos;t generate this look. Try again or pick another style.
            </p>
          </div>
        )}

        {!isSuccess && !isFail && (
          <LoadingAnimation output={output} />
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Loading animation — warm, calm, barbershop-inspired.
 * Replaces the old emoji-heavy purple/pink spinner with a
 * warm amber pulse and rotating barbershop-style messages.
 */
function LoadingAnimation({ output }: { output: OutputProps['output'] }) {
  const [messageIndex, setMessageIndex] = useState(0)

  const startingMessages = [
    "Preparing the chair...",
    "Setting up the tools...",
    "Getting ready...",
  ]

  const processingMessages = [
    `Crafting your ${output.hairstyle || 'new look'}...`,
    `Mixing ${output.shade || ''} ${output.color || ''}...`,
    "Your digital barber is working...",
    "Adding the finishing touches...",
    "Almost there...",
  ]

  const messages = output.status === 'starting' ? startingMessages : processingMessages

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [messages.length])

  return (
    <div className="py-16 relative overflow-hidden">
      {/* Warm ambient glow */}
      <div className="absolute inset-0 opacity-15 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/3 w-32 h-32 rounded-full animate-pulse"
          style={{
            background: "radial-gradient(circle, hsl(38 70% 55%) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-32 h-32 rounded-full animate-pulse"
          style={{
            background: "radial-gradient(circle, hsl(18 55% 42%) 0%, transparent 70%)",
            filter: "blur(40px)",
            animationDelay: "1s",
          }}
        />
      </div>

      <div className="relative">
        {/* Barber pole-inspired spinner — warm amber rings */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          {/* Outer ring */}
          <div className="absolute inset-0 border-2 border-amber/20 rounded-full" />

          {/* Spinning ring */}
          <div
            className="absolute inset-2 border-2 border-amber/40 border-t-transparent rounded-full animate-spin"
            style={{ animationDuration: '2s' }}
          />

          {/* Inner pulse — hairstyle illustration in center */}
          <div className="absolute inset-0 flex items-center justify-center opacity-40">
            <StyleIllustration category="fade" size={40} className="text-amber/60" />
          </div>
        </div>

        {/* Status title — warm, calm */}
        <h3 className="text-xl font-display italic opacity-70 mb-6">
          {output.status === 'starting' ? 'Getting ready' : 'Working on it'}
        </h3>

        {/* Rotating message — fade transition */}
        <div className="relative h-6 mb-8">
          <p
            key={messageIndex}
            className="absolute inset-0 text-sm opacity-50 animate-[fadeIn_0.5s_ease-in-out] text-center font-display"
          >
            {messages[messageIndex]}
          </p>
        </div>

        {/* Progress bar — warm amber */}
        <div className="max-w-xs mx-auto space-y-3">
          <div className="relative h-1 bg-white/5 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full transition-all duration-1000 animate-[shimmer_2s_ease-in-out_infinite]"
              style={{
                width: '50%',
                background: "linear-gradient(90deg, hsl(38 70% 55%), hsl(18 55% 42%))",
              }}
            />
          </div>

          {/* Time estimate — subtle */}
          <div className="flex items-center justify-between text-[10px] tracking-wide opacity-30">
            <span>Usually takes 1-3 min</span>
            <span className="animate-pulse">Live</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 0.5; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}
