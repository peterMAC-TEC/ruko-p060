# RUKO: Advancement Prompt (v2)

*Received from the user on 9 Oct 2026. Saved verbatim. The response to it is `docs/V2_AUDIT_AND_PLAN.md`.*

---

You are continuing work on Ruko, an existing app that protects people from scams
during phone calls and video calls. Read the existing codebase and the original
master prompt first. Do not rebuild what works. Your job is to make Ruko the most
effective scam-prevention app in the world, measured by one thing: money and
people actually saved.

## 1. ELEVATOR PITCH

I want to build **Ruko**, for **everyday phone users, especially parents,
grandparents, and first-time digital payment users**, who **get pressured on
calls and video calls by scammers posing as police, banks, couriers, government
officials, or family members**, so that **they stop, verify, and never lose
money or dignity to a scam again.**

"Ruko" means "stop." Every feature must serve that one moment: creating a pause
between a scammer's pressure and the victim's action.

## 2. CORE FEATURES (the only three that matter)

### Feature 1: Scam Radar (before and during the call)
- **Pre-call risk check:** score incoming numbers using community reports,
  known-scam number lists, number patterns (spoofed, international, newly active),
  and whether the number is in the user's contacts. Show a clear risk label on
  the incoming call screen where the platform allows it.
- **In-call "Is this a scam?" button:** a floating, one-tap button. It opens a
  fast guided check: "Are they asking you to stay on the call? Pay to avoid
  arrest? Install an app? Share an OTP? Keep this secret?" Two or more "yes"
  answers trigger a full-screen STOP warning with the exact scam type named.
- **Listen mode (Android, opt-in):** with explicit consent, the user puts the
  call on speaker and Ruko listens through the microphone, transcribes on-device,
  and flags scam language in real time. Process audio on-device only. Never
  upload or store it.
- **Scam pattern library:** detect and explain at minimum these patterns:
  digital arrest / fake police or CBI or customs officer, courier parcel with
  "drugs" inside, KYC / bank account block, electricity disconnection, fake
  customer care, family emergency with voice clone, investment / task / trading
  groups, sextortion video calls, loan app harassment, OTP or screen-share
  requests (AnyDesk, TeamViewer, QuickSupport). Keep the library in a remote
  config file so new scams can be added without an app update.

### Feature 2: Money Lock (the moment money moves)
This is the single most important feature. Scams succeed at the payment step.
- When a risky call ended in the last 30 minutes (or is still active), and the
  user opens a payment app, scans a QR, or copies a UPI ID or account number,
  show a **Money Lock screen**: "You just spoke to a number Ruko flagged. Real
  police, banks, and courts NEVER ask for money over the phone."
- Add a **cool-down timer** (default 10 minutes, user adjustable) before the
  warning can be dismissed for flagged cases.
- Offer one-tap **"Call my trusted person first."**
- Work with what each OS permits (accessibility service, notification listener,
  clipboard detection, foreground app detection on Android; Shortcuts and
  Screen Time-style approaches on iOS). Document each approach and its
  Play Store / App Store policy risk.

### Feature 3: Family Shield (no one fights a scam alone)
- User adds 1 to 3 trusted contacts.
- When a high-risk call is detected or Money Lock triggers, the trusted contact
  gets an instant alert: "Amma may be on a scam call right now. Call her."
- **"I've been scammed" emergency flow:** one tap shows exactly what to do in
  the golden hour: call the national cybercrime helpline (1930 in India), file
  at cybercrime.gov.in, call the bank to freeze the transaction, report the
  number via Sanchar Saathi (Chakshu). Prefill everything Ruko already knows
  (number, time, amount if entered, scam type) into a shareable report.

Everything else (dashboards, gamification, news feeds, chat) is out of scope
until these three are excellent.

## 3. USER FLOW (screen by screen)

1. **Onboarding (under 90 seconds):** choose language (English, Hindi, plus
   regional languages), see one sentence explaining what Ruko does, grant only
   the permissions needed, each with a plain reason ("We need this to warn you
   before you pay a scammer"). Add a trusted person (skippable, but nudged).
2. **Home screen:** a large, calm status: "You are protected." Below it: the
   big "Is this a scam?" button, the trusted person, and recent flagged calls.
3. **Incoming risky call:** a risk banner with the scam likelihood and the
   reason in plain words ("Reported 214 times as fake police").
4. **During the call:** a floating Ruko button. Tap it to open the guided check
   or listen mode.
5. **STOP screen:** full-screen, red-amber, names the scam, states the one rule
   being broken ("Police never arrest anyone on video call"), and offers three
   actions: Hang up, Call trusted person, I'm not sure (opens a 3-line
   explanation).
6. **Money Lock screen:** appears when a payment is attempted after a risky call.
   Countdown, reason, call trusted person.
7. **Post-call screen:** "Was this a scam?" Yes / No / Not sure. This trains the
   community database and reduces false positives.
8. **Emergency "I've been scammed" flow:** step-by-step recovery with prefilled
   reports and one-tap calls.
9. **Settings:** languages, trusted contacts, sensitivity level, data controls,
   delete my data.

## 4. DESIGN PHILOSOPHY

**Ruko should feel like:** a calm, sharp friend who works in cybersecurity and
always picks up the phone. Steady, protective, certain.

- Readable by a 70-year-old without glasses: large type (minimum 18sp body),
  high contrast, big tap targets (minimum 56dp).
- Speaks plainly, in the user's language. No jargon. Every warning answers
  "What is happening? What should I do right now?"
- Fast: the STOP screen must appear within 1 second of the trigger.
- Works offline for core protection (pattern library and recent number lists
  cached on-device).
- Private by design: on-device processing first, minimal data, compliant with
  India's DPDP Act 2023 and app-store policies. Explain every permission.

**Ruko must NEVER feel like:**
- Spyware. No hidden recording, no audio uploads, no reading private messages
  beyond what the user explicitly enables.
- Shaming. Never "How could you fall for this?" Victims already feel shame,
  which is why they don't report. Use "Scammers are trained professionals.
  This could happen to anyone."
- Alarmist. Too many false warnings and users will ignore real ones. Keep
  high-severity alerts rare and accurate. Track the false-positive rate as a
  core metric.
- Complicated. If a feature needs a tutorial, redesign it.

## 5. INSTRUCTIONS FOR CLAUDE CODE

Work in this order. Do not skip ahead.

1. **Audit:** read the existing Ruko codebase. Summarize what exists, what is
   broken, and what overlaps with this prompt.
2. **Platform reality report:** for Android and iOS separately, list exactly
   what is technically possible for call screening, call audio access, payment
   interception, overlays, and background operation, plus the Play Store /
   App Store policy risk of each. Flag anything that could get Ruko rejected.
   Wait for my approval before building around a risky permission.
3. **Plan:** propose a phased build plan.
   - Phase 1: Scam Radar (pre-call scoring + guided check + STOP screen)
     and the pattern library.
   - Phase 2: Money Lock.
   - Phase 3: Family Shield + emergency recovery flow.
   - Phase 4: Listen mode (on-device transcription and detection).
4. **Build** one phase at a time. After each phase, write tests, run them, and
   show me a short demo script of the user flow.
5. **Measure:** add privacy-safe, anonymous metrics for: scams flagged, Money
   Lock triggers, payments abandoned after Money Lock (the "money saved"
   number), false-positive reports, and time from trigger to warning.

The definition of success: a real person, mid-scam, sees Ruko, stops, and keeps
their money. Build every screen for that person.
