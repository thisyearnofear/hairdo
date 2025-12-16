"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Github } from "lucide-react"
import { ConnectKitButton } from "connectkit"

export function Header() {
  return (
    <header className="py-8 flex flex-col md:flex-row items-center gap-4">
      <Image 
        src="/img/logo.svg" 
        alt="Logo" 
        width={42} 
        height={42} 
        className="flex-shrink-0"
      />
      <h1 className="text-2xl font-normal ml-0 md:ml-4">HAIRDO</h1>
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <ConnectKitButton />
        <Button 
          asChild 
          variant="ghost" 
          size="icon"
          className="rounded-full h-10 w-10"
        >
          <a 
            href="https://github.com/thisyearnofear/hairdo" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Github className="w-5 h-5" />
          </a>
        </Button>
      </div>
    </header>
  )
}
