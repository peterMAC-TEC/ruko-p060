# Ruko: decisions (8 Oct 2026)

From the user's questionnaire answers. This file is the source of truth; where it differs from `MASTER_PROMPT.md`, this file wins.

## Event
- **P060** is bet and owned. Chosen because the user likes it more than P056.
- Solo, **4–8 hours a day**.
- **Build starts 8 Oct 2026. Submission and demo day: 28 Oct 2026.**
- Judging format is unknown, so prepare for all of them: a live stage demo, a recorded video, and judges trying it themselves. The product must work when a judge picks it up cold.
- The master prompt is a **strict spec**: build all four parts.

## Participants
- 10 older adults: own parents and grandparents, classmates' families, neighbours or an RWA, and a senior-citizens group. Getting 10 is "probably, with effort".
- All in **Bengaluru, in person**.
- Languages: Hindi, English, Kannada, Tamil, Telugu, Malayalam, Marathi and Bengali. **English is the default** on elder screens; the others are switchable.
- Phones are mixed Android and iPhone. Most use UPI themselves.

## The drill
- **Both channels:** browser practice drills, plus **one real phone call** per person.
- **A voice plus an animated caller** (illustrated, not a real person; no uniforms, badges or logos).
- **Consent upfront, surprise timing.**
- **No family member is present.** See open question 1.
- **Full experiment design:** 3–4 calls per person, including harmless control calls to measure false alarms.
- **Scripts:** CBI digital arrest, customs drugs parcel, courier + Aadhaar misuse, TRAI number cut-off, electricity disconnection. Plus the benign controls.
- Generic agency names ("CBI", "police", "customs") are fine. Never real officer names, badges or logos (BNS §204).

## Product
- **All four parts are must-haves:** the Ruko voice check, the Family Safety Circle, bank-side friction, and the scam simulator with the results dashboard.
- **No** pressure meter or cinematic debrief; stick to the master prompt.
- **PWA plus a native Android app (Expo)** for real call-state signals. Expo comes last.
- Family alerts: **real SMS and phone calls.** See open question 2.
- Mood: **calm for elders' screens, dramatic for the demo and dashboard.**
- Business story for the pitch: **families subscribe** (not the master prompt's banks-pay story).

## Accounts and money
- Has: Anthropic API, Vercel (petermac-tec only), Supabase, Sarvam AI, ElevenLabs.
- Needs: Twilio (calls and international SMS) and Vapi (phone-call agent; has free credit). MSG91 and Exotel are dropped (see below).
- **Budget: up to ₹2,000, paid by the user.** Ask before any paid action.

## Demo day
- A **real participant** plays the elder.
- **Live AI call on stage, with a backup video.**

## Build decisions (made by Claude, noted)
- **Next.js 16** (current) instead of 14. The spec's intent is the App Router + Tailwind + shadcn/ui, which is unchanged.
- **Browser drills** run on Claude + Sarvam (Indian languages) / ElevenLabs (English) directly, with no Vapi or Twilio, so they cost almost nothing. **Vapi + Twilio** are used only for the one real call per person and the family alert calls.
- **SMS goes through Twilio's international route.** India's domestic DLT registration is not open to individuals, so MSG91 is out.
- **Twilio trial accounts can only call 5 verified numbers** and play a trial notice. 10 elders + families need an upgraded account, about $20 (~₹1,700), which is most of the budget. Decide before trials start.
- Telephony, SMS and signals all sit behind mock flags (`MOCK_TELEPHONY`, `MOCK_SIGNALS`, `DEMO_MODE`), so the demo never depends on a carrier.

## Answers from 8 Oct (round 2)
- **A family member is sometimes present.** Each trial records `family_present`. When yes, the scammer agent skips the drill announcement at the start, which the spec allows. When no, it announces itself at the start. Both always announce at the end. Results can be split by this.
- **Paid Twilio is a last resort.** Use a free or manual route for the real call; the options and their pros and cons were given to the user (see "Real-call channel" below).
- **Supabase project created:** `ruko`, ref `udwynjujhglfdhermzvm`, region ap-south-1 (Mumbai), free plan, in "peterMAC-TEC's Org". The schema is applied. `.env.local` has the URL and the public key; the user must paste the secret key from the dashboard.
- **No API keys yet.** Everything is built to work without them:
  - The voice check uses the browser's built-in speech recognition and voices (free, supports Indian languages in Chrome/Android) plus the deterministic keyword rules.
  - The scammer agent runs **scripted, branching dialogue** instead of a live LLM. This is also better for the experiment, because every participant hears the same script.
  - Claude, Sarvam and ElevenLabs are upgrades once keys exist.

## Blueprint approved (9 Oct): "execute it"
All seven changes in `BLUEPRINT.md` §6 are approved and **override the earlier answers above**:
1. **Drills use a fictional agency**, "Central Investigation Cell – DRILL". No CBI, police or other real agency names, badges or emblems (BNS §204).
2. **Family members accept their own invite** before their number is used (DPDP). In the demo sandbox, invites auto-accept and are labelled as such.
3. **App notifications first.** No Twilio international SMS. DLT registration for SMS comes later, budget permitting.
4. **Business model: banks pay (B2B2C)**, and families get Ruko free through their bank. This replaces "families subscribe".
5. **The family feature is called "Ruko Family"**, not "Family Safety Circle".
6. **Family alerts fire only on risk events or when the elder triggers them.** Never continuous monitoring.
7. **Results use a "furthest step reached" scale**, plus control calls and exact intervals, and are called a feasibility pilot.

The build order is §7 of the blueprint.

## Real-call channel: **A (main) + B (backup)**, chosen 8 Oct
The user picked A, laptop + Phone Link + spare SIM, with B, a WhatsApp Desktop call, as the backup. They share the same audio routing.

Options that were offered:
- **A.** Laptop + Windows Phone Link + an Android phone with a spare prepaid SIM + VB-Audio Virtual Cable. The AI voice goes into a real +91 cellular call.
- **B.** WhatsApp Desktop call with the same audio routing.
- **C.** A human actor reading Ruko's script from a director screen.
- **D.** Twilio free trial.
- **E.** Twilio paid.

## Open questions for the user (resolved: see round 2 above)
1. **Family not present vs the master prompt's guardrail.** The spec says the scammer agent "announces at the start and end it's a Ruko safety drill (or a family member is present)". With no family present, the call must announce itself at the start, which makes it less realistic. Options: (a) announce at the start; (b) a family member is present for the real phone call only; (c) the elder sets a consent window and a code phrase, and the opening line includes a subtle drill marker. **Default until answered: (a).**
2. **Twilio upgrade (~₹1,700)** for the real calls, or keep the real calls to 5 verified numbers on the free trial.

## Schedule (20 days)
| Dates | Work |
|---|---|
| 8–9 Oct | Scaffold, Supabase schema + seed, mock flags; mock bank transfer + rules engine + cooling-off + fraud console |
| 10–11 Oct | Family Safety Circle: onboarding, code word, `notify()`, acknowledgements, "help is coming" screen |
| 12–14 Oct | Ruko voice check ("Is this call real?") in English + Hindi first, then the other languages |
| 15–17 Oct | Scam simulator (5 scam + 3 benign scripts), guardrails, trial logging, results dashboard |
| **Now → 17 Oct** | **Recruit 10 elders and collect written consent (the user, in parallel)** |
| 18–24 Oct | Run trials; Expo Android app in parallel |
| 25–28 Oct | Polish, demo script, backup video, submit |

## v2 build (9 Oct)
The user re-pasted the v2 prompt without answering the decisions form in `docs/V2_AUDIT_AND_PLAN.md`. Read as "go ahead with everything that needs no risky permission". Built on the web: Scam Radar (pattern library, guided check, STOP, number risk, post-call report), Family Shield on the home screen, "I've been scammed", settings with delete-my-data, anonymous impact metrics, shorter onboarding.
- **Defaults chosen:** STOP at 2 "yes" answers (the person can pick 1 or 3 in Settings). Two phrase hits on a high-severity pattern is a STOP on its own. Reports count once per device or login (salted hashes). The STOP screen's call button goes to the trusted person, or to 1930 if there is none.
- **Still waiting on the user:** the native Android app, the 4 risky permissions (overlay, usage access, notification listener, accessibility), listen mode (recommended: drop it, since Android silences other apps' mic during calls), Play Store ($25) vs sideload for the trial.

## Trial method (9 Oct, from docs/research/06-trial-methodology.md)
Adopted as defaults; the user can override any of them.
- **Primary outcome = stopped before pay** (level ≤ 5 on the 0–7 scale). The earlier "money didn't move" outcome favoured Ruko by construction (a bank hold can only happen with Ruko on); it is now a secondary, labelled outcome.
- **Design:** 2 blocks per person, ≥48 h apart, each = 1 scam + 1 genuine control in the same arm. Fixed 10-row allocation table (5 without-Ruko-first, 5 with-Ruko-first), handed out in a random order (seed 20261018), revealed only after consent and teach-back.
- **Measured scripts:** 2 matched scams (digital arrest, customs/courier drugs) and 2 controls (bank KYC, courier delivery). The other 3 scam scripts (courier + Aadhaar, telecom, electricity) and the relative's-favour control stay as practice drills and demo material. This narrows "5 scripts" in "The drill" above for the measured calls only.
- **The real phone call** is each person's block-2 scam (5 with Ruko, 5 without).
- **False alarms** = C3 (Ruko STOP/caution, family alert or bank hold) on genuine calls in the Ruko arm.
- **Open for the user:** ethics review. Deception studies normally need an ethics committee (ICMR 2017); without one, say "not formally approved" in the pitch.

## Security layer (10 Oct)
The user asked for Ruko to be "way more advanced", built as a top security engineer would. Built, with defaults from docs/research/08 (all overridable):
- **Threat engine** levels at 0.20 / 0.50 / 0.80 / 0.95 from a 1% prior; likelihood ratios are expert priors, to be re-fitted on trial data.
- **Verified bank calls** expire in 10 minutes; a verified call lowers risk but never cancels a safe-account or mule warning.
- **Duress PIN** must differ from the PIN in ≥2 digits; the customer sees "processing" (not "sent"); never calls police automatically.
- **Coercion signals** need ≥2 to count and can't hold a payment alone.
- **Every payment now needs the UPI PIN** (practice PIN 1234). The trial's "pressed Pay" (level 6) is now "submitted with the PIN".
- **The trial lab** is open without login only on localhost/private-network hosts.
- **Still the user's to do:** rotate the Supabase secret key; set `RUKO_HASH_SALT` and `RUKO_BANK_SIGNING_KEY` before any deploy.

## Merge with the new P060 session (20 Oct)
A second session started P060 from scratch in `claud 2/Ruko (P060)`, with a Gemini key and code reused from the Last Call prototype (`reuse/`). The user said "merge this and hackathon main setup" and chose: **copy hackathon-main in as the base, add the new pieces, deploy from here.**
- **Copied** `C:\dev\hackathon-main` → `app/` (code) and `docs/` (documents) on 20 Oct. The original folder is untouched. Left out: `node_modules`, `.next`, `_old-policy-xray` (the unrelated P056 project), `docs/old-problem-analysis.md`. Git starts here (the original had none).
- **Supabase:** the paused `ruko` project (ref udwynjujhglfdhermzvm) was **restored**, not replaced: the name was taken, and the free plan allows two active projects (the other is last-call). No schema changes.
- **Not rebuilt,** because the old build already covers them: the family circle and invite links, the role-play lab, the results page, and bank-side friction. This session's own plan for those parts was dropped.

### Added in the merge (judgement calls)
- **AI check of what they said or showed** (`/api/check/read`, `lib/ai/*`, `lib/signs.ts`). Gemini replaces the Anthropic plan, because there is a Gemini key and no Anthropic key. It uses the reuse kit's provider.
  - **The AI only reads.** It returns warning signs (11 kinds), each with the exact words or visible text as evidence. **Code decides:** signs become the Scam Radar's answers and can raise its verdict.
  - A STOP needs a scam's own move (arrest on a call, secrecy, pay to clear a name, safe account) plus one more sign, or any 3 signs.
- **Fewer false alarms:** when the AI has read the words and found no sign, a lone keyword hit (e.g. "parcel" in a real delivery update) is no longer a "Be careful". This was found by the live test. Without the AI, the phone's own phrase check behaves as before. A STOP is never lowered.
- **Free Gemini tier is the weak spot.**
  - `gemini-3.5-flash` allows only **20 requests a day** (used up during testing on 20 Oct). The lite models are often "busy" (503) or take 15–30 s.
  - So the app tries three models in a chain (`gemini-3.5-flash`, `gemini-3.1-flash-lite`, `gemini-flash-lite-latest`), starting the next after **8 s** (the reuse kit used 12 s).
  - It gives up at **30 s** and falls back to the phone's own phrase check. After 5 s it shows "Still checking… Meanwhile, don't send money or share any OTP."
  - A paid Gemini key would make checks fast and reliable, for pennies at this volume. **This needs the user's OK.**
- **Privacy:** Ruko stores only the sign codes, never the words, the clip or the photo. On Google's free tier, Google may use what is sent to improve its products. So the field-test consent says so, and practice drills use only fictional content. A paid key would avoid this.
- **Tap to talk** (tap, speak, tap again) instead of hold-to-talk: easier for older hands. It uses Hindi (`hi-IN`) or Indian English (`en-IN`) speech-to-text, and records a clip for the AI when the browser can't transcribe.
- **WhatsApp fallback:** "Also send Priya a WhatsApp" (pre-filled `wa.me` link) on the STOP and result screens. Indian SMS needs DLT registration.
- **Family alert reasons** are now plain English ("Told to keep it secret") instead of codes ("q keep secret").
- **Presenter mode:** `npm run demo:offline` (`RUKO_OFFLINE=1`) runs everything on the laptop with in-memory demo data and no AI, so the demo never depends on the network.
- **Tests** stay in the old build's style (`tsx` scripts) rather than the reuse kit's Vitest; `npm test` runs them all. `npm run check:ai` runs the live AI cases (they use the free quota).

## Deploy (20 Oct)
- **Live: https://ruko-seven.vercel.app.** This is a new Vercel project `ruko` (team peter-74be, the petermac-tec login) on the free plan, linked from `app/`. Redeploy with `cd app && npx vercel@latest deploy --prod`.
- **The functions run in Mumbai** (`"regions": ["bom1"]` in `app/vercel.json`), next to the Supabase database. In the US default region, the family alert took **17 s**; in Mumbai it takes **1.2 s**. `vercel.json` also pins the framework to Next.js (the CLI-created project defaulted to "Other" and served 404s).
- **Environment:** 13 production variables, piped from `app/.env.local` and never shown: DEMO_MODE/MOCK flags, Supabase, Gemini, and three new secrets generated for production (`RUKO_HASH_SALT`, `RUKO_BANK_SIGNING_KEY`, `RUKO_LAB_KEY`).
- **The lab and results are locked in production:** the facilitator opens `/lab/unlock?key=<RUKO_LAB_KEY>` once per browser.
- **Verified on the live link at phone width (20 Oct):**
  - home;
  - the guided check → STOP → family told (1.2 s);
  - the WhatsApp and call links;
  - the family screen with plain reasons;
  - "Tell me what they said" in Hinglish → AI → STOP (22 s on the free tier, with "Still checking…" shown);
  - the Hindi screens;
  - `/demo`'s bank hold with the family alert;
  - `/help`; `/lab` and `/results` locked.
- **Still the user's to do:**
  - **Rotate the Supabase secret key.** It was pasted in a chat on 8 Oct; it is still the one in use. When it changes, update `app/.env.local` and the Vercel variable.
  - **Decide on a paid Gemini key**, for fast AI checks and no free-tier data use (see above).
- **Follow-ups:** two Supabase advisor warnings (`ruko_pin_fail` and `ruko_no_update` have a mutable search_path), from the 8–10 Oct schema.
