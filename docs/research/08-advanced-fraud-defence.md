# Research 8: Advanced fraud defence for Ruko (as of 10 Oct 2026)

This covers six "advanced security" features: signal fusion, verified bank calls, duress codes, coercion signals during payment, mule-account risk, and security for the app itself. It doesn't repeat the scam stages (Research 1) or the country-by-country interventions (Research 2).

How to read this:
- **Verified** means a primary or official source (regulator, government, standards body, the company's own announcement), or the same fact in two or more independent outlets.
- **Claimed** means vendor marketing or a single secondary source. Numbers marked like this have not been independently tested.
- **Inference** means Ruko's own design reasoning. No source says it.
- The search budget was limited. The gaps are listed in §7.

---

## 1. Signal fusion and the "scam kill chain"

### 1.1 Existing frameworks

| Framework | Who and when | Structure | Status |
|---|---|---|---|
| **Scam Kill Chain** | F-Secure, press release 30 Jan 2025; presented at the Global Anti-Scam Summit London, Mar 2025 | 8 stages: Reconnaissance → Development → Contact → Persistence → Access → Exfiltrate → Lateral Movement → Monetization. Inspired by MITRE ATT&CK. | Verified (F-Secure's own release) |
| **Cyber Fraud Prevention Framework (CFPF)** | FS-ISAC, Apr 2025 | 5 phases: Reconnaissance → Initial Access → Positioning → Execution → Monetization. Built so fraud, cyber and AML teams share one vocabulary. | Verified (FS-ISAC release) |
| **Fight Fraud Framework (F3)** | MITRE Center for Threat-Informed Defense, announced May 2025; builds on CFPF | An ATT&CK-style matrix of tactics, techniques and sub-techniques for cyber-enabled financial fraud, including social engineering and cash-out | Project verified. The number of tactics ("7") comes from a third-party blog, so it is **unverified**. |
| **DISARM** | DISARM Foundation (disinformation) | Phases Plan → Prepare → Execute → Assess; 16 tactics and 100+ techniques; a "Red" (attacker) and a "Blue" (counter-measure) framework | Verified. Useful as a **pattern**: pair every attacker tactic with a named counter-measure. |

Sources: [F-Secure release](https://company.f-secure.com/en/newsroom/f-secure-reveals-how-scammers-operate-with-new-scam-kill-chain) · [F-Secure Scam Kill Chain page](https://www.f-secure.com/en/partners/insights/f-secure-scam-kill-chain) · [GASA London 2025 talk](https://www.gasa.org/post/understanding-the-scam-kill-chain-global-anti-scam-summit-london-2025) · [FS-ISAC CFPF release](https://www.fsisac.com/newsroom/fsisac-releases-cyber-fraud-prevention-framework-to-strengthen-collaboration-between-fraud-and-cybersecurity-teams) · [CFPF PDF](https://fsisac.com/hubfs/Knowledge/Fraud/CyberFraudPreventionFramework.pdf) · [MITRE F3 announcement](https://ctid.mitre.org/blog/2025/05/10/fight-fraud/) · [F3 design principles PDF](https://ctid.mitre.org/fraud/MITRE%20F3%20Design%20Principles%20and%20Methodology.pdf) · [F3 summary (third party)](https://arsen.co/en/blog/mitre-fight-fraud-framework-f3) · [DISARM FAQ](https://www.disarm.foundation/faqs) · [DISARM in CTI, arXiv 2502.20997](https://arxiv.org/pdf/2502.20997)

**What carries over to Ruko:**
- Every framework separates **stages** (where the attack is) from **tactics/techniques** (what the attacker does). Ruko's verdicts should report both: "stage: Isolation; tactics: RT05, RT06".
- The FS-ISAC and F-Secure models are written for banks and telcos, and they focus on account takeover. **Digital arrest is an authorised-payment scam**: the victim does every step themselves. So Ruko's model needs psychological stages (authority, fear, isolation) that the generic models fold into "Contact". The taxonomy in §1.3 adds them.

### 1.2 How banks fuse signals in real time (what's public)

- **Combine weak signals and never act on one alone.** BioCatch says its Scams360 product looks for *combinations*: hesitation, unusual navigation, an active call, risky payment context, remote access. Outseer says it fuses behavioural, active-call and device signals "in a unified risk engine". Sardine warns that one low behavioural score can be explained by a new device, an injury or stress. (Claimed: vendor material.) [BioCatch Scams360](https://www.biocatch.com/press-release/biocatch-delivers-scams360) · [Outseer](https://www.outseer.com/solutions/scam-prevention) · [Sardine](https://www.sardine.ai/learn/behavioral-biometrics)
- **Graded responses, set in law (UK).** Since **30 Oct 2024**, UK banks may hold an outbound payment when they have "reasonable grounds to suspect" fraud. The grounds must be established by the end of D+1, and the hold must end by **D+4 business days** at the latest. The customer must be told the reason and what will release the payment, and the bank pays any interest or late fees the hold causes. This is the model for "hold, explain, release". Verified. [UK policy paper, SI 2024/1013](https://www.gov.uk/government/publications/the-payment-services-amendment-regulations-2024) · [FCA FG24/6](https://fca.org.uk/publication/finalised-guidance/fg24-6.pdf) · [Regulation Tomorrow](https://www.regulationtomorrow.com/2024/10/the-payment-services-amendment-regulations-2024/)
- **A timed "spell-breaker" pause.** Google's Android in-call protection shows a warning and a **30-second pause** before the user can continue, when a participating banking app is opened while the screen is shared during a call from an unsaved number. Piloted in the UK, then India and Brazil, then the US (Cash App, JPMorganChase). Verified (Google blog, Dec 2025). [Google](https://blog.google/security/android-expands-pilot-in-call-scam-protection-financial-apps/)
- **Risk-score decay** (evidence losing weight over time) is standard in case-management tools, but I found **no public parameter values**. The half-lives below are Ruko's inference.

### 1.3 Proposed stage model and tactic taxonomy for digital arrest

This matches what is already in `lib/threat.ts` (S1–S7, RT01–RT17), so the doc and the code use the same IDs. RT01–RT13 are attacker tactics. RT14–RT17 are meta-evidence: the person or the bank telling Ruko something.

**Stages** (mapped to F-Secure / FS-ISAC):

| ID | Stage | Maps to | What the victim experiences |
|---|---|---|---|
| S1 | Contact | F-Secure Contact / CFPF Initial Access | Unknown, foreign or reported number; "TRAI/courier/FedEx" opener |
| S2 | Authority | (not split out in the generic models) | "I am from CBI / police / your bank" |
| S3 | Fear | (not split out) | Drugs parcel, money laundering, arrest warrant |
| S4 | Isolation | F-Secure Persistence | Stay on camera, tell nobody |
| S5 | Control | F-Secure Access / CFPF Positioning | Install an app, share the screen, read an OTP |
| S6 | Extraction | Exfiltrate / Execution | "Verification" transfer, FD break, gold loan, RTGS at a branch |
| S7 | Re-victimisation | Monetization, plus repeat | Second demand, "clearance fee", recovery scam |

**Tactics.** LR is the likelihood ratio, P(signal | scam) ÷ P(signal | no scam). These are expert priors to re-fit on trial data. "Half-life" is how fast the evidence fades.

| ID | Tactic | Stage | Typical source in Ruko | Prior LR | Half-life |
|---|---|---|---|---|---|
| RT01 | Risky caller number (international, reported, FRI-flagged) | S1 | `/api/number` | 4 | 2 h |
| RT02 | Impersonated authority | S2 | Radar answers, call check | 5 | 2 h |
| RT03 | Accusation or arrest threat | S3 | Radar, call-check phrases | 15 | 3 h |
| RT04 | Manufactured urgency | S3 | Radar | 3 | 2 h |
| RT05 | Isolation: stay on the call or camera | S4 | Radar | 10 | 3 h |
| RT06 | Secrecy demand | S4 | Radar | 8 | 3 h |
| RT07 | Remote access or app install | S5 | Radar, self-report | 8 | 6 h |
| RT08 | Credential harvest (OTP, PIN) | S5 | Radar | 12 | 6 h |
| RT09 | Payment to a "safe / verification / RBI" account | S6 | Payee name, payment purpose | 25 | 12 h |
| RT10 | Liquidation (unusual amount, FD break, large cash) | S6 | Bank rules | 4 | 12 h |
| RT11 | Coerced payment behaviour (§4) | S6 | On-device behaviour flags | 3 (cap) | 2 h |
| RT12 | Mule destination account (§5) | S6 | Payee-risk score | 60 | 7 d |
| RT13 | Repeat demand after a hold | S7 | Bank | 5 | 1 d |
| RT14 | Duress signalled by the customer (§3) | meta | Safety PIN | 500 | 1 d |
| RT15 | Claims to be the bank, but no verified bank call (§2) | S2 | Call-intent check | 6 | 2 h |
| RT16 | Customer raised concern ("Tell my family") | meta | Elder home | 3 | 6 h |
| RT17 | Verified call from the real bank (counter-evidence) | meta | Call-intent check | 0.3 | 30 min |

**Fusion rules** (inference, already the shape of `lib/threat.ts`):
1. **Log-odds sum from a low prior.** A prior of 1% gives logit −4.6. Example: a threat (RT03, ln 15 = 2.7) plus "stay on camera" (RT05, ln 10 = 2.3) gives logit ≈ 0.4, so p ≈ 0.6 (**elevated**). Adding a "safe account" payee (RT09, ln 25 = 3.2) gives p ≈ 0.97 (**critical**). This feels right: two script phrases warrant a warning, and a payment on top warrants a hold.
2. **Discount correlated evidence.** Within one stage, the strongest tactic counts fully and the rest count at half weight. The same tactic seen twice counts once.
3. **Count stage coverage as evidence.** Three or more distinct stages active is itself a signal. Real attacks walk the chain; false alarms usually trip one stage.
4. **Counter-evidence lowers the score but can't overrule a payment red flag.** A verified bank call (RT17) never cancels RT09 or RT12. A real bank never asks anyone to move money to a "safe account".
5. **Behaviour (RT11) is capped.** On its own it can never push the level above "watch" (see §4).

**Graded response ladder** (thresholds as in `lib/threat.ts`):

| Level | p ≥ | Elder sees | Bank/money side | Family |
|---|---|---|---|---|
| none | 0 | nothing | normal | — |
| watch | 0.20 | gentle nudge on the home screen ("Is someone on the phone asking for money?") | normal | — |
| elevated | 0.50 | full STOP screen with a **30 s pause** (Google's figure) and the 1930 helpline | payments ≥ ₹10k take the 60-min cooling-off | silent heads-up |
| high | 0.80 | STOP screen, plus "call your trusted person" as the one big button | **hold** until the trusted person or the bank clears it | red alert with the "What to say" script |
| critical | 0.95, or duress, or RT12 | same, calm wording (never "you're being scammed!") | hold; fraud desk case opened; payee frozen in the mock bank | red alert plus a call |

Hold length: the UK caps a hold at D+4 business days. For Ruko's mock bank, use **hold until cleared, with automatic escalation to the fraud desk after 4 hours and an auto-release review at 24 hours**. That release always needs a human and is never automatic for critical holds. (Inference.)

---

## 2. Verified outbound calls from banks

### 2.1 What exists

| Mechanism | Where | How it works | Status and limits |
|---|---|---|---|
| **Monzo Call Status** | UK, launched Sep 2023 | In-app banner shows whether a Monzo agent is on a call with you *right now*. If not: "If someone is telling you they're from Monzo, hang up now." Built by linking the phone system to the app in real time. Has an "offline" state. Monzo warns that a caller who blames a "technical issue" for the banner is a red flag. | Verified (Monzo help page, Google Android dev blog Mar 2024) |
| **Starling call status indicators** | UK, ~2025 | Shown on the home screen **and the payment screen**. States reported: "We've never called you", "We're calling you now", "You're on a call with Starling", "We aren't calling you", last-call date. | Press coverage; launch date not confirmed |
| **Revolut Call Identification** | Announced 13 Jan 2026 | Detects that the user is on a call (including VoIP apps) while the app is open, and checks whether it's a Revolut agent. Red banner: "Revolut is not calling you." On by default on iOS; Android users must turn it on. Doesn't help with scammers posing as other banks or the police. | Verified (Revolut release) |
| **159** | UK, Stop Scams UK, pilot from Sep 2021 | A short number that routes you to your own bank's fraud line. "Hang up, call 159." | Verified (NatWest, Which?). The 800k-calls figure is unverified. |
| **STIR/SHAKEN** | US/Canada carriers | The originating carrier signs a "PASSporT" (a JWT) with `iat`, `orig`, `dest` and an attestation level. RFC 8224 *recommends* the signer treat requests older than **60 s** as stale. `iat` exists for replay protection. | Verified (RFCs). **Not used in India.** |
| **CNAP** (caller's KYC name shown by the network) | India | Default-on with opt-out (TRAI, 28 Oct 2025). Target **31 Mar 2026**. Pilots: Jio, Vi and BSNL in Haryana; Airtel in Himachal. **2G excluded.** CLIR users hidden. Voice only. | **The nationwide rollout is not confirmed** as of an Aug 2026 explainer. Treat it as patchy. |
| **1600-series for BFSI calls** | India, TRAI direction 19 Nov 2025 | All service and transactional calls from RBI-regulated entities must come from 1600xx. Deadlines: **commercial banks 1 Jan 2026**; large NBFCs, payments banks and SFBs 1 Feb 2026; co-op banks, RRBs and others 1 Mar 2026. Vendors calling for a bank count too. | Verified (TRAI PDF). Compliance level unknown: 485 entities and 2,800+ numbers at the time of the direction; "570+" is undated. |
| **Financial Fraud Risk Indicator (FRI)** | DoT, May 2025 | Classes a mobile number as Medium, High or Very High fraud risk, using NCRP (I4C), Chakshu and bank inputs, shared over the **Digital Intelligence Platform (DIP)** by API. RBI told all banks to integrate it (30 Jun 2025). PhonePe declines Very-High-risk transactions and warns on Medium. | Verified (DoT/RBI via Business Standard). The "₹660 cr prevented in 6 months" figure is **unverified**. |
| **Sanchar Saathi / Chakshu** | DoT | Citizens report suspected fraud calls and SMS. As of 15 Jul 2026: **11.18 lakh reports led to ≈50.9 lakh connections cut** (after re-verification). A separate AI tool (ASTR) cut ≈88 lakh connections that failed re-verification. Chakshu numbers feed the FRI. | Verified (Rajya Sabha replies, via press) |

Sources: [Monzo help: call status](https://monzo.com/help/monzo-fraud-category/monzo-call-status) · [FinTech Futures on Monzo](https://www.fintechfutures.com/digital-banking/monzo-announces-new-feature-to-help-protect-customers-against-impersonation-scams) · [Android Developers blog: Monzo](https://android-developers.googleblog.com/2024/03/battling-impersonation-scams-monzo-innovative-approach.html) · [FStech on Starling](https://www.fstech.co.uk/fst/Starling_Introduces_InApp_Tool_To_Tackle_Bank_Impersonation_In_Industry_First.php) · [Revolut release](https://www.revolut.com/news/revolut_amps_up_fight_against_impersonation_scams_with_new_call_identification_feature/) · [Bitdefender on Revolut](https://www.bitdefender.com/en-gb/blog/hotforsecurity/revolut-introduces-a-new-way-for-customers-to-check-if-theyre-speaking-with-a-real-agent) · [NatWest on 159](https://www.natwestgroup.com/news/2021/09/new-159-anti-fraud-hotline-launched.html) · [Which? on 159](https://www.which.co.uk/news/article/can-the-new-159-anti-fraud-hotline-stop-impersonation-scams-a3sp35C1gDCC) · [RFC 8224](https://www.rfc-editor.org/rfc/rfc8224) · [RFC 8225](https://www.rfc-editor.org/rfc/rfc8225) · [RFC 8224 erratum quoting the 60 s rule](https://www.rfc-editor.org/errata/eid5391) · [Business Standard: CNAP by Mar 2026](https://www.business-standard.com/industry/news/cnap-service-nationwide-rollout-by-march-2026-dot-trai-telecom-125102901190_1.html) · [TRAI on CNAP](https://www.trai.gov.in/notifications/press-release/trai-responds-dots-back-reference-dated-26092025-respect-trais) · [Storyboard18: 2G excluded](https://www.storyboard18.com/how-it-works/caller-name-display-pilot-to-begin-this-week-on-mobile-networks-2g-users-left-out-83313.htm) · [TechMitra CNAP explainer (Aug 2026)](https://techmitra.in/cnap-caller-id-explained/) · [TRAI 1600 direction, 19 Nov 2025](https://www.trai.gov.in/sites/default/files/2025-11/Direction_19112025_0.pdf) · [Outlook Business on 1600 deadlines](https://www.outlookbusiness.com/news/trai-sets-firm-deadlines-for-bfsi-entities-to-adopt-1600-series-for-service-transactional-calls) · [Vinod Kothari, Mar 2026](https://vinodkothari.com/2026/03/adopting-1600-number-series-preventive-measure-or-burden/) · [Business Standard: FRI launch](https://www.business-standard.com/industry/news/dot-launches-financial-fraud-risk-indicator-to-aid-cybercrime-detection-125052101912_1.html) · [Business Standard: RBI asks banks to integrate FRI](https://www.business-standard.com/india-news/rbi-asks-banks-to-integrate-dot-s-fraud-risk-tool-to-curb-cyber-crimes-125070201367_1.html) · [Governance Now on FRI](https://www.governancenow.com/news/regular-story/how-dots-fraud-risk-indicator-empowers-stakeholders) · [NewKerala: 88 lakh / Chakshu, Jul 2026](https://www.newkerala.com/news/a/govt-disconnects-over-88-lakh-suspicious-mobile-connections-286.htm) · [Dynamite News: 39.43 lakh, Feb 2026](https://www.dynamitenews.com/technology/3943-lakh-mobile-connections-disconnected-227-lakh-mobile-handsets-blacklisted-mos-telecom-in-rs)

**The pattern that works is "pull, not push":** the app *asks* the bank "are you calling me right now?". Nothing the caller says or sends can create a green tick. Monzo, Starling and Revolut all do this. It works because the bank's own app is the trusted channel, not the phone line.

### 2.2 Design: a signed "call intent" for Ruko

When the bank (the mock bank, or a partner bank later) places an outbound call, its system creates a **call intent**. Ruko's app fetches it on demand and verifies it.

**Contents** (compact JWS, EdDSA/Ed25519 or ES256):

| Claim | Example | Why |
|---|---|---|
| `v` | 1 | versioning |
| `iss` | `bank:practice-bank` | which bank; key looked up by `iss` + `kid` |
| `kid` | `2026-10-a` | key rotation |
| `sub` | pseudonymous customer ID (not a phone number) | binds the intent to one person |
| `from` | `1600-xx-xxxx` (masked to the last 4 for display) | the elder can match what's on their phone screen |
| `agent` | role plus first name, e.g. "Fraud team, Asha" (fictional in the demo, as BNS §204 requires) | something the elder can ask about |
| `purpose` | enum: `fraud_check`, `card_delivery`, `kyc_update`, `loan_followup` | short, plain-language reason |
| `never` | `["otp","upi_pin","password","move_money","install_app"]` | shown as "They will never ask you to…" |
| `iat`, `nbf`, `exp` | issue time, start, expiry | freshness |
| `jti` | 128-bit random | replay protection |
| `call_ref` | the bank's case ID | lets the elder or the fraud desk cross-check |

**Freshness and replay:**
- **Live intent** (the call is ringing or in progress): `exp = iat + 10 min`. The bank **re-issues every 2 min** while the call lasts (a heartbeat). When the call ends, the bank revokes the intent and the app flips to "not calling" within one poll. This mirrors Monzo's real-time link.
- **Scheduled intent** ("we'll call you between 3 and 4 pm"): a window of up to **60 min**. Shown as "expected call", never as "verified now".
- **Clock skew tolerance ±60 s**, borrowing RFC 8224's 60 s freshness guidance.
- **Replay:** the server keeps every `jti` until `exp + 5 min` and rejects repeats. The app only accepts intents fetched over its own authenticated session for its own `sub`. **It never accepts one from a link, QR code, SMS or the caller.** Signature checks happen on the server. The app shows only the server's verdict.
- **Fail-safe default:** no intent, an expired intent, a bad signature or offline all count as **not verified**. That feeds RT15 only if the person says the caller claims to be from the bank.

**Presentation** (wording adapted from Monzo, Revolut and Starling; one action per screen):
- Verified: green, "**Your bank is calling you now** from 1600 ··· 4321. Fraud team, Asha. They will **never** ask for your OTP or PIN, or ask you to move money." Button: "Hang up anyway and call the bank back" (always allowed).
- Not calling: red, "**Your bank is not calling you.** If someone says they are, hang up now." Button: "Hang up and tell my family". Also show 1930.
- Offline: grey, "Can't check right now. Hang up and call the number on the back of your card." Never green.
- **Put the status on the payment screen as well as home** (Starling's lesson: that's where people look when they're under pressure).
- Teach it: "If the caller says the app is broken, that's a scam." (Monzo's warning.)
- **A green tick never unlocks a payment.** If a "verified" call asks to move money, Radar still says STOP (RT09 beats RT17).

**Teaching facts to show in India** (verified): real bank service calls must come from **1600** (commercial banks since 1 Jan 2026). CNAP may show the KYC name, but **not on 2G and not everywhere yet**, so never teach "trust the name on screen". Report numbers on **Chakshu** (sancharsaathi.gov.in).

---

## 3. Duress codes and duress PINs

### 3.1 Where they exist and what's known

- **Alarm systems: real and common.** A duress code is "a silent alarm signal generated by entering a designated code… to signal that the user is being forced to turn off the system". A common scheme is "**one plus**" (normal 1234, duress 1235). Police treat duress alarms as **among the highest-priority calls**, and say **most false duress alarms come from users entering the wrong code**. Some panels ship with duress disabled. Ring says a duress code "cannot be tested or cancelled" except through its in-app test. Verified (municipal codes, police, vendor). [Canby OR alarm code](https://codelibrary.amlegal.com/codes/canby/latest/canby_or/0-0-0-2039) · [Hamilton Police tip sheet](https://hamiltonpolice.on.ca/sites/default/files/alarm_tip_sheet.pdf) · [Ring help](https://support.ring.com/hc/en-us/articles/360050056012-Duress-Code-Silent-Alarm-False-Alarm-Tips) · [Wikipedia: duress code](https://en.wikipedia.org/wiki/Duress_code)
- **The ATM "reverse PIN": a myth.** It has circulated since 2006. No ATM has ever had it. A 2010 FTC report called it an urban legend from a never-deployed "emergency PIN" proposal (SafetyPIN). A Kansas bill never became law. The ATM Industry Association **opposes** it, because a nervous criminal might harm the user. Verified (Snopes, PolitiFact, Africa Check, citing ABA and ATMIA). [Snopes](https://snopes.com/business/bank/pinalert.asp) · [PolitiFact](https://politifact.com/factchecks/2019/mar/26/facebook-posts/entering-atm-pin-backwards-wont-call-police/) · [Africa Check](https://africacheck.org/fact-checks/fbchecks/dangerous-hoax-do-not-type-your-pin-backwards-if-youre-mugged-atm)
- **Banking duress PINs:** I found **no live deployment** in mainstream retail banking. Most of the discussion concerns physical robbery. **No evidence was found on duress codes against remote phone coercion**, which is Ruko's case. (Gap.)

### 3.2 Risks for Ruko

| Risk | Why it matters for digital arrest | Mitigation |
|---|---|---|
| **Detection and escalation** | The scammer is watching on video and may demand screen-sharing. A visibly different screen ("Alert sent!") could make them angrier or make them switch to cash or a branch. | The duress path must look **identical** to the normal path: same animation, same "Payment processing" screen. Nothing on screen reveals it. |
| **False alarms** | The police's main cause is wrong-code entry. Elders mistype. | Use a **separate** short safety PIN, not "PIN+1". Practise it in onboarding (teach-back). The response is **family + hold**, never police dispatch. |
| **False sense of security** | "I have a safety PIN, so I'm safe" could reduce vigilance. The elder may also never remember to use it under stress. | Present it as one tool among several, never the main defence. Radar, the bank rules and Money Lock still run without it. |
| **Coercion to reveal it** | Scammers already ask "do you have any other PIN?" | Ruko's script: "If anyone asks, you have only one PIN." Duress outcomes never mention the word "duress". |
| **The money still appears to move** | If the payment visibly fails, the scammer escalates. | **Fake success:** show "processing / pending" and hold it at the bank side, as Money Lock does. Release only when family or the bank clears it. |

### 3.3 Design guidance

- **One safety PIN** (4 digits, must differ from the normal PIN in at least 2 places, so one slip can't trigger it). Entering it **anywhere a PIN is asked**, or saying a set safe phrase in Radar, fires RT14.
- Effect: silent **hold on all outgoing payments for 24 h**, a silent alert to the trusted person ("Please call Amma now. Don't mention Ruko."), a fraud-desk case. **The screen looks exactly like a normal pending payment.**
- Keep `RT14`'s LR high (500), because it is a deliberate act. But because of mistypes, **never auto-call the police**. Humans verify first.
- Let people **test it in a drill mode** that sends a "TEST" alert (Ring's lesson: people need a safe way to test).
- Label it "Safety PIN", not "duress PIN". The language must not frighten.

---

## 4. Behavioural signals of coercion during payment

### 4.1 State of the art

| Signal | Who reports it | Evidence |
|---|---|---|
| **Active phone call during the session** | BioCatch Scams360, Outseer, Revolut, Google Android | Native apps can detect a call; **a web app cannot**. Google pairs a call from an unsaved number with screen sharing and a banking app. Verified (Google, Revolut); vendor claims (BioCatch, Outseer). |
| **Screen sharing or remote access tools** | BioCatch, Google, Sardine ("robotic, laggy or pasted input") | Strong. Native only (Android). |
| **Hesitation, long idle stretches** | BioCatch case study ("long idle = coercion"), Sardine ("one of the strongest indicators"), ThreatFabric ("pressure or duress, uncertain behaviour") | Claimed (vendor) |
| **Segmented typing of an account number** (bursts of digits with pauses, as if dictated) | BioCatch-related write-ups; ThreatFabric "coaching or dictation". In new-account fraud, "segmented typing" was flagged in **44%** of cases (BioCatch, via MobileIDWorld). | Claimed. For dictation specifically, the evidence is thin. |
| **Longer sessions** | BioCatch: APP-fraud sessions run longer because the victim follows instructions | Claimed |
| **Doodling / aimless mouse movement, device repositioning** | BioCatch case study | Claimed |
| **Unfamiliar navigation, first use of a feature** | BioCatch Scams360 | Claimed |
| **Delayed OTP entry, stop-and-go typing, deletions** | BioCatch OTP use case | Claimed |
| **Reported result** | BioCatch: a top-5 UK bank detected **60% of voice scams "at the model's peak"** | Claimed, single vendor case study, false-positive rate not published |

Sources: [BioCatch Scams360](https://www.biocatch.com/press-release/biocatch-delivers-scams360) · [BioCatch APP case study (PDF)](https://www.biocatch.com/hubfs/Case_Studies/BC%20CS%20APP%20Fraud%20V6.pdf?hsLang=en) · [BioCatch social-engineering data sheet (PDF)](https://www.biocatch.com/hubfs/White%20Papers/New%20Brand/Biocatch_DS_Social_Engineering_Scam_15_Sept.pdf?hsLang=en) · [BioCatch OTP social engineering](https://www.biocatch.com/use-case/customer-protection/otp-social-engineering) · [ID Tech on BioCatch APP](https://idtechwire.com/biocatch-uses-behavioral-biometrics-guard-against-authorized-push-payment-fraud-010708) · [MobileIDWorld: segmented typing 44%](https://mobileidworld.com/heres-how-behavioral-biometrics-spot-new-account-fraud-108106/) · [Sardine](https://www.sardine.ai/learn/behavioral-biometrics) · [ThreatFabric](https://www.threatfabric.com/blogs/behavioral-analytics-scams) · [Outseer](https://www.outseer.com/solutions/scam-prevention) · [Google in-call protection](https://blog.google/security/android-expands-pilot-in-call-scam-protection-financial-apps/) · [AML Intelligence on BioCatch (Oct 2026)](https://www.amlintelligence.com/2026/10/insight-how-biocatch-uses-the-way-people-type-to-detect-scammers/)

**Key caveat** (verified in several sources): in an authorised-payment scam the real customer is on their **own device, in their own location, and passes 2FA**, so device and credential checks miss it. That's why behaviour matters. But "plenty of innocent people type slowly, use accessibility tools… or make mistakes". Older adults especially vary. **Behaviour is weak evidence and must be combined with other signals.**

### 4.2 What a consented web app can measure (privacy-friendly)

The browser cannot see phone calls, other apps or screen sharing. What it can see, ranked by **strength ÷ privacy cost** (inference, informed by the vendors above):

| # | Feature (computed on the device; only the flag is sent) | Web API | Definition | Strength |
|---|---|---|---|---|
| 1 | **Self-reported live call** | a question on the pay screen | "Is anyone on the phone with you right now?" Yes → flag | **Strong**, near-zero privacy cost |
| 2 | **Recent Radar session** | Ruko state | A Radar check or STOP in the last 30 min | Strong (already RT02–RT08) |
| 3 | **App switching during the payment** | `visibilitychange` (Page Visibility API) | ≥ 3 hidden→visible switches between "new payee" and "confirm" (going back to WhatsApp for instructions) | Medium |
| 4 | **Segmented numeric entry** | `input` timestamps on account/IFSC fields only | Account number typed in ≥ 3 bursts separated by gaps ≥ 1.5 s, with no paste | Medium (hypothesis: dictation) |
| 5 | **Pasted payee account** | `paste` event (presence only, not content) | Account number pasted, not typed | Weak–medium (could be "sent on WhatsApp") |
| 6 | **Long dwell on confirm** | timers | Confirm-screen dwell > 60 s, or whole flow > 3 × the person's median (default 10 min if no history) | Medium |
| 7 | **Corrections on the amount** | `input` | Amount edited ≥ 2 times upward | Weak |
| 8 | **First use of a high-risk feature** | Ruko state | First RTGS, first FD break, first payee above ₹50k | Medium (already in rules) |
| 9 | **Unusual hour** | clock | Payment between 22:00 and 06:00 local, when the person usually doesn't pay | Weak |

**Privacy rules:**
- Compute everything **in the browser**. Send only a small object such as `{switches:3, segmented:true, dwell_bucket:"60-120s"}`. **Never send keystrokes, digits, timings per key, cursor trails or clipboard content.**
- Name it in the consent screen ("how you use the payment screen, not what you type").
- Keep behaviour flags for **30 days**, then aggregate. Don't build a biometric profile. That avoids biometric-identification territory.

**Weighting:** combine the flags into RT11 with a **maximum LR of 3**, and only when ≥ 2 flags fire. A self-reported live call (feature 1) is stronger and should count as RT11 with LR 5, or as its own observation. **No behaviour signal alone can raise the level above "watch".**

---

## 5. Mule accounts and a payee-risk score

### 5.1 India's state of play

| Measure | Facts | Status |
|---|---|---|
| **MuleHunter.AI** (RBI Innovation Hub) | ML model built with banks from **19 mule-behaviour patterns**. Piloted with 2 large PSU banks (Dec 2024). RBI and FinMin pushed all banks to adopt it. Research 4 reports it **live in 29 banks, ≈20k mule accounts flagged a month (Jul 2026)**. **I4C–RBIH MoU (12 May 2026)** feeds Suspect Registry data into MuleHunter's training. | The 19 patterns aren't published. Bank counts come from press. |
| **I4C Suspect Registry** | Launched **10 Sep 2024** with banks. Holds identifiers (accounts, mobile numbers, emails, devices, digital identities). As of **30 Jun 2026: 30.48 lakh suspicious identifiers** reported by banks, **32.08 lakh "Layer-1" mule accounts** shared, ≈**₹25,698 cr** of transactions blocked. As of 31 Jan 2026: 27.37 lakh L1 mules, ₹9,518 cr prevented. | Verified via several outlets citing Parliament/I4C. "Blocked / declined / saved" are used loosely. |
| **Over-freezing** | Flagged accounts are sometimes frozen in full for small links. The Madras HC limited one freeze to the ≈₹3 lakh disputed amount (The Ken). | A lesson: **proportional** action and an appeal path |
| **DoT FRI** | Mobile number risk (M/H/VH), shared with banks via DIP | §2 |
| **NPCI** | **P2P "collect" requests banned from 1 Oct 2025**. NPCI gives all banks a **free AI/ML fraud-risk-scoring** system to alert and decline. Device binding, daily limits. | Verified (PTI/ETV; Lok Sabha answer) |
| **Name check before RTGS/NEFT** | RBI circular 30 Dec 2024: all RTGS/NEFT banks must offer a **beneficiary name look-up by 1 Apr 2025**, free, on internet and mobile banking and at branches. If no name shows, the remitter can still proceed. | Rule verified. Coverage not confirmed. |
| **UK Confirmation of Payee** (comparison) | Results: Match / Close match / No match / Unavailable. Users can still proceed after a no-match. Since launch, a **59% fall** in the "incorrect account" claim category and a 20–40% fall in losses for some fraud types (UK Finance, via Pay.UK) | Verified via Pay.UK, but it's a proxy measure |

Sources: [Business Standard: what is MuleHunter.AI](https://www.business-standard.com/amp/finance/news/what-is-mulehunter-ai-rbi-s-latest-tool-against-financial-fraud-explained-124120600865_1.html) · [FinTech Futures: pilot](https://www.fintechfutures.com/ai-in-fintech/reserve-bank-of-india-pilots-new-mulehunter-ai-solution-to-help-identify-mule-accounts) · [Moneylife: I4C–RBIH MoU](https://moneylife.in/article/i4c-rbi-innovation-hub-sign-mou-to-use-ai-for-detecting-mule-accounts-and-cyber-frauds/80439.html) · [The Hitavada, 13 May 2026](https://www.thehitavada.com/Encyc/2026/5/13/mou-signed-to-curb-mule-accounts-shah.html) · [The Ken: 3M mule accounts](https://the-ken.com/story/flagged-3m-mule-accounts-declined-rs-25k-cr-in-fraud-transactions-then-who-knows/) · [LatestLY: Lok Sabha figures Jan 2026](https://www.latestly.com/agency-news/business-news-fraudsters-increasingly-using-india-based-mule-accounts-to-move-stolen-money-report-7532900.html) · [Drishti IAS: Suspect Registry](https://www.drishtiias.com/daily-updates/daily-news-analysis/india-s-suspect-registry-and-cybersecurity-initiatives) · [ETV Bharat: P2P collect ban](https://www.etvbharat.com/en/!business/npci-to-stop-upi-p2p-collect-requests-from-oct-1-to-combat-fraud-enn25081404610) · [Lok Sabha answer on NPCI FRM](https://eparlib.nic.in/bitstream/123456789/2971362/1/AU1158.pdf) · [Business Standard: RTGS/NEFT name look-up](https://www.business-standard.com/amp/finance/personal-finance/secure-your-payment-rbi-launches-name-verification-for-neft-rtgs-transfer-124101000149_1.html) · [Mondaq on the circular](https://www.mondaq.com/india/financial-services/1574376/rbis-beneficiary-name-look-up-facility-in-rtgs-and-neft-a-step-towards-secured-fund-transfers) · [Pay.UK: CoP 2bn checks](https://www.wearepay.uk/confirmation-of-payee-reaches-two-billion-checks-helping-protect-uk-consumers-against-fraud/) · [Finextra: CoP five years on](https://www.finextra.com/the-long-read/1396/confirmation-of-payee-five-years-on)

### 5.2 Typical mule indicators (industry; mostly vendor sources, so claimed)

- **Pass-through:** credits leave within hours, often all of them, to cash, crypto or onward accounts.
- **Fan-in from unrelated senders**, then fan-out. This is a *graph* signal: each bank sees only one "ordinary" payment.
- **New or newly re-activated accounts**: dormant, then bursts; many new beneficiaries in a short window.
- **Name or purpose mismatch**: a personal account named like a body ("RBI Verification", "Supervision A/c"), or a holder who doesn't match the declared purpose.
- **Shared devices or numbers** across many accounts (the Suspect Registry includes devices and phones).

Sources: [Bureau](https://bureau.id/resources/blog/money-mule-detection) · [Trustfull](https://trustfull.com/articles/how-to-spot-money-mule-red-flags-in-banking) · [Sphinx](https://sphinxhq.com/blog-posts/what-is-a-mule-account-detection-investigation) · [Partisia (cross-bank example)](https://www.partisia.com/blog/mule-accounts-in-banking-how-fraud-networks-exploit-accounts)

### 5.3 Privacy-preserving sharing

- **Plain hashing is not enough.** Phone numbers (10 digits) and account numbers are low-entropy, so an unsalted SHA-256 can be reversed by brute force. Use **keyed hashing (HMAC-SHA-256 with a server-side secret)**, which `lib/privacy.ts` already does for numbers. (Inference, consistent with the sources' caveats.)
- **Bloom filters** answer "is this payee on the list?" with **no false negatives** and a tunable false-positive rate. PayPal has patented Bloom-filter block lists over accounts, phones and devices. Build them over **HMACs**, not raw IDs. Rotate the key monthly. Sizing for 10,000 entries at a 0.1% false-positive rate: m ≈ 143,800 bits (**≈18 KB**), **k = 10 hash functions**. Small enough to ship to the device so payee checks happen offline. (Maths: m = −n·ln p / (ln 2)²; k = (m/n)·ln 2.) [Redis Bloom docs](https://redis.io/docs/stack/bloom) · [US12086277B2](https://patents.google.com/patent/US12086277)
- **Private set intersection (PSI) and multi-party PSI** let banks learn only the overlap ("how many of us flag this account?"). Research also flags **provenance privacy**: even "Bank X flagged it" can leak information. [IACR ePrint 2025/072](https://eprint.iacr.org/2025/072.pdf) · [PoPETs 2024](https://crysp.petsymposium.org/popets/2024/popets-2024-0114.pdf) · [arXiv 2502.19952](https://arxiv.org/pdf/2502.19952)
- **BIS Project Aurora (2023)** reports privacy-enhancing tech plus cross-institution network analysis finding **up to 3× more** complex mule schemes, with **up to 80% fewer false positives**. The figure came from a secondary blog, so check it before citing. [BIS Aurora](https://www.bis.org/publ/othp66.htm)
- **k-anonymity:** don't show any community statistic for a payee or number until at least **k = 3** distinct reporters back it. That also blunts malicious single reports. [Sweeney 2002](https://dataprivacylab.org/dataprivacy/projects/kanonymity/kanonymity.pdf)

### 5.4 Design: payee-risk score (0–100)

All inputs are mockable in the demo. Bank-side inputs come from the practice bank's ledger.

| Signal | Points | Notes |
|---|---|---|
| Payee in an external registry list (mock Suspect Registry / MuleHunter flag) | **hard: 100** | Labelled "Reported to the government's cybercrime list" |
| Payee name looks like an authority or "safe account" (RBI, CBI, court, "verification", "supervision", "escrow") on a personal account | **hard: 100** | Already `scam_payee_name` in `lib/rules.ts`; also RT09 |
| Ruko community reports, distinct reporters (HMAC'd), decayed | 1 → +20; 2 → +40; ≥ 3 → +60 | Half-life 30 days; drop after 180 days; reporters must have confirmed "Was this a scam? Yes" |
| Fan-in: ≥ 5 distinct unrelated payers into the payee in 24 h (Ruko network / practice bank) | +25 | Graph signal |
| Pass-through: ≥ 80% of 24 h inflow leaves within 24 h | +20 | Bank-side |
| Account age < 90 days, or dormant > 180 days and now active | +15 | Bank-side |
| Name look-up mismatch (name typed or claimed ≠ name returned) | +20 (no match), +5 (close match) | Mirrors CoP |
| First payment from this payer to this payee | +10 | Already `new_payee` |
| FRI on the payee's linked mobile: Medium / High / Very High | +10 / +30 / hard | Mock until DIP access |

**Tiers:** 0–29 low (no friction) · 30–59 **caution** (show the returned name and "Do you know this person?") · 60–79 **hold** plus trusted-person approval · ≥ 80 **block**, show 1930, open a fraud-desk case, raise RT12.

**Pitfalls:**
- **Weaponised reports.** One person shouldn't be able to block a shop. Hence ≥ 2–3 distinct reporters, verified-victim weighting and decay.
- **Over-freezing** (the Madras HC lesson). Hold the transaction, not the payee's whole account. Offer an appeal path on the fraud desk.
- **Bias.** Don't score by the payee's bank type or region.
- **Explainability.** Always show the top two reasons in plain words.

---

## 6. App security for an elder-data fraud app

### 6.1 Standards baseline

- **OWASP ASVS 5.0.0** (released 30 May 2025; ≈350 requirements in 17 chapters). **Level 2** is for "applications that handle personal, financial or other sensitive data", which is Ruko's case. Level 3 is for financial infrastructure. [OWASP ASVS](https://owasp.org/projects/asvs?tab=main) · [What's new in 5.0](https://softwaremill.com/whats-new-in-asvs-5-0/)
- **OWASP Top 10** (2021 edition: A01 Broken Access Control is #1). For Ruko that means Supabase row-level security (RLS) and the `lib/auth.ts` checks. [OWASP Top 10](https://owasp.org/Top10/)
- **Next.js 16 (this repo's version)** docs in `node_modules/next/dist/docs/`:
  - CSP nonces are generated in **`proxy.ts`**, and nonce pages must be **dynamically rendered** (`02-guides/content-security-policy.md`).
  - Server Actions are POST-only and compare `Origin` with `Host` (`02-guides/data-security.md`). **Route handlers under `app/api/*` get no such check.** Add one yourself.
- **Supabase:** RLS on every table. The secret/service key is used only in server code. Rotate the key that was pasted in chat (CLAUDE.md). [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

### 6.2 Concrete controls

| Area | Setting |
|---|---|
| **CSP** (via `proxy.ts`) | `default-src 'self'; script-src 'self' 'nonce-{n}' 'strict-dynamic'; style-src 'self' 'nonce-{n}'; img-src 'self' data: blob:; connect-src 'self' https://<ref>.supabase.co wss://<ref>.supabase.co; frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests`. `frame-ancestors 'self'` keeps `/demo` iframes working. |
| Other headers | HSTS `max-age=63072000; includeSubDomains`; `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`, and **`no-referrer` on `/join/[token]` and `/auth/*`** because tokens are in the URL; `Permissions-Policy: microphone=(self), camera=(), geolocation=(), payment=()` (the mic is needed for browser speech) |
| **CSRF** | SameSite=Lax auth cookies. On every non-GET `app/api/*` handler, reject if `Origin` ≠ the app origin. Never change state on GET. |
| **Rate limits** (per user, plus per IP) | Login email link: 5/h per email · `/join/[token]`: 10 per 15 min per IP · code-word check: 5 attempts, then a 15-min lock · `/api/number/report`: 5/day per user, 20/day per IP · `/api/number` lookups: 60/min · Radar/threat writes: 30/min · general API: 120/min |
| **Secrets in data** | Code words and safety PINs: **scrypt or Argon2id** (not SHA-256), with a per-record salt. Invite tokens: 128-bit random, **stored hashed**, single use, **72 h expiry**. |
| **Data minimisation** | Signals not audio (already a rule). Behaviour flags only (§4). Payee and number IDs HMAC'd. |
| **Logging** | No PII in logs. Log the actor's pseudonymous ID, action and object ID. |

### 6.3 Tamper-evident (hash-chained) audit log

Purpose: evidence for the fraud desk (who held or released what, and when) and **research integrity** for the trial (allocations, outcomes and the time each was recorded can't be changed silently).

- **Structure** (per Crosby & Wallach 2009 and the Certificate Transparency idea, RFC 6962): each row stores `seq`, `at`, `actor`, `action`, `object`, `payload_digest`, `prev_hash` and `hash = SHA-256(prev_hash ‖ canonical_json(row without hash))`. The first row uses a fixed genesis value. [Crosby & Wallach, USENIX Sec 2009](https://www.usenix.org/legacy/event/sec09/tech/full_papers/crosby.pdf) · [RFC 6962](https://www.rfc-editor.org/rfc/rfc6962)
- **Append-only in Postgres:** `REVOKE UPDATE, DELETE` from app roles, plus a trigger that raises an error on UPDATE or DELETE. Insert through one `security definer` function that computes `prev_hash` under a lock, so concurrent inserts can't fork the chain.
- **Anchoring:** every day, and at trial milestones, publish the **head hash** outside the database: show it on `/results`, commit it to the repo, or email it to the supervisor. Before the first trial call, **publish the hash of the allocation table (seed 20261018)** so the allocation is pre-registered.
- **Verify:** a `scripts/check-audit.ts` that recomputes the chain and reports the first broken `seq`.
- **Erasure vs immutability:** never put personal data in the chain itself. Store digests and pseudonymous IDs. A deletion request then erases the source rows, and the chain still verifies.

### 6.4 Indian law

| Rule | What it requires | Source |
|---|---|---|
| **DPDP Rules 2025, Rule 6** (notified 13 Nov 2025; main duties from **13 May 2027**) | Reasonable safeguards: encryption, masking or tokenisation; access control; access logging and monitoring; detecting unauthorised access; backups and continuity; processor contracts. Secondary sources say **logs must be kept ≥ 1 year**. Check against the gazette. | [DPDP Rule 6 text](https://dpdpa.com/dpdparules/rule6.html) · [MYND wiki](https://dpdp.myndsolution.com/wiki/rules/rule-6-reasonable-security-safeguards/) · [AMLegals](https://amlegals.com/reasonable-security-safeguards-under-dpdpa/) |
| **DPDP breach (Rule 7)** | Tell affected people without delay; full report to the Data Protection Board **within 72 h** | Research 4 |
| **CERT-In Directions, 28 Apr 2022** (s.70B IT Act) | Report cyber incidents **within 6 h** of noticing them; keep **logs in India for 180 days**; sync clocks to NIC/NPL NTP (or an equivalent server) | [PSA Legal](https://psalegal.com/new-cert-in-directions-overview-and-implications/) · [Mondaq](https://mondaq.co.uk/india/it-and-internet/1270332/6-hours-to-report-cyber-incidents-to-cert-in) · [CERT-In PDF](https://www.cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf) |

What this means for Ruko: Supabase is already in **Mumbai**. Set Vercel function and log regions to India (`bom1`), or drain logs to India. Keep app and audit logs for **at least 1 year**, which satisfies both the 180-day and the 1-year rules. Write a one-page incident runbook with a **6-hour CERT-In** clock and a **72-hour DPB** clock.

---

## 7. Gaps and unverified items

- Nationwide CNAP status after Mar 2026, and coverage in the Karnataka circle: **not confirmed**.
- How many banks actually comply with the 1600 rule: unknown.
- FRI "₹660 cr prevented": unverified. No public API spec for DIP/FRI.
- MuleHunter's 19 patterns and its precision: not public.
- BioCatch's 60% detection: a single vendor case study with no false-positive rate. **No independent evaluation** of behavioural coaching detection was found.
- The "segmented typing = dictation" link is plausible, but documented only for new-account fraud (44%, vendor).
- No deployed **banking** duress PIN found, and no evidence on duress codes against remote coercion.
- BIS Aurora's "3× / −80%" figures came via a secondary blog.
- DPDP 1-year log retention: from secondary readings of Rule 6/8, not checked against the gazette.
- The number of tactics in MITRE F3 is unverified.
- Risk-decay half-lives and graded-response thresholds have no public benchmarks, so Ruko's values are priors to fit on trial data.

---

## Top 12 implications for Ruko's code

1. **One fusion engine, one vocabulary.** Keep `lib/threat.ts`: stages S1–S7, tactics RT01–RT17, prior **p₀ = 0.01**, levels **watch 0.20 / elevated 0.50 / high 0.80 / critical 0.95**. Inside a stage the strongest tactic counts fully and the rest count at **½ weight**. Drop evidence after **6 half-lives**.
2. **The ladder decides the action, not single rules.** elevated → STOP screen with a **30 s** pause (Google's figure) and a ₹10k / **60 min** cooling-off. high → hold plus trusted-person approval. critical → hold, fraud-desk case, family call. Escalate unresolved holds to the desk after **4 h**, with a human review at **24 h** (the UK cap is D+4).
3. **Counter-evidence can't overrule money red flags.** RT17 (verified bank call, LR **0.3**, half-life **30 min**) may lower a Radar-only score. It must never cancel RT09 ("safe account", LR 25) or RT12 (mule, LR 60).
4. **Call intent:** a signed JWS (Ed25519) with `iss, kid, sub, from(1600…), agent, purpose, never[], iat, nbf, exp, jti, call_ref`. Live intents expire in **10 min**, re-issued every **2 min**; scheduled windows are **≤ 60 min**; skew **±60 s**; `jti` kept until **exp + 5 min**. Accept it only from Ruko's own authenticated fetch, **never from a link, SMS or the caller**.
5. **Show the call status on home *and* the payment screen.** Three states: green "Your bank is calling you now", red "Your bank is not calling you. Hang up now.", grey "Can't check". Offline is never green. Add Monzo's line: "If the caller says the app is broken, it's a scam."
6. **India call facts in the UI:** "Real bank calls come from **1600**" (banks since **1 Jan 2026**). Don't say "trust the CNAP name", because it's patchy and not on 2G. Link **Chakshu**, **1930** and **cybercrime.gov.in**.
7. **Safety PIN (duress):** a separate 4-digit PIN that differs from the normal one in **≥ 2 digits**. The result looks identical to "payment pending". It triggers a **24 h** silent hold and a silent family alert, RT14 LR **500**. **Never auto-dial the police.** Testable in drill mode. Never call it "duress" in the UI.
8. **Behaviour flags computed in the browser and sent as summaries only:** app switches **≥ 3**; account typed in **≥ 3 bursts with gaps ≥ 1.5 s**; confirm dwell **> 60 s** or flow **> 3× median** (default 10 min); paste on the account field; first use of RTGS/FD-break. RT11 fires only with **≥ 2 flags**, with LR **capped at 3**. Ask outright: "Is anyone on the phone with you?" (Yes = LR **5**). Keep flags **30 days**.
9. **Payee-risk score 0–100:** registry hit or an authority-style name = **hard 100**; community reports **+20 / +40 / +60** for 1 / 2 / ≥ 3 distinct reporters (half-life **30 d**, expire **180 d**); fan-in ≥ 5 payers in 24 h **+25**; pass-through ≥ 80% in 24 h **+20**; account < 90 d **+15**; name no-match **+20** (close match +5); new payee **+10**. Tiers: **<30** pass, **30–59** confirm the name, **60–79** hold plus trusted person, **≥80** block and RT12.
10. **Privacy for shared lists:** HMAC-SHA-256 with a server pepper (never plain SHA). An on-device Bloom filter of flagged payees: **10k entries, 0.1% FPR → ≈18 KB, k = 10**, key rotated monthly. Show community stats only at **k ≥ 3** reporters. Hold the transaction, never the payee's whole account, and give the desk an appeal button.
11. **Web hardening (ASVS L2):** a nonce CSP in `proxy.ts` (`strict-dynamic`, `frame-ancestors 'self'`, `object-src 'none'`); an Origin check on every non-GET `app/api/*`; `no-referrer` on `/join/*` and `/auth/*`; rate limits (login **5/h**, join **10/15 min**, code word **5 tries → 15 min lock**, number reports **5/day/user**); scrypt or Argon2id for code words and the safety PIN; invite tokens hashed with **72 h** expiry; RLS on every table; rotate the Supabase secret.
12. **Hash-chained `audit_log`:** `hash = SHA-256(prev_hash ‖ canonical_json(row))`. Append-only through REVOKE plus a trigger. Publish the head hash daily and publish the **allocation-table hash before the first trial call**. A `scripts/check-audit.ts` verifier. No PII in the chain. Keep logs **≥ 1 year** in India (covers CERT-In's 180 days). Incident runbook: **CERT-In 6 h**, **DPB 72 h**.
