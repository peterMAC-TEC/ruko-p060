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

## Free-only fixes (20 Oct, the user asked for free solutions for now)
- **No waiting on the free AI for obvious scams:** when the words already match a known scam (the phone's own phrase check says STOP), STOP shows at once (0.06 s, it was 22 s on the live link) and the family is alerted. The AI's quoted evidence is added when it arrives ("Ruko's AI is double-checking the words…"). It never alerts the family a second time.
- **Other words wait at most 10 s** for the AI (it was 30 s), then the phone answers by itself. Photos and voice clips still need the AI (up to 35 s).
- **Priya's screen** loads in about 0.3 s once the app is awake. The 8 s seen once was the first request after a deploy. Before a demo, open both phones a minute early, or use presenter mode.
- **No paid Gemini key for now.** The free daily limit (20 checks on the best model) resets every day at midnight Pacific time (12:30 pm IST).

## Ruko Companion and UX (22 Oct)
The user asked for "the chatbot that picks up the call in case of alert" and a UX pass (elder screens, family alert, demo flow). Asked which kind of "pick up"; the user chose: **talks to the elder in the app** (free, no phone number, no card rule broken). Phoning the elder or the family needs paid Twilio/Vapi and was not chosen. Joining the scam call itself is not allowed (no call interception).
- **What it is:** after "Hang up" on the STOP screen (or "Talk to Ruko" on the home screen), a calm full-screen chat opens. Ruko speaks and shows each line in large text, **English or Hinglish** (Hindi in Roman letters; the user wants English and Hinglish only for the MVP), and the person answers with big buttons. Path: is the caller still on the line? → end the call (or "I'm scared": stay calm, family is being told) → did you already send money or an OTP? (yes → call 1930) → call family / stay with me.
- **Fixed script first, AI second.** The lines and buttons are code (`lib/companion.ts`, 30 tests). The AI only words answers to free questions, and only for topics the fixed answers don't cover. Questions about money, OTPs, arrest, being scared or "I already paid" get a fixed answer in 0.1 s: too important to improvise.
- **Every AI reply is checked by `safeReply()` before anyone sees it:** two short sentences at most; no telling them to send, pay, share, install or open anything; no investment, legal or medical advice; no blame. If it fails, or the AI is slow (12 s) or off, the fixed answer is used.
- **The family sees how it is going**, as a code only (`risk_events.elder_status`, migration 0009, applied to Supabase 22 Oct): "Kamala is talking to Ruko", "says the caller has hung up", "is scared and may still be on the call. Call now", "says money or an OTP was already shared. Call now, then 1930". Nothing the elder says or types is stored.
- **Voice is optional** (a toggle; every answer is also a button). The voice reads Hinglish with an Indian English voice, which is understandable but not perfect.
- **Home screen simplified:** the big "Is this a scam?", the trusted person, "Tell my family" and "Talk to Ruko" stay on top. The number check, recent warnings and the other tiles moved under "More". "I've been scammed" stays visible.
- **Family alert:** the Call button moved up, right under the headline and status; the reasons collapsed under "Why Ruko thinks so".
- **Line endings:** the repo now uses LF everywhere (`.gitattributes`). Some earlier edits had slipped in Windows line endings.

## The four bots (22 Oct)
The user asked for: a scammer bot that role-plays calls with consented people; a bot on the app that talks to the scammer and disarms it; a company bot for elders that reduces fear and gathers information; and a survey bot to collect external data and see how well the app does against the scammer. Details and how to run: [BOTS.md](BOTS.md).
- **Defender bot = a lab test harness, not a live decoy** (the user chose this). A phone app can't join or listen to a real call and the card forbids interception; a decoy on real calls needs a paid phone line and legal advice. It talks to our own scammer bot in the simulator, so its safety and Ruko's detection can be measured for free and repeated on every change.
- **Scammer bot = a mix of fixed script and live replies** (the user chose this). The script's own steps are the spine, so every participant meets the same stages; replies follow what the person says (rules, not AI); only an unexpected question may get one AI sentence, checked by guardrails. Two refusals or the stop word end the call kindly. A "relentless" mode (never gives up) exists for the simulator only.
- **Only the kind of reply is logged** (hesitated, refused, asked for proof...), never the words. The words are used to pick the next line and thrown away. If an unexpected question goes to the AI for a sentence, the words go to Google's Gemini (free tier: may be used to improve its products), so the consent form says so.
- **Three surveys as asked** (participant after each drill call, family member, open link/QR) plus a fourth, **incident**, behind Companion's "Help warn others". Anonymous, no names or numbers (text is scrubbed), linked only to the participant's code and arm. Erasing a participant erases their answers. Migrations 0010 and 0011 applied.
- **The simulator found real weaknesses, fixed in the product** (pattern library v2; the database upgrades itself when the app ships a newer library). One common word (KYC, parcel) is only half a sign and never warns alone; reassurance sentences ("we never ask for your OTP") are ignored; Hindi letters with a dot match; new phrases for cyber-desk, safe-custody, "read me the code on your screen", Aadhaar misuse and power-cut-tonight scripts. STOP before the money request in the simulator: 9 → 24 of 30; false alarms on genuine calls: 5 → 1 of 24.
- **Honesty about the simulator:** it tests Ruko's rules and the defender's safety (it must never agree to pay or share). It is **not** evidence that real older adults would stop. The results page labels it "Simulated" and keeps it apart from the trial's north star.
- **Not built:** a bot on real calls; phoning the elder or family (paid); a live cloned voice; Devanagari Hindi in Companion and surveys (the MVP is English and Hinglish).

## The Ink look (22 Oct)
The user chose direction **C, "Ink"** from three samples (`design/ruko-design-directions.html`) for the whole app. Written up in [DESIGN.md](DESIGN.md).
- **Done by changing the foundation:** the colour tokens, fonts and shared components (`app/globals.css`, `app/layout.tsx`, `components/elder/ui.tsx`, the wordmark, the helpline bar), so every screen follows the look. Then hand-restyled: the elder home, STOP, the Companion, the family alert, the survey bot, and the headings of the check, help, circle, sign-in and impact pages.
- **STOP on white:** the STOP screen is a white page with a 150px red "Stop." and a red top edge, the same idea as in the sample. It relies on size, not a red background. If the trial shows people don't notice it, the fallback is the full red screen of direction B.
- **Kept dark on purpose:** the demo page, the fraud console and the landing page.
- **Fonts:** Public Sans and Newsreader replace Atkinson Hyperlegible and Instrument Serif. Public Sans stays clear at large sizes; the larger risk is the thin display type, so it is only used at 34px or more.
- **Screens saved** in `design/screens/` (home, STOP, Companion, family alert).

## Ruko Line: the call gatekeeper (22 Oct)

- **Request:** an "extension" scam-call bot for experiments (already the trial lab) and Ruko as the fighting app: grade an incoming call green/yellow/orange/red, have a bot verify the caller, put genuine calls through, block scams, alert the family.
- **Decision:** build the decision engine now, free, as `lib/line.ts` + `/api/line/screen` + the `/line` demo. It is pure rules (no AI), replayed on the server, tested against the drill scripts. See [LINE.md](LINE.md).
- **Not built:** answering real calls (needs a paid phone line or a native Android app; the card also forbids interception without consent) and scraping caller data (against third-party terms). Both wait for the user's go-ahead.
- **Judgement calls:** a number is never "green" unless it is a saved contact; a risky number is never put through even if the caller sounds calm (a message is taken instead); a block also writes the number to the person's own block list and tells the family, and turns on Money Lock only if money or a code was asked, to keep false alarms down.

## "I can't tell yet" on /check (22 Oct)

- **Why:** with empty input, "I don't know" or mostly "not sure" answers, `/check` used to say "Nothing you told me matches a scam we know", which sounds like an all-clear. For test 3 (bad or ambiguous input) it must ask for more instead.
- **Rule (plain code, `hasEnoughToJudge` in `lib/radar.ts`):** a clear result needs three firm "no" answers, or at least three meaningful words about the call (filler like "I don't know", "idk", "nothing" is ignored). Otherwise the screen says "I can't tell yet", offers "Tell me what they said", and keeps family and 1930 one tap away. If the AI read something (even finding nothing), the result stands.
- **Not changed:** the radar's own levels (stop, caution, clear), the STOP threshold, and the family alert and Money Lock rules. Nothing new is alerted or locked for "can't tell yet", to keep false alarms down.
