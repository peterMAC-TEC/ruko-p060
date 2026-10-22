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

## Audit fixes: ambiguous input must never read as an all-clear (22 Oct)

Found by running the live app against the three MVP tests:
- **Words path:** "Someone called me about my bank account. I don't know if it was a scam." (and "I don't know") showed "Nothing you told me matches a scam we know." because the "can't tell yet" check was skipped whenever the AI had read the words, and a long sentence counted as enough. Fix: the check now applies after the AI too, and a sentence saying the person is unsure ("I don't know if…", "was it a scam", "maybe") is never enough (`hasEnoughToJudge`, `lib/radar.ts`).
- **Guided path:** choosing "Police, CBI, customs or a court" and answering no/not sure to everything showed an all-clear for the classic digital-arrest call. Fix: a police/CBI claim alone is now "Be careful, check before you do anything" and names the scam (`AUTHORITY_ALONE`). Other identities (bank, courier, family) are not escalated by the claim alone, to avoid false alarms on genuine calls.
- **Unchanged:** STOP threshold, family alert and Money Lock rules, AI role (it still only adds evidence).
- **Noted, not fixed:** on the free AI tier, text the AI cannot read in 10 s falls back to the phone's own check ("Checked on this phone only…"), so results can take about 11 s instead of 10.

## Redesign v3: the Guardian (22 Oct)

- **Request:** a playful, animated, character-led redesign that stays calm and clear in danger.
- **Built:** the Guardian character and motion language, the new landing page, question and STOP screens, post-stop reassurance, Companion situations and "What can I say?", honest Family Circle and Money Lock wording. Details in [DESIGN.md](DESIGN.md).
- **Not changed:** the radar, thresholds, threat engine, payment rules, database, AI role, routes.
- **Judgement calls:** (1) The STOP button now reads "I have hung up" and still opens the Companion. (2) The old dark pitch page is replaced by a light consumer landing page; the judge links (live demo, lab, results, fraud desk) moved to its footer. (3) "Not sure" stays as a third answer because the radar uses it. (4) Practice Mode was not rebuilt: the existing lab, drill scripts and practice phone already do it, and the deadline is 28 Oct. (5) A police/CBI claim alone is "Be careful" (see the audit fixes above).

## AI provider: OpenRouter instead of the Gemini free tier (22 Oct)

- **Why:** the Gemini free tier allowed about 20 requests a day and was slow (8 to 11 s). The owner supplied an OpenRouter key instead.
- **What:** `lib/ai/openrouter.ts` is a second provider behind the same interface; `AI_PROVIDER=openrouter` selects it (the Gemini provider is kept, and with no key at all Ruko still runs on plain rules). The account's guardrails allow Google models only, so the list is `OPENROUTER_MODEL=google/gemma-4-26b-a4b-it:free,google/gemini-2.5-flash-lite`: the free Gemma 4 first, and the paid Gemini Flash-Lite (about 0.01 paisa per check, owner-approved) only if the free one is slow, busy or at its limit.
- **Results:** words checks now take about 3 to 6 s (were 8 to 11 s) and read Hinglish correctly.
- **Limits:** audio clips are not supported by this route (typed or spoken-to-text words still work); the phone falls back to its own check as before.
- **Safety unchanged:** the AI only reads evidence; code decides.
- **Security note:** the key was pasted in a chat, so it should be replaced after the hackathon (new key into `app/.env.local` and Vercel). The earlier Supabase key was replaced on 22 Oct; the old `service_role` key should still be disabled in Supabase.

## The call demo sounds human (22 Oct)

- **Why:** the first version used the browser's built-in voices, which sounded robotic and not Indian.
- **What:** `/demo/call` now plays recorded natural Indian voices (Microsoft neural voices, free): Indian English for the English version and Hindi for the "Hinglish" version (spoken in Devanagari, with English loanwords the way people say them; captions stay in Roman letters). The script is `app/data/demo-call-script.json`; `app/scripts/make-demo-audio.py` records it (needs `pip install edge-tts` and ffmpeg; the finished clips are committed, so the app needs neither).
- **Realism:** natural fillers and hesitations ("Hello? ... Haan, yes"), the caller talks over the end of Kamala's sentence, the caller's voice has a phone-line filter, Kamala is slower and lower, Ruko is clean and warm with a soft chime before it speaks, and the lines pause the way people do.
- **Honest limits:** the voices are still synthetic (labelled as role-play); the same voice family is used for Kamala and Ruko, told apart by pitch, pace, the chime and the on-screen label. If a clip fails to load the browser's own voice reads the line; with sound off the captions carry the demo.
- **Retune:** edit `VOICES` or `FILTERS` in the script and run it again.

## Positioning and the layer (22 Oct)

- **The line:** "Your phone can spot the scam. Ruko stops the money." Full statement, the layer diagram, the moat and the honest gaps are in [POSITIONING.md](POSITIONING.md).
- **Why:** Apple (Call Screening), Google and Samsung (on-device scam detection) are sensors at the phone for the person only; digital-arrest scams mostly run on WhatsApp video calls; most 65 to 85-year-olds are not on those phones; none involve family or the payment. Ruko is the response layer.
- **Built:** Ruko is now a real installable app (a web app manifest with icons, home-screen shortcuts) and has **Share to Ruko**: from any app on Android Chrome, a message or call transcript can be shared to Ruko, which opens the check with the text in the box for the person to review and check. The text travels in a 2-minute cookie (never in a URL, never stored). Before this the app was called a PWA but had no manifest.
- **Not possible:** reading Apple or Google alerts automatically (no API); the person shares instead. Screenshots through the Share sheet need a service worker and are next.
- **Judgement call:** the moat is described as the family network, the bank relationships and the data, not the AI, because the AI is copyable.

## The live call demo and the final master prompt (22 Oct)

Built for the 23 Oct judging. Walk-through in [DEMO-SCRIPT.md](DEMO-SCRIPT.md); answers in [JUDGE-QA.md](JUDGE-QA.md).

- **Where:** `/demo` is now a hub (one big button per scene, an offline switch, a reset). The old guided demo moved to `/demo/guided`. **`/demo/live`** is the new interactive call. `/demo/call` (the recorded role-play) is unchanged, because the submission document and pitch link to it.
- **The officer** (`lib/demo-officer.ts`, plain code, 17 checks over 84 simulated calls): seven stages (contact, fear, isolation, authority, urgency, payment ask, closing), three wordings each, a counter for refusing / asking for proof / mentioning family / hesitating, nudges for silence, and a time rule that jumps to the payment ask after 55 s, so it is reached within 90 s in every simulated call (slowest 75 s). Saying RUKO ends the call at once.
- **Scripted, not AI-worded.** The brief allowed optional AI rewording behind a guard. Not built, on purpose: scripted lines are instant and cannot break a live demo, and AI-worded lines would play in a different (browser) voice from the recorded ones. The switch on the hub still means "scripts only".
- **Ruko steps in** when the payment ask lands (or both isolation and payment have been used). The decision is the real scam check (`runRadar`) and `/api/check` (family alert and Money Lock), not a timer.
- **Two endings:** A "Hang up and use Ruko" (Companion, report on 1930, family alerted); B "I still want to pay" (practice bank with a MOCK BANK banner, ₹50,000 pre-filled, Money Lock holds it, the family decides). The result shows the trial scale's furthest step, "stopped before pay", "money moved", and what the caller did, labelled demo data. Ending B reports "stopped before pay: No (pressed Pay)" and "money moved: No" separately, because that is the honest reading of the trial's own scale.
- **Voice Trust:** after a flagged call, **approving** a held payment needs the family code word (`lib/code-word-rule.ts`, enforced on the server in `/api/approvals/[id]`; declining never needs it; no code word set means no change). The demo sets the code word "mango" for the demo family. The family phone shows the approval card directly under the alert. A "perfect voice is not proof" panel and a never-ask list are on the result screen.
- **The bank's cooling-off is 8 s in the live demo** (30 s everywhere else), labelled "shortened for the demo".
- **Voices:** browser speech (official, free). Best in Microsoft Edge, which has natural Indian voices built in. Pre-rendered clips for the new lines were **not** made, because the only free route I had (`edge-tts`) is an unofficial use of Microsoft's service, which the brief forbids. **Disclosure:** the earlier `/demo/call` clips were made that way before this rule. The clean upgrade is an official free key (Sarvam AI, which the card suggests): `app/scripts/make-demo-audio.py` is the place to swap it in.
- **Voice cloning: not built.** It is off by default in the brief and a rushed version is a risk.
- **Sourced facts on `/impact`:** checked against sources on 22 Oct. Used: ₹22,845 crore lost in 2024; 1,03,488 senior-citizen complaints and about ₹4,005 crore in 2025; digital-arrest cases 60,676 (2023) and 1,23,672 (2024); McAfee 47%. **Not used, could not be confirmed:** "₹22,495 crore in 2025 across 24 lakh complaints" (the sources give ₹22,845 crore for 2024), the "17,264" digital-arrest figure for 2025 (a source gives 17,718 for Jan to Feb 2025), and the claim that awareness campaigns caused a 2025 drop. "AI could make scams rise again" is labelled our hypothesis.
- **Lighthouse (mobile profile, live site):** accessibility 100 on `/check`, `/companion` and `/line`; performance 73, 77 and 80; largest content about 4.4 s and blocking time 250 to 400 ms under heavy throttling; no layout shift. Performance is moderate, not great.
- **Tests:** `npm test` now also runs `check-line`, `check-demo`, `check-share`, `check-officer` and `check-codeword` (14 suites). Simulator unchanged (24 of 30 STOP before the money request, 1 false alarm in 24).

## The three layers and the bank-ready stop (23 Oct, branch `three-layers`)

Built on a branch, **not merged and not deployed to the live address**, so the version that passes the pitch rehearsal stays untouched. Research with sources and what is unverified: [RESEARCH-UPI-BANKS.md](RESEARCH-UPI-BANKS.md). Bank contract: [BANK-INTEGRATION.md](BANK-INTEGRATION.md). Android: `android/README.md`.

- **Layer 1, family-first setup (`/setup`):** the family member, on their phone, does five steps: put Ruko on the elder's phone (QR and WhatsApp link to `/app`), choose a family code word (stored scrambled, never shown again; only the trusted person can set it), the **Rule Card** (one sentence naming the trusted person; it is the elder's home-screen headline and a printable card at `/setup/card`), a practice call (the live call demo), and a test alert. **Every tick on the checklist comes from something that really happened** (`lib/setup-status.ts`), not a tick box: the test alert counts only when it has reached the family phone, and the drill only when a real Ruko STOP was raised. A setup test alert is labelled TEST, goes only to the person setting up, and does not turn on Money Lock, feed the threat engine or count in the impact numbers. Judgement call: "pairing the elder's phone" is a link/QR to `/app` (the elder signs in as usual); there is no new device-pairing login for the web app.
- **Layer 3, the family alert on a risky number (`POST /api/alerts/risk`):** one alert shape from every source (Android app, number check, elder), **signal codes only**: a risk level, reason codes and a hash of the number; the body is strict, so audio, words or a raw phone number are refused. Only orange and red tell the family. Held back for the same number within 10 minutes and beyond 6 alerts an hour. The elder is told in plain words every time. "It's fine, I've checked" is the family's **false-alarm** signal and feeds the false-alarm rate (setup tests excluded). Offline: alerts wait in a small capped queue and go when the connection is back (web: `lib/alert-queue.ts`; Android: its own queue). A WhatsApp message button is on the family alert. **Not built: web push to a closed phone** (it needs VAPID keys, a service worker, a subscription table and a push library). Today the family sees the alert when the Ruko family screen is open (with sound and a browser notification), or via the WhatsApp fallback. This is a real limit for Layer 3 and is the first thing to build next.
- **Device pairing for the Android app:** a pairing code `<elder id>.<token>` where the token is an HMAC of the elder id with a server secret (`RUKO_DEVICE_SECRET`, falling back to `RUKO_HASH_SALT`); nothing is stored, it cannot be guessed, and it can do exactly two things (report a risky number for that elder; read the Rule Card). Only the trusted person sees it.
- **Layer 4, Ruko Guard (`lib/guard-assess.ts`, `POST /api/guard/assess`):** allow / delay / require_trusted_person / block with reason codes, each tagged `rbi_draft`, `ruko_own` or `customer_choice`. Defaults: a one-hour delay above ₹10,000 (merchants excluded), trusted-person approval at 70+ and ₹50,000 or more, Ruko's own rules after a flagged call, for new large payees and for reported destination accounts. **The RBI paper is a draft and its thresholds are from press summaries (UNVERIFIED against the paper itself).** The mock bank asks the same function for every digital payment and merges it with its own rules (the stricter wins); the fraud desk lists each decision under "Ruko Guard" (demo data). **Honest note:** the mock calls the shared function in-process, not over HTTP; the HTTP endpoints are tested separately. The bank's API key (`RUKO_BANK_API_KEY`) is checked in constant time; with no key set only the demo family is reachable, never a real customer.
- **Kill switch:** the customer, or the family, can pause every digital payment at once; **resuming needs the family code word** (and an elder with no code word set cannot resume alone). It is a separate flag from Money Lock (so a duress freeze is never overwritten), stored in two new columns on `protection` (**migration 0012, additive, applied to the shared Supabase project; the live app ignores the columns**). Pausing by the elder tells the family.
- **Demo payee:** the live call demo now pays a payee that is not pre-reported. The demo mule account (`rbi.verify@axis`) would be blocked outright by Guard (correct), which would skip the family-approval moment the pitch shows; the mule block stays a separate thing to show.
- **Layer 2, Android (`android/`):** a native Kotlin app with the standard call-screening role and notification permission only (plus internet); no contacts, call log, phone state, microphone, overlay, accessibility, notification-listener or usage-access permission. Grades the number on the phone first (same rules as the web grader, proven by shared test vectors), asks the Ruko server for community reports with a 1.5 s limit and a 24-hour memory, silences orange and red (rejects red only if "block the worst" is on, off by default), warns in large words, and tells the family for orange and red. **The pure logic was compiled and run here (30 checks pass); the Android code was not compiled or run (no Android SDK on this computer), and nothing was tested on a real phone.** Assumption to verify on a device: the system hands the screening role only calls from numbers not in the contacts (from the owner's research; unverified), since the app has no contacts permission to check.
- **Tools:** a portable JDK 17 and the Kotlin compiler were downloaded into the temporary folder to run the logic tests; nothing was added to the repo and no paid service was used.
- **Not done / next:** web push; screenshot sharing; a background retry for waiting Android alerts; a real bank pilot; the 10-person field trial.
