# Ruko: architecture (one page)

**Job to be done:** When an older person is on a call with someone pretending to be police, customs or a bank, they want to know straight away that it is a scam and what to do next, so they hang up and do not transfer money.

**Current workflow:** Phone rings → a "CBI officer" says "digital arrest" → fear, pressure, "don't tell anyone", "don't hang up" → the person doubts but has nobody to ask → transfers savings → family finds out later.

**Future workflow:** Tap "Is this a scam?" (or Ruko Line screens the call) → answer 5 yes/no questions or say what the caller said → big **STOP** → tap Hang up → Ruko Companion says what to do next, one question at a time → family is told and Money Lock stops any transfer in the mock bank.

## Input
- The person's answers to 5 yes/no/not-sure questions and who the caller claims to be (tiles).
- Optional: what they said (typed or spoken) or a photo of a message.
- For Ruko Line: the caller's number and what the caller says to the screening assistant.
- Code checks it first: empty, whitespace, very long or malformed input never reaches a decision.

## AI (Gemini, free tier, optional)
- Reads the optional words or photo and returns **warning-sign codes, each with the words it relied on** (for example "threatened arrest: 'I will be arrested'").
- Words the Companion's replies and the family message in plain English or Hinglish.
- It is used here because a rule cannot read a rambling Hinglish sentence or a screenshot. It never decides anything.
- No key, no quota or too slow (10 s): the phone's own phrase check runs and the screen says "Checked on this phone only".

## Logic (plain code, always the decider)
- Scam Radar (`lib/radar.ts`, `data/scam-patterns.json`): two "yes" answers, or two phrases of a serious scam, give STOP. A police/CBI claim alone gives "Be careful".
- **Not enough to judge** (`hasEnoughToJudge`): empty input, "I don't know", or mostly "not sure" gives "I can't tell yet", never an all-clear.
- Threat engine (17 tactics, 7-stage kill chain), 17 payment rules, trusted-person approval, duress PIN, mule-account checks.
- Ruko Line (`lib/line.ts`): grades the number, screens the caller, replays the call on the server so a decision cannot be forged.
- Safety rule: AI evidence can raise a warning but never lower STOP.

## Action
- STOP screen with Hang up, Call family, WhatsApp family, 1930.
- Family Circle alert with a "what to say" script; Money Lock freezes transfers; Companion guides the next minute; Ruko Line puts through, takes a message or blocks and adds the number to the block list.
- Nothing is intercepted or recorded. Only signal codes are stored.

## Output
- One decision the person can act on in seconds: STOP, "Be careful", "I can't tell yet" or "Nothing matches (still never share an OTP)".
- The family sees status codes. The trial lab turns the same events into the north-star number: share of role-played scam calls where the person stopped before paying.

## What stays human
Whether to hang up, whether to call family or 1930, whether to proceed with a payment (family approves large ones), who is in the Circle, and the consent to take part in the trial. Ruko never calls, pays or blocks a bank account for the person.

## Why these tools
- **Claude Code** to build from plain English, in small tested steps (over 250 automated checks).
- **Next.js + Vercel:** one project holds the phone-friendly web app (PWA, no app-store install) and the server; one-step deploy to Mumbai.
- **Supabase:** accounts, family circle, trial data; salted hashes, no audio.
- **Gemini free tier:** reads words and photos at no cost. The AI is optional, so the demo never depends on it.

## Failure cases
| What goes wrong | What Ruko does |
|---|---|
| Empty, vague or "I don't know" input | "I can't tell yet", asks for more, offers family and 1930. No fake certainty. |
| AI is slow, out of quota or no key | Phone's own phrase check; says it was checked on the phone only. |
| AI invents or misses a sign | Signs are shown with the quoted words; STOP is decided by code and AI can never lower it. |
| Genuine call looks unusual | No family alert and no Money Lock unless money or a code is asked; false-alarm rate is measured in the trial. |
| Caller pushes against the call-back test | Ruko Line blocks, tells family, locks money only if money or a code was asked. |
| Network or server down | Safe message: "I couldn't check this. Call your family or 1930." |
| Real calls | Not intercepted. A real-call route (phone number or Android app) needs consent and a separate decision. |

## The three tests this supports
1. **Fast decision:** 5 questions to STOP in about 1.7 s; typed words to STOP in about 9 s with AI.
2. **After STOP:** Hang up opens the Companion, which asks "did you send money?" and gives the next step.
3. **Bad input:** empty, vague, gibberish and long input never crash or claim certainty.
