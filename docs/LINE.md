# Ruko Line: the call gatekeeper

Added 22 Oct from the user's flow request. Two apps, one idea.

| Side | What it is | Where |
|---|---|---|
| The experiment ("extension") | The scam-call bot you run on consenting people, plus surveys and results | Trial lab `/lab`, bots in [BOTS.md](BOTS.md) (already built) |
| The fighting app | **Ruko Line**: grades an unknown caller, screens them, then puts through, takes a message or blocks | `/line`, `lib/line.ts`, `/api/line/screen` |

## How a call is handled

1. **Grade the number** before anyone speaks: green (saved contact), yellow (unknown), orange (risky: foreign number, reports), red (many reports, or you blocked it). From `lib/numberRisk.ts` plus the person's own block list.
2. **Green** is put straight through.
3. **Anyone else is screened** by a calm assistant: *who are you and what is it about?* then *which office, give me a number and I will confirm it on the official site and ring straight back.* A genuine caller is happy to. A scammer pushes ("don't disconnect", "no need to verify"), asks for money or a code, or threatens arrest, and gives themselves away. Ruko's own phrase check runs over everything the caller says.
4. **Decision**
   - **Put through**: calm caller, not a risky number.
   - **Took a message**: risky number, or nobody speaks. Never put through; no accusation.
   - **Blocked**: money or code asked, arrest threat, secrecy, or pushing against the call-back. Then the number goes on the person's block list (never rings again), the family is told, and if money or a code was asked, Money Lock turns on.
5. The decision is **replayed on the server** from what the caller said, so the browser cannot forge it. Only the number's hash and the reason codes are stored; the caller's words are not.

## Tested (`npm test`, `scripts/check-line.ts`, 24 checks)

Grading, genuine callers put through, scammers blocked, silent callers, Hinglish, the bot's own lines are safe, and the trial's drill scripts replayed as calls: **no scam script is ever put through (5 of 5), 3 of 5 blocked outright and the other 2 kept off the phone, and none of the 4 genuine-call scripts is blocked.**

## What is NOT built, and why

- **Answering a real call.** A web app or an ordinary phone app cannot answer, hold or connect calls. Two real routes, both need the user's go-ahead:
  1. A **Ruko number** (Twilio or Vapi, paid): the person forwards unknown calls to it; the bot answers; this engine decides; it connects or hangs up. Needs consent text, a recording policy (store codes, not audio) and legal advice.
  2. A **native Android app** with the call-screening role (Expo plus a Kotlin service). Can grade and block, but cannot hold a conversation with the caller; the risky-permission approval in `docs/V2_AUDIT_AND_PLAN.md` still applies.
- **Scraping caller details** from Truecaller and similar: against their terms, so not done. Grading uses the number's own pattern, community reports and the person's contacts. A paid lookup could be added later.
- A saved call log (the demo keeps a session list on the screen).
