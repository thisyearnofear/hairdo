"use client";

import { useEffect, useRef } from "react";

/**
 * P2-2 Ambient cursor trail (BertovDev/cursor-shader-trail steal, CSS-light
 * edition). A fading ribbon of amber dots follows the pointer — pure ambience,
 * zero interaction. Renders nothing unless `pointer: fine` + no
 * `prefers-reduced-motion`. Canvas is fixed, pointer-events-none, low alpha.
 */
type Dot = { x: number; y: number; life: number };

export function AmbientTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.matchMedia?.("(pointer: fine)").matches) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let dots: Dot[] = [];
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: PointerEvent) => {
      dots.push({ x: e.clientX * dpr, y: e.clientY * dpr, life: 1 });
      if (dots.length > 60) dots = dots.slice(-60);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dots = dots.filter((d) => d.life > 0);
      for (const d of dots) {
        d.life -= 0.03;
        const r = 3 * dpr * d.life + 0.5;
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(38, 70%, 55%, ${0.22 * d.life})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[5]"
    />
  );
}
