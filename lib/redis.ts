import { Redis } from "@upstash/redis";

/**
 * Shared Upstash Redis client.
 *
 * Reads current standard vars first, falls back to legacy Vercel KV vars
 * for existing deployments:
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN (preferred)
 *   KV_REST_API_URL / KV_REST_API_TOKEN (legacy, migrate away)
 *
 * Returns null when no vars are set (local dev → callers use in-memory fallback).
 */

let redis: Redis | null = null;

export function getRedis(): Redis | null {
  if (redis) return redis;

  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;

  redis = new Redis({ url, token });
  return redis;
}

export const attestationKey = (tokenId: string) => `attestation:${tokenId}`;
export const userAttestationsKey = (address: string) =>
  `user:${address.toLowerCase()}:attestations`;

// ─── Consult sessions (server side of lib/consult-session.ts) ───────────
// Same key shape as the client hook: consult:{namespace}:{owner}, so a
// consult started on the phone can be picked up on glasses (and vice versa)
// once a surface syncs through these helpers. Null-safe: returns null/false
// when Redis is unconfigured (local dev) or the stored value is stale.
import type { ConsultSession } from "@/lib/consult-session";
import { isConsultSession } from "@/lib/consult-session";

export const consultSessionKey = (namespace: string, owner: string) =>
  `consult:${namespace}:${owner}`;

export async function getConsultSession<P extends string>(
  namespace: string,
  owner: string
): Promise<ConsultSession<P> | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const raw = await redis.get(consultSessionKey(namespace, owner));
    const parsed: unknown =
      typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!isConsultSession(parsed)) return null;
    return parsed as ConsultSession<P>;
  } catch {
    return null;
  }
}

export async function setConsultSession<P extends string>(
  namespace: string,
  owner: string,
  session: ConsultSession<P>,
  ttlSeconds = 7 * 24 * 3600
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) return false;
  try {
    await redis.set(consultSessionKey(namespace, owner), JSON.stringify(session), {
      ex: ttlSeconds,
    });
    return true;
  } catch {
    return false;
  }
}
