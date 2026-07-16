"use client"

import { ReactNode, useEffect, useRef, useState, CSSProperties, ElementType } from "react"

/**
 * Reveal — IntersectionObserver-driven cinematic entrance.
 * Content fades and rises into view as it enters the viewport.
 *
 * direction: "up" (default), "down", "left", "right", "scale", "blur"
 * delay: ms delay before animation starts (after entering viewport)
 * threshold: 0-1, how much of the element must be visible
 * once: if true, animates only once (default). if false, re-animates on re-entry
 *
 * Usage:
 * <Reveal direction="up" delay={100}>
 *   <h2>Section title</h2>
 * </Reveal>
 */

type RevealDirection = "up" | "down" | "left" | "right" | "scale" | "blur" | "fade"

interface RevealProps {
  children: ReactNode
  direction?: RevealDirection
  delay?: number
  threshold?: number
  once?: boolean
  className?: string
  style?: CSSProperties
  as?: ElementType
}

const initialTransforms: Record<RevealDirection, string> = {
  up: "translateY(40px)",
  down: "translateY(-40px)",
  left: "translateX(40px)",
  right: "translateX(-40px)",
  scale: "scale(0.92)",
  blur: "translateY(20px)",
  fade: "translateY(0)",
}

export function Reveal({
  children,
  direction = "up",
  delay = 0,
  threshold = 0.15,
  once = true,
  className = "",
  style,
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion — show immediately
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Promise.resolve().then(() => setVisible(true))
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setVisible(true), delay)
          } else {
            setVisible(true)
          }
          if (once) observer.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold, once])

  const isBlur = direction === "blur"

  return (
    <Tag
      ref={ref as never}
      className={className}
      style={{
        ...style,
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0, 0) scale(1)" : initialTransforms[direction],
        filter: isBlur ? (visible ? "blur(0px)" : "blur(12px)") : undefined,
        transition: `opacity 600ms cubic-bezier(0.2, 0, 0, 1), transform 600ms cubic-bezier(0.2, 0, 0, 1), filter 600ms cubic-bezier(0.2, 0, 0, 1)`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </Tag>
  )
}

/**
 * RevealStagger — wraps a list of children and reveals them
 * one by one with a stagger delay.
 */
interface RevealStaggerProps {
  children: ReactNode
  stagger?: number // ms between each child
  threshold?: number
  className?: string
  direction?: RevealDirection
}

export function RevealStagger({
  children,
  stagger = 80,
  threshold = 0.1,
  className = "",
  direction = "up",
}: RevealStaggerProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      Promise.resolve().then(() => setVisible(true))
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, i) => (
            <div
              key={i}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible
                  ? "translate(0, 0) scale(1)"
                  : initialTransforms[direction],
                transition: `opacity 500ms cubic-bezier(0.2, 0, 0, 1) ${i * stagger}ms, transform 500ms cubic-bezier(0.2, 0, 0, 1) ${i * stagger}ms`,
                willChange: "opacity, transform",
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  )
}
