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
          <div className="py-4">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            <h3 className="text-2xl font-normal">
              {output.status}
              <span className="normal-case"> (may take 3 minutes)...</span>
            </h3>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
