# Research: UPI, banks, and where Ruko fits

Checked 22 Oct 2026. Each finding says what was confirmed and what was not. **Rule: if it is marked UNVERIFIED, do not put it on a slide as fact.**

## 1. RBI discussion paper on friction for digital payments

- **What it proposes** (reported from 10 Apr 2026; business press, e.g. [Business Standard](https://www.business-standard.com/finance/personal-finance/one-hour-delay-to-upi-friction-rbi-proposals-to-fight-online-fraud-126041000580_1.html)):
  - A mandatory delay of up to **one hour** on account-to-account transfers above **₹10,000**, including UPI. The debit is provisional and can be cancelled; the customer is alerted if it looks suspicious. Merchant payments are excluded.
  - A **kill switch**: one facility to disable all digital payments from the account. Re-enabling may need authentication or a branch visit.
  - A **trusted person** for customers aged **70+** and people with disabilities. Secondary summaries put the threshold at **₹50,000**, optional, but they **disagree on details**.
- **Status: a draft.** Feedback was due 8 May 2026. I found **no report of a final circular**. UNVERIFIED whether it has since become final. Check the RBI website before saying "RBI requires".
- **Exact rupee thresholds:** ₹10,000 (delay) is consistent across sources. The ₹50,000 trusted-person threshold is from secondary summaries only: UNVERIFIED against the paper itself.

## 2. UPI Circle (NPCI, August 2024)

- A primary user can delegate to **up to five** secondary users; each secondary user can link to only one primary. ([Business Today](https://www.businesstoday.in/amp/personal-finance/news/story/upi-circle-what-is-the-new-feature-and-how-will-it-work-for-multiple-users-check-top-5-points-441849-2024-08-17))
- **Full delegation:** the secondary user pays alone within **₹5,000 per transaction and ₹15,000 per month**. **Partial delegation:** the secondary user starts the payment and the primary user approves it (one source says with their UPI PIN: UNVERIFIED against NPCI's own guidelines).
- **What it is not:** it delegates *spending to someone else*. It is **not** a way for family to approve the elder's own payments. That gap is exactly what Ruko's trusted-person approval fills.

## 3. DoT Financial Fraud Risk Indicator (FRI)

- Announced by the Department of Telecommunications on **21 May 2025** (the PIB release; some outlets date it 22 May). It rates mobile numbers **Medium, High or Very High** risk of financial fraud, from inputs including the I4C's NCRP, DoT's Chakshu, and intelligence from banks. Banks and UPI apps use it in transaction monitoring; PhonePe declines payments to Very High numbers. ([Voice&Data](https://www.voicendata.com/news/dot-launches-financial-fraud-risk-indicator-to-curb-cybercrime-in-digital-payments-9149405))
- **"₹5,044 crore prevented by Aug 2026": UNVERIFIED.** I could not find it. Do not use it.
- **It is for institutions. There is no public API.** Ruko must not assume access. Ruko links elders to **Sanchar Saathi / Chakshu** reporting and **1930**.

## 4. Google's on-device scam detection (20 Nov 2025)

- Gemini Nano, on the device, no audio recorded or sent to servers; **off by default**; unknown numbers only; a beep tells participants; **Pixel 9 and later** at launch. (TechCrunch, Storyboard18, Gulf News.)
- A pilot with **Google Pay, Paytm and Navi** warns during screen-sharing calls (Android 11+), with a one-tap option to stop sharing.
- **Language: sources disagree.** Several say English only; TechCrunch says Hindi and English. Treat "English only" as UNVERIFIED.
- Pixel's share of the Indian market was under 1% in 2024 (a limit on reach).

## 5. Android call screening

- `CallScreeningService` (API 29+): the app can allow, reject, silence or skip the call log for a call, and it must call `respondToCall()` within **about 5 seconds** of being bound, so the decision must be local and fast. The user grants the role through `RoleManager` (`ROLE_CALL_SCREENING`) with a system dialog. ([Android Developers](https://developer.android.com/reference/android/app/role/RoleManager))
- It gives **no access to call audio**.
- **READ_CALL_LOG:** I could not confirm from the sources found whether it is needed. Third-party SDK docs list only the role plus `READ_PHONE_STATE` and `READ_CONTACTS`. Ruko's design does **not** use it either way. UNVERIFIED on the platform side.
- The caller-number verification status (STIR/SHAKEN-style) is exposed on newer Android versions (API 30+, from memory of the docs: UNVERIFIED here). Ruko treats it as optional.

## How Ruko fits

| What exists | What it does | The gap Ruko fills |
|---|---|---|
| RBI draft (delay, kill switch, trusted person) | Friction at the payment, if adopted | Ruko Guard is a working mock of exactly that friction, so banks can see it before the rules are final. The draft is a draft. |
| UPI Circle | Delegates spending to others | Not family approval of the elder's own payment. Ruko adds it, with a code word. |
| DoT FRI | Rates numbers, for institutions | No public API. Ruko grades numbers with its own list (community reports, series, international) and routes people to Chakshu and 1930. |
| Google scam detection | Warns the person on newer Pixels | Any phone, Hinglish, family in the loop, elder-first screens, and the payment moment. |
| Android call screening | Lets an app grade a number before it rings | Ruko's Android layer uses it with no audio and no risky permissions, and alerts the family. |

**The honest summary:** Ruko cannot hear calls or stop a real PIN entry in a real bank app today. The real-money stop depends on a bank or payment app calling Ruko Guard. What Ruko offers is the *whole loop* (setup, warning, family, payment pause) for the people the platforms do not reach.
