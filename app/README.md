# Ruko

Stop digital-arrest scams before money moves. Built for ForgeX 2.0, problem P060.

- Spec: `docs/MASTER_PROMPT.md`
- Decisions and schedule: `docs/DECISIONS.md`

## Setup

```bash
npm install
cp .env.example .env.local   # optional: everything runs without keys in demo mode
npm run dev -- -p 3200
```

Open http://localhost:3200.

## The fastest way to see it: `/demo`

Open http://localhost:3200/demo on a laptop. Kamala's phone, Priya's phone and the bank's fraud desk sit side by side, with a five-step guide on the left. Each step is one tap, and the steps tick themselves off by watching the real data. **Start over** resets everything. This is the page for judges and for the stage.

## The security layer (how Ruko fights back)

Design and threat model: `docs/SECURITY.md`.

| Try this | What happens |
|---|---|
| `/check`: police, then Yes, Yes | The threat engine fuses it with everything else (number, payments, family) and goes **critical**; family alerted, Money Lock on. |
| `/bank`: send money while a threat is live | A **30-second pause** with one fact, then the **UPI PIN pad** (practice PIN **1234**). |
| `/bank`: pay with PIN **4321** | **Duress**: Kamala's screen says "processing"; the money is frozen, Priya gets an urgent alert, the fraud desk sees DURESS. |
| `/bank`: pay `rbi.verify@axis` or `safe.custody@ybl` | **Mule intelligence** holds it (reported accounts, matched by salted hash). |
| `/console` | Threat panel per customer: attack stages, evidence with likelihood ratios, playbook, **evidence chain intact** badge, **Call Kamala (verified)**. |
| `/app` after that | Kamala's phone verifies the bank's Ed25519 signature and shows the same code. |

Tests: `npx tsx scripts/check-threat.ts` (15), `check-rules.ts` (26).

## The pilot: trial lab and results

The tools for the north-star trial (10 older adults, with vs without Ruko). Facilitator steps: `docs/TRIAL_RUNBOOK.md`.

| Page | What it does |
|---|---|
| `/lab` | Enrol participants by code (P01…) after consent and teach-back; each gets a fixed allocation row and a practice phone link. |
| `/lab/run/[id]` | The facilitator's console: the script line by line, the 0–7 scale, live signals from the practice phone, distress buttons, debrief. |
| `/lab/caller/[id]` | The participant-facing caller: it rings, an illustrated caller speaks the script, and saying "RUKO" ends it. |
| `/phone` | The participant's practice phone: practice bank, Ruko (or "paused"), Messages with the DRILL code. |
| `/results` | Stopped-before-pay with vs without Ruko, exact CIs, McNemar, Newcombe, slope chart, false alarms, feasibility, CSV. Switch to **Illustrative** to see seeded D01–D10. |

Tests: `npx tsx scripts/check-trial.ts` (46 cases, reference values from the method doc).

## New in v2 (Scam Radar, Money Lock, Family Shield)

| Page | What to try |
|---|---|
| `/check` | **Is this a scam?** Pick "Police, CBI…", then answer **Yes, Yes**. The full-screen **STOP** names the scam ("Digital arrest") and the one rule being broken, and Priya is alerted. **Hang up**, then the post-call "Was this a scam?" question. |
| `/app` | Type **+855 23 456 789** in "Check a phone number": High risk, "Reported 37 times as Courier parcel with drugs". After a check, the warning shows under **Recent warnings**. |
| `/help` | "I've been scammed": the golden-hour steps, what to say to the bank, and a report to copy or share. |
| `/settings` | Sensitivity (STOP after 1, 2 or 3 signs), a switch per consent, Delete my data. |
| `/impact` | Money saved, STOPs, median time to warning, false-alarm rate, by scam type. |

Tests: `npx tsx scripts/check-radar.ts` (21 cases).

## New in week 1

| Page | What to try |
|---|---|
| `/app` | The elder's Ruko home. Tap **Tell my family**: it's silent, with only a small tick. Priya's phone (`/family`) gets the alert plus a "What to say" script. |
| `/check` | **Is this call real?** Answer No, then Yes, Yes. It stops early with "This is a scam", the fixed fact, three steps, and the family alerted. Questions are read aloud (English or Hindi), and the mic accepts "haan"/"nahin". |
| `/bank` | Kamala is 72, so sending **₹60,000 to Priya** waits for Priya's OK. Priya approves or declines on `/family`. A scam payment switches on **protection**: later large payments (UPI, NEFT, cash) are held until Priya taps "They're safe". Also try **Close a fixed deposit**, then **Withdraw cash**. |
| `/login`, `/start`, `/join/…` | Real accounts: sign in by email link, choose who Ruko is for, consent to each purpose separately, explain Ruko in your own words, and invite family by link. |

Tests: `npx tsx scripts/check-rules.ts` (17 cases) and `npx tsx scripts/check-callcheck.ts` (9 cases).

**Before real sign-in works:** in the Supabase dashboard, go to Authentication → URL Configuration. Set Site URL to `http://localhost:3200`, and add `http://localhost:3200/**` to Redirect URLs.

## Test it in 2 minutes (bank-side friction)

1. Open `/bank` (the elder's practice bank) and `/console` (the fraud desk) side by side.
2. In the **demo signal panel** on `/bank`, click **Unknown call 95m**. This simulates a long call from an unknown number.
3. Send money to **someone new**: name `RBI Safe Account`, UPI `rbi.verify@axis`, amount **₹4,80,000**.
4. The elder sees **"We have paused this payment"**, with plain-language reasons and a button to call family. The fraud desk shows the held transfer with a risk score of 100 and each rule that fired.
5. Click **Block** on the fraud desk. Within 2 seconds the elder's screen changes to "The bank stopped this payment".
6. Control check: pay **BESCOM electricity** ₹1,900 with no call running. It goes straight through.

## Test it in 2 minutes (Family Safety Circle)

1. Open `/family` (Priya's phone) and tap **Turn on alert sound**.
2. In another window, open `/circle` (the elder) and press **Alert my family now**.
3. Priya's screen turns red, beeps and vibrates. Tap **I'm calling Kamala**.
4. The elder's screen changes to **"Priya is calling you now"**.
5. The bank does this automatically too: repeat the bank test above with `/family` open, and Priya is alerted the moment the payment is paused.

Mock SMS and voice calls appear in the server log as `[mock sms]` and `[mock voice]`.

Click **Reset demo data** on the home page to start over.

Rules engine checks: `npx tsx scripts/check-rules.ts`

## Structure

| Path | What |
|---|---|
| `lib/rules.ts` | Bank rules engine (pure; hard rules can't be overridden) |
| `lib/store.ts` | Data access. In-memory in demo mode; Supabase plugs in behind the same functions |
| `lib/flags.ts` | `DEMO_MODE`, `MOCK_TELEPHONY`, `MOCK_SIGNALS` |
| `lib/i18n.ts` | Elder-screen text (English, Hindi) |
| `supabase/migrations/0001_init.sql` | Database schema with RLS |
| `app/bank`, `app/console` | Elder practice bank, fraud desk |
| `app/circle`, `app/family` | Elder's family circle, family member's alert screen |
| `lib/circle.ts`, `lib/notify.ts` | Alerting the circle; SMS and voice (mock unless Twilio is on) |
