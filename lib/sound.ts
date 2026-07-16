/**
 * Tiny Web Audio sound synthesis — cuelume-inspired, zero dependencies.
 * Every cue is synthesized live with Web Audio. No files, no deps.
 *
 * Usage:
 *   import { play } from "@/lib/sound"
 *   play("press")      // button press
 *   play("success")    // attestation recorded
 *   play("toggle")     // checkbox toggle
 *   play("chime")      // recommendations arrived
 *
 * Sounds are opt-in: if the user hasn't interacted with the page yet,
 * the AudioContext won't be allowed by the browser. We lazily create
 * it on first play() call. If reduced-motion is preferred, we skip.
 */

type CueName =
  | "press"
  | "release"
  | "toggle"
  | "success"
  | "chime"
  | "tick"
  | "error"
  | "page"

let ctx: AudioContext | null = null
let enabled = true

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null
  if (!ctx) {
    try {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)()
    } catch {
      return null
    }
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === "suspended") {
    void ctx.resume()
  }
  return ctx
}

/** Check if the user prefers reduced motion — also disables sound */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Enable or disable sounds globally */
export function setSoundEnabled(value: boolean) {
  enabled = value
}

/** Is sound currently enabled? */
export function isSoundEnabled() {
  return enabled
}

/** Create an oscillator with an exponential gain envelope */
function tone(
  audioCtx: AudioContext,
  opts: {
    freq: number
    type?: OscillatorType
    duration?: number
    gain?: number
    delay?: number
    glideTo?: number
  }
) {
  const {
    freq,
    type = "sine",
    duration = 0.08,
    gain = 0.06,
    delay = 0,
    glideTo,
  } = opts

  const t = audioCtx.currentTime + delay
  const osc = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (glideTo) {
    osc.frequency.exponentialRampToValueAtTime(glideTo, t + duration)
  }

  // Exponential gain envelope — natural decay (never linear to 0)
  gainNode.gain.setValueAtTime(0.001, t)
  gainNode.gain.exponentialRampToValueAtTime(gain, t + 0.005)
  gainNode.gain.exponentialRampToValueAtTime(0.001, t + duration)

  osc.connect(gainNode)
  gainNode.connect(audioCtx.destination)

  osc.start(t)
  osc.stop(t + duration + 0.02)
}

/** Two-tone chime — root + fifth */
function chime(audioCtx: AudioContext, baseFreq: number) {
  tone(audioCtx, { freq: baseFreq, type: "sine", duration: 0.12, gain: 0.05 })
  tone(audioCtx, {
    freq: baseFreq * 1.5,
    type: "sine",
    duration: 0.15,
    gain: 0.04,
    delay: 0.04,
  })
}

/** Success — ascending arpeggio (root, third, fifth) */
function successSound(audioCtx: AudioContext) {
  const base = 523.25 // C5
  tone(audioCtx, { freq: base, type: "sine", duration: 0.1, gain: 0.05 })
  tone(audioCtx, {
    freq: base * 1.26, // E5
    type: "sine",
    duration: 0.1,
    gain: 0.05,
    delay: 0.06,
  })
  tone(audioCtx, {
    freq: base * 1.5, // G5
    type: "sine",
    duration: 0.18,
    gain: 0.05,
    delay: 0.12,
  })
}

/** Error — descending minor third */
function errorSound(audioCtx: AudioContext) {
  const base = 311.13 // Eb4
  tone(audioCtx, { freq: base, type: "triangle", duration: 0.12, gain: 0.05 })
  tone(audioCtx, {
    freq: base * 0.841, // C4 (minor third down)
    type: "triangle",
    duration: 0.18,
    gain: 0.05,
    delay: 0.08,
  })
}

/** Soft tick for hover/scroll */
function tickSound(audioCtx: AudioContext) {
  tone(audioCtx, {
    freq: 1200,
    type: "square",
    duration: 0.02,
    gain: 0.015,
  })
}

/** Play a named cue */
export function play(cue: CueName) {
  if (!enabled || prefersReducedMotion()) return

  const audioCtx = getCtx()
  if (!audioCtx) return

  switch (cue) {
    case "press":
      tone(audioCtx, {
        freq: 280,
        type: "sine",
        duration: 0.05,
        gain: 0.04,
        glideTo: 180,
      })
      break
    case "release":
      tone(audioCtx, {
        freq: 180,
        type: "sine",
        duration: 0.04,
        gain: 0.03,
        glideTo: 240,
      })
      break
    case "toggle":
      tone(audioCtx, {
        freq: 600,
        type: "sine",
        duration: 0.04,
        gain: 0.03,
        glideTo: 900,
      })
      break
    case "success":
      successSound(audioCtx)
      break
    case "chime":
      chime(audioCtx, 659.25) // E5
      break
    case "tick":
      tickSound(audioCtx)
      break
    case "error":
      errorSound(audioCtx)
      break
    case "page":
      tone(audioCtx, {
        freq: 400,
        type: "sine",
        duration: 0.06,
        gain: 0.03,
        glideTo: 300,
      })
      break
  }
}
