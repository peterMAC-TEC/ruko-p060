# Ruko: solution thinking

## The problem (sourced)
- **₹22,845 crore** lost to cyber fraud in India in 2024, up from ₹7,465 crore in 2023 (Ministry of Home Affairs reply in Parliament, July 2025, via Scroll). That averages **about ₹7,200 every second** (our arithmetic: the 2024 total divided by the seconds in a year; an average, not live data).
- **1,03,488** financial cyber fraud complaints from senior citizens in 2025, with losses of about **₹4,005 crore** (MHA written reply in the Rajya Sabha, via Asianet Newsable).
- **Digital arrest** cases: **60,676 in 2023 → 1,23,672 in 2024**, about double, with about ₹1,935 crore lost in 2024 (government reply in Parliament, via Outlook Money and Inc42).
- **47%** of Indian adults in a 2023 survey had experienced an AI voice scam or knew someone who had (McAfee, The Artificial Imposter, 1,010 Indian respondents). That AI will make these scams rise again is **our hypothesis**, not a measured trend.
- Not used because we could not verify them: a 2025 total of ₹22,495 crore, 17,264 digital-arrest cases in 2025.

## Why awareness alone breaks
Under fear, a person stops checking. The caller adds authority (a badge, a case number), isolation ("tell no one"), and a deadline. People who "know about scams" still pay, because in the moment it does not feel like a scam. And a perfect voice is no proof of identity, so the defence cannot be "spot the fake voice".

## Ruko: three layers, before the money moves
| Layer | What it does | Built | Next |
|---|---|---|---|
| **Before** | Family sets Ruko up: code word, trusted people, test alert, printable Rule Card | Yes (/setup) | Assisted setup in shops and clinics |
| **During** | Spots pressure, secrecy and a made-up case; a big STOP; family alerted | Yes (live call, /check, Ruko Line) | Android call screening (logic built and tested; app not run on a device) |
| **At the money** | Money Lock pauses a risky payment; family approves only with the code word; Ruko Guard API for banks | Yes on a mock bank (/bank) | A pilot bank calling Ruko Guard |

## Real-world fit
- **RBI discussion paper (reported April 2026, a draft):** a one-hour delay above ₹10,000, a trusted person for customers 70+, a kill switch. Ruko Guard implements these as changeable rules, labelled "draft".
- **DoT Financial Fraud Risk Indicator:** rates numbers for banks; no public API. Ruko routes people to Chakshu and 1930.
- **UPI Circle:** delegates spending to others; it is not family approval of the elder's own payment. Ruko adds that, with a code word.
- **Google's call scam detection:** on newer Pixels, opt-in; sources disagree on languages. Ruko works on any phone, in Hinglish, with the family in the loop.

## Ruko's edge
Any phone (a PWA), English and Hinglish, the family loop, elder-first screens, and the payment moment itself. The AI reads and words; the code decides, so it is predictable, testable, explainable and works offline.

## Distribution
Families first (free, word of mouth, a shareable Rule Card). Then banks and payment apps through the **Ruko Guard API**: the only way to stop a real payment. Then telcos and Android call screening.

## North star and honesty
**The share of role-played scam calls where the person stops before paying.** Measured with 10 older adults (protocol in FIELD-TEST.md). **No field results exist yet.** The call is simulated in the app; a web app cannot ring a real phone. The bank is a mock; no money moves. Eval numbers are on synthetic data (EVAL.md).
