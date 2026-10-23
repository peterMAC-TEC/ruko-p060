# Ruko: submission (paste into a Google Doc, share as "Anyone with the link can view")

**Ruko ("stop" in Hindi) stops digital-arrest scams before money moves.** ForgeX 2.0, problem P060, Money track.
Live: https://ruko-seven.vercel.app · Live call: /demo/live · Architecture: /architecture · Eval: /eval

## The problem
Scammers posing as police keep older people on a call until they pay. ₹22,845 crore was lost to cyber fraud in India in 2024 (MHA, via Scroll); digital-arrest cases went from 60,676 in 2023 to 1,23,672 in 2024 (government reply, via Outlook Money and Inc42). Senior citizens filed 1,03,488 financial fraud complaints in 2025, losing about ₹4,005 crore (MHA, via Asianet Newsable).

## User journeys
1. **The older person (Kamala, 72):** a call rings → the caller pressures her → Ruko says STOP in plain words, with 1930 and cybercrime.gov.in → she hangs up, or, if she still pays, the payment waits.
2. **The family (Priya):** gets a plain alert ("your mother may be on a scam call"), with what to say; approves or refuses a held payment, and approving needs the family code word.
3. **The bank:** asks Ruko Guard before moving money: allow, delay, trusted person, or block, with reasons.

## How AI is used (and where it is not)
**AI reads and words. Code decides.**
- AI **classifies** unclear replies in the live call (with a confidence score; below 0.6 it is ignored), **extracts** warning signs from a photo or "what they said", and **words** the Companion's calm replies.
- **Code decides** everything that matters: the call's next move (a 7-stage state machine), the STOP (a pattern-based scam check), the risk (a threat engine with 17 tactics and log-odds fusion), the payment hold (rules and the code word), and every safety check (a guard that blocks OTP or PIN requests, real agency names, long numbers, violence and abuse).
- Every AI output is validated against a strict schema; on a timeout, failure, low confidence or no network, the rule-only path runs. Everything works offline.

## Measured (synthetic data, `npm run eval`)
Reading replies: rules 75.8%, AI 93.9%, **hybrid 90.9%** (66 replies, 11 classes). Guard: **22 of 22** unsafe AI outputs blocked, 5 of 5 safe ones allowed. Scam check on genuine calls: **0% false alarms**. 120 simulated calls: payment ask reached in time in 120, **0 unsafe lines**. Code steps: under 0.1 ms each; AI round trip about 2.2 s median.

## Tech stack
Next.js 16 (PWA), React 19, Tailwind 4, TypeScript, zod; Supabase (Mumbai, row-level security, signal codes and salted hashes, hash-chained evidence log); OpenRouter (a free Gemma model first, Gemini Flash-Lite as backup); browser speech recognition; recorded natural Indian voices; Vercel. Android call-screening logic in Kotlin (tested, not yet run on a device).

## Research
RBI discussion paper on payment friction (reported April 2026, a draft); DoT's Financial Fraud Risk Indicator; NPCI's UPI Circle; Google's on-device scam detection; Android call screening. See RESEARCH-UPI-BANKS.md.

## Honest limits
The call is simulated inside the app (a web app cannot ring a real phone). The bank is a mock; no real money moves. The eval data is synthetic and ours. No field-test results exist yet; the protocol is ready (10 older adults, with and without Ruko).
