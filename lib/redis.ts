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
