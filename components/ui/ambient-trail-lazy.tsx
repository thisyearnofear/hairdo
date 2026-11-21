"use client";

import dynamic from "next/dynamic";

// P2-2 ambient trail — client-only chunk, self-guards (pointer:fine + motion).
// Split into a Client Component because `ssr: false` is not allowed in the
// Server Component layout; layout statically imports this tiny wrapper.
const AmbientTrail = dynamic(
  () => import("@/components/ui/ambient-trail").then((m) => m.AmbientTrail),
  { ssr: false }
);

export function AmbientTrailLazy() {
  return <AmbientTrail />;
}
