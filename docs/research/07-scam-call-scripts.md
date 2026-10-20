# Research 7: Drill call scripts (as of 9 Oct 2026)

These are the safe role-play scripts for the scam simulator: 5 scam calls and 4 harmless control calls, in English and Hindi. They go with the research behind them and the "furthest step reached" scale used to score each call.

- **Machine-readable copy:** `data/drill-scripts.json` (`{ version: 1, scripts: [...] }`). The full text below is generated from that file, so **edit the JSON, not this page**.
- This builds on `01-scam-anatomy.md` and doesn't repeat it. Source tags work the same way: **[GOV]** government or primary, **[NEWS]** reputable outlets, **[LOCAL/SEC]** regional, aggregator or analysis sites, **[FORUM]** a single user post. Anything without [GOV] is unverified.
- The research was done with a limited number of web searches. Deccan Herald pages returned 403, so some Deccan Herald facts come from search snippets and are marked as such.

---

## 1. How the five real scams unfold

### (a) "Digital arrest" by fake investigators: money laundering, Aadhaar, stay on camera

| Stage | What really happens | Sources |
|---|---|---|
| Opener | A call from someone posing as a police officer from a named Mumbai station. Older Bengaluru victims are often told **their Aadhaar is linked to a bank account in a money-laundering case**. | Digit (81-year-old, ₹1.77 cr) [NEWS] |
| Proof | **Fake arrest warrants** are sent on WhatsApp. Fake IDs and a copy of the "complaint" are shown on video. | Digit [NEWS]; TNM [NEWS] |
| "Digital arrest" | The victim is told they are under digital arrest, must **stay on the video call and not disconnect**, and must not leave the house. Scammers watch in shifts. One victim was told to keep the call open all night. | CyberPeace [LOCAL/SEC]; The Quint [NEWS] |
| Secrecy | "**Don't inform anyone**, or you'll be arrested." **Location updates every 3 hours** (retired colonel, 83). | Deccan Herald via search snippet, Nov 2025 [NEWS] |
| Money pivot | The money is needed for "**RBI verification**", or must move to "**secure government accounts**" until the probe ends. It is **promised back within about 3 days**. Victims are pushed to **cash out mutual funds, savings and FDs**. | DH colonel [NEWS]; Digit [NEWS]; CyberPeace [LOCAL/SEC] |
| Transfer | Net banking or **RTGS at the branch**, often in several instalments over days (₹56 lakh over 2 weeks; ₹1.77 cr over 10 days). | DH, Digit [NEWS] |
| Cover story | When the branch asks, victims give a **coached reason**: "buying land in Bengaluru" (Mangaluru, ₹84 lakh), "selling one property and buying another" or "granddaughter's fees" (Jodhpur, ₹1.85 cr), "son buying property" (Agra, ₹81 lakh). | Search summaries of DH, ETV Bharat, the420 [NEWS/LOCAL] |
| End | Victims realise **when the calls stop**, and then go to the police. | Digit; DH [NEWS] |

### (b) Courier parcel with drugs ("FedEx scam")

| Stage | What really happens | Sources |
|---|---|---|
| Opener | A live "customer care" agent (sometimes an IVR: "parcel on hold, press 1") who **already knows the victim's name**, and sometimes their Aadhaar number. | Decode first-person account [NEWS]; techenclave [FORUM] |
| Hook | A parcel in the victim's name, **Mumbai → Taiwan** (or Iran, Thailand, Cambodia), was **seized**. It holds **drugs/MDMA (e.g. 140–240 g), passports, bank or credit cards**. A **tracking number** and fake CCTV are offered as proof. | TNM (₹1.2 cr journalist) [NEWS]; Decode [NEWS]; CyberPeace [LOCAL/SEC] |
| Identity pivot | "I didn't send it." → "**Then your Aadhaar was misused.**" The victim is now both suspect and victim, which makes them easier to steer. | CyberPeace [LOCAL/SEC] |
| Handover | "I'll **connect you to the police / narcotics officer**." A second call, often on WhatsApp or Skype, plays police-station background noise. | Decode; TNM [NEWS] |
| Escalation | The case grows into money laundering and hawala across several bank accounts. A document with an agency stamp is shown. | Decode [NEWS] |
| Money pivot | "Good cop, bad cop": the officer offers to help, then asks for a **"verification" payment of about ₹95k** (₹95,499 and ₹96,525 in two separate cases). Threat: **account frozen for 2–3 years**. | Decode; Tribune [NEWS] |
| Duration | About 7 hours (Ankita Shrivastav), 2 days (a techie, ₹1 cr), 8 days (journalist), about 2 weeks (retiree, ₹9.14 cr). | CyberPeace; TNM [NEWS] |
| Break-off | Swati Thapa **refused to pay; the caller paused, then hung up.** | Decode [NEWS] |

### (c) Courier plus Aadhaar misuse

This is (b) with the drugs story left out. **The Aadhaar is the hook**: "a parcel or SIM with your Aadhaar copy was found", then "your Aadhaar opened accounts used for fraud", then "**all your accounts will be frozen**", then "**move your money to a safe or secure government account** until you're cleared". Scammers also tell victims to declare their accounts and balances. I found no primary source for the line "don't tell the bank, bank staff are involved". It is a plausible lever (the Supreme Court did order a probe into bank staff), but **it is unverified as a quoted line**. Sources: CyberPeace; Digit; Telangana Today (fake officer says an account was opened with the victim's KYC and Aadhaar; the couple were told men were waiting outside; RTGS of ₹46 lakh from an FD) [NEWS].

### (d) Telecom "your number will be disconnected in 2 hours"

| Stage | What really happens | Sources |
|---|---|---|
| Opener | A **pre-recorded call**: "your number will be **blocked within 2 hours**, press 9". | MyPunePulse [LOCAL/SEC]; TRAI PR 55/2024 confirms the pre-recorded calls [GOV] |
| Hook | "A **second SIM was issued on your Aadhaar** (in Mumbai). It's used for **illegal advertisements and harassment messages**." They quote an FIR number and the address of the shop that sold the SIM. | MyPunePulse; TNM (₹11.8 cr techie) [NEWS] |
| Handover | "You must give a **police clarification**." The call goes to a fake "Andheri police station" officer, then video calls, then money laundering, then digital arrest. | DH (₹30 lakh Bengaluru woman, 14 days, via snippet) [NEWS] |
| Money | The same "verification of bank accounts" pivot. ₹30 lakh, ₹3.7 cr and ₹11.8 cr were lost in Bengaluru cases (₹75 lakh, then ₹3.41 cr for the techie). | DH; TNM [NEWS] |
| Official line | **TRAI does not contact customers about disconnecting numbers and has authorised no third party to do so.** Disconnection is the operator's job. Report the call on Sanchar Saathi Chakshu. | TRAI PR 22/2025 [GOV]; PIB/AIR [GOV] |

### (e) Electricity disconnection "tonight"

| Stage | What really happens | Sources |
|---|---|---|
| Opener | An SMS or call: "bill pending, **power will be disconnected tonight**", with a mobile number to call. | Udayavani (61-year-old, Bengaluru, ₹50,000) [NEWS] |
| Pivot | A fake utility employee asks for a **tiny payment of ₹10–20 "to record the payment"**, or tells the victim to **download an app**. | DH (BESCOM caution) [NEWS] |
| Loss | OTPs for transactions the victim never made start arriving, and the account is drained: ₹50,000 and ₹53,545 in two Bengaluru cases (60 and 61-year-olds). Some variants use a link for a ₹10–25 "re-delivery" or "bill" fee. | Udayavani; DH; The Goan [NEWS] |
| Official line | Check a doubtful bill at the sub-division office, the utility's app or 1912. Never use the number in the SMS. | DH; NativePlanet [NEWS/LOCAL] |

The electricity scam is **short (minutes, not days), the amounts are smaller, and it works through an app or OTP more than a transfer**. The drill keeps that shape: a ₹10 "record update", then a "code on your screen", then a ₹6,360 "reconnection".

### Amounts, methods and what made people stop

- **Typical losses for older victims in Bengaluru (2024–25 reports):** ₹56 lakh (83, colonel), ₹1.2 cr (70, journalist), ₹1.62 cr (66), ₹1.77 cr (81), ₹9.14 cr (61), ₹31.83 cr (the extreme case). **First demands often sit just under ₹1 lakh**, then grow.
- **How the money moves:** net banking or NEFT, and **RTGS at the branch after breaking FDs** (the most common route for older victims), cashing out mutual funds, gold loans (Pune, see 01), and UPI for small amounts. **Instalments over several days** are the norm.
- **What made real victims stop:**
  1. Refusing to pay: the scammer gives up and hangs up (Decode).
  2. **Bank staff noticing tension or restlessness**, asking what the money is for, calling the children, then 1930 (Hyderabad ₹46 lakh, Kochi, Mangaluru, Agra).
  3. **Family noticing** (see 01).
  4. The scammers simply stopping.
- **Failure mode:** a single warning isn't enough. The Rajkot victim switched banks; the Jodhpur victim gave different stories at two branches.

### What legitimate calls actually say (for the controls)

- **Banks:** RBI lets customers complete re-KYC with a **self-declaration** through non-branch channels (registered email or mobile, ATM, net or mobile banking, letter) or **at any branch**. Since Jun 2025, Aadhaar-OTP e-KYC and video KYC are allowed for updates. RBI and banks warn: **never share your PIN, OTP or password**, and contact your branch if asked. **Since 1 Jan 2026, commercial banks must make service and transactional calls from the 1600 number series.** NBFCs, co-operative banks and RRBs had until Feb or Mar 2026, and post-deadline compliance is unconfirmed. Sources: RBI re-KYC press release (Jan 2023) [GOV]; Business Standard (Nov 2024) [NEWS]; RBI KYC-fraud caution [GOV]; TRAI 1600 direction (19 Nov 2025) [GOV]; IANS [NEWS].
  - **A nuance for the trial:** Aadhaar-OTP e-KYC is a real channel, so "a bank never involves an OTP" is not literally true. The rule to teach is: **never read an OTP to someone who called you.** The control script never mentions an OTP except to say "we will never ask for it".
- **Planned power outages (Bengaluru):** BESCOM announces **area lists, the date, the time window (for example 10 am–5 pm) and the reason** (cable charging, tree trimming, maintenance), usually through the press, X, the BESCOM Mithra app and 1912. An SMS alert scheme was announced years ago, but its current status is unverified. **These notices never ask for anything.**
- **Courier delivery:** genuine agents call to confirm **the time slot, a landmark, or a safe place to leave it**. Prepaid means nothing to pay. Some platforms use a delivery code shown **at the door**, but **no courier needs a bank, card or UPI OTP, or a payment by link.** (Goa cyber police; QuickHeal [NEWS/BLOG].) The control script **leaves out delivery codes on purpose**, so it doesn't contradict Ruko's "never share a code" teaching during the trial.
- **Relatives:** a real favour comes from a **saved number**, involves **a small, explained amount to a known payee**, has **no deadline**, and **invites you to involve family** ("tell Amma I called"). That is the opposite of the family-emergency scam (see the `family_emergency` pattern).

---

## 2. The "furthest step reached" scale

Every scam call is scored by the **furthest checkpoint the person passed** before stopping. The scale is ordinal: higher means closer to losing money. **A level counts as passed when the person stays on past the step that triggers it.** If a script has no step for a level (for example, the electricity script has no secrecy step), that level is credited when the person passes the next level that does exist.

| Level | Code | The person… | Reached when they stay past a step with stage |
|---|---|---|---|
| 0 | `stopped_early` | hung up, said RUKO, or refused before the story landed | (stopped during `open` or `hook`) |
| 1 | `engaged` | stayed for the accusation and kept talking | `hook`, `fear` |
| 2 | `disclosed` | read out the fake case code, reference or balance (**logged as "would have disclosed"**) | `verify_fake` that asks for a code, reference or balance (`*_disclose`, `ca_balance`, `ec_code`) |
| 3 | `stayed_isolated` | stayed on after being told not to hang up, to stay on camera or to stay alone | `isolate` |
| 4 | `agreed_secrecy` | agreed not to tell family or the bank | `secrecy` |
| 5 | `opened_bank` | opened the mock Sahyog Bank screen | `pivot_money` → the app is opened |
| 6 | `entered_amount` | entered the payee and amount | `instruct_transfer` |
| 7 | `confirmed_transfer` | pressed confirm | `instruct_transfer` → confirm |
| 8 | `overrode_hold` | went past the cooling-off screen or trusted-person hold, or tried "another bank" | `pressure` (`*_override`) |

**The electricity script needs one special rule.** Its ₹10 "record update" (`ec_small_pay`) comes before the code request, so a completed ₹10 payment counts as **level 5** (opened the bank). Levels 6–8 are scored on the ₹6,360 payment only. Log the ₹10 separately as `small_test_payment`, because in real cases that is the step that leads to the account being drained.

**North-star metric:** the share of scam calls that end at **level ≤ 6**, meaning the person stopped before confirming. **Secondary metrics:** the median level reached, time to stop, and **how they stopped**:

- `hung_up`
- `said_ruko`
- `ruko_check` (used "Is this call real?")
- `told_family`
- `bank_hold_accepted`
- `facilitator_ended`

**Control calls** use a separate outcome:

- `completed_normally`: the expected result
- `false_alarm`: the person used the Ruko check and it flagged the call, alerted family, or was blocked by bank friction (only applies to the ₹640 known-payee transfer in `control_relative_favour`)
- `refused_but_fine`: the person declined politely without any alarm (not a false alarm; caution is fine)

### How the stages map

| Stage | What it does | Scale role |
|---|---|---|
| `open` | greeting, IVR, identity check | before level 1 |
| `hook` | the accusation or reason for the call | → level 1 |
| `fear` | warrant, freeze, disconnection, case | → level 1 |
| `verify_fake` | fake proof (certificate, "I'll make you a witness"), **or** a request for a fake code or balance | → level 2 (the disclosure kind only) |
| `isolate` | stay on, camera on, stay alone, don't call the office | → level 3 |
| `secrecy` | don't tell family or bank | → level 4 |
| `pivot_money` | why money must move | → level 5 |
| `instruct_transfer` | payee, amount, method | → levels 6–7 |
| `pressure` | deadlines, cover story, "continue past the warning" | → level 8 |
| `close` | the scammer's sign-off, and the `debrief` | — |

---

## 3. Script rules and how the engine should use them

**Safety (non-negotiable; all checked by a lint over the JSON):**
- **Fictional names only:**
  - Central Investigation Cell – DRILL
  - SwiftParcel
  - Telecom Verification Desk
  - City Power Board
  - Sahyog Bank

  No CBI, NCB, TRAI, DoT, RBI, BESCOM, FedEx, customs, Supreme Court, real officer names or badge numbers. Characters are labelled "(drill character)".
- **The on-screen caller card must always show the "– DRILL" suffix** under the agency name, even though the spoken line says only "Central Investigation Cell". Saying "drill" aloud on every line would break the test.
- **Wherever a real scammer would ask for an OTP, Aadhaar, card, PIN or password**, the script asks for a fake value the drill screen shows: a "case code", "tracking reference", "complaint code", "consumer reference" or "six-digit code", or the **mock** Sahyog Bank balance. The facilitator logs it as `would_have_disclosed`. The drill screen must show these fake values and nothing real.
- **No threats of violence, no harm to family members, no sexual content.** The fear comes only from legal or administrative threats (warrant, case, freeze, disconnection), which is what real scripts lean on anyway. The real "we'll arrest your family" line (DH, ₹1.62 cr case) is **left out on purpose**.
- **Money only moves on the mock Sahyog Bank screen.** The payee names are chosen so `lib/rules.ts` `SCAM_PAYEE` catches them ("Secure Verification Account", "Narcotics Case Verification", "Safe Custody Account Cyber Desk", "Financial Verification Unit"). The electricity payees ("CPB Bill Update", "CPB Field Officer") are **not** caught by name. That is deliberate: it tests whether behaviour signals (new payee, a live call) are enough on their own.

**Engine conventions (the JSON uses only the fields specified):**
- `steps[0].id === "drill_disclosure"` is **optional**. Skip it when `family_present = true`, and play it otherwise. **The last step is always `debrief`**, and it always plays, including after RUKO or a hang-up.
- **"RUKO" (or "रुको") is handled globally:** at any step, stop speech and jump straight to `debrief`. It isn't repeated in each step's `branches`.
- `branches.hesitate` plays **once** if the person says no, hesitates, questions it, or stays silent for 6 seconds or more. Then the script moves on. If they hesitate again on the same step, move on anyway: never loop pressure.
- **Steps that wait for an action:**
  - `instruct_transfer` steps wait for the mock bank to report "amount entered" or "confirmed".
  - `*_override` steps play only if the bank shows a hold or warning; otherwise skip them.
  - `ec_code` plays after the ₹10 payment "fails". Make the mock bank fail it on purpose.
- **Timing (target 4–8 minutes):**
  - At about 150 words a minute, each line takes 4–9 seconds. With the person's replies, about 13 steps comes to about 4–5 minutes before the bank screen.
  - **Add a 20–40 second "connecting…" hold** at each handover step (`cd_handover`, `ca_handover`, `td_fear`). Real victims also wait on hold.
  - Let the bank interaction run in real time.
- **Suggested caller-ID display** (shown on the illustrated caller card; all fictional, never real numbers):
  - **Scams:** "+91 9xxxx xxxxx" (an ordinary mobile number) or "International call".
  - **`control_bank_kyc`:** "1600-xxx-xxx", because real bank service calls must come from the 1600 series.
  - **`control_relative_favour`:** "Rahul (saved contact)".
- **Pattern ids:**
  - `scam_courier_aadhaar` uses `courier_drugs`, the closest library pattern.
  - `scam_telecom_disconnect` uses `digital_arrest`, because real telecom calls hand over to fake police.
  - **`data/scam-patterns.json` has no telecom or SIM-disconnection pattern.** Consider adding `telecom_disconnect` (TRAI PR 22/2025 is the rule text).
  - Controls use `null`. What each one resembles:
    - `control_bank_kyc` → `kyc_block`
    - `control_relative_favour` → `family_emergency`
    - `control_courier_delivery` → `courier_drugs`
    - `control_power_outage` → `electricity_cut`

  Use this mapping to see which pattern rules raise false alarms.
- **Counterbalancing:** each participant gets 3–4 calls. Pair the scam scripts so the baseline and Ruko arms use different scripts of similar "heaviness":
  - the heavy ones: `scam_digital_arrest`, `scam_courier_drugs`, `scam_courier_aadhaar`, `scam_telecom_disconnect`
  - the light one: `scam_electricity_cut`

  Mix one control in at random.

**Script summary**

| id | is_scam | pattern | steps | mock amount | payee |
|---|---|---|---|---|---|
| scam_digital_arrest | yes | digital_arrest | 14 | ₹4,75,000 (break FD) | Secure Verification Account ••4471 |
| scam_courier_drugs | yes | courier_drugs | 13 | ₹95,500 | Narcotics Case Verification ••2209 |
| scam_courier_aadhaar | yes | courier_drugs | 14 | ₹2,40,000 (NEFT) | Safe Custody Account Cyber Desk ••7730 |
| scam_telecom_disconnect | yes | digital_arrest | 13 | ₹1,50,000 | Financial Verification Unit ••5512 |
| scam_electricity_cut | yes | electricity_cut | 12 | ₹10, then ₹6,360 | CPB Bill Update / CPB Field Officer ••0921 |
| control_bank_kyc | no | null | 9 | — | — |
| control_relative_favour | no | null | 8 | ₹640 (optional) | Rahul (known payee) |
| control_courier_delivery | no | null | 8 | — | — |
| control_power_outage | no | null | 8 | — | — |

Averages: **scam 13.2 steps, control 8.3, all 11.0.**

---

## 4. Sources

**Government and primary**
- [TRAI PR 22/2025: TRAI never calls about disconnection](https://trai.gov.in/sites/default/files/2025-04/PR_No.22of2025.pdf)
- [TRAI PR 55/2024: pre-recorded calls](https://trai.gov.in/sites/default/files/PR_No.55of2024.pdf)
- [Sanchar Saathi: threatening fake disconnection calls](https://www.sancharsaathi.gov.in/SancharSaathiDocuments/ImportantDocuments/Threatening%20fake%20call%20for%20disconnection%20of%20mobile%20connections.pdf)
- [AIR: TRAI warning (Apr 2025)](https://www.newsonair.gov.in/trai-warns-public-against-fake-calls-threatening-mobile-disconnection)
- [TRAI 1600-series direction (19 Nov 2025)](https://www.trai.gov.in/sites/default/files/2025-11/Direction_19112025_0.pdf)
- [IANS: 1600-series deadlines](https://ianslive.in/trai-orders-mandatory-adoption-of-1600-series-numbers-by-banks-financial-services-insurance-firms--20251119152705)
- [RBI re-KYC press release (Jan 2023)](https://website.rbi.org.in/documents/87730/39710918/PR1500KYC297ef03ad4f74bca874a414d26235ecc.pdf)
- [RBI caution on KYC-update fraud](https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=52216)
- [RBI BE(A)WARE booklet](https://website.rbi.org.in/web/rbi/-/press-releases/be-a-ware-a-booklet-on-modus-operandi-of-financial-frauds-53372)

**News**
- [Tribune: I4C says CBI and ED don't arrest by video call](https://www.tribuneindia.com/news/india/cbi-ed-dont-nab-via-video-calls-advisory-to-curb-digital-arrest/amp)
- [Digit: Bengaluru 81-year-old, ₹1.77 cr](https://www.digit.in/news/general/bengaluru-man-duped-of-rs-1-77-crore-in-digital-arrest-scam-heres-what-happened.html)
- [Deccan Herald: retired colonel, ₹56 lakh](https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Fbengaluru-retired-colonel-cheated-of-rs-56-lakh-under-digital-arrest-for-two-weeks-3805014) (via search snippet; the page returned 403)
- [Deccan Herald: Bengaluru retiree, ₹1.62 cr](https://www.deccanherald.com/india/karnataka/bengaluru/will-arrest-your-family-if-you-dont-comply-fake-cops-dupe-bengaluru-retiree-of-rs-162-crore-3770611) (403; title only)
- [TNM: Bengaluru journalist, ₹1.2 cr (FedEx)](https://www.thenewsminute.com/karnataka/beware-of-fedex-scam-bengaluru-journalist-loses-rs-12-crore)
- [Deccan Herald: FedEx scam, 8 days of "digital captivity"](https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Ffedex-frauds-hold-woman-in-digital-captivity-for-8-days-2848168) (403; via snippet)
- [Decode: first-person account of the FedEx/Taiwan call](https://www.decodeinternet.in/decode/voices/fedex-scam-call-of-taiwan-parcel-and-what-unfolds-next-22048)
- [Tribune: actor loses ₹5.79 lakh](https://www.tribuneindia.com/news/trending/how-a-fraud-posed-as-cop-convinced-bollywood-actor-that-she-had-drugs-in-her-parcel-robs-her-of-rs-5-79-lakh-577889)
- [TNM: Bengaluru techie, ₹11.8 cr (SIM, illegal advertisements)](https://www.thenewsminute.com/karnataka/bengaluru-software-engineer-loses-rs-118-crore-in-digital-arrest-scam)
- [Deccan Herald: fake DoT officials, ₹30 lakh](https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fbengaluru%2Fscammers-pose-as-dot-officials-cheat-bengaluru-woman-of-rs-30-lakh-3019526) (via snippet)
- [Telangana Today: SBI staff save ₹46 lakh](https://telanganatoday.com/hyderabad-alert-sbi-staff-avert-digital-arrest-scam-being-perpetrated-save-46-lakh-of-elderly-couple)
- [Deccan Herald: Mangaluru ₹84 lakh save ("buying land")](https://www.deccanherald.com/amp/story/india%2Fkarnataka%2Fmangaluru%2Falert-bank-manager-mulki-police-foil-rs-84-lakh-digital-arrest-fraud-attempt-3820300)
- [ETV Bharat: Jodhpur ₹1.85 cr (two cover stories)](https://www.etvbharat.com/en/state/jodhpur-senior-citizen-duped-of-more-than-rs-1-dot-5-crore-through-digital-arrest-enn26022402537)
- [the420: Agra ₹81 lakh save](https://the420.in/agra-digital-arrest-scam-bank-saves-81-lakh/)
- [Udayavani: fake power bill, ₹50,000](https://www.udayavani.com/english-news/fake-power-bill-scam-man-loses-rs-50000)
- [Deccan Herald: BESCOM warns consumers about fraudsters](https://www.deccanherald.com/amp/city/top-bengaluru-stories/bescom-cautions-consumers-not-to-fall-prey-to-fraudsters-1120874.html)
- [Deccan Herald: IVR trap](https://www.deccanherald.com/city/bengaluru-crime/beware-of-ivr-trap-bengaluru-residents-lose-money-in-back-to-back-phone-scams-1235828.html)
- [TNM: BESCOM planned outages](https://www.thenewsminute.com/karnataka/over-5-hour-power-cut-to-affect-parts-of-bengaluru-on-january-16-list)
- [The Quint: "keep the call on all night"](https://www.thequint.com/news/webqoof/all-you-need-to-know-about-digital-arrests)
- [The Goan: fake parcel fee](https://www.thegoan.net/goa-news/%EF%BB%BFfake-parcel-scam-grips-goa-cyber-crime-sleuths-sound-warning/139746.html)

**Regional, aggregator and analysis**
- [CyberPeace: modus operandi of the FedEx scam](https://cyberpeace.org/resources/blogs/your-parcel-contains-drugs-inside-the-fake-fedex-scam-terrorising-indian-cities)
- [MyPunePulse: "blocked in 2 hours, press 9"](https://www.mypunepulse.com/?p=110019)
- [NativePlanet: BESCOM outage status (Sep 2026)](https://www.nativeplanet.com/news/bengaluru-power-cut-update-check-bescom-maintenance-status-september-7-2026-011-24127.html)
- [QuickHeal: parcel delivery scams](https://www.quickheal.co.in/knowledge-centre/parcel-delivery-scams-why-that-sms-about-your-package-is-dangerous/)

**Forum**
- techenclave thread: "FedEx package on hold, press 1" (one anecdote)

**Unverified or not found:**
- a police-released verbatim transcript (none found)
- the exact "2 hours" wording in a TRAI release (it appears only in news coverage)
- whether BESCOM planned-outage SMS alerts are running now
- whether "don't tell the bank, staff are involved" is a quoted scammer line

---

## 5. The full scripts

Generated from `data/drill-scripts.json`. **(optional)** marks the drill disclosure, which is skipped when a family member is present. "If they hesitate" is the single pressure line played on a no or a pause. Saying RUKO at any point jumps to the debrief.

### `scam_digital_arrest`: Investigation officer: money-laundering case and "digital arrest"

*जाँच अधिकारी: मनी लॉन्ड्रिंग केस और "डिजिटल अरेस्ट"*

- **Caller:** Officer Sethi (drill character), Senior officer, Central Investigation Cell – DRILL
- **Scam:** yes
- **Ruko pattern:** digital_arrest
- **Steps:** 14

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `da_open` · *open*
   - EN: Good morning, this is Officer Sethi from the Central Investigation Cell, Mumbai office. Am I speaking to the person who uses this number?
   - HI: नमस्ते, मैं सेंट्रल इन्वेस्टिगेशन सेल, मुंबई ऑफ़िस से ऑफ़िसर सेठी बोल रहा हूँ। क्या यह नंबर आप ही इस्तेमाल करते हैं?
   - If they hesitate: This is an official matter. Please just confirm, it will take one minute.
   - हिचकिचाएँ तो: यह सरकारी मामला है। बस कन्फ़र्म कर दीजिए, एक मिनट लगेगा।
3. `da_hook` · *hook*
   - EN: Your Aadhaar has been found linked to a bank account used in a six crore money laundering case. Your name is in the FIR.
   - HI: आपका आधार एक ऐसे बैंक अकाउंट से जुड़ा मिला है जो छह करोड़ के मनी लॉन्ड्रिंग केस में इस्तेमाल हुआ। FIR में आपका नाम है।
   - If they hesitate: You may well be innocent. That is exactly why we must verify you today.
   - हिचकिचाएँ तो: हो सकता है आप बेक़सूर हों। इसीलिए आज ही आपका वेरिफ़िकेशन ज़रूरी है।
4. `da_disclose` · *verify_fake*
   - EN: For the record, please read me the four-digit case code shown on your screen.
   - HI: रिकॉर्ड के लिए, अपनी स्क्रीन पर दिख रहा चार अंकों का केस कोड पढ़कर बताइए।
   - If they hesitate: If you don't cooperate, your file goes forward marked as non-cooperation.
   - हिचकिचाएँ तो: आप सहयोग नहीं करेंगे तो आपकी फ़ाइल "असहयोग" लिखकर आगे भेज दी जाएगी।
5. `da_fear` · *fear*
   - EN: An arrest warrant is ready in your name. From now you are under digital arrest, and your questioning will happen on this call.
   - HI: आपके नाम का अरेस्ट वारंट तैयार है। अब से आप डिजिटल अरेस्ट में हैं, और पूछताछ इसी कॉल पर होगी।
   - If they hesitate: If this call is cut, the case will record you as absconding.
   - हिचकिचाएँ तो: अगर यह कॉल कटी, तो केस में आपको फ़रार लिखा जाएगा।
6. `da_isolate` · *isolate*
   - EN: Stay on this call and keep your camera on. Do not disconnect, even if someone else calls you.
   - HI: इसी कॉल पर रहिए और कैमरा चालू रखिए। कोई और फ़ोन करे, तब भी कॉल मत काटिए।
   - If they hesitate: This is for your own protection. People in this case may try to contact you.
   - हिचकिचाएँ तो: यह आपकी अपनी सुरक्षा के लिए है। इस केस के लोग आपसे संपर्क करने की कोशिश कर सकते हैं।
7. `da_secrecy` · *secrecy*
   - EN: This is a confidential case, so do not tell your family, neighbours or bank staff. Do you understand?
   - HI: यह गोपनीय केस है, इसलिए परिवार, पड़ोसी या बैंक वालों को कुछ मत बताइए। समझ गए?
   - If they hesitate: If you tell anyone, the confidentiality breaks and clearing your name will take much longer.
   - हिचकिचाएँ तो: किसी को बताया तो गोपनीयता टूट जाएगी और आपका नाम साफ़ होने में बहुत देर लगेगी।
8. `da_verify_fake` · *verify_fake*
   - EN: My senior has seen your file. If your money is clean, you will get a clearance certificate today itself.
   - HI: मेरे सीनियर ने आपकी फ़ाइल देख ली है। आपका पैसा साफ़ निकला तो आज ही क्लियरेंस सर्टिफ़िकेट मिल जाएगा।
9. `da_pivot` · *pivot_money*
   - EN: To prove your money is clean, your savings and fixed deposits must be checked in a secure verification account.
   - HI: आपका पैसा साफ़ है, यह साबित करने के लिए आपकी बचत और FD की जाँच एक सुरक्षित वेरिफ़िकेशन अकाउंट में होगी।
   - If they hesitate: It is only a verification. Every rupee comes back to you within three days.
   - हिचकिचाएँ तो: यह सिर्फ़ वेरिफ़िकेशन है। तीन दिन में एक-एक रुपया आपको वापस मिल जाएगा।
10. `da_transfer` · *instruct_transfer*
   - EN: Open your Sahyog Bank app now. Break your fixed deposit and transfer four lakh seventy-five thousand rupees to Secure Verification Account, ending 4471.
   - HI: अभी अपना सहयोग बैंक ऐप खोलिए। FD तोड़िए और चार लाख पचहत्तर हज़ार रुपये "सिक्योर वेरिफ़िकेशन अकाउंट" में भेजिए, जिसके आख़िरी अंक 4471 हैं।
   - If they hesitate: The verification window closes in thirty minutes. After that the file goes to court.
   - हिचकिचाएँ तो: वेरिफ़िकेशन की विंडो तीस मिनट में बंद हो जाएगी। उसके बाद फ़ाइल कोर्ट चली जाएगी।
11. `da_cover_story` · *pressure*
   - EN: If the bank asks, say the money is for buying a property. Do not mention this case.
   - HI: बैंक पूछे तो कहिए कि पैसा प्रॉपर्टी ख़रीदने के लिए है। इस केस का ज़िक्र मत कीजिए।
12. `da_override` · *pressure*
   - EN: The bank is showing a hold? That is routine, so continue anyway, or the case moves forward today.
   - HI: बैंक होल्ड दिखा रहा है? यह आम बात है, फिर भी आगे बढ़िए, वरना केस आज ही आगे बढ़ जाएगा।
   - If they hesitate: If this bank is slow, you can use another bank's app. Just finish it now.
   - हिचकिचाएँ तो: यह बैंक धीमा है तो किसी दूसरे बैंक का ऐप इस्तेमाल कर लीजिए। बस अभी पूरा कीजिए।
13. `da_close` · *close*
   - EN: Good, your clearance certificate will come on WhatsApp. Stay available for the next step.
   - HI: ठीक है, आपका क्लियरेंस सर्टिफ़िकेट WhatsApp पर आएगा। अगले स्टेप के लिए उपलब्ध रहिए।
14. `debrief` · *close*
   - EN: This was a Ruko practice call: no money moved, and you did nothing wrong. Real police never arrest anyone or ask for money on a call, so hang up and call 1930 or visit cybercrime.gov.in.
   - HI: यह Ruko की अभ्यास कॉल थी: कोई पैसा नहीं गया, और आपने कुछ ग़लत नहीं किया। असली पुलिस कभी कॉल पर गिरफ़्तार नहीं करती, न पैसे माँगती है, इसलिए फ़ोन काटिए और 1930 पर कॉल कीजिए या cybercrime.gov.in पर जाइए।

### `scam_courier_drugs`: Courier parcel stopped at the airport with drugs

*एयरपोर्ट पर पकड़ा गया पार्सल, जिसमें ड्रग्स मिले*

- **Caller:** Priya (SwiftParcel), then Officer Naik (drill characters), SwiftParcel international desk, then narcotics unit, Central Investigation Cell – DRILL
- **Scam:** yes
- **Ruko pattern:** courier_drugs
- **Steps:** 13

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `cd_ivr` · *open*
   - EN: This is an automated message from SwiftParcel: your parcel has been held. Stay on the line to speak to an executive.
   - HI: यह SwiftParcel का ऑटोमैटिक मैसेज है: आपका पार्सल रोका गया है। एग्ज़ीक्यूटिव से बात करने के लिए लाइन पर बने रहिए।
3. `cd_hook` · *hook*
   - EN: Hello, Priya from the SwiftParcel international desk. A parcel booked in your name from Mumbai to Taiwan was stopped at the airport inspection.
   - HI: हैलो, मैं SwiftParcel इंटरनेशनल डेस्क से प्रिया बोल रही हूँ। आपके नाम से मुंबई से ताइवान बुक हुआ एक पार्सल एयरपोर्ट जाँच में रोका गया है।
   - If they hesitate: It is booked with your name and this phone number. That is why I am informing you.
   - हिचकिचाएँ तो: यह आपके नाम और इसी फ़ोन नंबर से बुक है। इसीलिए मैं आपको बता रही हूँ।
4. `cd_fear` · *fear*
   - EN: Inside there are five passports, three bank cards and one hundred forty grams of drugs. This is a serious offence.
   - HI: इसके अंदर पाँच पासपोर्ट, तीन बैंक कार्ड और एक सौ चालीस ग्राम ड्रग्स मिले हैं। यह गंभीर अपराध है।
   - If they hesitate: If you did not send it, then someone has misused your identity. You must report it now, or it stays on your name.
   - हिचकिचाएँ तो: अगर आपने नहीं भेजा, तो किसी ने आपकी पहचान का ग़लत इस्तेमाल किया है। अभी शिकायत कीजिए, वरना यह आपके नाम पर ही रहेगा।
5. `cd_disclose` · *verify_fake*
   - EN: To file your complaint, please read me the six-digit tracking reference shown on your screen.
   - HI: आपकी शिकायत दर्ज करने के लिए, स्क्रीन पर दिख रहा छह अंकों का ट्रैकिंग रेफ़रेंस पढ़कर बताइए।
6. `cd_handover` · *isolate*
   - EN: I am transferring you directly to the Central Investigation Cell narcotics unit. Please do not disconnect.
   - HI: मैं आपकी कॉल सीधे सेंट्रल इन्वेस्टिगेशन सेल की नारकोटिक्स यूनिट को ट्रांसफ़र कर रही हूँ। कृपया कॉल मत काटिए।
   - If they hesitate: If you cut now, the complaint will not register and the case stays open on your name.
   - हिचकिचाएँ तो: अभी काटा तो शिकायत दर्ज नहीं होगी और केस आपके नाम पर खुला रहेगा।
7. `cd_officer` · *fear*
   - EN: This is Officer Naik, narcotics unit, and your name is now in a drug trafficking case. This is not a small matter.
   - HI: मैं नारकोटिक्स यूनिट से ऑफ़िसर नाइक बोल रहा हूँ, और अब आपका नाम ड्रग तस्करी के केस में है। यह छोटी बात नहीं है।
   - If they hesitate: I am trying to help you. Answer calmly and this can be sorted out today.
   - हिचकिचाएँ तो: मैं आपकी मदद करने की कोशिश कर रहा हूँ। शांति से जवाब दीजिए, आज ही मामला सुलझ सकता है।
8. `cd_secrecy` · *secrecy*
   - EN: This case is confidential. Do not discuss it with anyone until your statement is complete, not even family.
   - HI: यह केस गोपनीय है। जब तक आपका बयान पूरा न हो, किसी से बात मत कीजिए, परिवार से भी नहीं।
   - If they hesitate: Talking to others now can spoil your statement. Just ten more minutes.
   - हिचकिचाएँ तो: अभी दूसरों से बात करने से आपका बयान ख़राब हो सकता है। बस दस मिनट और।
9. `cd_good_cop` · *verify_fake*
   - EN: I believe you. If you cooperate, I can record you as a witness, not as an accused.
   - HI: मुझे आप पर भरोसा है। आप सहयोग करें तो मैं आपको आरोपी नहीं, गवाह के तौर पर दर्ज कर सकता हूँ।
10. `cd_pivot` · *pivot_money*
   - EN: For that, a refundable verification deposit of ninety-five thousand five hundred rupees is needed. It comes back after the inquiry.
   - HI: इसके लिए पंचानवे हज़ार पाँच सौ रुपये का वेरिफ़िकेशन डिपॉज़िट चाहिए, जो वापस मिलता है। जाँच के बाद लौटा दिया जाएगा।
   - If they hesitate: Without this deposit, I cannot change your status to witness.
   - हिचकिचाएँ तो: यह डिपॉज़िट नहीं हुआ तो मैं आपको गवाह नहीं बना पाऊँगा।
11. `cd_transfer` · *instruct_transfer*
   - EN: Open Sahyog Bank and send ninety-five thousand five hundred rupees to Narcotics Case Verification, ending 2209. Stay on the line while you do it.
   - HI: सहयोग बैंक खोलिए और पंचानवे हज़ार पाँच सौ रुपये "नारकोटिक्स केस वेरिफ़िकेशन" में भेजिए, आख़िरी अंक 2209 हैं। भेजते समय लाइन पर बने रहिए।
12. `cd_override` · *pressure*
   - EN: If the bank shows a warning, just continue. Banks show that for every large payment.
   - HI: बैंक कोई चेतावनी दिखाए तो बस आगे बढ़िए। बड़ी रक़म पर बैंक हमेशा ऐसा दिखाता है।
   - If they hesitate: Please hurry. The case will be sent forward within the hour.
   - हिचकिचाएँ तो: जल्दी कीजिए। एक घंटे के अंदर केस आगे भेज दिया जाएगा।
13. `debrief` · *close*
   - EN: This was a Ruko practice call: no money moved, and you did nothing wrong. Couriers never hand your call to the police, so hang up and call 1930 or visit cybercrime.gov.in.
   - HI: यह Ruko की अभ्यास कॉल थी: कोई पैसा नहीं गया, और आपने कुछ ग़लत नहीं किया। कूरियर कंपनी कभी आपकी कॉल पुलिस को नहीं जोड़ती, इसलिए फ़ोन काटिए और 1930 पर कॉल कीजिए या cybercrime.gov.in पर जाइए।

### `scam_courier_aadhaar`: Courier finds your Aadhaar copy: accounts to be frozen

*कूरियर में आपके आधार की कॉपी: खाते फ़्रीज़ होंगे*

- **Caller:** Rakesh (SwiftParcel), then Officer Rao (drill characters), SwiftParcel returns hub, then cyber desk, Central Investigation Cell – DRILL
- **Scam:** yes
- **Ruko pattern:** courier_drugs
- **Steps:** 14

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `ca_open` · *open*
   - EN: Hello, this is Rakesh from SwiftParcel, Bengaluru hub. I am calling about a parcel linked to this number.
   - HI: हैलो, मैं SwiftParcel बेंगलुरु हब से राकेश बोल रहा हूँ। इस नंबर से जुड़े एक पार्सल के बारे में फ़ोन किया है।
3. `ca_hook` · *hook*
   - EN: A returned parcel has a copy of your Aadhaar and four SIM cards inside. Did you send it?
   - HI: एक लौटे हुए पार्सल में आपके आधार की कॉपी और चार सिम कार्ड मिले हैं। क्या यह आपने भेजा था?
   - If they hesitate: Please don't worry, I am only trying to help. Just tell me yes or no.
   - हिचकिचाएँ तो: घबराइए मत, मैं बस मदद करना चाहता हूँ। सिर्फ़ हाँ या ना बताइए।
4. `ca_disclose` · *verify_fake*
   - EN: To check the parcel, please read me the six-digit reference number shown on your screen.
   - HI: पार्सल चेक करने के लिए, स्क्रीन पर दिख रहा छह अंकों का रेफ़रेंस नंबर पढ़कर बताइए।
5. `ca_fear` · *fear*
   - EN: Then your Aadhaar has been misused. It was used to open bank accounts that received fraud money.
   - HI: तो फिर आपके आधार का ग़लत इस्तेमाल हुआ है। इससे ऐसे बैंक अकाउंट खोले गए जिनमें धोखाधड़ी का पैसा आया।
6. `ca_handover` · *isolate*
   - EN: I am connecting you to the Central Investigation Cell cyber desk to register your complaint. Please stay on the line.
   - HI: आपकी शिकायत दर्ज कराने के लिए मैं आपको सेंट्रल इन्वेस्टिगेशन सेल के साइबर डेस्क से जोड़ रहा हूँ। लाइन पर बने रहिए।
   - If they hesitate: If you don't register today, the misuse will be counted as yours.
   - हिचकिचाएँ तो: आज शिकायत नहीं की तो यह ग़लत इस्तेमाल आपके ही नाम माना जाएगा।
7. `ca_officer` · *fear*
   - EN: This is Officer Rao, cyber desk: your Aadhaar is linked to three accounts in a hawala case. Every account in your name will be frozen in two hours.
   - HI: मैं साइबर डेस्क से ऑफ़िसर राव बोल रहा हूँ: आपका आधार हवाला केस के तीन अकाउंट से जुड़ा है। दो घंटे में आपके नाम के सारे अकाउंट फ़्रीज़ हो जाएँगे।
   - If they hesitate: Once frozen, you will not be able to use your pension or savings for months.
   - हिचकिचाएँ तो: एक बार फ़्रीज़ हुआ तो महीनों तक आप अपनी पेंशन या बचत इस्तेमाल नहीं कर पाएँगे।
8. `ca_balance` · *verify_fake*
   - EN: To separate your genuine account, open your Sahyog Bank app and read me the balance it shows.
   - HI: आपका असली अकाउंट अलग करने के लिए, सहयोग बैंक ऐप खोलिए और जो बैलेंस दिख रहा है वह पढ़कर बताइए।
9. `ca_secrecy` · *secrecy*
   - EN: Do not tell your bank about this call. Some bank staff are part of this racket.
   - HI: इस कॉल के बारे में अपने बैंक को मत बताइए। कुछ बैंक वाले भी इस गिरोह में शामिल हैं।
   - If they hesitate: If they find out, they can move your money before we protect it.
   - हिचकिचाएँ तो: अगर उन्हें पता चल गया, तो हमारे बचाने से पहले वे आपका पैसा हटा सकते हैं।
10. `ca_isolate` · *isolate*
   - EN: Keep this call on speaker and stay alone in the room until we finish.
   - HI: यह कॉल स्पीकर पर रखिए और जब तक हम ख़त्म न करें, कमरे में अकेले रहिए।
11. `ca_pivot` · *pivot_money*
   - EN: We will keep your money in a government safe custody account until your name is cleared. It comes back in forty-eight hours.
   - HI: जब तक आपका नाम साफ़ नहीं होता, हम आपका पैसा सरकारी सेफ़ कस्टडी अकाउंट में रखेंगे। अड़तालीस घंटे में वापस आ जाएगा।
   - If they hesitate: This is only to protect you. If it stays in your account, it will be frozen with the others.
   - हिचकिचाएँ तो: यह सिर्फ़ आपको बचाने के लिए है। आपके अकाउंट में रहा तो बाक़ी के साथ यह भी फ़्रीज़ हो जाएगा।
12. `ca_transfer` · *instruct_transfer*
   - EN: Transfer two lakh forty thousand rupees to Safe Custody Account Cyber Desk, ending 7730. Use NEFT from the app.
   - HI: दो लाख चालीस हज़ार रुपये "सेफ़ कस्टडी अकाउंट साइबर डेस्क" में भेजिए, आख़िरी अंक 7730 हैं। ऐप से NEFT कीजिए।
13. `ca_override` · *pressure*
   - EN: If the bank asks you to wait, don't wait. The freeze starts soon and your money will be stuck.
   - HI: बैंक रुकने को कहे तो मत रुकिए। फ़्रीज़ जल्दी शुरू होगा और आपका पैसा अटक जाएगा।
   - If they hesitate: I am on your side. Finish this one step and you are safe.
   - हिचकिचाएँ तो: मैं आपकी तरफ़ हूँ। बस यह एक काम पूरा कीजिए, फिर आप सुरक्षित हैं।
14. `debrief` · *close*
   - EN: This was a Ruko practice call: no money moved, and you did nothing wrong. There is no such thing as a safe custody account, so hang up and call 1930 or visit cybercrime.gov.in.
   - HI: यह Ruko की अभ्यास कॉल थी: कोई पैसा नहीं गया, और आपने कुछ ग़लत नहीं किया। "सेफ़ कस्टडी अकाउंट" जैसी कोई चीज़ नहीं होती, इसलिए फ़ोन काटिए और 1930 पर कॉल कीजिए या cybercrime.gov.in पर जाइए।

### `scam_telecom_disconnect`: Telecom desk: your number will be cut in 2 hours

*टेलीकॉम डेस्क: 2 घंटे में आपका नंबर बंद होगा*

- **Caller:** Telecom Verification Desk, then Officer Iyer (drill characters), Telecom Verification Desk, then Central Investigation Cell – DRILL
- **Scam:** yes
- **Ruko pattern:** digital_arrest
- **Steps:** 13

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `td_ivr` · *open*
   - EN: This is the Telecom Verification Desk: your mobile number will be disconnected in two hours. Stay on the line to speak to an officer.
   - HI: यह टेलीकॉम वेरिफ़िकेशन डेस्क है: आपका मोबाइल नंबर दो घंटे में बंद कर दिया जाएगा। अधिकारी से बात करने के लिए लाइन पर बने रहिए।
3. `td_hook` · *hook*
   - EN: A second SIM was issued on your Aadhaar in Mumbai. It is sending illegal advertisements and harassment messages.
   - HI: आपके आधार पर मुंबई में एक दूसरा सिम जारी हुआ है। उससे ग़ैरक़ानूनी विज्ञापन और परेशान करने वाले मैसेज भेजे जा रहे हैं।
   - If they hesitate: If it is not yours, you must give a clarification today, or both numbers will be blocked.
   - हिचकिचाएँ तो: अगर वह आपका नहीं है, तो आज ही सफ़ाई देनी होगी, वरना दोनों नंबर बंद हो जाएँगे।
4. `td_disclose` · *verify_fake*
   - EN: I am raising a complaint for you. Please read me the four-digit complaint code shown on your screen.
   - HI: मैं आपके लिए शिकायत दर्ज कर रहा हूँ। स्क्रीन पर दिख रहा चार अंकों का शिकायत कोड पढ़कर बताइए।
5. `td_fear` · *fear*
   - EN: There are seventeen complaints against that number. I must connect you to the Central Investigation Cell for a police clarification.
   - HI: उस नंबर पर सत्रह शिकायतें हैं। पुलिस में सफ़ाई के लिए मुझे आपको सेंट्रल इन्वेस्टिगेशन सेल से जोड़ना होगा।
6. `td_isolate` · *isolate*
   - EN: Stay on the line. If you hang up, the disconnection will go ahead automatically.
   - HI: लाइन पर बने रहिए। फ़ोन काटा तो नंबर अपने-आप बंद हो जाएगा।
   - If they hesitate: It will take only five minutes, and then your number is safe.
   - हिचकिचाएँ तो: बस पाँच मिनट लगेंगे, फिर आपका नंबर सुरक्षित है।
7. `td_officer` · *fear*
   - EN: This is Officer Iyer, Central Investigation Cell: that SIM is also linked to a bank account in a money laundering case. You are now a suspect.
   - HI: मैं सेंट्रल इन्वेस्टिगेशन सेल से ऑफ़िसर अय्यर बोल रहा हूँ: वह सिम मनी लॉन्ड्रिंग केस के एक बैंक अकाउंट से भी जुड़ा है। अब आप संदिग्ध हैं।
   - If they hesitate: I am not saying you did it. But you must prove it, today.
   - हिचकिचाएँ तो: मैं नहीं कह रहा कि आपने किया। लेकिन साबित तो आपको ही करना होगा, आज ही।
8. `td_video` · *isolate*
   - EN: Please switch to video and stay in front of the camera until your statement is finished.
   - HI: कृपया वीडियो चालू कीजिए और बयान पूरा होने तक कैमरे के सामने रहिए।
9. `td_secrecy` · *secrecy*
   - EN: Your statement is being recorded. Do not discuss this with anyone, or it will count as tampering with evidence.
   - HI: आपका बयान रिकॉर्ड हो रहा है। किसी से इस बारे में बात मत कीजिए, वरना इसे सबूत से छेड़छाड़ माना जाएगा।
   - If they hesitate: Once you are cleared, you can tell anyone you like.
   - हिचकिचाएँ तो: एक बार आपका नाम साफ़ हो जाए, फिर आप जिसे चाहें बता दीजिए।
10. `td_pivot` · *pivot_money*
   - EN: To prove your savings are not from this case, the amount must be checked by our financial verification unit.
   - HI: यह साबित करने के लिए कि आपकी बचत इस केस की नहीं है, रक़म की जाँच हमारी फ़ाइनेंशियल वेरिफ़िकेशन यूनिट करेगी।
11. `td_transfer` · *instruct_transfer*
   - EN: Send one lakh fifty thousand rupees to Financial Verification Unit, ending 5512. It is returned after the verification report.
   - HI: एक लाख पचास हज़ार रुपये "फ़ाइनेंशियल वेरिफ़िकेशन यूनिट" में भेजिए, आख़िरी अंक 5512 हैं। वेरिफ़िकेशन रिपोर्ट के बाद लौटा दिया जाएगा।
   - If they hesitate: Your number goes off in one hour. Please do it now.
   - हिचकिचाएँ तो: एक घंटे में आपका नंबर बंद हो जाएगा। कृपया अभी कीजिए।
12. `td_override` · *pressure*
   - EN: If the bank stops you, tell them it is for a family medical expense, and continue.
   - HI: बैंक रोके तो कहिए कि परिवार के इलाज का ख़र्च है, और आगे बढ़िए।
13. `debrief` · *close*
   - EN: This was a Ruko practice call: no money moved, and you did nothing wrong. Telecom offices never call to cut your number or pass you to the police, so hang up and call 1930 or visit cybercrime.gov.in.
   - HI: यह Ruko की अभ्यास कॉल थी: कोई पैसा नहीं गया, और आपने कुछ ग़लत नहीं किया। टेलीकॉम विभाग कभी नंबर बंद करने या पुलिस से जोड़ने के लिए फ़ोन नहीं करता, इसलिए फ़ोन काटिए और 1930 पर कॉल कीजिए या cybercrime.gov.in पर जाइए।

### `scam_electricity_cut`: Power board: electricity will be cut tonight

*बिजली बोर्ड: आज रात बिजली कट जाएगी*

- **Caller:** Mr Kumar (drill character), "Billing officer", City Power Board (fictional)
- **Scam:** yes
- **Ruko pattern:** electricity_cut
- **Steps:** 12

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `ec_open` · *open*
   - EN: Hello, this is Kumar from the City Power Board billing office. Is the electricity connection at your house in your name?
   - HI: हैलो, मैं सिटी पावर बोर्ड के बिलिंग ऑफ़िस से कुमार बोल रहा हूँ। आपके घर का बिजली कनेक्शन आपके नाम पर है?
3. `ec_hook` · *hook*
   - EN: Last month's bill is showing unpaid in our system. Your connection will be cut tonight at nine thirty.
   - HI: हमारे सिस्टम में पिछले महीने का बिल बाक़ी दिख रहा है। आज रात साढ़े नौ बजे आपका कनेक्शन काट दिया जाएगा।
   - If they hesitate: Maybe you did pay, but it has not updated. That is why I am calling, to help you.
   - हिचकिचाएँ तो: हो सकता है आपने भरा हो, पर अपडेट नहीं हुआ। इसीलिए तो मैं मदद के लिए फ़ोन कर रहा हूँ।
4. `ec_fear` · *fear*
   - EN: Once it is cut, reconnection takes three to four days, with a reconnection charge.
   - HI: एक बार कट गया तो दोबारा जोड़ने में तीन-चार दिन लगेंगे, और रीकनेक्शन चार्ज अलग से लगेगा।
5. `ec_disclose` · *verify_fake*
   - EN: Let me check your record. Please read me the consumer reference number shown on your screen.
   - HI: मैं आपका रिकॉर्ड देखता हूँ। स्क्रीन पर दिख रहा कंज़्यूमर रेफ़रेंस नंबर पढ़कर बताइए।
6. `ec_isolate` · *isolate*
   - EN: No need to call the office, they will only keep you on hold. I am handling your case personally.
   - HI: ऑफ़िस में फ़ोन करने की ज़रूरत नहीं, वहाँ बस होल्ड पर रखेंगे। आपका मामला मैं ख़ुद देख रहा हूँ।
   - If they hesitate: The office closes at six. After that, nobody can stop the line crew.
   - हिचकिचाएँ तो: ऑफ़िस छह बजे बंद हो जाता है। उसके बाद लाइन वालों को कोई नहीं रोक पाएगा।
7. `ec_small_pay` · *instruct_transfer*
   - EN: First, to update your record, pay just ten rupees to CPB Bill Update from your Sahyog Bank app.
   - HI: पहले रिकॉर्ड अपडेट करने के लिए, सहयोग बैंक ऐप से "CPB बिल अपडेट" में सिर्फ़ दस रुपये भेजिए।
8. `ec_code` · *verify_fake*
   - EN: It did not go through? Then read me the six-digit code that just appeared on your screen, and I will do it from my side.
   - HI: पेमेंट नहीं हुआ? तो अभी स्क्रीन पर आया छह अंकों का कोड पढ़कर बताइए, मैं अपनी तरफ़ से कर देता हूँ।
   - If they hesitate: It is only the payment code, it is needed to stop the disconnection.
   - हिचकिचाएँ तो: यह तो बस पेमेंट का कोड है, कनेक्शन कटने से रोकने के लिए चाहिए।
9. `ec_pivot` · *pivot_money*
   - EN: The system now shows the full amount with the reconnection fee: six thousand three hundred sixty rupees.
   - HI: अब सिस्टम में रीकनेक्शन फ़ीस के साथ पूरी रक़म दिख रही है: छह हज़ार तीन सौ साठ रुपये।
10. `ec_transfer` · *instruct_transfer*
   - EN: Send six thousand three hundred sixty rupees to CPB Field Officer, ending 0921, and the line stays on.
   - HI: छह हज़ार तीन सौ साठ रुपये "CPB फ़ील्ड ऑफ़िसर" में भेजिए, आख़िरी अंक 0921 हैं, और आपकी बिजली नहीं कटेगी।
   - If they hesitate: Why is it in an officer's name? It is our field collection account, that is normal.
   - हिचकिचाएँ तो: ऑफ़िसर के नाम पर क्यों? यह हमारा फ़ील्ड कलेक्शन अकाउंट है, यह आम बात है।
11. `ec_pressure` · *pressure*
   - EN: Only twenty minutes left before the line crew reaches your area. Please do it now.
   - HI: लाइन वाले बीस मिनट में आपके इलाक़े में पहुँच जाएँगे। कृपया अभी कीजिए।
12. `debrief` · *close*
   - EN: This was a Ruko practice call: no money moved, and you did nothing wrong. The power board never cuts power tonight over a personal call, so check your bill on the official app and call 1930 or visit cybercrime.gov.in if money is taken.
   - HI: यह Ruko की अभ्यास कॉल थी: कोई पैसा नहीं गया, और आपने कुछ ग़लत नहीं किया। बिजली बोर्ड कभी निजी कॉल पर आज रात बिजली काटने की बात नहीं करता, इसलिए असली ऐप पर बिल देखिए, और पैसा चला जाए तो 1930 पर कॉल कीजिए या cybercrime.gov.in पर जाइए।

### `control_bank_kyc`: Bank KYC reminder (genuine)

*बैंक का KYC रिमाइंडर (असली)*

- **Caller:** Meena (drill character), Customer service officer, Sahyog Bank, Jayanagar branch (calls from a 1600 number)
- **Scam:** no (control)
- **Ruko pattern:** null
- **Steps:** 9

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `bk_open` · *open*
   - EN: Good afternoon, this is Meena from Sahyog Bank, Jayanagar branch. Is this a good time to talk for a minute?
   - HI: नमस्ते, मैं सहयोग बैंक, जयनगर ब्रांच से मीना बोल रही हूँ। क्या एक मिनट बात करने का समय है?
3. `bk_hook` · *hook*
   - EN: Your account's KYC is due for its regular update this year. Nothing is wrong with your account.
   - HI: आपके अकाउंट का KYC इस साल नियमित अपडेट के लिए ड्यू है। आपके अकाउंट में कोई दिक़्क़त नहीं है।
4. `bk_options` · *hook*
   - EN: If your address and documents have not changed, a simple self-declaration is enough. You can do it in the app, at an ATM, or at any branch.
   - HI: अगर आपका पता और कागज़ नहीं बदले हैं, तो बस एक सेल्फ़-डिक्लेरेशन काफ़ी है। यह ऐप में, ATM पर या किसी भी ब्रांच में हो जाएगा।
5. `bk_no_rush` · *hook*
   - EN: There is no hurry. Your account stays active, and you have until the thirty-first of December.
   - HI: कोई जल्दी नहीं है। आपका अकाउंट चालू रहेगा, और आपके पास इकतीस दिसंबर तक का समय है।
6. `bk_safety` · *close*
   - EN: Please remember, we will never ask for your OTP, PIN or password, on a call or at the branch.
   - HI: याद रखिए, हम कभी भी आपका OTP, PIN या पासवर्ड नहीं माँगेंगे, न फ़ोन पर, न ब्रांच में।
7. `bk_verify` · *close*
   - EN: If you want to check this call, you can phone the number printed on your passbook or debit card.
   - HI: अगर आप इस कॉल की जाँच करना चाहें, तो अपनी पासबुक या डेबिट कार्ड पर छपे नंबर पर फ़ोन कर सकते हैं।
8. `bk_bye` · *close*
   - EN: Do you have any questions for me? Thank you, have a good day.
   - HI: आपका कोई सवाल है? धन्यवाद, आपका दिन अच्छा रहे।
9. `debrief` · *close*
   - EN: This was a Ruko practice call, and this one was an everyday, genuine kind of call: it asked for no money, no secrets and no codes. Checking a call is always okay, and 1930 is there if you ever need it.
   - HI: यह Ruko की अभ्यास कॉल थी, और यह एक आम, असली तरह की कॉल थी: इसमें न पैसे माँगे गए, न कुछ छिपाने को कहा, न कोई कोड। कॉल की जाँच करना हमेशा ठीक है, और ज़रूरत पड़े तो 1930 मौजूद है।

### `control_relative_favour`: Nephew asks a small favour (genuine)

*भतीजे का छोटा-सा काम (असली)*

- **Caller:** Rahul (drill character), Nephew, calling from his own saved number
- **Scam:** no (control)
- **Ruko pattern:** null
- **Steps:** 8

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `rf_open` · *open*
   - EN: Hello, it's Rahul! How are you, is your knee feeling better now?
   - HI: हैलो, मैं राहुल! कैसे हैं आप, घुटना अब कुछ ठीक है?
3. `rf_hook` · *hook*
   - EN: I'm in Mysuru till Sunday, and Amma's medicine delivery is coming to your house tomorrow. Could you keep it for me?
   - HI: मैं रविवार तक मैसूरु में हूँ, और अम्मा की दवाई की डिलीवरी कल आपके घर आएगी। आप रख लेंगे क्या?
4. `rf_no_pressure` · *hook*
   - EN: Nothing urgent. If it's a problem, no worries at all, I'll ask the neighbour.
   - HI: कोई जल्दी नहीं है। दिक़्क़त हो तो बिल्कुल कोई बात नहीं, मैं पड़ोसी से कह दूँगा।
5. `rf_payment` · *instruct_transfer*
   - EN: It's six hundred forty rupees cash on delivery; if you like, send it to my number on Sahyog Bank, it's already saved as Rahul. I'll return it on Sunday.
   - HI: डिलीवरी पर छह सौ चालीस रुपये देने हैं; चाहें तो सहयोग बैंक से मेरे नंबर पर भेज दीजिए, "राहुल" नाम से पहले से सेव है। रविवार को लौटा दूँगा।
6. `rf_open_door` · *close*
   - EN: Or just tell them to come back Monday, that's fine too. Tell Amma I called.
   - HI: या उन्हें सोमवार को आने को कह दीजिए, वह भी ठीक है। अम्मा को बता दीजिएगा कि मेरा फ़ोन आया था।
7. `rf_bye` · *close*
   - EN: Call me back on my number if anything comes up. Okay, take care, bye!
   - HI: कुछ भी हो तो मेरे नंबर पर फ़ोन कर लीजिए। ठीक है, अपना ध्यान रखिए, बाय!
8. `debrief` · *close*
   - EN: This was a Ruko practice call, and this one was an everyday, genuine kind of call: a known person, a small amount, no hurry and no secrets. Checking a call is always okay, and 1930 is there if you ever need it.
   - HI: यह Ruko की अभ्यास कॉल थी, और यह एक आम, असली तरह की कॉल थी: जाना-पहचाना व्यक्ति, छोटी रक़म, न जल्दी, न कुछ छिपाना। कॉल की जाँच करना हमेशा ठीक है, और ज़रूरत पड़े तो 1930 मौजूद है।

### `control_courier_delivery`: Courier delivery confirmation (genuine)

*कूरियर डिलीवरी की पुष्टि (असली)*

- **Caller:** Suresh (drill character), Delivery partner, SwiftParcel
- **Scam:** no (control)
- **Ruko pattern:** null
- **Steps:** 8

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `cv_open` · *open*
   - EN: Hello, SwiftParcel delivery here. I have a parcel for this number, from an online order.
   - HI: हैलो, SwiftParcel डिलीवरी से बोल रहा हूँ। इस नंबर के लिए एक पार्सल है, ऑनलाइन ऑर्डर का।
3. `cv_hook` · *hook*
   - EN: It is prepaid, so nothing to pay. I am in your area, can I come between two and four today?
   - HI: यह प्रीपेड है, कुछ देना नहीं है। मैं आपके इलाक़े में हूँ, आज दो से चार के बीच आ जाऊँ?
4. `cv_landmark` · *hook*
   - EN: Is there a landmark near your house? I am near the temple on the main road.
   - HI: आपके घर के पास कोई निशानी है? मैं मेन रोड वाले मंदिर के पास हूँ।
5. `cv_options` · *hook*
   - EN: If you are not home, I can leave it with the security, or bring it tomorrow. Whatever suits you.
   - HI: आप घर पर न हों तो सिक्योरिटी के पास छोड़ दूँ, या कल ले आऊँ। जैसा आपको ठीक लगे।
6. `cv_track` · *close*
   - EN: You can also track it in the app you ordered from.
   - HI: आप जिस ऐप से ऑर्डर किया था, उसमें भी इसे ट्रैक कर सकते हैं।
7. `cv_bye` · *close*
   - EN: Okay, see you in the afternoon. Thank you.
   - HI: ठीक है, दोपहर में मिलते हैं। धन्यवाद।
8. `debrief` · *close*
   - EN: This was a Ruko practice call, and this one was an everyday, genuine kind of call: nothing to pay, no threats and no codes. Checking a call is always okay, and 1930 is there if you ever need it.
   - HI: यह Ruko की अभ्यास कॉल थी, और यह एक आम, असली तरह की कॉल थी: न कुछ देना, न कोई धमकी, न कोई कोड। कॉल की जाँच करना हमेशा ठीक है, और ज़रूरत पड़े तो 1930 मौजूद है।

### `control_power_outage`: Planned power outage notice (genuine)

*बिजली बंद रहने की पहले से सूचना (असली)*

- **Caller:** City Power Board information line (drill character), Recorded notice, City Power Board (fictional)
- **Scam:** no (control)
- **Ruko pattern:** null
- **Steps:** 8

1. `drill_disclosure` · *open* **(optional)**
   - EN: This is a Ruko safety practice call. Say RUKO at any time to stop.
   - HI: यह Ruko की सुरक्षा अभ्यास कॉल है। रोकने के लिए कभी भी "रुको" बोलिए।
2. `po_open` · *open*
   - EN: Namaskara. This is an information call from City Power Board.
   - HI: नमस्कार। यह सिटी पावर बोर्ड की सूचना कॉल है।
3. `po_hook` · *hook*
   - EN: Because of planned maintenance, power will be off in your area this Thursday, from ten in the morning to two in the afternoon.
   - HI: पहले से तय मरम्मत के काम की वजह से, इस गुरुवार सुबह दस बजे से दोपहर दो बजे तक आपके इलाक़े में बिजली बंद रहेगी।
4. `po_reason` · *hook*
   - EN: The work is cable replacement and tree trimming near the transformer.
   - HI: ट्रांसफ़ॉर्मर के पास केबल बदलने और पेड़ों की छँटाई का काम होगा।
5. `po_no_action` · *hook*
   - EN: You do not need to do anything. Your bill and your connection are not affected.
   - HI: आपको कुछ करने की ज़रूरत नहीं है। आपके बिल या कनेक्शन पर कोई असर नहीं पड़ेगा।
6. `po_details` · *close*
   - EN: For details, check the City Power Board app or call the helpline printed on your bill.
   - HI: ज़्यादा जानकारी के लिए सिटी पावर बोर्ड का ऐप देखिए या अपने बिल पर छपे हेल्पलाइन नंबर पर फ़ोन कीजिए।
7. `po_bye` · *close*
   - EN: We regret the inconvenience. Thank you.
   - HI: असुविधा के लिए खेद है। धन्यवाद।
8. `debrief` · *close*
   - EN: This was a Ruko practice call, and this one was an everyday, genuine kind of call: no payment, no deadline on you and no codes. Checking a call is always okay, and 1930 is there if you ever need it.
   - HI: यह Ruko की अभ्यास कॉल थी, और यह एक आम, असली तरह की कॉल थी: न पेमेंट, न आप पर कोई डेडलाइन, न कोई कोड। कॉल की जाँच करना हमेशा ठीक है, और ज़रूरत पड़े तो 1930 मौजूद है।

