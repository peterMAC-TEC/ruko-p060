# Ruko (ForgeX 2.0, problem P060)

Ruko ("stop" in Hindi) stops digital-arrest scams before money moves.

**Since 20 Oct this app lives in `claud 2/Ruko (P060)/app`** (copied from `C:\dev\hackathon-main`, which is left as it was). The documents are one level up: every `docs/…` path below means `../docs/…`. Git is at `Ruko (P060)/`.

@AGENTS.md

**Read these first:**
- `docs/MASTER_PROMPT.md`: the full spec (strict: build all of it)
- `docs/DECISIONS.md`: the user's answers and the build decisions. **Where it differs from the master prompt, DECISIONS wins.**
- `docs/BLUEPRINT.md`: the research-backed strategy (9 Oct): the 8 pillars, design rules, compliance rules and the build order. Its §6 lists proposed changes to DECISIONS that need the user's OK. The sources are in `docs/research/`.

- `docs/ADVANCEMENT_PROMPT_V2.md` (9 Oct): the user's v2 direction. There are three core features: Scam Radar, Money Lock and Family Shield. `docs/V2_AUDIT_AND_PLAN.md` holds the audit, the Android/iOS platform reality report and the phased plan. **Don't build anything that needs a risky permission (overlay, usage access, notification listener, accessibility) until the user approves it there.**

`_old-policy-xray/` (P056) and `docs/old-problem-analysis.md` were not copied here; never bring them in.

## The brief, in short
- **North star:** the share of role-played scam calls where the person stops before transferring. It's measured with 10 older adults in Bengaluru, comparing a without-Ruko baseline with with-Ruko calls, plus harmless control calls for the false-alarm rate.
- **Four parts, all must-haves:**
  1. Ruko voice check ("Is this call real?")
  2. Family Safety Circle
  3. Bank-side friction (mock transfer, cooling-off screen, fraud console)
  4. Scam simulator + results dashboard
- **Deadline:** submission and live demo on **28 Oct 2026**. Solo, 4–8 hours a day.

## Progress (see the schedule in docs/DECISIONS.md)
- [x] Step 1: scaffold, schema (`supabase/migrations`), seed, mock flags. Supabase project `ruko` (ref udwynjujhglfdhermzvm, Mumbai) is created with the schema applied. **Connected:** the secret key is in `.env.local`, and `lib/store.ts` uses Supabase whenever keys are present (otherwise memory). The demo data seeds itself. The fraud desk still polls; Realtime isn't wired yet. **Rotate the secret key before deploying:** it was pasted in chat on 8 Oct.
- No API keys yet: build everything to work without them (browser speech, scripted dialogue, rules) and treat Claude/Sarvam/ElevenLabs as upgrades.
- [x] Step 2: practice bank (`/bank`), rules engine (`lib/rules.ts`), cooling-off screen, fraud desk (`/console`, polling)
- [x] Step 3: Family Safety Circle: `/circle` (elder: up to 3 people, hashed code word, "Alert my family now"), `/family` (family phone: red alert, sound, vibration, I'm calling / It's fine), auto-alert when the bank holds a payment, `lib/notify.ts` (mock SMS/voice; Twilio-ready but untested). Migration 0002 applied.
- [x] Design pass (8 Oct): premium, low-friction UI. Shared elder components in `components/elder/ui.tsx` (ElderShell with a pinned bottom action, BigButton, StepDots, Avatar, Field); brand mark in `components/brand/RukoMark.tsx`; palette and utilities (`shadow-soft`, `shadow-lift`, `emerald-card`, `tabular`) in `app/globals.css`; lucide icons. **`/demo`** is the guided demo: both phones and the fraud desk side by side with a self-ticking 5-step guide (uses `/bank?embed=1&prefill=scam` and `/family?embed=1`). Keep new screens consistent with these.
- [x] **Blueprint week 1 (9 Oct):**
  - **Accounts:** Supabase Auth, email link plus Google once enabled. `proxy.ts` refreshes the session; `lib/auth.ts` holds the access rules (the demo people are an open sandbox; real people need their own login, a family member who accepted, or bank staff). Pages pick whose Ruko to show via `lib/pages.ts`. Routes: `/login`, `/auth/callback`, `/auth/confirm`, `/auth/signout`.
  - **Onboarding** `/start`: role, profile, one consent per purpose (`lib/consent.ts`, EN/HI, versioned), teach-back.
  - **Family invites:** `/join/[token]`. The invitee accepts, which is their own consent; in the demo sandbox, invites auto-accept.
  - **P1 "Is this call real?"** `/check`: `lib/callcheck.ts` (script phrases EN/HI; test with `npx tsx scripts/check-callcheck.ts`), browser speech, and the verdict. Stores signal codes only.
  - **P2 silent "Tell my family"** on the elder home `/app`; every family alert shows the "What to say" script.
  - **P3:** trusted-person approval for people aged 70+ and payments of ₹50k or more (`approvals`). The protection hold follows the elder across channels until family or the bank clears it (`protection`). FD-break and large-cash signals. All of this is in `lib/rules.ts` (17 checks) and `lib/payments.ts`.
  - Migration 0003 applied.
- [x] **v2 Phase 0/1 on the web (9 Oct)**, no risky permissions:
  - **Scam Radar:** `data/scam-patterns.json` (10 patterns, EN/HI, versioned, served by `/api/patterns`, cached on the device by `usePatternLibrary` in `lib/client.ts`). `lib/radar.ts` runs the guided check on the device (identity tiles, then 5 yes/no questions; STOP at 2 yes, or 1/3 by the sensitivity setting). Test with `npx tsx scripts/check-radar.ts` (21 checks). `/check` → `components/radar/StopScreen.tsx` → `PostCall.tsx` ("Was this a scam?" feeds `/api/number/report`).
  - **Number risk:** `lib/numberRisk.ts` + `/api/number` (1600/140 series, international, community reports with salted hashes, `lib/privacy.ts`). `NumberCheck` on the home screen.
  - **Elder home v2** `/app`: "You are protected", the big "Is this a scam?", trusted person one tap away, silent "Tell my family", number check, recent warnings (`/api/warnings`), "I've been scammed".
  - **`/help`** "I've been scammed": golden-hour steps (1930, bank script, cybercrime.gov.in, Chakshu), recovery-scam warning, a report kept on the phone until the person shares it. Open without login.
  - **`/settings`:** language, trusted person, sensitivity (`PATCH /api/me`), a switch per consent, "Delete my data" (`DELETE /api/me`; off in the demo sandbox).
  - **`/impact`:** anonymous metrics (`lib/metrics.ts`, `events` table): money saved, STOPs, Money Lock holds, median time to warning, false-alarm rate, by scam type. Demo data labelled.
  - **Onboarding** `/start` is shorter: language first, compact consents, optional teach-back, ends on "add a trusted person".
  - Migration 0004 applied. Still paused for the user's answer: native Android, the 4 risky permissions, listen mode, Play vs sideload.
- [ ] Step 4: Ruko voice check (now P1 above; still to do: other languages, a feature-phone version)
- [x] **Step 5: scam simulator, trial logging, results dashboard (9 Oct).** Runbook: `docs/TRIAL_RUNBOOK.md`. Method: `docs/research/06-trial-methodology.md` (adopted). Scripts: `data/drill-scripts.json` (5 scams + 4 controls, EN/HI, research in `docs/research/07-scam-call-scripts.md`).
  - `/lab` (enrol by code P01…, consent + teach-back gate, fixed 10-row allocation table with seed 20261018, phone link, erase), `/lab/run/[id]` (facilitator console), `/lab/caller/[id]` (participant-facing animated caller, browser voice, rings, "RUKO" stop word), `/phone` (practice phone: bank, Ruko or "paused", Messages with the DRILL code), `/results` (north star with exact CIs, paired 2×2, McNemar exact + mid-p, Newcombe CI, Wilcoxon + r, slope chart, false alarms C3, carryover, feasibility, CSV).
  - Primary outcome = **stopped before pay** (level ≤ 5, same act in both arms); money moved is secondary. Controls carry an arm; C3 (Ruko alarm on a genuine call) is set automatically.
  - Practice accounts are sandbox users (ids `00000000-0000-4000-a000-…`), reset at every call start; `users.ruko_enabled=false` for baseline calls. The phone's events (`/api/practice`) fill levels 4–7.
  - `lib/trial.ts` (scale, allocation, stats; `npx tsx scripts/check-trial.ts`, 46 checks vs the doc's reference values), `lib/lab.ts`, migrations 0005 + 0006 applied. Seeded D01–D10 are labelled "illustrative".
- [x] **Security layer (10 Oct).** Design + threat model: `docs/SECURITY.md`; research: `docs/research/08-advanced-fraud-defence.md`. Migration 0007 applied.
  - **Threat engine** `lib/threat.ts` (17 tactics RT01–RT17 on a 7-stage kill chain; log-odds fusion with decay, same-stage discounting, multi-stage bonus, counter-evidence; levels watch/elevated/high/critical; playbook) + `lib/threat-server.ts` (`observe()`, `recordAction()`). Fed by /api/check, /api/number (?elderId), /api/alerts (SOS), payments. `npx tsx scripts/check-threat.ts` (15).
  - **Hash-chained evidence log** `threat_events` (`lib/integrity.ts`, `appendThreatEvents`/`verifyThreatChain`); `/api/threat` returns the picture + integrity. Practice accounts start a fresh chain each trial call.
  - **Verified bank calls**: Ed25519-signed notices (`lib/callIntent.ts`, key `RUKO_BANK_SIGNING_KEY` or per-process in dev), verified on the phone with WebCrypto (`lib/verifyIntent.ts`, `components/radar/VerifiedCall.tsx`), 10-min expiry, nonce, 4-digit code. `/api/callintent`, `/api/callintent/keys`.
  - **UPI PIN + duress PIN** (`lib/pin.ts`, scrypt, 3 tries → 5-min lock shared with `/api/pin`). Practice PIN 1234; Kamala's demo safety PIN 4321. Duress → transfer held + `duress`, customer sees "processing" (`customerView`, `?view=customer`), freeze + urgent family alert.
  - **Coercion signals** (`lib/coercion.ts`, needs ≥2, capped) captured in `BankApp`; **mule intelligence** (`payeeIntel`, `/api/mules`, demo reports for rbi.verify@axis, safe.custody@ybl); **30-second pause** before the PIN when the threat is elevated+.
  - **App hardening**: CSP + headers (`next.config.ts`), CSRF origin check + rate limits (`lib/guard.ts` via `proxy.ts`), lab only on private hosts without a researcher login, salt fails closed in production, `publicUser()`, protocol fingerprint on /results (`lib/protocol.ts`).
- [x] **Merge (20 Oct)**, see the last section of docs/DECISIONS.md:
  - **AI check:** "Tell me what they said" (tap to talk in Hindi/English, or type) and "Show me a photo" on `/check`. Gemini, via `lib/ai/*` from the Last Call reuse kit, returns warning signs with evidence; `lib/signs.ts` decides (code, not the AI). `/api/check/read` stores nothing, and `/api/check` stores sign codes only.
  - **WhatsApp fallback** on the STOP and result screens, and **plain-English family reasons**.
  - **Presenter mode** `npm run demo:offline` (port 3300, `RUKO_OFFLINE=1`: in-memory data, no AI).
  - **Tests:** `npm test` (all `scripts/check-*.ts`; `check-signs.ts` is new). Live AI cases: `npm run check:ai`.
  - **Docs:** `../docs/FIELD-TEST.md` (the 10-elder protocol) and `../README.md` (the 2-minute demo script).
- [x] **Ruko Companion (22 Oct)**, see the last section of ../docs/DECISIONS.md: `lib/companion.ts` (script, safeReply, offline answers; `scripts/check-companion.ts`), `components/companion/*`, `/companion`, `/api/companion/{ask,status}`, `lib/ai/companion.ts`, migration 0009 (`risk_events.elder_status`). Opens from STOP → Hang up and from the home screen. The family screen shows the elder's status. Home simplified ("More" fold).
- [x] **The bots (22 Oct)**, see ../docs/BOTS.md and the last section of ../docs/DECISIONS.md:
  - `lib/bots/*` (intent reader, scammer bot, defender bot, guardrails, harness; `scripts/check-bots.ts`, `npm run sim`). The scammer bot plays the caller in the lab (`live.auto`, `heard` action in `/api/lab/calls/[id]`, caller screen sends what it hears).
  - `lib/survey.ts` + `components/survey/*` + `/survey*` + `/api/survey` + `/api/lab/surveys` (`scripts/check-survey.ts`); kinds participant, family, open, incident. Results: `components/lab/SurveyPanel.tsx`, `SimPanel.tsx`.
  - Pattern library v2 (`data/scam-patterns.json`; `lib/patterns.ts` weights common words half, ignores reassurance sentences, folds Hindi nukta); the database upgrades itself (`loadPatternLibrary`).
  - Migrations 0009 to 0011 applied.
- [x] **Ruko Line (22 Oct)**, see ../docs/LINE.md: `lib/line.ts` (grade + screening bot + decisions), `lib/line-demo.ts`, `/line`, `/api/line/screen`, `hasReportedScam` in the store, `scripts/check-line.ts`. Real call answering is not built (needs a phone line or native app).
- [ ] Step 6: trials, Expo app, polish, backup video

Dev server: port 3200 (`npm run dev -- -p 3200`).

## Stack
Next.js 16 (App Router), Tailwind 4, shadcn/ui, PWA, Supabase, Gemini for the AI check (Claude via the Anthropic API was the earlier plan), Sarvam AI (Indian languages), ElevenLabs (English), Vapi + Twilio (real phone calls only). Expo Android comes last. Deploy on Vercel with the **petermac-tec** account only, never yaswanth528.

## Rules
1. **Consent first.** No call interception or recording without permission. Store signals, not audio. Transcripts auto-delete.
2. **Scammer-agent guardrails are non-negotiable:**
   - It only calls pre-registered, consented participants.
   - The stop word "RUKO" ends the call instantly.
   - It never asks for real OTPs, card numbers, Aadhaar or passwords.
   - Money only moves on the mock bank screen.
   - It uses no real officer names, badges or logos (BNS §204).
3. **Everything works in `DEMO_MODE`** with mock telephony and signals before any real service is wired in. The demo must never depend on a carrier.
4. **Label seeded data vs real trial data** everywhere it appears.
5. **Elder UX:**
   - Body text at least 20px, buttons at least 32px.
   - One action per screen.
   - English first, with Hindi and other languages switchable.
   - Never shame the user.
   - Always show the 1930 helpline and cybercrime.gov.in.
6. **Money:** the budget is ₹2,000, paid by the user. Ask before any paid signup, upgrade or deploy.
7. **Secrets** go in `.env.local` only. Never commit or print them.
