"use client"

import { useEffect, useState } from "react"

/**
 * Scroll progress hook — returns scroll position as a 0-1 value
 * of the total page scroll. Used for parallax effects.
 *
 * Also provides scrollY (raw pixels) and scrollDirection.
 */
export function useScrollProgress() {
  const [scrollY, setScrollY] = useState(0)
  const [progress, setProgress] = useState(0)
  const [direction, setDirection] = useState<"up" | "down">("down")

  useEffect(() => {
    let lastY = 0
    let ticking = false

    const update = () => {
      const y = window.scrollY
      const max = document.documentElement.scrollHeight - window.innerHeight
      const p = max > 0 ? y / max : 0

      setScrollY(y)
      setProgress(Math.min(1, Math.max(0, p)))
      setDirection(y > lastY ? "down" : "up")
      lastY = y
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    update()

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return { scrollY, progress, direction }
}

/**
 * Element-relative scroll hook — returns how far an element is
 * from the viewport center, normalized to 0-1. Useful for
 * per-card parallax effects.
 */
export function useElementScroll<T extends HTMLElement>(offset = 0) {
  const [ref, setRef] = useState<T | null>(null)
  const [elementProgress, setElementProgress] = useState(0)

  useEffect(() => {
    if (!ref) return

    let ticking = false

    const update = () => {
      const rect = ref.getBoundingClientRect()
      const viewportCenter = window.innerHeight / 2
      const elementCenter = rect.top + rect.height / 2
      const distance = viewportCenter - elementCenter + offset
      const normalized = distance / window.innerHeight
      setElementProgress(Math.min(1, Math.max(-1, normalized)))
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)
    update()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
    }
  }, [ref, offset])

  return { ref: setRef, elementProgress }
}
