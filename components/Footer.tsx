"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="mt-16 p-2 bg-black/[0.04] rounded-[32px] flex flex-wrap items-center gap-2">
      <Button 
        asChild 
        variant="ghost" 
        size="sm"
        className="rounded-full h-10 bg-[#dcdcdc] hover:bg-[#d0d0d0]"
      >
        <a 
          href="https://replicate.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 pr-6"
        >
          <Image src="/img/replicate.svg" alt="Replicate" width={10} height={10} className="mx-2" />
          Replicate
        </a>
      </Button>
      
      <Button 
        asChild 
        variant="ghost" 
        size="sm"
        className="rounded-full h-10 bg-[#dcdcdc] hover:bg-[#d0d0d0]"
      >
        <a 
          href="https://vercel.com" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          ▲ Vercel
        </a>
      </Button>
      
      <Button 
        asChild 
        variant="ghost" 
        size="sm"
        className="rounded-full h-10 bg-[#dcdcdc] hover:bg-[#d0d0d0]"
      >
        <a 
          href="https://react.dev" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          ⚛ React
        </a>
      </Button>
      
      <div className="flex-1" />
      
      <Button 
        asChild 
        variant="ghost" 
        size="icon"
        className="rounded-full h-10 w-10"
      >
        <a 
          href="https://twitter.com/PontusAurdal" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          𝕏
        </a>
      </Button>
      
      <Button 
        asChild 
        variant="ghost" 
        size="icon"
        className="rounded-full h-10 w-10"
      >
        <a 
          href="https://github.com/Pwntus/change-hairstyle-ai" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </Button>
    </footer>
  )
}
