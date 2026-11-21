"use client";

import dynamic from "next/dynamic";
import { type ReactNode } from "react";

// Wagmi + connectors are only downloaded when the user touches onchain UI.
// Guest flow (recommend → visualize → save → growth) never pays this cost.
const Web3Provider = dynamic(
  () => import("@/components/Web3Provider").then((m) => m.Web3Provider),
  { ssr: false }
);

export const ONCHAIN_ENABLED =
  process.env.NEXT_PUBLIC_ONCHAIN_ENABLED !== "0";

export function LazyWeb3Provider({ children }: { children: ReactNode }) {
  if (!ONCHAIN_ENABLED) return <>{children}</>;
  return <Web3Provider>{children}</Web3Provider>;
}
