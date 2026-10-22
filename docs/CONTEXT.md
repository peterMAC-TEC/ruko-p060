# Ruko: context for any AI assistant

Paste this whole file at the start of a chat. It is accurate as of 22 Oct 2026. Where it conflicts with `docs/DECISIONS.md` in the repo, DECISIONS wins.

## What Ruko is

Ruko ("stop" in Hindi) is a hackathon web app (a PWA) that helps older adults stop impersonation scams such as "digital arrest" (a fake CBI, police or customs officer keeps the victim on a call and pushes them to transfer savings) before money moves.

- Hackathon: ForgeX 2.0, problem card **P060**, Mythic tier, track Money (fintech, insurance, cross-border). Deadline: submission and live demo on **28 Oct 2026**. One person builds it, who is not a developer.
- **North star metric:** the share of role-played scam calls where the older person stops before transferring.
- **Build expectation:** test with ten older adults and their families using role-played scams. The protocol is in `docs/FIELD-TEST.md`.
- **Constraints from the card:** privacy and consent, **no call interception without permission**, and false alarms.
- **Who it is for (ICP):** adults aged 65 to 85 anywhere in India, often not at ease with UPI. They are often still professionals, so they are targets. Their families and bank fraud teams are secondary users.
- **Languages for the MVP:** English and Hinglish (Hindi in Roman letters). A Hindi (Devanagari) toggle exists but is not the focus.
- **Links:** live app https://ruko-seven.vercel.app. Repo (private): https://github.com/peterMAC-TEC/ruko-p060. Deployed on Vercel (region Mumbai) with Supabase (Mumbai) as the database.

## Hard rules (do not break)

1. **Consent first.** No call interception or recording. Store signal codes, not audio or transcripts of real people.
2. **The scammer bot** only "calls" pre-registered, consenting participants. The stop word **"RUKO"** ends the call instantly. It never asks for real OTPs, cards, Aadhaar or passwords, uses no real officer names, badges or logos, and money only moves on a mock bank screen.
3. **Elder UX:** body text 20px or larger, buttons 64px or taller, one action per screen, words not icons, never shame the user, always show the 1930 helpline and cybercrime.gov.in.
4. **AI only reads or words things; code decides.** Everything works offline with no AI key.
5. **No financial or investment advice.**
6. **Secrets** live only in `app/.env.local` (never committed, never printed). The user must still replace the Supabase secret key (it was pasted in chat once) and save a new Gemini key.
7. **Free options only for now.** Ask before any paid service.
8. Label seeded or demo data versus real trial data wherever it appears.

## What is built (all works today)

| Part | What it does | Where |
|---|---|---|
| **Is this a scam?** (`/check`) | Guided check: who is calling, five yes/no questions, optional "tell me what they said" (voice or text) and "show me a photo" read by Gemini. Shows a huge red **STOP** screen at 2 yes answers (1 or 3 by sensitivity). | `lib/radar.ts`, `lib/patterns.ts`, `data/scam-patterns.json` (v2), `lib/signs.ts`, `lib/ai/*` |
| **Number risk** | Pre-call score for a number (1600 and 140 series, international, community reports stored as salted hashes). | `lib/numberRisk.ts`, `/api/number` |
| **Ruko Companion** (`/companion`) | After STOP and "Hang up", a calm one-question-at-a-time guide, spoken and on screen. Tells the family how it is going as status codes. | `lib/companion.ts`, `components/companion/*` |
| **Family Safety Circle** | Up to 3 trusted people, hashed code word, "Tell my family" silent alert, family alert screen with a "what to say" script, WhatsApp fallback. | `/circle`, `/family`, `lib/circle.ts` |
| **Money Lock and bank friction** | Mock bank (`/bank`), 17 rules (`lib/rules.ts`), cooling-off screen, trusted-person approval for 70+ and large payments, duress PIN, mule-account intelligence, fraud desk (`/console`). | `lib/payments.ts`, `lib/threat.ts` |
| **Threat engine** | 17 tactics on a 7-stage kill chain, log-odds fusion, hash-chained evidence log. | `lib/threat.ts`, `lib/integrity.ts` |
| **Trial lab** (`/lab`, `/results`) | Enrol participants, run role-played scam and control calls, log the furthest step reached (0 to 7), results dashboard with confidence intervals and McNemar test. Primary outcome: **stopped before pay**. | `lib/trial.ts`, `lib/lab.ts`, `data/drill-scripts.json` |
| **The bots** | Scammer bot (script spine plus replies; plays the caller in the lab), defender bot (verify, boundary, written, exit), simulator `npm run sim` as a regression test, Companion bot, **survey bot** (kinds: participant, family, open QR link, incident; scrubs personal data; CSV export). | `lib/bots/*`, `lib/survey.ts`, `docs/BOTS.md` |
| **Ruko Line** (`/line`, new) | Call gatekeeper decision engine. Grades an incoming number green, yellow, orange or red. Green goes straight through. Others are screened by a calm assistant (who are you; give a number and I will ring back on the official one). Outcome: **put through**, **took a message**, or **blocked** (number goes on the person's block list, family alerted, Money Lock only if money or a code was asked). The server replays the call, so a decision cannot be forged. | `lib/line.ts`, `/api/line/screen`, `docs/LINE.md` |
| **Surveys, impact, help** | `/survey`, `/impact` (anonymous metrics), `/help` ("I've been scammed" golden-hour steps). | |

Design system "Ink": white paper, ink black, one grey, hairlines, red only for danger; Newsreader light serif for big words, Public Sans for the interface. See `docs/DESIGN.md`.

## Tech

Next.js 16 (App Router, `cacheComponents`, `proxy.ts`; APIs differ from older Next, read `node_modules/next/dist/docs/` before changing framework code), React 19, Tailwind 4, TypeScript, zod 4, Supabase (RLS on, service-role key server-only; migrations 0001 to 0011; in-memory fallback when keys are absent), Gemini via `@google/genai` (free tier, about 20 requests a day on the best model; model fallback chain), Vercel. Code is in `app/`, documents in `docs/`, data in `data/`.

Commands (run from the repo root):
- Dev: `npm --prefix app run dev -- -p 3200`
- Presenter mode (no keys, in-memory data, no AI): `npm --prefix app run demo:offline` (port 3300)
- Tests: `npm --prefix app test` (all `scripts/check-*.ts`; about 250 checks across 10 suites)
- Simulator: `npm --prefix app run sim`

## What is deliberately NOT built

- **Answering, holding or connecting real calls.** A web app or normal phone app cannot do this, and the card forbids interception without consent. Real routes (not chosen yet): a Ruko forwarding number via Twilio or Vapi (paid, needs legal advice), or a native Android call-screening app (can grade and block, cannot converse).
- **Scraping caller data** from Truecaller and similar (against their terms).
- A bot that phones the elder or family, live voice cloning, Devanagari in the Companion and surveys, a persistent call log for Ruko Line.
- The Expo Android app and any risky Android permission (overlay, accessibility, notification listener, usage access) until the user approves.

## Status and next steps

Done: merge of two builds, live deployment, AI check with offline fallback, Companion, bots and simulator, surveys, Ink redesign, Ruko Line (committed and pushed, not yet redeployed to the live link).

Open:
1. User to replace the Supabase secret key and save a new Gemini key in `app/.env.local`; then copy to Vercel.
2. Redeploy so `/line` is live.
3. Decide the real-call route (Ruko number vs native Android).
4. Run the 10-elder field test (`docs/FIELD-TEST.md`), record a backup demo video, add the 2-minute demo flow including Ruko Line.
5. Two Supabase advisor warnings (mutable `search_path` on two functions).

## How to work with the owner

Not a developer: short, plain reports, one setup step at a time, say plainly what works and what does not. Show a plan before anything that changes the brief. Build in milestones, run tests, commit. Log judgement calls in `docs/DECISIONS.md`. Do not touch other projects in the parent folder.
