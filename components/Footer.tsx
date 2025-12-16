"use client"

import { Button } from "@/components/ui/button"

export function Footer() {
  return (
    <footer className="mt-16 p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-3 text-[10px] tracking-wider uppercase opacity-60">
        <a 
          href="https://replicate.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-100 transition-opacity"
        >
          Replicate
        </a>
        <span className="w-px h-3 bg-white/20" />
        <a 
          href="https://vercel.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-100 transition-opacity"
        >
          Vercel
        </a>
        <span className="w-px h-3 bg-white/20" />
        <a 
          href="https://lisk.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-100 transition-opacity"
        >
          Lisk
        </a>
      </div>
      
      <div className="flex-1" />
      
      {/* Social Icons */}
      <div className="flex items-center gap-2">
        <Button 
          asChild 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-white/10"
        >
          <a 
            href="https://x.com/papajimjams" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="X (Twitter)"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
        </Button>
        
        <Button 
          asChild 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-white/10"
        >
          <a 
            href="https://farcaster.xyz/papa" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Farcaster"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M18.5 2h-13A3.5 3.5 0 0 0 2 5.5v13A3.5 3.5 0 0 0 5.5 22h13a3.5 3.5 0 0 0 3.5-3.5v-13A3.5 3.5 0 0 0 18.5 2zm-3 17h-7v-8h7v8zm0-10h-7V6h7v3z"/>
            </svg>
          </a>
        </Button>
        
        <Button 
          asChild 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-white/10"
        >
          <a 
            href="https://github.com/thisyearnofear/hairdo" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="GitHub"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
        </Button>
      </div>
    </footer>
  )
}
