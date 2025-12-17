"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"

interface OutputProps {
  output: {
    status: string
    output?: string
    hairstyle?: string
    shade?: string
    color?: string
  }
}

export function Output({ output }: OutputProps) {
  const isSuccess = output.status === 'succeeded'
  const isFail = output.status === 'failed'

  return (
    <Card className="rounded-2xl shadow-[0_10px_35px_-5px_rgba(0,0,0,0.06)]">
      <CardContent className="p-4 text-center">
        {isSuccess && (
          <>
            <h3 className="text-2xl font-normal capitalize">
              {output.hairstyle}, {output.shade} {output.color}
            </h3>
            {output.output && (
              <div className="mt-4 relative w-full aspect-square">
                <Image 
                  src={output.output} 
                  alt="Generated hairstyle" 
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </>
        )}
        
        {isFail && (
          <h3 className="text-2xl font-normal">
            Something failed. Try again.
          </h3>
        )}
        
        {!isSuccess && !isFail && (
          <LoadingAnimation output={output} />
        )}
      </CardContent>
    </Card>
  )
}

function LoadingAnimation({ output }: { output: OutputProps['output'] }) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [colorIndex, setColorIndex] = useState(0)
  
  const startingMessages = [
    "🧠 Waking up the AI...",
    "🔮 Consulting the hair gods...",
    "🎯 Calibrating style sensors...",
    "🌟 Loading magic pixels...",
    "⚡ Charging creativity cores...",
    "🎪 Preparing the transformation...",
  ]
  
  const processingMessages = [
    `✂️ Virtually snipping away...`,
    `💈 Your digital barber is working...`,
    `🎨 Mixing ${output.shade} ${output.color}...`,
    `💫 Sprinkling style dust...`,
    `🔥 Making you look fire...`,
    `👑 Crafting your crown...`,
    `✨ Adding the finishing touches...`,
    `🎭 Revealing your new vibe...`,
    `🚀 Almost there, stay cool...`,
    `💎 Polishing perfection...`,
  ]
  
  const messages = output.status === 'starting' ? startingMessages : processingMessages
  
  const colors = [
    { ring: 'border-purple-500', glow: 'bg-purple-500', shadow: 'shadow-purple-500/50' },
    { ring: 'border-blue-500', glow: 'bg-blue-500', shadow: 'shadow-blue-500/50' },
    { ring: 'border-pink-500', glow: 'bg-pink-500', shadow: 'shadow-pink-500/50' },
    { ring: 'border-emerald-500', glow: 'bg-emerald-500', shadow: 'shadow-emerald-500/50' },
    { ring: 'border-amber-500', glow: 'bg-amber-500', shadow: 'shadow-amber-500/50' },
    { ring: 'border-rose-500', glow: 'bg-rose-500', shadow: 'shadow-rose-500/50' },
  ]
  
  // Rotate messages every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [messages.length])
  
  // Rotate colors every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((prev) => (prev + 1) % colors.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])
  
  const currentColor = colors[colorIndex]
  
  return (
    <div className="py-12 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-10">
        <div className={`absolute top-0 left-0 w-32 h-32 ${currentColor.glow} rounded-full blur-3xl animate-pulse`} />
        <div className={`absolute bottom-0 right-0 w-32 h-32 ${currentColor.glow} rounded-full blur-3xl animate-pulse delay-1000`} />
      </div>
      
      {/* Main loading spinner */}
      <div className="relative">
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Outer rotating hexagon effect */}
          <div className={`absolute inset-0 border-4 ${currentColor.ring} opacity-20 rounded-full transition-all duration-500`} />
          
          {/* Middle spinning ring */}
          <div 
            className={`absolute inset-2 border-4 ${currentColor.ring} border-t-transparent rounded-full animate-spin transition-all duration-500`}
            style={{ animationDuration: '1.5s' }}
          />
          
          {/* Inner counter-spinning ring */}
          <div 
            className={`absolute inset-6 border-3 ${currentColor.ring} opacity-60 border-b-transparent rounded-full transition-all duration-500`}
            style={{ animation: 'spin 2s linear infinite reverse' }}
          />
          
          {/* Center pulsing glow */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-8 h-8 ${currentColor.glow} rounded-full animate-ping transition-all duration-500`} />
            <div className={`absolute w-8 h-8 ${currentColor.glow} rounded-full blur-sm transition-all duration-500 ${currentColor.shadow}`} />
          </div>
          
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
            <div className={`absolute top-0 left-1/2 -ml-1.5 w-3 h-3 ${currentColor.glow} rounded-full transition-all duration-500`} />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
            <div className={`absolute bottom-0 left-1/2 -ml-1.5 w-3 h-3 ${currentColor.glow} rounded-full transition-all duration-500`} />
          </div>
        </div>
        
        {/* Animated title */}
        <h3 className="text-3xl font-bold mb-6 animate-pulse bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
          {output.status === 'starting' ? '🎬 Getting Ready...' : '✨ Creating Magic...'}
        </h3>
        
        {/* Rotating message with fade effect */}
        <div className="relative h-8 mb-6">
          <p 
            key={messageIndex}
            className="absolute inset-0 text-lg font-medium animate-[fadeIn_0.5s_ease-in-out] text-center"
          >
            {messages[messageIndex]}
          </p>
        </div>
        
        {/* Progress bar with gradient */}
        <div className="max-w-xs mx-auto space-y-4">
          <div className="relative h-2 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className={`absolute inset-y-0 left-0 ${currentColor.glow} rounded-full transition-all duration-1000 animate-[shimmer_2s_ease-in-out_infinite]`}
              style={{ width: '45%' }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[slide_2s_ease-in-out_infinite]" />
          </div>
          
          {/* Time estimate */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">⏱️ ETA: 2-3 min</span>
            <span className="animate-pulse">● LIVE</span>
          </div>
        </div>
        
        {/* Fun facts carousel */}
        <div className="mt-8 max-w-md mx-auto">
          <p className="text-xs text-muted-foreground italic">
            {output.status === 'starting' 
              ? "💡 Fun fact: Our AI has styled over 1M virtual looks!"
              : `🎨 Crafting your perfect ${output.hairstyle} with ${output.shade} ${output.color}`
            }
          </p>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  )
}
