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

## Updated figures (23 Oct 2026), with sources

- Digital arrest, India: 1,23,672 complaints and ₹1,935 crore lost (2024); 58,239 and ₹1,211 crore (2025); over 21,900 and ₹647 crore (Jan to Aug 2026). I4C and MHA status report to the Supreme Court, reported by Free Press Journal, 23 Oct 2026. (ThePrint, 18 Feb 2026, reported a different I4C cut for 2025: 17,264 cases, ₹644 crore; 2023: 60,676 cases.)
- All financial cyber fraud: 19.19 lakh complaints, ₹22,849 crore (2024); 21.78 lakh complaints, ₹19,813 crore (2025). I4C/NCRP data, reported by The420.in, 3 Jan 2026. About ₹6,300 a second in 2025 (our arithmetic).
- Senior citizens, 2025: 1,03,488 complaints, about ₹4,005 crore (MHA reply, Rajya Sabha, via Asianet Newsable).
- The AI wave (our assumption, with evidence): deepfake fraud attempts +1,300% in 2024 and synthetic voice calls +173% from Q1 to Q4 2024 (Pindrop, 12 Jun 2025); generative-AI fraud losses in the US projected to rise from $12.3 billion (2023) to $40 billion (2027) (Deloitte, 29 May 2024); a Hong Kong finance worker paid out about US$25 million after a deepfake video call (Hong Kong police, CNN, Feb 2024). AI makes faking a voice or a face cheap on phones and laptops; Ruko does not depend on spotting the fake, so it still protects the payment when the fake is perfect.
