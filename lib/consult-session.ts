"use client";

import { useEffect, useState } from "react";

/**
 * Consult-session machine — one phase state for every consult surface.
 *
 * Any phased flow (PFA→PICK→PLACE→DONE, CONSULT→CUT→VERIFY→REBOOK) declares
 * its phases and gets: advance/back/goTo, localStorage persistence across
 * reload, and a server-syncable shape (see consult helpers in lib/redis.ts).
 * /glasses, PhaseStamps flows, and future barber surfaces all share this —
 * no more one-off index state per page.
 */

export const CONSULT_SESSION_VERSION = 1;

export interface ConsultSession<P extends string = string> {
  version: typeof CONSULT_SESSION_VERSION;
  id: string;
  phases: P[];
  index: number;
  updatedAt: number;
}

export function createSession<P extends string>(
  phases: readonly P[],
  id: string,
  now: number = Date.now()
): ConsultSession<P> {
  return {
    version: CONSULT_SESSION_VERSION,
    id,
    phases: [...phases],
    index: 0,
    updatedAt: now,
  };
}

/** Current phase id. */
export function currentPhase<P extends string>(s: ConsultSession<P>): P {
  return s.phases[s.index];
}

function touch<P extends string>(
  s: ConsultSession<P>,
  index: number,
  now: number = Date.now()
): ConsultSession<P> {
  if (index === s.index) return s;
  return { ...s, index, updatedAt: now };
}

/** Step forward, clamped at the last phase. */
export function advance<P extends string>(s: ConsultSession<P>): ConsultSession<P> {
  return touch(s, Math.min(s.phases.length - 1, s.index + 1));
}

/** Step back, clamped at the first phase. */
export function back<P extends string>(s: ConsultSession<P>): ConsultSession<P> {
  return touch(s, Math.max(0, s.index - 1));
}

/** Jump to a phase id (unknown ids are ignored). */
export function goTo<P extends string>(
  s: ConsultSession<P>,
  phase: P
): ConsultSession<P> {
  const i = s.phases.indexOf(phase);
  return i === -1 ? s : touch(s, i);
}

/**
 * Sync helper for *derived* phases (e.g. StyleAdvisor's phaseForFlow):
 * moves the session to `phase` only when it differs. Lets flow-derived
 * UIs share the machine without fighting it.
 */
export function syncSessionToPhase<P extends string>(
  s: ConsultSession<P>,
  phase: P
): ConsultSession<P> {
  return currentPhase(s) === phase ? s : goTo(s, phase);
}

/** Boundary guard — validate unknown input (storage, API, postMessage). */
export function isConsultSession(v: unknown): v is ConsultSession {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    s.version === CONSULT_SESSION_VERSION &&
    typeof s.id === "string" &&
    s.id.length > 0 &&
    Array.isArray(s.phases) &&
    s.phases.length > 0 &&
    s.phases.every((p) => typeof p === "string") &&
    typeof s.index === "number" &&
    Number.isInteger(s.index) &&
    s.index >= 0 &&
    s.index < (s.phases as unknown[]).length &&
    typeof s.updatedAt === "number"
  );
}

/** Storage key for a session: namespace (surface) + owner (guestId/wallet). */
export function consultStorageKey(namespace: string, owner: string): string {
  return `consult:${namespace}:${owner}`;
}

function readStored<P extends string>(
  key: string,
  phases: readonly P[]
): ConsultSession<P> | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isConsultSession(parsed)) return null;
    // Same phase set only — a changed flow starts fresh, never half-synced.
    const same =
      parsed.phases.length === phases.length &&
      parsed.phases.every((p, i) => p === phases[i]);
    if (!same) return null;
    return parsed as ConsultSession<P>;
  } catch {
    return null;
  }
}

export interface UseConsultSessionResult<P extends string> {
  session: ConsultSession<P>;
  phase: P;
  advance: () => void;
  back: () => void;
  goTo: (phase: P) => void;
  syncTo: (phase: P) => void;
}

/**
 * Client hook — session state persisted to localStorage under
 * consult:{namespace}:{owner}. SSR-safe (starts fresh on the server).
 */
export function useConsultSession<P extends string>(
  phases: readonly P[],
  namespace: string,
  owner: string
): UseConsultSessionResult<P> {
  const key = consultStorageKey(namespace, owner);
  const [session, setSession] = useState<ConsultSession<P>>(() => {
    if (typeof window === "undefined") return createSession(phases, key);
    return readStored(key, phases) ?? createSession(phases, key);
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(session));
    } catch {
      // Storage full/blocked — session still works for this visit.
    }
  }, [key, session]);

  const [api] = useState(() => ({
    advance: () => setSession((s) => advance(s)),
    back: () => setSession((s) => back(s)),
    goTo: (phase: P) => setSession((s) => goTo(s, phase)),
    syncTo: (phase: P) => setSession((s) => syncSessionToPhase(s, phase)),
  }));

  return { session, phase: currentPhase(session), ...api };
}
