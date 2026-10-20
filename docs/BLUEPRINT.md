# Ruko blueprint: the best defence against digital-arrest scams

*9 Oct 2026. This combines five research reports in `docs/research/`; every claim below is sourced there. It sits alongside `MASTER_PROMPT.md` and `DECISIONS.md`. **Where it changes a decision, the change is listed in §6 and needs the user's OK.***

---

## 1. The insight

A digital arrest isn't a "bad phone number" problem. It's a **capture**: authority, fear and **isolation** ("stay on camera, tell no one"), kept up for hours or weeks, until the victim **moves money through their bank**.

**How the money actually moves:**
- Mostly at the branch: breaking FDs, gold loans, RTGS transfers.
- Often in many instalments. One Mumbai couple made 26 branch visits in 40 days; a Bengaluru victim made 187 transfers.

**Recovery afterwards barely works:**
- India: ≈₹7,000 cr frozen through 1930, but **only ₹18 cr actually returned** to victims.
- Brazil's Pix returns 8.9%.

**Prevention is the only game.**

**Who owns which moment today:**

| Moment | Who's there |
|---|---|
| The phone call | Truecaller (number reputation), telcos (labels), Google (warns when screen-sharing) |
| The transaction | Bank fraud engines (they score the payment, not the person) |
| **The gap between the scam call and the money leaving**, where the person is captured, isolated and frightened | **Nobody. That's Ruko.** |

**What actually stops victims in India today:**
- **branch staff** (Kochi, Ahmedabad, Mangaluru, Hyderabad);
- **family who noticed** (Pune, Mumbai, Bareilly);
- **police showing up** (Bhopal).

One warning is not enough. In Rajkot last week, a bank warned a doctor, so she sent ₹58.5 lakh **through another bank**.

## 2. Positioning

> **Ruko is the safety layer between the scam call and the money. It breaks the isolation, brings in the family, makes the bank pause, and proves it works.**

- **Not** a caller-ID app. Truecaller does that well and for free.
- **Ruko means "stop".** The Prime Minister's digital-arrest advice was "Stop, Think, Take action". The brand matches a message India has already heard.
- **Who pays:**
  - **Banks, B2B2C.** The family uses it free through the bank.
  - **Why banks will pay now:**
    - From **1 Jan 2027**, frauds done "**under coercion or duress**" count as fraudulent, which shifts cost onto banks.
    - RBI's **April 2026 proposals** cover a 1-hour hold and trusted-person approval for customers aged 70+ (still proposals).
    - The **Supreme Court** is pressing RBI for a bank procedure.
    - The **2025 Authentication Directions** already let banks add risk-based checks.

## 3. The eight pillars (what makes Ruko the best)

### P1. "Is this call real?": a calm, certain answer
- **What it is:**
  - The elder taps one button. A calm voice asks up to 3 questions at a time, with a **keypad always available** as well as voice.
  - It recognises the **phrases from the real script**: parcel, Aadhaar misuse, TRAI, money laundering, "stay on camera", "don't tell anyone", "RBI verification", "refund after verification".
  - It answers with **one fixed fact**: "*No police, CBI, ED, RBI or court ever arrests anyone or takes money on a video call.*"
  - It adds the rules: **real bank calls come from 1600 numbers**, and check the name your phone shows for the caller.
- **Evidence:**
  - People who had heard of the specific scam lost money 9% of the time, versus 34% for those who hadn't.
  - The Kochi rescue turned on that fixed fact.
  - Monzo and CommBank "is the bank really calling?" checks see heavy use.
- **Edge over competitors:** it works on new numbers and WhatsApp video, where Truecaller is blind.

### P2. Silent "Tell my family": the isolation breaker
- **What it is:**
  - One tap, no confirmation and nothing visible to the scammer quietly alerts the family.
  - **The family gets what to *say*:** "Are you safe? I'm with you. Hang up; I'll call back in 2 minutes."
  - Ruko tells the elder plainly: "**If someone told you not to tell anyone, that is the scam.**"
  - A family **code word** handles calls pretending to be a relative, such as voice clones.
- **Evidence:** isolation predicts loss, and **51% of people who had someone intervene avoided losing money** (FINRA).
- **Rules:**
  - The elder is the user and controls it. **Never continuous monitoring of an adult** (Google Play stalkerware policy).
  - **Each family member accepts their own invite** (DPDP).

### P3. Smart pause at the bank
- **What it does:**
  - **Warns only on risk.** The target is warnings on fewer than 10% of routine payments, which avoids warning fatigue.
  - The warning **makes the safe choice the main button**: *Cancel / Pause / Call my family*.
    - In a randomised trial (CeDEx), that design cut scam payments from **22% to 4% (−81%)** and to **−94%** on repeat exposure.
    - Generic warnings had stopped working by the third time.
  - **Risk comes from behaviour, not the reason the customer gives:**
    - a new payee
    - an amount far above normal
    - a live call
    - breaking all FDs
    - a gold loan followed by RTGS
    - repeat branch visits
    - **large cash withdrawals** (Singapore saw scammers switch to in-person cash handovers)
  - **A 1-hour hold** above ₹10k to a new payee. **No early release during a live call.**
  - **A trusted person approves payments of ₹50k+ for customers 70+**, with a 24-hour wait to change who that person is. This mirrors RBI's proposal.
  - **The hold follows the person across visits and channels** until family or 1930 clears it, so the Rajkot "just use another bank" route is closed.
- **Evidence:** UK refund rules plus the power to delay payments cut losses 21%. Singapore uses a 12–24 hour hold and a rapid-draining rule.

### P4. Co-pilot for branch staff and the fraud desk
- **Teller check screen:**
  - 3 questions, starting with "*Do you trust this payee? Is anyone on the phone telling you to do this?*"
  - Prompts to take the customer **to a quiet area** and **show proof** (an RBI or I4C statement).
- **One-tap actions:** "Call 1930 now" and "E-lock account".
- **The fraud desk calls likely victims proactively.** Hong Kong's police outreach drove about half of its 2025 drop in losses.
- **The trusted contact is told within a fixed time** whenever a hold fires (FINRA does this within 2 business days).

### P5. Ruko Lock
- **What it is:** savings locked against digital transfer. Unlocking needs family approval or a branch visit, plus a 12–24 hour cooling-off.
- **Switched on by default during onboarding.**
- **Evidence:** Singapore locked S$6.6bn with **no reported fraud on locked money**. Hong Kong made the same thing opt-in and got about 3,200 users.

### P6. Practice that protects
- **What it is:**
  - **Interactive drills under 5 minutes**, specific to a scam and channel (phone, WhatsApp video), **mixed with genuine calls**.
  - **Boosters every 2–4 weeks.**
  - Scripts follow current scams: courier, TRAI, terror accusations, a cloned-voice "your son is arrested", a forged court order.
  - **A fictional agency** ("Central Investigation Cell – DRILL"). BNS §204 makes impersonating a real public servant risky even when no money is taken.
  - Saying "RUKO" stops it instantly. No real OTPs. A kind debrief afterwards.
- **Evidence:**
  - Interactive practice works; static tips don't (Robb & Wendel).
  - Repeated contact beats one-off: 22.4% vs 8.6% fewer repeat victims (US Postal Inspection Service trial).
  - The effect **fades**, so boosters matter.

### P7. Proof (the moat)
- **What it measures:**
  - **stop rate** with Ruko vs without;
  - **false-alarm rate** (from harmless control calls);
  - time to stop;
  - **money lost before the save**.
- **The trial scale:** an ordered "**furthest step reached**" scale, from hung up through overriding the hold. Reported honestly as a **feasibility pilot**: with 10 people, the stop-rate confidence interval is wide.
- **This becomes a product:** drill-based **stop-rate audits** for banks.
- **Why it's the moat:** no competitor publishes any effectiveness data, including Truecaller, Google and Airtel. Over time, scam scripts reported by elders and families across banks become shared intelligence that banks and telcos can't see on their own.

### P8. Reach everyone (after the hackathon)
- **Why:**
  - Only **41%** of Indian elders own a smartphone, and only 5% bank online.
  - **66%** find digital tools confusing.
- **What:**
  - A **basic-phone version**: missed call, phone menu (IVR) or SMS for "Is this call real?" and SOS.
  - **The family's phone and the bank branch carry the protection** for elders who aren't online.
  - Languages in this order: English, Hindi, Kannada, then the rest.

## 4. Built in from day one: trust and compliance
- **Separate consent for each purpose**: call signals, family alerts, transaction risk, drills.
  - "Teach-back": the elder says in their own words what Ruko does.
  - Withdrawing consent must be as easy as giving it.
- **Each family member consents themselves.** An adult child is not a lawful guardian.
- **The elder is the user.** No monitoring of adults; family alerts only when the elder triggers them or a risk event happens.
- **Signals, never audio.** No interception of calls.
- **Drills:** fictional agency, no real names or emblems, written consent, debrief, ethics approval before research use.
- **Data:**
  - DPDP-standard notices in English, Hindi and Kannada, and a grievance contact.
  - Breach reporting within 72 hours.
  - Minimal logs kept 1 year, content deleted sooner.
  - **Hosted in India** (Supabase Mumbai).
- **Distribution:** trial Android builds go through Play testing tracks, never as a loose APK file. No accessibility-service tricks.
- **Labels:** RBI items are "proposed"; the mock bank is labelled a simulation.

## 5. Language and design rules (from the evidence)
1. **Name the scam, then state the "never" rule.**
2. **Calm first:** "You are safe. You have done nothing wrong."
3. **One physical action per screen, starting with "End the call".**
4. **The safe button is always the biggest.**
5. **No shame**, ever: "This happens to doctors, officers and engineers." Banned words are checked automatically.
6. **Proof, not argument.** Always show 1930 and cybercrime.gov.in.
7. **Text at least 20px**, tap targets at least 48dp (aim for 12 mm), **7:1 contrast on warnings**, and every alert read aloud.

## 6. Changes to earlier decisions (need your OK)

| # | Was | Now | Why |
|---|---|---|---|
| a | Drills may say "CBI" or "police" | **A fictional agency** ("Central Investigation Cell – DRILL") | BNS §204 impersonation needs no cheating, so a real name is a legal risk |
| b | Family members are added directly by the elder | **The family member gets an invite and accepts it** | DPDP: each person consents to their own data |
| c | Real SMS through Twilio's international route | **App notifications first**, plus real calls (option A or B). For SMS, DLT registration (≈₹5.9k per operator, over budget) or skip SMS for now | Twilio's international route replaces the sender name with a random number, which looks like a scam to elders |
| d | Business: families subscribe | **Banks pay (B2B2C)**; families free through the bank; drill audits and partnerships second | Truecaller is free; bank liability rises from 2027 |
| e | "Family Safety Circle" | Rename, e.g. **"Ruko Family"** | Truecaller's launch uses "safety circle" language |
| f | Passive "isolation" alerts to family | **Only on risk events or when the elder triggers them** | Google Play stalkerware policy |
| g | Results: a stopped / not-stopped percentage | **Ordered "furthest step" scale + control calls + exact confidence intervals; called a feasibility pilot** | n=10 can't support strong claims |

## 7. What to build by 28 Oct (19 days, prioritised)

**Week 1 (10–16 Oct): foundations, plus what the trials need**
1. **Safety foundations:**
   - accounts (Google sign-in) and protected server routes;
   - consent screens for each purpose;
   - family invite and accept.
   - *Must exist before any real elder uses Ruko.*
2. **P1 "Is this call real?"**: the browser's free speech features, scripted questions, the fixed fact, the 1600 rule. English and Hindi first.
3. **P2 silent "Tell my family"**, with the "what to say" script.
4. **P3 upgrade:**
   - a warning with the safe action as the main button;
   - the hold persists across channels;
   - trusted-person approval;
   - FD-breaking and cash-withdrawal signals.

**Week 2 (17–23 Oct): drills and proof, and run the trials**
5. **P6 drills plus P7 trial logging and the results dashboard** (ordered scale, control calls, seeded vs real data clearly labelled).
6. **Run the trials** from about 18 Oct (10 elders, consent, debrief).
7. **P4 teller check screen** and the "Call 1930 / E-lock" buttons. **P5 Ruko Lock** (simple version).

**Week 3 (24–28 Oct): ship and pitch**
8. Deploy to Vercel (**rotate the Supabase secret key first**), final polish, the demo script, a backup video, and a pitch built on these research numbers.

**After the hackathon:**
- The Android app (call-screening role and call-state signals).
- The basic-phone version.
- All 8 languages.
- A bank pilot (AU Small Finance Bank or a Bengaluru co-operative bank).
- The RBI sandbox via a bank partner.
- An ISO 27001 roadmap.
- Partnerships with HDFC ERGO and Emoha.

**Being honest about scope:** this is a lot for one person in 19 days, alongside running trials. If time runs short, cut in this order:
1. P5 Ruko Lock
2. the teller screen (P4)
3. the Hindi voice

**Never cut:** the safety foundations (1), P2 and P7.

## 8. Business model (summary of `research/05`)
- **Primary:** "Vulnerable Customer Protection" for banks at **₹10–25 per enrolled senior per month**, plus a **₹3–8 lakh 90-day pilot**. Start with small finance banks and urban co-operative banks; they are faster and less crowded.
- **Secondary:**
  - stop-rate drill audits (₹2–5 lakh per 100 people);
  - an insurer add-on (₹20–50 per policy);
  - bundling with elder-care platforms (e.g. Emoha);
  - a low-cost family plan as an entry point.
- **First conversations:**
  1. AU Small Finance Bank
  2. a Bengaluru urban co-operative bank with many pensioner customers
  3. Emoha (distribution), plus HDFC ERGO
- **Risks:**
  - RBI may finalise the rules differently;
  - free public tools and Truecaller push prices down;
  - bank sales take 6–18 months;
  - few seniors are online, so onboarding runs through family and branches.

## 9. The 60-second pitch
1. "Indians lost ₹1,935 crore to digital arrest in 2024. Recovery returns almost nothing. **Only prevention works.**"
2. "The scam's weapon is **isolation**; the money leaves through the **bank**, often at the branch, over days."
3. "Truecaller labels calls. Google warns about screen-sharing. **Nobody owns the moment between the call and the money. Ruko does.**" (Show the live demo.)
4. "**We measured it.** Without Ruko, X of 10 elders stopped. With Ruko, Y of 10. False alarms: Z." (Stated as a feasibility pilot.)
5. "From 2027, coercion frauds fall on banks. RBI has proposed trusted-person approval for 70+. **Ruko is that system, built for elders and proven.**"

## Research files
1. `research/01-scam-anatomy.md`: how the scam works, the numbers, real saves and failures
2. `research/02-global-interventions.md`: UK, Australia, Singapore, Japan, Hong Kong, US, and the big platforms
3. `research/03-behavioural-science-and-ux.md`: why people fall for it, what works, 15 design rules, the trial design
4. `research/04-law-and-platforms.md`: RBI, DPDP, telecom, criminal law, Android and iPhone, working with banks
5. `research/05-market-and-business.md`: competitors, who pays, pricing, first customers
6. `COMPETITORS.md`: the first quick scan
