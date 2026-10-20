# Research 5: Market, buyers, competitors and business model (as of 9 Oct 2026)

How to read this:
- Source tags: **[H]** regulator, government, court or company filing · **[M]** mainstream or trade press · **[L]** vendor, aggregator or dated source.
- Check every [H] item against the primary text before quoting it on stage.
- Not covered (the search limit ran out): I4C procurement budgets, exact smartphone ownership among people 60+, Truecaller's 2026 India pricing, and Tata AIG's cyber-cover pricing.

## 1. Competitors

| Player | What it does | Price | Weakness Ruko can use |
|---|---|---|---|
| **Truecaller Family Protection** (India launch 13 Mar 2026) | An admin plus up to 5 members. The admin can end flagged calls remotely and share a blocklist. Pitched at digital arrest. | Free (premium tier available; old Family plan ₹925/yr) | Number-based only. It does nothing at the bank, so a clean number or a WhatsApp video call gets through. No cooling-off, no trusted-person approval, no drills. **No published stop-rate.** |
| **Google** | Gemini Nano detects scam calls (Hindi and English, off by default, **Pixel 9+ only**). A screen-share warning pilot covers GPay, Paytm and Navi. GPay claims ₹13,000 cr of fraud stopped in 2024. | Free | Pixels are under 1% of Indian phones, so almost no seniors have one. Only 3 apps are in the pilot, there's no family loop, and no pilot results are published. |
| **Airtel** | Network-level AI blocking of spam and malicious links, on by default. Self-reports a 68.7% drop in loss value. | Free | It can't hear the call and doesn't touch the payment. |
| **Vi / Jio** | Spam labels (Jio has some mislabelling complaints). | Free | Labels only. |
| **Quick Heal AntiFraud.AI** | Fraud-call, screen-share and call-forwarding alerts, plus a payee-name announcer. | ≈₹885/yr | Feels like an antivirus product, isn't designed for elders, and has no bank link. |
| **McAfee / Norton** | Scam protection; McAfee has a deepfake detector at ₹499. | ₹499–₹2,398 | English-first and PC-oriented. |
| **WhatsApp** | Warning before chatting with an unknown number (June 2026). Screen-share warning on video calls. Banned ~9,400 digital-arrest accounts in 12 weeks. | Free | No warning once the scammer is a saved contact. No link to payments. |
| **ScamMukt** | You submit a link, QR code or message and it checks it. | ₹599/yr | Reactive: the victim has to suspect a scam first. |
| **Indian startups** | **Bachao.AI** (on-device scam detection for seniors, raising an $8–10M seed), **VRIKAAN** (family of 5 with a "senior UPI guard", ₹149/mo), **TatvaShield** ("Elderly Guardian Mode"). | ₹149/mo | All tiny. None runs measured drills or works with banks. |
| **Bank-side vendors** | **Bureau** (mule and account-takeover detection, $30M Series B, IDFC First), **Clari5/Perfios** (Ujjivan, Fino), **BioCatch** (behavioural "VoiceScam" signal), **FICO Falcon** Scam Detection Score. | Enterprise | They score the *transaction*, not the person. Little family or human-in-the-loop design. **Plug into them; don't replace them.** |
| **Public infrastructure** | **MuleHunter.AI** (free, 26 banks), **DPIP** (8-bank pilot), **DoT FRI** phone-number risk ratings (PhonePe declines high-risk numbers; GPay and Paytm are integrating), **NPCI** federated risk scores. | Free | Mule and number intelligence is becoming free. **Use it instead of competing with it.** |
| **Elder-care platforms** | **Emoha** (₹85 cr Series B1 in Jul 2026, FY25 revenue ₹68 cr), **Khyaal** (1M+ seniors), **Samarth**. | ₹399–₹11,999 | They have paying families and trust but no fraud product. **Best as distribution partners.** |
| **EverSafe (US)** | Account monitoring that alerts caregivers. Sold direct and through Fidelity. | $7.49–$26.99/mo | Shows that families pay, and that selling through a financial firm works. |

## 2. Who pays

**Banks are the strongest buyer, and liability is moving onto them.**
- **Today most scam losses fall on the customer.** Social-engineering losses (where the customer authorised the payment) sit outside banks' fraud statistics. RBI itself counts **2.8M digital payment frauds worth ≈₹23,000 cr in 2025**.
- **New compensation rule (final directions 24 Jun 2026, effective 1 Jan 2027):**
  - Customers who lose up to ₹50,000 get **85% back, capped at ₹25,000**.
  - It applies **once in a lifetime, even if the customer was negligent**, as long as they report within 5 days.
  - The draft cost split was RBI 65% / bank 20% / customer 15%; the final split is unconfirmed.
  - It covers urban co-operative banks too.
- **RBI proposal of 9 Apr 2026** (still a proposal):
  - Customers aged 70+ need a trusted person to approve transfers above ₹50k (they can opt out).
  - Changing the trusted person triggers a 24-hour cooling-off.
  - A one-hour cancellable delay on transfers of ₹10k or more, plus a kill switch.
  - **This is almost exactly Ruko's bank kit.**
- **Supreme Court pressure:**
  - The CJI asked why banks' AI didn't flag a pensioner's large withdrawals.
  - On 4 Aug 2026 the Court gave RBI 4 weeks to frame a bank SOP.
- **Small finance banks** must run early-warning systems under the SFB Fraud Risk Management Directions of 31 Jul 2026.
- **The 1600 rule:** banks must call customers **only from 1600-series numbers** (in force for commercial banks from 1 Jan 2026, SFBs from 1 Feb, co-op banks and RRBs from 1 Mar). That gives "Is this call really my bank?" a simple, reliable answer.
- **Market size estimates disagree:** $1.69B (IMARC) versus $180M for BFSI in 2026 (MarketsandMarkets).

**Insurers:** cyber covers are cheap and already sold through platforms, so a prevention add-on that cuts claims fits.
- Paytm + HDFC ERGO: ₹30/yr for ₹10k cover.
- Flipkart + Bajaj: ₹183 for ₹50k.
- HDFC ERGO Cyber Sachet: ₹817/yr for ₹50k.
- No insurer bundles prevention yet.

**Telcos and UPI apps:** they give protection away free. Possible partners for elder-specific flows, not buyers.

**Employers:** no evidence yet. A possible later segment is "protect your parents" as an employee benefit.

**Government and I4C:** a channel, an endorsement and a data partner, not a near-term payer.

**Families:**
- The price ladder runs from ScamMukt ₹599/yr to Quick Heal ₹885/yr, VRIKAAN ₹149/mo and Emoha from ₹399.
- **Truecaller Family Protection is free**, which caps what families will pay for call screening.

## 3. Market size

- **Seniors:** 149M Indians aged 60+ (2022), projected to reach 347M by 2050.
- **Online seniors:** fewer than 25% of people 60+ used the internet in the last 3 months (NSO 2025). HelpAge India: 41% own a smartphone, 13% use the internet. That puts **≈30–37M seniors online today**. People in their 50s are twice as online and are the next wave.
- **Cyber-fraud losses:** ₹7,465 cr (2023), ₹22,848 cr (2024), ₹22,495 cr (2025).
- **Digital arrest:** ₹1,935.5 cr across 1,23,672 cases in 2024. **The average loss is ≈₹1.56 lakh, far above the ₹25k compensation cap.**
- **Karnataka:** ₹468.6 cr lost to digital arrest from Jan 2023 to Feb 2026, including single cases of ₹31.83 cr (Bengaluru) and ₹15 cr (Belagavi). This matters because the pilot is in Bengaluru.

## 4. Go-to-market playbooks that worked

- **UK:** mandatory reimbursement for authorised-payment scams since Oct 2024. In year one 88% of losses were refunded, **this type of fraud fell 21% (£73m)**, and banks invested in detection. **Liability makes banks buy.**
- **Australia:**
  - The Scams Prevention Framework (Feb 2025) carries fines of up to A$50M.
  - The banks' Scam-Safe Accord added payment delays and confirmation of payee.
  - **Apate.ai** went from pilot to bank-branded deployment to selling its intelligence to several banks (CommBank, Jun 2025).
- **Starling Bank** shows "We're calling you now / We've never called you" in its app. Combined with India's 1600 rule, an Indian bank could offer the same.
- **EverSafe** reached customers through Fidelity.
- **Indian routes into banks:**
  - The **RBI Regulatory Sandbox**: a fraud cohort ran 2023–24 (≈18 months; 3 of 6 entities were found viable), and it now accepts applications at any time.
  - The **HaRBInger 2024** "Zero Financial Frauds" prize (₹40 lakh per problem).
- **Sales cycles:** 6–12 months to a bank pilot (12–18 in some cases). Public-sector bank tenders need a Make-in-India certificate and a source-code audit. **Small finance banks and co-operative banks are faster and have fewer competing vendors.**

## 5. What can be a moat

- **Not a moat:** mule and phone-number intelligence. The government is making it free.
- **Can be defensible:**
  1. **Elder-side signals:** scam scripts reported by seniors and families, which banks and telcos can't see. Shared across banks (anonymised, with consent), they create a network effect like Apate.ai's.
  2. **Measured outcomes:** stop rate, false-alarm rate and how much the cooling-off actually helps. **No competitor publishes any of these.**
  3. **Regulatory alignment:** be the reference implementation of RBI's trusted-person approval and one-hour delay, and get validated through the sandbox.
  4. **Lock-in:** once a bank's trusted-person flow runs on Ruko, switching away is costly.

## Recommended business model

**Primary: B2B2C "Vulnerable Customer Protection" for banks.** Sell to small finance banks, urban co-operative banks and mid-size private banks. The bank pays; the senior gets it free. It includes:
- trusted-person approval and cooling-off
- the fraud desk
- a white-label elder companion ("Is this call really my bank?", using the 1600 rule)
- the family circle
- data feeds from FRI, MuleHunter and DPIP

**The pitch:** avoided compensation payouts, readiness for RBI and the Supreme Court, and proof from measured drills.

**Secondary:**
- **(a)** Scam-drill stop-rate audits as a service (this also builds the data moat).
- **(b)** Bundles with elder-care platforms and insurers.
- **(c)** A low-priced family subscription as a funnel, not the main revenue.

## Pricing to test

| What | Hypothesis |
|---|---|
| Bank, per enrolled senior | **₹10–25/month**, plus a ₹3–8 lakh 90-day pilot fee (500–2,000 seniors). Also test a bonus per verified stopped transfer. |
| Drill audit | **₹2–5 lakh** per 100-person cohort |
| Insurer bundle | **₹20–50** per policy per year |
| Family plan (up to 5 people) | Compare ₹49/mo, ₹99/mo and ₹999/yr; measure how many convert from free |
| Elder-care partner | 20–30% revenue share, or ₹30–60 per member per month |

## First 3 customers

1. **AU Small Finance Bank.** It was an early MuleHunter adopter and is now under the new early-warning-system rules for small finance banks. Offer a 90-day pilot of trusted-person approval and cooling-off for customers 60+, with a measured stop rate. **Ujjivan SFB** is the fallback.
2. **A Bengaluru urban co-operative bank with many pensioner customers** (this is an inference; no specific bank has been identified yet). Co-op banks fall under the 2027 compensation rule, have few fraud vendors, and Karnataka's digital-arrest losses are high.
3. **Emoha Elder Care** as a distribution partner. It just raised ₹85 cr and its families already pay for elder safety. In parallel, approach **HDFC ERGO** for the insurer bundle and apply to the **RBI Sandbox**.

**Risks:**
- RBI may finalise the trusted-person rule differently, or not at all.
- Free public infrastructure and free Truecaller push prices down.
- Bank sales cycles run 6–18 months.
- Few seniors are online, so family members and bank staff must handle onboarding.

## Key sources
- RBI discussion paper (9 Apr 2026): [PDF](https://rbidocs.rbi.org.in/rdocs/PublicConsultation/PDFs/C2R453090420266BB498A82F924583961B276E9A26376F.PDF), [MediaNama](https://www.medianama.com/2026/04/223-safeguard-elderly-rbi-suggests-trusted-person-approval-high-value-digital-payments/)
- Compensation rules (Jan 2027): [Moneylife](https://moneylife.in/article/rbi-notifies-digital-fraud-compensation-rules-gives-banks-more-time-delays-rollout/80882.html)
- Supreme Court SOP order: [The Leaflet](https://theleaflet.in/leaflet-reports/supreme-court-calls-digital-arrest-frauds-robbery-and-dacoity-presses-rbi-on-banking-safeguards)
- 1600-series calls for banks: [Outlook Business](https://www.outlookbusiness.com/news/trai-sets-firm-deadlines-for-bfsi-entities-to-adopt-1600-series-for-service-transactional-calls)
- DoT FRI: [Sanchar Saathi PDF](https://www.sancharsaathi.gov.in/SancharSaathiDocuments/ImportantDocuments/DoT%20Introduces%20Financial%20Fraud%20Risk%20Indicator%20(FRI)%20to%20strengthen%20Cyber%20Fraud%20Prevention.pdf)
- MuleHunter: [MediaNama](https://www.medianama.com/2025/12/223-rti-23-banks-mulehunter-mule-accounts/)
- Truecaller India launch: [ETV Bharat](https://www.etvbharat.com/en/technology/truecaller-launches-family-protection-feature-in-india-what-is-it-key-features-enn26031304993)
- Google in India: [TechCrunch](https://techcrunch.com/2025/11/20/google-steps-up-ai-scam-protection-in-india-but-gaps-remain)
- Airtel: [Outlook Business](https://www.outlookbusiness.com/corporate/anti-fraud-offensive-led-to-687-drop-in-value-of-financial-losses-airtel)
- WhatsApp bans: [Moneylife](https://moneylife.in/article/whatsapp-banned-9400-accounts-used-for-digital-arrest-scams-in-2026-ag-tells-supreme-court/80326.html)
- Bureau Series B: [Bureau](https://www.bureau.id/blog/bureau-raises-30m-series-b-as-global-fraud-losses-hit-486b)
- Emoha funding: [Inc42](https://inc42.com/company/emoha-elder-care/funding/)
- Bachao.AI: [YourStory](https://yourstory.com/companies/bachaoai)
- UK reimbursement, one year on: [PSR](https://www.psr.org.uk/news-and-updates/latest-news/news/one-year-on-impact-of-app-reimbursement-on-victims/), [Regulation Tomorrow](https://www.regulationtomorrow.com/2026/07/payment-fraud-falls-by-73m-following-psr-reimbursement-scheme/)
- Apate.ai at CommBank: [CommBank](https://www.commbank.com.au/articles/newsroom/2025/06/apate-ai.html)
- Starling call status: [Payment Expert](https://paymentexpert.com/2024/10/31/starling-bank-launches-anti-scam-tool/)
- RBI Sandbox fraud cohort: [RBI](https://website.rbi.org.in/ta/web/rbi/-/press-releases/regulatory-sandbox-fourth-cohort-on-prevention-and-mitigation-of-financial-frauds-exit)
- India Ageing Report 2023: [AffairsCloud](https://affairscloud.com/unfpa-india-and-iips-releases-india-ageing-report-2023/)
- Seniors online: [Data For India](https://www.dataforindia.com/data-bytes/more-pre-teens-in-india-have-used-the-internet-than-people-in-their-40s/)
- Cyber-fraud losses 2025: [Dynamite News](https://www.dynamitenews.com/national/cyber-frauds-mount-to-rs22495-crore-in-2025-over-rs8000-crore-saved-through-rapid-response-system)
