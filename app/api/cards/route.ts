import { NextRequest, NextResponse } from "next/server";
import {
  pfaToConsultCards,
  isConsultCard,
  type ConsultCard,
  type PfaSample,
} from "@/lib/consult-cards";
import { growthToConsultCard } from "@/lib/growth-cards";
import type { GrowthStatus } from "@/lib/hooks/useGrowthAgent";

/**
 * POST /api/cards — one event in, ConsultCards out.
 * The single source of truth for card mapping: /glasses, the growth agent,
 * and future channels (push, SMS, MiniPay) consume these cards instead of
 * each mapping raw payloads themselves. Every card is re-validated with
 * isConsultCard before it leaves the server.
 *
 * Events:
 * - { event: "pfa.completed", pfa: PfaSample } → 4 phase cards
 * - { event: "retouch.due", status: GrowthStatus } → 0-1 follow-up card
 */
export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();
    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Expected a JSON object" }, { status: 400 });
    }
    const { event } = body as { event?: unknown };

    let cards: ConsultCard[];
    if (event === "pfa.completed") {
      const { pfa } = body as { pfa?: unknown };
      cards = pfaToConsultCards(pfa as PfaSample);
    } else if (event === "retouch.due") {
      const { status } = body as { status?: unknown };
      const card = growthToConsultCard(status as GrowthStatus);
      cards = card ? [card] : [];
    } else {
      return NextResponse.json(
        { error: "Unknown event — want pfa.completed or retouch.due" },
        { status: 400 }
      );
    }

    if (!cards.every(isConsultCard)) {
      return NextResponse.json(
        { error: "Payload produced invalid cards" },
        { status: 400 }
      );
    }
    return NextResponse.json({ cards });
  } catch (e) {
    console.error("Cards API error:", e);
    return NextResponse.json({ error: "Failed to build cards" }, { status: 400 });
  }
}
