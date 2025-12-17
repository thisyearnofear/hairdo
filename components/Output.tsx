"use client"

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
          <div className="py-8">
            {/* Enhanced loading animation */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Outer rotating ring */}
              <div className="absolute inset-0 border-4 border-secondary/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
              
              {/* Inner pulsing circle */}
              <div className="absolute inset-3 bg-secondary/10 rounded-full animate-pulse" />
              
              {/* Center dot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-secondary rounded-full animate-ping" />
                <div className="absolute w-3 h-3 bg-secondary rounded-full" />
              </div>
            </div>
            
            <h3 className="text-2xl font-normal mb-3">
              {output.status === 'starting' ? 'Initializing AI Model' : 'Transforming Your Look'}
            </h3>
            
            {/* Progress indicator */}
            <div className="max-w-xs mx-auto">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Processing</span>
                <span>~2-3 min</span>
              </div>
              <div className="h-1 bg-secondary/20 rounded-full overflow-hidden">
                <div className="h-full bg-secondary rounded-full animate-[loading_3s_ease-in-out_infinite]" style={{width: '30%'}} />
              </div>
              
              {/* Status messages */}
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                {output.status === 'starting' && (
                  <p className="animate-pulse">🔄 Loading neural networks...</p>
                )}
                {output.status === 'processing' && (
                  <>
                    <p className="animate-pulse">✨ Analyzing facial features...</p>
                    <p className="animate-pulse delay-100">💇 Applying {output.hairstyle}...</p>
                    <p className="animate-pulse delay-200">🎨 Rendering {output.shade} {output.color}...</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
