# Validation sprint — pro-wedge concierge test (2–3 weeks, no new infra)

Goal: answer one question — **does the rebook nudge bring anyone back?**
You run the tool, the professional runs the chair. No code beyond what's
shipped unless the sprint demands it.

## Setup (5 shops max, 3 minimum)

- Target: independent barbers/stylists who already rebook by memory or
  paper. One chair each; owner-operators preferred (they feel the no-show
  pain directly).
- Offer: free consult tool + retouch reminders for their clients for the
  sprint. Ask for 10 minutes after a cut to run the flow.

## Concierge script (per cut, ~10 min)

1. Run the recommend flow with the client; read the pick reason out loud
   (the advisor beat from the hackathon demo).
2. Save the cut (attestation optional — guest-first; don't let the wallet
   slow down a chair).
3. Confirm the client's retouch window from the growth-agent estimate.
4. When the window opens, the nudge goes out (manual message is fine —
   the sprint tests the *loop*, not the automation).
5. Log: cut date, window, nudge sent date, rebooked? (y/n + days late).

## The only metric that matters

**Rebook rate on nudged windows vs. the shop's baseline** (ask each shop
their rough return rate up front — most know it). Track in a sheet:

| shop | cuts logged | nudges sent | rebooked | baseline | notes |
| ---- | ----------- | ----------- | -------- | -------- | ----- |

## Kill / go criteria (set before starting, judged after)

- **GO:** ≥3 shops run it weekly unprompted by week 3, and nudged rebooks
  beat baseline in at least 2 of them → build Phase B (barbershop phases
  on real events) then the SMS renderer.
- **PIVOT:** shops like the consult but ignore rebooking → the engine may
  be licensable consult-card tooling, or sponsored PFA-style tooling via
  the Wardah relationship — not a SaaS.
- **KILL the wedge:** no shop runs it weekly → stop building pro tooling;
  do not fall back to adding consumer features.

## Sponsor follow-up (send within 48h of the event)

> Subject: What we built on your PFA brief — HAIRDO on glasses
>
> Hi [name] — we entered the Wardah Personal Face Analysis challenge at
> Worn and built our consultation engine for the advisor's side of the
> chair: the PFA result and placement cues float on the glasses while the
> client sees her preview on the phone. Repo + demo [link]. Your catalog
> data (Colorfit 10 Lively Coral, the match-code schema) held up great.
> If sponsored PFA-style tooling is ever interesting on your side, we'd
> love to compare notes. — [you]

Personalize with the actual judge/organizer name and the real demo link.
One email, no deck, no ask beyond a conversation.
