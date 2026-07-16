"use client"

import { ReactNode, CSSProperties } from "react"
import { useScrollProgress } from "@/lib/hooks/useScroll"

/**
 * Parallax — wraps children and moves them at a different rate
 * than the scroll, creating depth.
 *
 * speed: 0 = no movement, 1 = moves with scroll, -1 = moves opposite
 * Typical: 0.1-0.3 for subtle background depth
 */
interface ParallaxProps {
  children: ReactNode
  speed?: number
  className?: string
  style?: CSSProperties
}

export function Parallax({ children, speed = 0.2, className = "", style }: ParallaxProps) {
  const { scrollY } = useScrollProgress()

  return (
    <div
      className={className}
      style={{
        ...style,
        transform: `translateY(${scrollY * speed}px)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  )
}

/**
 * ParallaxLayer — for background layers that should drift at
 * different speeds. Uses absolute positioning.
 */
interface ParallaxLayerProps {
  children: ReactNode
  speed?: number
  className?: string
  style?: CSSProperties
}

export function ParallaxLayer({ children, speed = 0.15, className = "", style }: ParallaxLayerProps) {
  const { scrollY } = useScrollProgress()

  return (
    <div
      className={`absolute inset-0 ${className}`}
      style={{
        ...style,
        transform: `translate3d(0, ${scrollY * speed}px, 0)`,
        willChange: "transform",
      }}
    >
      {children}
    </div>
  )
}
