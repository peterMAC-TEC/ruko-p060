# Ruko's bots

Four bots, one idea: practise against scams safely, protect the person in the moment, and learn from every call. Each one keeps to the card's rules: **consent first, no call interception, no recordings, and as few false alarms as possible.**

| Bot | Who it talks to | Where | Built |
|---|---|---|---|
| **Scammer bot** (role-play) | A consented participant in a drill | Trial lab, caller screen | Yes |
| **Defender bot** (disarms a threat) | The scammer bot, in the simulator | `npm run sim`, results page | Yes, in the lab only |
| **Companion** (keeps the elder company) | The older person, on their own phone | After STOP, "Talk to Ruko" | Yes |
| **Survey bot** | Participants, families, outsiders | Call screen, `/survey`, QR poster | Yes |

## 1. The scammer bot (role-play)

**What it does:** plays the fictional "Central Investigation Cell – DRILL" officer in the practice call. In the lab, **Start call → "Bot plays the caller"** (on by default). The caller screen rings; when the participant answers, the bot opens the call (with the practice disclosure if no family member is in the room), then listens and replies by itself. The facilitator can still press Space, H and E, and tick levels.

**Fixed script and live replies mixed:**
- The *spine* is the drill script's own steps in order (accusation, secrecy, verification, money request), so every participant meets the same stages and results stay comparable.
- The *reply* depends on what they said (English, Hinglish or Hindi, read by `lib/bots/intent.ts`):
  - They hesitate → the script's pressure line for that step.
  - They ask for proof → a made-up ID from the fictional cell (once).
  - They mention family → a secrecy reminder.
  - They go along or say nothing → the next step.
  - They refuse → one more push; **a second refusal, or the stop word "RUKO", ends the call kindly with the debrief.** Nobody is pushed a third time.
  - An unexpected question may get one AI sentence first (Gemini, 4.5 s cap). The script still decides what comes next.
- **The facilitator sees** only the *kind* of each reply ("hesitated → asked for proof → refused") and a suggested level to tick. **The words are never stored.**

**Guardrails, as code (`lib/bots/guard.ts`, tested):** a fictional agency only; never a real agency, bank, company or officer (BNS §204); never asks for a real OTP, PIN, password, card, Aadhaar or account number; no numbers longer than a four-digit DRILL code; no violence; money only on the practice bank screen. Any AI sentence that breaks a rule is dropped.

**Limits:** the voice is the browser's text-to-speech (Indian English or Hindi), not a cloned or live voice. For a real phone call, the caller screen's sound is routed into the call as planned in `TRIAL_RUNBOOK.md`. The bot hears the participant only through the caller screen's microphone, so Chrome is needed.

## 2. The defender bot (tries to disarm a threat)

**What it does:** answers a caller who looks like a threat, on the person's behalf, with the calm playbook bank staff use: (1) ask for name, ID and an official number to verify; (2) state the rule ("no agency arrests anyone or collects money over a call"); (3) ask for it in writing; (4) **leave the call**, and tell the family and 1930. It leaves at once if the caller asks for money or a code. On a genuine call it stays polite, accuses nobody, and never alerts the family. It never argues, never lies, never agrees to anything, and never says the stop word.

**Where it runs, and why only there:** in the **simulator**. A phone app cannot join or listen to someone's real call, and the card forbids call interception. So it never talks to a real caller. Putting a bot on real scam calls would need a paid phone line and legal advice; it was considered and not chosen.

**The simulator** (`npm run sim`, and the grey "Simulated" panel on the results page) runs the scammer bot over every script, in English and Hindi, clean and with speech-to-text noise:
- **Ruko's own check on the whole call** (a person who just goes along): on which line did it warn, on which did it show STOP, and was that before the money request? Does it false-alarm on the genuine calls?
- **The defender vs the scammer bot**, and vs a **relentless** one that never gives up: does it leave the call, and **does it ever agree to pay or share anything (must be zero)**?

**Where it stands (22 Oct):** Ruko showed STOP before the money request in 24 of 30 scam runs and a warning before it in all 30. It false-alarmed on 1 of 24 genuine runs. The defender left every relentless call within 2–5 lines and never agreed to anything. These are checks on Ruko's rules, repeated on every change (`npm test` fails if they get worse). **They are not evidence that real older adults would stop.** That is the trial's job.

**What the simulator found and fixed in the product:** a lone common word ("KYC", "parcel") no longer raises a warning; "we never ask for your OTP" is a warning, not a scam sign; Hindi letters with a dot (फ़) now match; and new phrases catch cyber-desk, safe-custody, "read me the code on your screen", Aadhaar-misuse and power-cut-tonight scripts.

## 3. Ruko Companion (keeps the elder company)

After **Hang up** on the STOP screen, or from **Talk to Ruko** on the home screen, Ruko talks the person through the next minute, in English or Hinglish, out loud and on screen. It asks if the caller is still on the line, helps them end the call, asks if money or an OTP already went (then points to 1930), and stays with them until family arrives. The family sees a one-line status (a code, never words).

Risky topics (money, OTP, arrest, fear, "I already paid") get **fixed answers in 0.1 s**. The AI only answers other questions, and every reply is safety-checked first (no telling them to send, pay, share or install anything; no investment, legal or medical advice; no blame).

**New: "Help warn others".** After a scare, Companion offers a few plain questions (who the caller said they were, how it reached them, what they asked, how long, whether money went, what helped them stop). The answers are stored **with no names, numbers or accounts**, appear on the results page, and become a **ready-to-send report for 1930 / cybercrime.gov.in** with a checklist (add the date and time, the caller's number, the account they gave; keep screenshots; report the number on Chakshu). This is how Ruko gathers information for prevention and for cases, with the person's consent.

## 4. The survey bot

Ruko asks one question at a time, in English or Hinglish, answered with big buttons (voice optional), with a back button. Free text is scrubbed of names, numbers, emails and links before it is stored.

| Survey | For | How it opens | Linked to |
|---|---|---|---|
| **Participant** | The older person, right after a drill call | Call screen → **Ask P01** | Their code (P01…), the arm (with or without Ruko) |
| **Family** | The family member | Call screen → **Ask their family member** | The same call |
| **Open** | Anyone | **/survey**, or the **QR poster** (Lab → Survey QR, or **/survey/share**) | Nothing: anonymous. It ends with a "share with another family" button |
| **Incident** | A person who just had a scam call | Companion → **Help warn others** | Nothing: anonymous |

Results: **Results page → "What people told the survey bot"**: counts per question, fear scores with and without Ruko, and free-text answers, plus a **Survey CSV**. Erasing a participant erases their answers.

## How to run it

```bash
cd app
npm test                    # every check, including the bots, surveys and companion
npm run sim                 # Ruko's own check on whole calls
npm run sim -- --defender   # the defender bot's calls (also --relentless)
npm run demo:offline        # presenter mode: no internet, no AI
npm run check:ai            # a few live AI cases (uses the free quota)
```

**On the trial day:** `/lab` → enrol → open the call → leave **Bot plays the caller** on → open the caller screen in a second window → **Start call**. After the debrief, open the participant survey, then the family survey. Show the QR poster to families and neighbours for the open survey.

## What is not built (on purpose)

- A bot that answers or joins **real** scam calls.
- Phoning the elder or the family (needs paid Twilio or Vapi).
- A live cloned or studio-quality scammer voice.
- Hindi (Devanagari) in the Companion and surveys: the MVP is English and Hinglish. The scammer bot and the check still understand Hindi.
