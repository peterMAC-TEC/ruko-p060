# Ruko (रुको, "stop")

**Problem P060, "This is the CBI. You are under digital arrest."** Scammers posing as police, customs or couriers keep older people on video calls for hours and push them to move their savings. Ruko helps them, and their family, stop before money moves.

- **Live:** **https://ruko-seven.vercel.app** (elder: `/app`, family: `/family`, laptop demo: `/demo`). The demo people, Kamala (72) and her daughter Priya, are an open sandbox. `/lab` and `/results` are locked: open `/lab/unlock?key=<RUKO_LAB_KEY from app/.env.local>` once on the facilitator's browser.
- **Code:** [app/](app/) (Next.js 16, Supabase, Gemini). Developer notes: [app/README.md](app/README.md) and [app/CLAUDE.md](app/CLAUDE.md).
- **Field test protocol (10 older adults and their families):** [docs/FIELD-TEST.md](docs/FIELD-TEST.md)
- **The bots (scammer, defender, companion, survey):** [docs/BOTS.md](docs/BOTS.md)
- **Decisions:** [docs/DECISIONS.md](docs/DECISIONS.md)

## What it does

| Who | Screen | What happens |
|---|---|---|
| Elder | `/app` → **Is this a scam?** (`/check`) | Tap who is calling, answer yes/no (read aloud, Hindi or English). **Or tell Ruko what they said** (tap and speak, or type), **or show a photo** of the "warrant", ID card or message. The AI lists the warning signs and **quotes the exact words** behind each; plain code decides the verdict. A full-screen **STOP** names the trick and the one rule being broken, then offers: hang up, **call Priya**, **WhatsApp Priya**, or call **1930**. |
| Elder | after **Hang up**, or `/app` → **Talk to Ruko** | **Ruko Companion**: a calm voice and text chat in English or Hinglish. It asks if the caller is still on the line, helps them end the call, asks if money or an OTP already went (then points to 1930), and stays with them until family arrives. Free questions are answered by fixed lines for risky topics and by the AI for the rest, all safety-checked. It talks to the person on their own phone; it never joins the call. |
| Elder | `/app` → **Tell my family** | A silent alert: nothing a scammer on video would notice. |
| Family | `/family` | Red alert with sound and vibration ("Ruko's call check says Kamala is probably on a scam call"), a one-line live status from the Companion ("Kamala says the caller has hung up"), **Call Kamala now** right under it, the reasons in plain words, and a "What to say" script. |
| Research | `/lab`, `/results` | **A scammer bot plays the caller** in the practice calls (fixed script, replies to what the person says, ends kindly after two refusals), then a **survey bot** asks the participant and their family a few quick questions, and anyone can answer the open survey from a QR code. The results page shows the north star, the survey answers and a clearly labelled simulator (below). See [docs/BOTS.md](docs/BOTS.md). |
| Bank | `/bank`, `/console` | A practice bank: a payment to a "safe account" during a live threat gets a 30-second pause, then a hold; the family is alerted and the fraud desk sees why. |
| Research | `/lab`, `/results` | Consent-gated role-play scam calls and the **north star: the share of role-played scam calls where the person stops before transferring**, with vs without Ruko, plus false alarms. |

**Safeguards:** no call interception (Ruko only acts when the person taps it); no audio, photos or transcripts stored, only signal codes; graded wording ("Be careful. Check before you do anything") so a single keyword never raises an alarm on its own; no financial advice; the AI is optional, and the phone's own phrase check answers when the AI is busy or offline.

## Run it

```bash
cd app && npm install && npm run dev -- -p 3200
```

Tests: `npm test` (all rule, radar, threat, trial, warning-sign, companion, bot and survey checks). Simulator: `npm run sim` (the scammer bot against Ruko's own check and the defender bot). Live AI cases: `npm run check:ai` (uses the free Gemini quota).

## Presenter mode (never depends on the internet or the AI)

```bash
cd app && npm run demo:offline
```

- The laptop opens **http://localhost:3300/demo**.
- Two phones on the same Wi-Fi open `http://<laptop IP>:3300/app` (Kamala) and `http://<laptop IP>:3300/family` (Priya). Find the laptop's IP with `ipconfig`.
- Everything runs on the laptop: in-memory demo data, with the phone's own phrase check standing in for the AI. **Start over** on `/demo` resets it.

## The 2-minute demo script

Two phones: **Kamala's** (elder, `/app`) and **Priya's** (family, `/family`, with **Turn on sound** pressed beforehand). Optional: the laptop on `/demo` for the bank and the fraud desk.

| Time | Do | Say |
|---|---|---|
| 0:00 | Hold up Kamala's phone, home screen. | "A call: *'This is the CBI. Your Aadhaar is in a money-laundering case. You are under digital arrest. Don't tell anyone.'* Retirees lose life savings to this every week, and their families find out too late." |
| 0:15 | Tap **Is this a scam?** → **Police, CBI, customs or a court**. | "Ruko is one big button. No typing. It reads every question aloud, in Hindi or English." |
| 0:25 | Answer **Yes** ("stay on the call or on camera?"), **Yes** ("pay to avoid arrest or trouble?"). | "Two yeses is enough. We never make a frightened person finish a form." |
| 0:35 | The **STOP** screen fills the phone. Read out the rule. | "It names the trick and the one rule being broken: *police never arrest anyone or ask for money on a video call.* And it never blames her." |
| 0:40 | On Kamala's STOP screen tap **Hang up**. Ruko's Companion opens and speaks. Tap **No, I hung up**. | "Ruko doesn't leave her alone with the fear. It asks one simple question at a time, out loud, in English or Hinglish." |
| 0:45 | Priya's phone rings and flashes red. Hold it up. | "At the same moment her daughter's phone rings with the reasons in plain words, a one-tap call and what to say. The scammer's power is isolation. Ruko breaks it." |
| 1:00 | Kamala's phone: **Call Priya** / **Also send Priya a WhatsApp**. | "If the app alert is missed, WhatsApp always gets through. Indian SMS needs business registration, so we don't depend on it." |
| 1:10 | Back, **Tell me what they said** → tap **Tap and speak** and say *"He said he is from CBI, I am under digital arrest, don't tell my son, transfer to the RBI safe account."* → **Check this**. | "Or she can just tell Ruko, in her own words. With the AI on, it lists each warning sign **with her exact words as evidence**. The AI only reads; plain code decides. Offline, the phone's own phrase check answers." |
| 1:30 | Laptop `/demo` → **Start the scam call** → **Open the payment** → **Send** on Kamala's phone → practice PIN **1234**. | "If she still goes to pay, her bank pauses the 'safe account' payment, alerts Priya and shows the fraud desk why." |
| 1:45 | `/results` (Illustrative, clearly labelled). | "Our north star is the share of role-played scam calls where the person stops before transferring, with Ruko vs without, for 10 older adults and their families. The protocol is in the repo." |
| 1:55 | — | "Ruko. One button between a scared parent and their savings." |

**If something fails on stage:** keep going on the same phone. Every step works offline in presenter mode. If the AI is slow, Ruko says "Still checking…" and answers from the phone's own phrase check within 30 seconds.

**Ruko Line** (`/line`): grades an unknown caller, screens them, then puts through, takes a message or blocks, and tells the family. See [docs/LINE.md](docs/LINE.md).

**Live call demo** (`/demo`, `/demo/live`): a fictional officer phones you by voice; Ruko steps in at the money ask; two endings. Walk-through in [docs/DEMO-SCRIPT.md](docs/DEMO-SCRIPT.md), answers in [docs/JUDGE-QA.md](docs/JUDGE-QA.md).
