# Ruko: competitor scan (9 Oct 2026)

Short version: **the big players now cover the family-alert and in-call-warning ideas, for free.** What nobody we found does is measure whether an intervention actually stops elders before money moves, or give banks an elder-friendly cooling-off and trusted-person flow for the rules RBI is proposing. That's where Ruko should stand.

## Direct overlaps

| Who | What it does | Overlap with Ruko | Gap Ruko can use |
|---|---|---|---|
| **Truecaller Family Protection** (global Dec 2025; India launch reported Mar 2026) | Up to 5 people in a family group with one admin. The admin gets a real-time alert when a member is on a call Truecaller flags as fraud, and on Android can **end that call remotely**. Shared block lists. **Free.** | Very high: this is our Family Safety Circle, with a huge spam database and call permissions behind it. | Flags calls by **number reputation**. It's unclear whether it covers WhatsApp/Skype **video** calls, which is how digital arrests usually run. It does nothing at the bank, and nothing once the scammer uses a fresh number. |
| **Google Android in-call scam protection** (piloting in India with Google Pay, Paytm, Navi) | If you're **screen-sharing on a call with an unsaved number** and open a finance app, a full-screen warning appears with one-tap "end call", then a **30-second pause**. Android 11+. | High for the "call signal + bank app" idea. | Only triggers on screen-sharing; digital-arrest victims are coached verbally, often without screen-sharing. It doesn't involve family, and doesn't cover iPhone. |
| **Quick Heal AntiFraud.AI** | Alerts on suspicious calls, links and scam attempts. | Medium (the voice check). | A general antivirus add-on, not elder-first or family-first. |
| **ScamMukt** (Project Bear Corp) | Phishing-site and fake-login warnings, ₹50/month billed annually. | Low (links, not calls). | Not about calls or officer impersonation. |
| **WhatsApp** | Expanding AI detection of people impersonating law enforcement and misusing official logos. | Medium, on the channel itself. | Platform-side only; nothing for the family or the bank. |

## Bank side and regulation

- **RBI discussion paper (April 2026, proposals only, final rules pending):**
  - a **1-hour cooling period** on person-to-person UPI/IMPS transfers above ₹10,000
  - **trusted-person approval** for people aged 70+ on transfers above ₹50,000
  - a ₹25 lakh annual cap on incoming UPI credits
  - a UPI "kill switch"

  If adopted, **every bank and UPI app must build an elder cooling-off and trusted-person flow.** That's exactly Ruko's bank-side friction plus the family circle. *Verify the wording on rbi.org.in before quoting it.*
- **RBI MuleHunter.AI / Digital Payment Intelligence Platform:** flags mule accounts (the receiving side). It complements Ruko rather than competing.
- **BioCatch** (global vendor): behavioural biometrics inside bank apps; a top-4 Australian bank reportedly detects 66% of voice scams with it. It's enterprise-priced and invisible to the family.

## Training and drills

- **Adaptive Security:** a free course (Mar 2026, 14 languages) on AI voice-clone and deepfake scams for older adults. It's unclear whether it includes live simulated calls.
- **OpenAI + AARP:** educational videos and resources.
- **We found no product that runs consented, role-played scam calls and measures the stop rate.** Ruko's simulator and results dashboard are the clearest open space.

## Elder-account monitoring (US)

- **EverSafe:** watches linked bank accounts for unusual activity and alerts "trusted advocates" within 24 hours. That's after the money moves; Ruko acts before it does.

## What this means for Ruko

1. **Don't pitch the family circle as the innovation.** Truecaller ships it free. Pitch it as one part of a measured, bank-integrated system, and expect judges to ask "How is this different from Truecaller?"
2. **Lead with the measurement**, which is the hackathon's own mechanic (agent safety and testing): "We ran consented scam drills with 10 elders. Without Ruko X/10 stopped; with Ruko Y/10." Nobody else publishes that.
3. **The business is probably banks, not families.**
   - Families get Truecaller and Google for free.
   - Banks may soon be *required* to run cooling periods and trusted-person approval for 70+ customers, and need a tested, elder-friendly way to do it.
   - Ruko can be that kit: the risk API, the cooling-off screens, family co-approval, the fraud desk and the drill-based testing.
4. **Cover the gaps the big players leave:** video-call digital arrests, verbal coaching without screen-sharing, and Indian-language voice guidance for the elder.
5. **Consider renaming "Family Safety Circle"**, since Truecaller's launch coverage uses "safety circle" language.

## Sources
- Truecaller Family Protection: [Cision release](https://news.cision.com/truecaller-ab/r/truecaller-launches-family-protection-to-protect-the-whole-family-from-phone-scams,c4278406) · [Croma](https://www.croma.com/unboxed/truecaller-family-protection-feature-lets-you-stop-scam-calls-in-real-time-on-behalf-of-others) · [ETV Bharat (India launch)](https://www.etvbharat.com/en/technology/truecaller-launches-family-protection-feature-in-india-what-is-it-key-features-enn26031304993)
- Google in-call protection: [Google blog](https://blog.google/security/android-expands-pilot-in-call-scam-protection-financial-apps/) · [Croma](https://www.croma.com/unboxed/android-warning-screensharing-finance-apps-call)
- Quick Heal: [Digital Terminal](https://digitalterminal.in/trending/quick-heal-warns-consumers-as-digital-arrest-scams-become-more-sophisticated-in-2026)
- ScamMukt: [Business Standard (press release)](https://www.business-standard.com/amp/content/press-releases-ani/scammukt-launches-india-s-dedicated-ai-scam-protection-app-because-spotting-a-scam-is-now-a-basic-survival-skill-for-every-indian-126052900802_1.html)
- RBI proposals: [Poonawalla Fincorp explainer](https://poonawallafincorp.com/blogs/financial-insights/rbi-upi-1-hour-cooling-off-rule-explained) · [CAclubindia](https://www.caclubindia.com/articles/how-rbi-plans-to-stop-digital-fraud-in-india-with-new-rule-2026-55081.asp)
- BioCatch: [case studies](https://www.casestudies.com/company/biocatch)
- Adaptive Security: [Protecting older adults](https://www.adaptivesecurity.com/protecting-older-adults)
- EverSafe: [eversafe.com](https://www.eversafe.com/?p=11783)
