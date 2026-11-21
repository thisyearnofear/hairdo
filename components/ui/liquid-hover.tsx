"use client";

import type { ReactNode } from "react";

/**
 * P1-1 Liquid lens hover (angelolibero/liquid-lens steal, CSS/SVG only).
 * Gooey amber blobs drift behind the card art on hover — decorative only,
 * never blocks clicks. Hidden on touch + reduced-motion via CSS.
 */
export function LiquidHover({ children }: { children: ReactNode }) {
  return (
    <span className="liquid-hover group/liquid relative block overflow-hidden rounded-lg">
      <svg
        className="liquid-goo absolute inset-0 h-full w-full opacity-0 transition-opacity duration-300 group-hover/liquid:opacity-100"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <filter id="hairdo-goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix
              in="blur"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
          </filter>
        </defs>
        <g filter="url(#hairdo-goo)">
          <circle cx="30%" cy="60%" r="28" fill="hsl(38 70% 55% / 0.32)" className="goo-a" />
          <circle cx="70%" cy="40%" r="20" fill="hsl(18 55% 42% / 0.28)" className="goo-b" />
        </g>
      </svg>
      <span className="relative block">{children}</span>
    </span>
  );
}
