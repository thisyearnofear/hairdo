"use client"

import { useState, useEffect } from "react"
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
    <Card className="rounded-2xl border-gradient-warm glass-warm overflow-hidden">
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
                  <div className="mt-2 relative w-full aspect-square overflow-hidden rounded-lg group cursor-col-resize border border-white/10">
                    {/* Before image */}
                    <div className="absolute inset-0">
                      <Image
                        src={output.sourceImage}
                        alt="Original"
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* After image with slider mask */}
                    <div
                      className="absolute inset-0"
                      style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                    >
                      <Image
                        src={output.output}
                        alt="Generated"
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Slider handle */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPosition}
                      onChange={(e) => setSliderPosition(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-col-resize z-10"
                      style={{ pointerEvents: 'auto' }}
                    />

                    {/* Visual slider line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-amber/60 pointer-events-none transition-all duration-75"
                      style={{ left: `${sliderPosition}%` }}
                    />

                    {/* Labels */}
                    <div className="absolute top-3 left-3 text-[10px] tracking-wide bg-black/60 px-2 py-1 rounded opacity-70">
                      Before
                    </div>
                    <div className="absolute top-3 right-3 text-[10px] tracking-wide bg-amber/20 px-2 py-1 rounded text-amber/90">
                      After
                    </div>
                  </div>
                ) : (
                  /* Result only view */
                  <div className="mt-2 relative w-full aspect-square rounded-lg overflow-hidden border border-white/10">
                    <Image
                      src={output.output}
                      alt="Generated hairstyle"
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

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
