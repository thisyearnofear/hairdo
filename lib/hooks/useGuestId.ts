"use client";

import { useState } from "react";

const KEY = "hairdo:guest-id";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id) {
      id = makeId();
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return makeId();
  }
}

/** Stable anonymous id stored in localStorage. No wallet required. */
export function useGuestId(): string | null {
  const [guestId] = useState<string | null>(loadId);
  return guestId;
}
