# Research 4: What is legal and technically possible (as of 9 Oct 2026)

How to read this:
- Items marked **[unverified]** come partly from the researcher's background knowledge, because the search limit was reached. Check them before relying on them.
- Primary texts read directly: the RBI discussion paper, the RBI 2017 liability circular, Google Play's Call Log/SMS, Stalkerware and Accessibility policies, the Android telecom guide, and Google's Android 16 security post.

## 1. RBI and NPCI

**Discussion paper, 9 Apr 2026: "Exploring safeguards in digital payments to curb frauds"** ([rbi.org.in](https://rbi.org.in/Scripts/PublicationsView.aspx?id=23810)). These are four proposed options, not rules.

**Option 1: 1-hour delay on push payments**
- RBI's paper mentions both "above ₹10,000" and "₹10,000 and above"; the wording is inconsistent.
- The money leaves the payer straight away, but the payer can **cancel for any reason** within the hour. The bank should re-confirm unusual payments.
- The payer can whitelist a single payment or a payee.
- Merchant payments, mandates (NACH) and cheques are excluded.
- Payments above ₹10k are ≈45% of frauds by count but **≈98.5% by value**.
- **RBI itself says scammers may talk victims into whitelisting the payee.** Ruko should account for that.

**Option 2: Trusted person**
- **Mandatory for people aged 70+ and persons with disabilities**; optional for everyone else.
- Applies to push payments **above ₹50,000** (≈92% of fraud by value).
- Changing the trusted person → **24-hour cooling period**.
- Opting out → takes effect after 24 hours, and the bank must explain the risks first.
- The trusted person has no legal or beneficial interest in the account.

**Option 3: Credit cap**
- Accounts with low credit turnover get a ceiling of about ₹25 lakh a year in total credits.
- Anything above it becomes "shadow credit" and is reversed if not justified within 30 days.

**Option 4: Customer controls**
- Per-channel limits.
- An account-level **kill switch**; reactivation needs strong authentication or a branch visit.

**Status:**
- Comments closed 8 May 2026.
- **No draft or final directions found as of Oct 2026 (uncertain; check rbi.org.in).**

**Customer liability**
- **2017 circular** (in force today):
  - zero liability if the bank was negligent, or for a third-party breach reported within 3 working days;
  - if reported within 4–7 days, liability is capped at ₹5k–25k;
  - the burden of proof is on the bank.
- **2026 amendment (final reported 25 Jun 2026; applies to transactions from 1 Jan 2027):**
  - **"Fraudulent" now explicitly includes transactions a customer made "under coercion or duress"**. **That covers digital-arrest victims, so the cost shifts towards banks.**
  - Zero liability for a third-party breach reported within 5 calendar days.
  - A once-in-a-lifetime compensation pilot: 85% of losses up to ₹50k, capped at ₹25k (must be reported to the bank and 1930 within 5 days).
  - SMS alerts mandatory above ₹500.

**Other RBI rules**
- **Authentication Directions 2025** (effective 1 Apr 2026): two-factor authentication, **and banks may add risk-based checks** (device, behaviour, location). **This lets a bank use Ruko's signals today.**
- **Fraud Risk Management Master Directions 2024:** early-warning signals connected to the core banking system, covering non-credit transactions too.
- **MuleHunter.AI:** live in 29 banks (Jul 2026), flagging ≈20k mule accounts a month.
- **DPIP:** a 7-bank pilot.

**NPCI**
- Person-to-person "collect" requests ended 1 Oct 2025.
- **Payment apps must show the verified banking name of the person being paid, and users can't edit it.**
- UPI Lite: ₹1k per payment, ₹5k balance.
- "UPI Help" assistant: in pilot.
- UPI Circle (delegated payments) is a possible model for the trusted-person experience [unverified].

## 2. DPDP Act 2023 and DPDP Rules 2025

**When it applies**
- The Rules were notified 13 Nov 2025.
- Consent-manager registration opens **13 Nov 2026**.
- **The main duties apply from 13 May 2027:** notices, consent, security, breach handling and retention.
- MeitY has proposed bringing some dates forward, but nothing has been gazetted. **Build to the full standard now.**
- Until then, the IT Act's s.43A and the 2011 SPDI Rules apply. Financial data counts as "sensitive", so it needs consent, a privacy policy and reasonable security.

**Notices (Rule 3)**
- Standalone and in **plain language**.
- **An itemised list of the data collected and each purpose.**
- Withdrawing consent must be **as easy as giving it**.
- Available in English or any of India's 22 scheduled languages.

**Guardians**
- **An adult child is *not* automatically a lawful guardian**; that needs a court or authority appointment.
- **So the elder must give consent personally.**

**Breaches (Rule 7)**
- Tell the people affected without delay.
- Tell the Data Protection Board, with a detailed report **within 72 hours**.
- CERT-In requires reporting **within 6 hours** and 180 days of logs kept in India [unverified].

**Retention (Rule 8)**
- Erase data when its purpose is served, with 48 hours' notice.
- **Keep minimal processing logs for at least 1 year.**
- So: delete transcripts and audio, but keep minimal logs.

**Penalties:** up to ₹250 crore.

**What Ruko needs**
- **Separate consent for each purpose:** call signals, family alerts, transaction risk data, drill participation.
- **Each family member gets their own notice and accepts it before their number is used.**
- Signals only, never audio.
- A grievance officer, a withdraw-consent button, and notices in English, Hindi and Kannada.

## 3. Telecom

**SMS (DLT registration)**
- **Any entity with a PAN, including a sole proprietor, can register.**
- ≈₹5,900 per operator (vendor-reported); 3–7 days to approve; templates take 1–3 days each.
- Ruko's alerts would be "Service-Implicit" messages (headers ending -S).
- URLs and apps in messages must be whitelisted.

**Twilio**
- **The international SMS route needs no DLT, but replaces the sender name with a random short code**, which looks like a scam to elders.
- The domestic route needs DLT.
- Calls to India must come from non-Indian numbers.

**Robocalls**
- TRAI (Aug 2024): computer-generated promotional calls from unregistered senders lead to disconnection and up to **2 years of blacklisting**.
- A 2026 amendment reportedly brings AI-based detection and automated calls under the rules.
- **Don't voice-clone real people.**

**1600 and 140 numbers**
- **Real bank service calls come from the 1600xx series, which can't be blocked**; promotional calls use 140xx.
- **Ruko can teach elders: "real bank calls come from 1600".**

**CNAP (the caller's KYC name shown on screen)**
- On by default, but only on 4G/5G phones; target Mar 2026.
- **Coverage in the Karnataka circle is unconfirmed.**

**DoT anti-spoofing**
- Foreign calls showing +91 numbers have been blocked since Oct 2024.
- Report numbers through **Chakshu** on Sanchar Saathi; Ruko should link straight to it.

**Messaging apps:** the 2025 Telecom Cyber Security rules led to a SIM-binding direction for WhatsApp-type apps.

## 4. Criminal and IT law

**Call recording**
- No statute sets a one-party or two-party consent rule. Courts admit recordings made by someone on the call.
- Some High Courts treat secret recording as a privacy violation.
- **Intercepting calls you're not part of is unlawful.**
- **Ruko must never record or intercept anyone's calls.** Recording drill calls, where Ruko is a party, with written consent is defensible.

**Impersonation**
- **BNS s.204 (pretending to be a public servant):** 6 months to 3 years; cognizable and non-bailable.
  - **It doesn't require cheating** (only acting "under colour of" the office), so **even a training script saying "I am a CBI officer" carries some risk.**
- BNS s.319 and IT Act s.66D both require cheating, so they're low-risk for consented drills with no real money.
- **Safer:** a fictional agency (e.g. "Central Investigation Cell – DRILL"), no badges, real names or emblems, and the drill framing disclosed.
- The State Emblem Act bars using the national emblem [unverified].

**Drills**
- No Indian law or CERT-In guidance found.
- Follow research ethics: ethics-committee approval, written informed consent, a debrief, and the stop word.

## 5. Phones and app stores

**Android**
- **Call state:** `READ_PHONE_STATE` is a runtime permission that is *not* Play-restricted. It tells you whether the phone is ringing or on a call, but **not the number**, and covers cellular calls only [docs knowledge, unverified].
- **CallScreeningService** (Android 10+):
  - **Sees calls from numbers not in contacts**, and can block or silence them.
  - **Doesn't need call-log permission**; the user grants the call-screening role.
  - **This is the cleanest Play-compliant way to know an unknown number is calling.**
- **Call-log and SMS permissions** are restricted. "Caller ID or spam detection" is an allowed exception (a declaration is needed); "Family locator" is not.
- **⚠️ Stalkerware policy (critical):**
  - Monitoring apps are allowed only for parent/child or employer/employee, and **adults cannot be tracked "even with their knowledge and permission."**
  - **Ruko must be designed so the elder is the user and controls what is shared.**
  - **Family alerts must be triggered by the elder or by a risk event, never by continuous monitoring.**
- **Accessibility services:** anti-fraud apps don't count as accessibility tools. **Avoid them entirely.**
- **Sideloading:**
  - Android 13+ restricts sideloaded apps' sensitive permissions.
  - **Android 16 blocks granting accessibility and first-time sideloading during calls with unknown numbers.** That stops the scammer installing a remote-access app.
  - **Distribute trial builds through Play internal testing, not a bare APK file.**
- **WhatsApp calls:**
  - The phone's audio mode can show a VoIP call is in progress without a permission, but not which app or who [unverified].
  - A notification listener could see WhatsApp call notifications, but it needs a special user grant and is restricted for sideloaded apps.
- **Screen sharing:** Android 15 can detect when *your own* app is being recorded [unverified].

**iPhone** [unverified]
- An app can know *that* a call is happening, but **never the number or which app it's in**.
- No way to detect WhatsApp calls.
- Family Controls are designed for children.
- Only licensed entities can publish banking apps, so **Ruko as an alert app is fine, Ruko as a payment app is not.**

## 6. Working with banks

- **Account Aggregator:** only regulated entities can receive the data. A startup can only be a **technology service provider** to one.
- **RBI Regulatory Sandbox:** fraud prevention was the 4th cohort theme, and the sandbox now accepts applications at any time. It needs an Indian company with minimum net worth [unverified].
- **Security and procurement bar** [unverified]:
  - RBI's 2023 IT outsourcing rules: right to audit, RBI access, business continuity;
  - **payment data stored in India**;
  - ISO 27001 and SOC 2 Type II, plus penetration testing by CERT-In-empanelled auditors;
  - public-sector bank tenders require turnover and prior deployments;
  - **startups get in through innovation labs, RBIH/NPCI programmes, hackathons and paid proofs of concept with private banks.**
- **Existing fraud vendors:** Clari5, Feedzai, BioCatch, NICE Actimize, SAS and Bureau, plus KYC firms (IDfy, Signzy) and NPCI's own tools.
- **Ruko's gap:** none of them covers the **moment on the elder's side, during the call, before the transaction, with the family involved.**

## Hard constraints (must not do)
1. Don't intercept or record anyone's calls; only record drill calls with written consent.
2. **Don't use real agency names, emblems, badges or officer names in drills.** BNS 204 needs no cheating, so **use a fictional agency.**
3. Don't ask for, store or replay real OTPs, PINs, card numbers, Aadhaar or passwords, even in drills.
4. **Don't continuously monitor an adult and report to family** (Play's Stalkerware policy).
5. Don't use accessibility services.
6. Avoid call-log and SMS permissions unless filing the caller-ID exception; prefer CallScreeningService.
7. Don't send alert SMS through a non-DLT route, or make robocalls through SIP/PRI lines.
8. **Don't present RBI's proposals as law**, and label the mock bank as a simulation.
9. Don't move real money or act as a payment app.
10. **Don't add family members without their own notice and consent.** An adult child isn't a "lawful guardian".
11. Don't keep audio or transcripts longer than needed, but keep processing logs for 1 year.
12. Don't voice-clone real people, or present AI drill calls as coming from a bank or the government.

## Green lights (can do now)
1. `READ_PHONE_STATE` plus the call-screening role, with clear consent.
2. Consented in-app drill calls with no phone network: fictional agency, "RUKO" stop word, debrief, ethics consent.
3. Elder-controlled "Alert my family" and alerts on risk events. **Start DLT registration** for SMS (≈₹5.9k per operator).
4. Mirror RBI's proposals in the mock bank (1-hour delay, trusted person, 24-hour change cooling, whitelisting, kill switch), labelled "proposed".
5. **Pitch banks on the 2025 Authentication Directions**, which already allow risk-based checks.
6. **Pitch on the 2027 liability change:** coercion and duress now count as fraud, so prevention saves banks money.
7. Teach with official facts: digital arrest doesn't exist, bank calls come from 1600, check the CNAP name, report on Chakshu, 1930 and cybercrime.gov.in.
8. Publish notices that meet the DPDP standard now (itemised, separate consents, easy withdrawal, English, Hindi and Kannada, a grievance contact, a 72-hour breach plan).
9. Ship the Android trial through Play testing tracks.
10. Position Ruko as a technology service provider to banks, entering through RBIH/NPCI programmes or the sandbox via a bank partner.
11. Plan for ISO 27001 and SOC 2, hosted in India (Supabase Mumbai already fits).
12. Use "check the verified name shown before you pay" in the app's wording.

## Re-check before 28 Oct
- Has RBI issued draft directions after the April paper?
- Has the DPDP date change been gazetted?
- CNAP coverage in Karnataka.
- Android API details: `READ_PHONE_STATE` scope, audio modes, screen-recording callbacks.

## Key sources
- [RBI discussion paper](https://rbi.org.in/Scripts/PublicationsView.aspx?id=23810)
- [RBI 2017 liability circular](https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11040)
- [2026 liability amendment](https://www.medianama.com/2026/06/223-rbi-final-amendment-directions-limiting-customer-liability-digital-transactions-effect-2027/)
- [Authentication Directions 2025](https://website.rbi.org.in/web/rbi/-/press-releases/rbi-issues-directions-on-framework-on-authentication-mechanisms-for-digital-payment-transactions)
- [DPDP Rules notified](https://www.scconline.com/blog/post/2025/11/14/meity-notified-digital-personal-data-protection-rules-2025/)
- [DPDP Rule 3 (notices)](https://www.dpdpa.com/dpdparules/rule3.html)
- [DPDP Rule 7 (breaches)](https://www.dpdpa.com/dpdparules/rule7.html)
- [DPDP Rule 8 (retention)](https://www.dpdpa.com/dpdparules/rule8.html)
- [DPDP Rule 11 (guardians)](https://www.dpdpa.com/dpdparules/rule11.html)
- [DLT registration](https://developer.exotel.com/docs/sms-support/dlt-entity-registration)
- [Twilio India SMS](https://www.twilio.com/en-us/guidelines/in/sms)
- [Twilio India voice](https://www.twilio.com/en-us/guidelines/in/voice)
- [TRAI robocall direction](https://trai.gov.in/sites/default/files/Direction_13082024.pdf)
- [1600 vs 140 series](https://www.dtnext.in/news/business/phone-calls-from-1600-number-series-cannot-be-blocked-dnd-app-can-block-calls-from-140-series-trai)
- [TRAI on CNAP](https://www.trai.gov.in/notifications/press-release/trai-responds-dots-back-reference-dated-26092025-respect-trais)
- [BNS s.204](https://devgan.in/bns/section/204/)
- [Call recording judgment](https://judgements.lawsathi.in/supreme-court/2025/vibhor-garg-neha/)
- [Android telecom guide](https://developer.android.com/guide/topics/connectivity/telecom/)
- [Play Call Log/SMS policy](https://support.google.com/googleplay/android-developer/answer/10208820)
- [Play Stalkerware policy](https://support.google.com/googleplay/android-developer/answer/9888380)
- [Play Accessibility policy](https://support.google.com/googleplay/android-developer/answer/10964491)
- [Android restricted settings](https://support.google.com/android/answer/12623953)
- [Android 16 security](https://blog.google/security/whats-new-in-android-security-privacy-2025/)
- [Sahamati FAQ (Account Aggregator)](https://sahamati.org.in/faq/)
