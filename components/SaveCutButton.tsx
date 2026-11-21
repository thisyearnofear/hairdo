"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";

export interface SavedCut {
  tokenId: string;
  styleId: string;
  styleName: string;
  timestamp: number;
  onchain: boolean;
  txVerified: boolean;
}

export function SaveCutButton({
  styleId,
  styleName,
  hairType,
  guestId,
  walletAddress,
  onSaved,
}: {
  styleId: string;
  styleName: string;
  hairType: string;
  guestId: string | null;
  walletAddress?: string | null;
  onSaved: (cut: SavedCut) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSave = Boolean(guestId || walletAddress) && !saving && !saved;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/attest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styleId,
          hairType,
          ...(walletAddress ? { userAddress: walletAddress } : { userId: guestId }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Save failed (${res.status})`);
      }
      const cut = (await res.json()) as SavedCut;
      setSaved(true);
      onSaved(cut);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save this cut");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handleSave}
        disabled={!canSave}
        variant="secondary"
        size="sm"
        className="w-full text-xs tracking-wide"
      >
        {saving ? (
          <>
            <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Saving…
          </>
        ) : saved ? (
          <>
            <Check className="w-3 h-3 mr-2" /> Saved to your history
          </>
        ) : (
          "Save this cut — no wallet needed"
        )}
      </Button>
      {!guestId && !walletAddress ? (
        <p className="text-[10px] opacity-40 text-center">Starting your private history…</p>
      ) : null}
      {error ? (
        <p className="text-[11px] text-red-400/80 text-center">{error}</p>
      ) : null}
      {saved ? (
        <p className="text-[10px] opacity-50 text-center font-display italic">
          Powers your growth timeline. Mint it onchain anytime.
        </p>
      ) : null}
    </div>
  );
}
