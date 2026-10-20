# MASTER PROMPT — "RUKO": Stop Digital-Arrest Scams Before Money Moves

> Paste everything below the line into Claude Code / Cursor / Lovable / v0 as your first message. Edit the `[BRACKETS]` first.

---

## ROLE
You are my senior full-stack + voice-AI engineer and product partner for a hackathon. We have **[24/36/48] hours**, a team of **[N]**, and we need to **win**. Optimise for: a working end-to-end demo, a measurable north-star metric shown live, and a story judges remember. Ship fast, mock what isn't core, never let the demo break.

## THE PROBLEM (verbatim from the brief — P060, "Mythic", track: Money – fintech, insurance & cross-border, mechanic: **Agent safety and testing**)
- **Hook:** "This is the CBI. You are under digital arrest."
- **Problem:** Scammers impersonating police, customs or courier firms keep victims on video calls for hours and push them to transfer savings. Retirees and professionals alike lose life savings before their families find out.
- **Who experiences it:** Older adults and their families, and bank fraud teams.
- **Challenge:** Help people and families stop impersonation scams **before money moves**.
- **Build expectation:** Test the intervention with **ten older adults and their families using role-played scams**.
- **North-star metric:** **Share of role-played scam calls where the person stops before transferring.**
- **Constraints:** Privacy and consent, **no call interception without permission**, and **false alarms**.
- **Why it matters:** Reported cyber-fraud losses in India run into thousands of crores a year; the PM publicly warned about digital-arrest scams in 2024. Banks and insurers want ways to stop transfers in the moment.
- **Suggested directions:** (1) a family safety circle that prompts a check with someone in real time, (2) call-pattern signals shared with consent, (3) bank-side friction on unusual transfers.
- **Suggested stack:** Voice — Sarvam AI, Deepgram or Whisper, ElevenLabs, Vapi or Retell, Exotel or Twilio. Mobile — PWA, Expo (React Native), MSG91 or Twilio SMS.

## OUR PRODUCT: RUKO ("stop" in Hindi)
A consent-first safety layer with **three interventions + one testing engine**. The testing engine is our winning edge: the brief's mechanic is *agent safety & testing* and the north-star is a *measured* rate — we will be the team that actually measures it live.

### 1. Ruko App (elder-facing PWA, Hindi + English, huge-text UI)
- One giant button: **"Is this call real?"** → opens a voice check with the Ruko Agent.
- **Ruko Agent** (Sarvam AI for Hindi/Indic STT+TTS, fallback Deepgram/Whisper + ElevenLabs): calm, respectful voice that asks 4–5 short questions (Did they say "digital arrest"? Claim CBI/ED/customs/courier/TRAI? Tell you to stay on video? Not to tell family? Ask you to move money to a "safe/RBI verification account"?). Returns a **risk score + plain-language verdict**: *"Digital arrest does not exist in Indian law. Police never ask for money on a video call. Hang up. Call 1930."*
- **Consented passive signals** (opt-in, shown clearly on screen): long call (>20 min) from unknown number + banking/UPI app opened during or right after the call → gentle nudge. On Android/Expo read call state only with explicit permission; in the PWA demo **simulate these signals** with a "signal panel". Never record or intercept call audio without permission.

### 2. Family Safety Circle
- Elder adds 1–3 trusted contacts + a **family code word**.
- When risk is high OR the elder taps the button, the circle gets an **instant SMS (MSG91/Twilio) + automated voice call (Exotel/Twilio)**: "Papa may be on a scam call. Call him now." with one-tap "I'm calling" / "It's fine" responses.
- Elder screen shows "Your daughter Priya has been alerted and is calling you" — the social interrupt is the intervention.

### 3. Bank-side Friction (mock bank / UPI screen + fraud-team console)
- Mock transfer screen. Rules engine flags: large amount vs. history, new payee, transfer during/after a long unknown call, "RBI/safe account" payee name, elder Ruko risk score high.
- Flagged → **cooling-off interstitial** (30-min hold, scam explainer in Hindi, "call your family contact first") + optional **family co-approval**.
- **Fraud-team console:** live queue of held transfers with reasons, release/block buttons, signals shown only if the user consented.

### 4. Scam Simulator & Test Lab (the differentiator)
- **AI scammer agent** (Vapi or Retell + ElevenLabs voices) that role-plays 3 scripts — *CBI digital arrest*, *customs parcel with drugs*, *courier/FedEx + Aadhaar misuse* — in Hindi and English, escalating pressure over a few minutes and ending with "transfer to this account" on the **mock bank screen**.
- **Benign control calls** (real bank KYC reminder, relative asking for help, delivery confirmation) to measure **false-alarm rate**.
- **Safety guardrails for the scammer agent (non-negotiable, say this to judges):** only calls pre-registered, consented test participants; announces at the start and end it's a Ruko safety drill (or a family member is present); stop-word "RUKO" ends the call instantly; never asks for real OTPs, card numbers, Aadhaar or passwords; money only moves on the mock screen; all transcripts auto-deleted after [7] days.
- **Experiment design:** 10 older adults + families. Each gets scam calls in two arms: **without Ruko (baseline)** vs **with Ruko** (counterbalanced order, different scripts). Log: stopped before transfer (Y/N), time-to-stop, which intervention fired (agent / family / bank friction), false alarms on benign calls.
- **Results dashboard:** north-star % (with vs without), false-alarm rate, median time-to-stop, breakdown by intervention. This is the hero slide.

## TECH DECISIONS (pick fast, don't debate)
- **Frontend:** Next.js 14 (App Router) + Tailwind + shadcn/ui, installable **PWA**; deploy on **Vercel**. (Expo only if time permits for real call-state signals.)
- **Backend/DB/Auth:** **Supabase** (Postgres + Realtime for the live fraud console and dashboard + Row Level Security).
- **Voice agent:** Vapi (or Retell) orchestrating LLM + **Sarvam AI** (Hindi STT/TTS) / Deepgram + ElevenLabs. LLM: Claude via API with a strict system prompt and JSON risk output.
- **Telephony/SMS:** Twilio (trial) or Exotel; MSG91 for India SMS. Wrap all in one `notify()` service with a **mock mode** so the demo never depends on a carrier.
- **Feature flags:** `MOCK_TELEPHONY`, `MOCK_SIGNALS`, `DEMO_MODE` (seeded data, deterministic scripts).

## DATA MODEL (Supabase)
`users(id, name, phone, language, role[elder|family|fraud_analyst|researcher])`
`circles(elder_id, member_id, relation, code_word_hash)`
`consents(user_id, scope[call_signals|app_usage|transcript], granted_at, revoked_at)`
`risk_events(id, elder_id, source[agent|signal|bank], score, reasons jsonb, created_at)`
`alerts(id, risk_event_id, member_id, channel, status[sent|ack_calling|ack_fine], ts)`
`transfers(id, elder_id, amount, payee, flagged bool, reasons jsonb, status[held|released|blocked|completed])`
`trials(id, participant_id, arm[baseline|ruko], script, is_scam bool, stopped_before_transfer bool, time_to_stop_s, intervention_fired, transcript_url, deleted_at)`

## RISK ENGINE
Combine (a) LLM classification of the conversation/answers into a JSON `{score 0-100, red_flags[], verdict_hi, verdict_en}` with (b) deterministic rules (keywords: "digital arrest", "CBI", "ED", "narcotics parcel", "RBI safe account", "don't tell anyone", "stay on video"; long unknown call; new payee; amount > X× median). **Rules can only raise the score, LLM can't override a hard rule.** Threshold tuned on the benign control calls to keep false alarms low; show the threshold slider on the dashboard.

## BUILD ORDER (time-box ruthlessly)
1. **Hour 0–2:** Repo, Next.js PWA shell, Supabase schema + seed, Vercel deploy, mock flags.
2. **2–8:** Mock bank transfer screen + rules engine + cooling-off interstitial + fraud console (Realtime). *This alone is a demoable product.*
3. **8–14:** Family Safety Circle: onboarding, code word, `notify()` with SMS + voice call, ack flow, elder "help is coming" screen.
4. **14–22:** Ruko Agent voice check (Hindi + English) with risk JSON → triggers circle + flags bank.
5. **22–30:** Scam Simulator agent (3 scripts + 3 benign) with guardrails; trial logging; results dashboard.
6. **30–end:** Run real/pilot trials (even 3–5 people + teammates' families beats zero — be honest about n), polish, demo script, backup video.

## UX RULES FOR OLDER ADULTS
Min 20px body / 32px buttons, high contrast, one action per screen, Hindi-first toggle, voice everywhere, no jargon, never shame the user ("Scammers fool smart people every day — you did the right thing by checking"). Always show **1930** (National Cyber Crime Helpline) and **cybercrime.gov.in**.

## PRIVACY & SAFETY CHECKLIST (show as a slide)
Explicit, revocable, per-scope consent · no call interception or recording without permission · data minimisation (store signals, not audio, by default) · transcripts auto-delete · family sees alerts, not conversations · bank sees reasons only for consented signals · scammer-agent guardrails above · false-alarm rate reported, not hidden.

## 3-MINUTE DEMO SCRIPT
1. **(20s)** Hook: play 10s of the AI scammer: *"This is the CBI. You are under digital arrest."*
2. **(60s)** Live: volunteer "Dadi" gets the scam call → signal panel lights up → she taps "Is this real?" → Ruko Agent in Hindi says digital arrest isn't real → her daughter's phone rings on stage.
3. **(40s)** She still tries to transfer ₹4,80,000 to "RBI Safe Account" → cooling-off screen → fraud console shows the held transfer with reasons.
4. **(40s)** Results dashboard: "Without Ruko X/10 stopped. With Ruko Y/10 stopped. False alarms: Z%." 
5. **(20s)** Safety & consent slide + path to banks/insurers (B2B2C: banks pay for friction + family circle as a white-label SDK).

## DELIVERABLES I WANT FROM YOU, IN ORDER
1. Confirm the plan in ≤10 bullets and list any assumptions.
2. Scaffold the repo and give me exact setup commands + `.env.example` (Supabase, Vapi/Retell, Sarvam, ElevenLabs, Twilio/Exotel, MSG91, Anthropic).
3. Build features in the build order above, each fully working in `DEMO_MODE` before moving on. After each step, tell me how to test it in under 2 minutes.
4. Write the Ruko Agent system prompt, the 3 scammer scripts + 3 benign scripts, and the scammer-agent guardrail prompt.
5. Seed data so the dashboard looks real even before trials; clearly label seeded vs real trial data.
6. A README with architecture diagram (Mermaid), consent model, and the experiment protocol.

Do not over-engineer. Do not stop to ask me questions unless truly blocked — make a sensible call, note it, keep going.
