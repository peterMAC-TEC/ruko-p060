# Research 6: Trial methodology for the Ruko feasibility pilot (as of 9 Oct 2026)

This goes deeper than the trial section of `03-behavioural-science-and-ux.md` §5. It covers prior studies, ethics and consent, the outcome scale, the design and statistics, and how to run the sessions in practice. It ends with what the trial software needs.

How to read it:
- Tags: **[PR]** peer-reviewed · **[WP]** working paper · **[Gov]** government · **[NGO]** non-profit · **[News]** press · **[BG]** background knowledge, not re-checked this session · **[Ruko]** a decision proposed here.
- Each claim links to its source. Anything I couldn't verify is listed in §9.
- **The existing code has been checked against this document:** `supabase/migrations/0005_trials.sql` and `lib/trial.ts`. The differences are in §8.

---

## 1. What earlier simulated-scam studies did

| Study | Who and n | Design | Outcome measured | Result | Ethics handling |
|---|---|---|---|---|---|
| **Oliveira et al. 2017 / Lin et al. 2019** (Univ. of Florida) [PR] | 158 people: 100 aged 18–37 and 58 aged 62–89 | 21 days at home; one simulated spear-phishing email a day; cover story of "a study of internet use" | A browser plugin logged clicks; on the last day, people rated how likely they were to click 21 unseen emails (1–5) | **43.3% clicked at least once.** Older women were the most susceptible (4.1% per email). Young people's clicking fell over the 21 days (OR 0.90 per day); **older people's stayed flat** (age × time OR 1.09, p=.03). Older adults were less aware of their own risk. | IRB approved. The true purpose was hidden until a **debrief at the end of the study**, where **99% said they understood why** it was hidden. No distress monitoring is reported. [PMC7274040](https://pmc.ncbi.nlm.nih.gov/articles/PMC7274040), [Enigma 2017 talk](https://www.usenix.org/conference/enigma2017/conference-program/presentation/oliveira) |
| **Scheibe et al. 2014** (Stanford Center on Longevity, with AARP) [PR] | 895 past fraud victims eligible; **511 reached** | Randomised field experiment. A warning call about the same scam or a different scam, made 2 or 4 weeks earlier, versus a control call; then a mock telemarketing pitch (a "federal grant" with a $279 fee) | **A 4-level coding:** unequivocal acceptance, skeptical acceptance, ambivalent refusal, unequivocal refusal. Two raters blind to condition, **κ = .88** | Almost **50% of the control group accepted outright**. Warnings cut outright acceptance (χ²(1)=10.46, p=.001). The same-scam warning **faded by 4 weeks**; the different-scam warning didn't. | IRB approved. **No debrief**, because the authors judged it would do more harm than good. **The call ended as soon as the person accepted the package; no bank details were taken.** Calls averaged about 2 minutes. [PMC4199235](https://pmc.ncbi.nlm.nih.gov/articles/PMC4199235) |
| **Yu et al. 2023, JAMA Netw Open** (Rush and FINRA Foundation) [PR] | 644 people in an ongoing cohort study; average age 85.6 | A fictional "U.S. Retirement Protection Task Force" contacted people by mail, email and phone (a live agent), Oct–Dec 2021 | **3 levels:** didn't engage (68.5%), engaged but was skeptical (15.1%), **converted (16.4%)**. Converting meant engaging without skepticism, confirming personal details, or giving the last 4 digits of their SSN. | People with no cognitive impairment converted too. Cognition, financial literacy and scam awareness predicted vulnerability. | A summary says people were **debriefed afterwards and given a talk on fraud** (not confirmed in the paper itself). [PMC10517371](https://pmc.ncbi.nlm.nih.gov/articles/PMC10517371/), [FINRA Foundation](https://www.finrafoundation.org/node/1901), [summary](https://www.publichealthpost.org/research/seniors-vs-cyber-scammers/) |
| **CeDEx payment-warning experiment** (Akesson, Gathergood & Quispe-Torreblanca 2023) [WP] | 15,888 recruited; **8,958 analysed**; UK adults | 8 payment flows in a mock bank app; 3 payment scenarios each, **1 of them fraudulent**, in random order; paid incentives | Whether the person made the fraudulent payment, **and whether they still made the genuine ones** | Control: 22% paid the scammer and 57% completed genuine payments. Risk-based warning with clear action buttons: **4% and 50%**. | **People were told at the start that some payments might not be genuine.** The authors note this probably makes people more cautious, so the drop in genuine payments is an upper bound. [Paper](https://www.nottingham.ac.uk/cedex/documents/papers/cedex-discussion-paper-2023-08.pdf), [2021 preliminary](https://www.openbanking.org.uk/wp-content/uploads/2021/04/Preliminary-Analysis-Effective-Warning-20210201.pdf) |
| **Hashmi et al. 2023, CHI EA** (LUMS, Pakistan) [PR] | 244 students trained; **100 picked up the simulated call** | Persuasion training versus awareness training (control); then an **unannounced call 8 days later** from a fake "university IT" person asking for their father's name and then a call back | **0, 1 or 2 acts of compliance** (gave the name; called back) | 50 of 100 fell for it; **47.6% (training) vs 55.2% (control), not significant**. They estimated needing 356 people for adequate power. | IRB approved. Mild deception ("a phone-usage study"); **debriefed immediately after the call**. The one South Asian live-call precedent found. [Paper](https://web.lums.edu.pk/~mobin/publications/2023/vishing-CHI23.pdf) |
| **ViKing** (AI vishing bot, 2024) [WP] | 240 online volunteers | Role-play: volunteers acted as a secretary while AI bots called them | Whether they disclosed information, and whether they realised the caller wasn't human | — | The authors call vishing real people **"ethically untenable"** and used a staged scenario instead. [arXiv](https://arxiv.org/pdf/2409.13793) |
| **Uganda "Beera Mubangule"** (IPA/Viamo) [NGO] | **27,162** mobile-money users, randomised | An interactive voice story on basic phones (about 18 min), not live calls | Self-reported fraud losses 6–9 months later, and complaints to the regulator | Losses: 7.1% → 5.7%. **Complaints filed rose 67%.** 93% finished the story. | Not reported. [GASA summary](https://gasa.org/knowledge-base/blog/what-ugandas-ivr-trial-shows-about-practice-based-scam-prevention) |
| **Singapore National Simulated Scams Exercise** (CSA and MHA, Mar–Aug 2026) [Gov] | Opt-in public, plus community groups (e.g. Lions Befrienders) | Robocalls impersonating government officials, made at an unknown time within 6 months | The stated aim is "experiential learning". **No results published yet.** | — | Opt-in registration (consent upfront, surprise timing): the closest model to Ruko's. [CSA press release](https://www.csa.gov.sg/news-events/press-releases/csa-and-mha-launch-national-simulated-scams-exercise-as-part-of-exercise-sg-ready-2026/), [event page](https://www.csa.gov.sg/news-events/events/national-simulated-scams-exercise/) |
| **Bullee et al.; Harris et al.** (vishing) [PR, cited secondhand] | — | Simulated vishing after an awareness campaign; a 3-month advance warning | Compliance | Bullee: the awareness effect **lasted only about a week**. Harris: **a warning 3 months earlier made no difference** to susceptibility. | Cited in [Hashmi et al.](https://web.lums.edu.pk/~mobin/publications/2023/vishing-CHI23.pdf) |
| **India** | — | — | — | **No peer-reviewed Indian study was found** that ran simulated scam calls, or measured susceptibility to digital arrest among older adults (searched I4C, RBI, IIT and IIM). Ruko's pilot would be a first, which is a pitch point, but say "first we could find". | [Lowy Institute](https://www.lowyinstitute.org/the-interpreter/india-s-digital-arrest-scams) notes that Indians report high trust in government (79%), a plausible risk factor. |

**Lessons for Ruko:**
1. **Use an ordinal outcome, not yes/no.** Scheibe used 4 levels, Rush 3 and Hashmi 0–2. Each level must be defined by what the person *did*, and ideally coded by someone who doesn't know the arm (Scheibe: κ=.88).
2. **End the call before anything real is handed over.** Scheibe stopped at "accepted the package"; Ruko stops at the mock bank. Never collect real data.
3. **Measure genuine actions as well as scam actions.** CeDEx's 57% → 50% for genuine payments is the model for Ruko's control calls. Telling people upfront that "some calls may be fake" makes them warier, so **false-alarm rates are an upper bound**. Say so.
4. **Warnings fade.** The effect lasts about a week (Bullee) to 2–4 weeks (Scheibe), and older adults learn less from repeated exposure (Lin 2019). Within one week, carryover between Ruko's two calls is **a real risk**: see §4.
5. **Debrief immediately** (Hashmi), with education (Rush), and check people accept it (Lin: 99%).

---

## 2. Ethics: authorised deception, consent, debrief and distress

### 2.1 What India's rules say

**ICMR National Ethical Guidelines (2017)** [Gov] ([PDF](https://ethics.ncdirindia.org/asset/pdf/ICMR_National_Ethical_Guidelines.pdf)):
- **§5.11 Consent for deception studies:** "a two-step procedure" of initial consent plus "a debriefing after participation". Deception is permitted only with ethics committee (EC) approval, where information must be withheld until the research is complete. Undue influence and intimidation are "to be avoided at all costs".
- **§9.2.9 Studies using deception** need **full committee review**. The study must:
  - pose **no more than minimal risk**;
  - not harm participants' welfare or safety;
  - use deception only when the research can't be done without it;
  - include a debrief plan;
  - share the results with participants.
- **Box 9.5** defines **"authorised deception"**: participants are told beforehand that they will be deceived, but not how. This lets them decide whether to take part on those terms. **This is Ruko's model:** consent upfront, surprise timing, and they aren't told which calls are drills.
- **Table 2.1:** "minor increase over minimal risk" includes "very slight, temporary distress" and psychological discomfort. A frightening role-played call **sits at or just above minimal risk**, so the safeguards in §2.4 aren't optional.
- **Box 6.2 / §6.9:** cognitively impaired people and people with "diminished autonomy due to dependency" are vulnerable groups. **Recruiting your own grandparents or classmates' parents is a dependency relationship**, so someone other than the relative should take consent where possible.
- **Box 9.4 (§9.2.6):**
  - Researchers must watch for "cultural symbols of refusal" (silence, monosyllabic replies, restlessness) and **must not continue** when they see them.
  - Under "relational autonomy", an elder may want to ask family before agreeing. Allow time for that.
- **§2.2:** for an illiterate participant, a literate **impartial witness** signs.

**An honest gap.** ICMR expects EC review for deception studies, and a solo hackathon pilot almost certainly has none. **[Ruko]** Options, in order of preference:
1. Ask a college or school EC, or a partner NGO's EC, for an expedited review before 17 Oct.
2. Get a written protocol review from an independent senior person (a doctor, psychologist or social worker; Nightingales staff are ideal) and name them.
3. At minimum, follow everything here and **state openly in the pitch: "Feasibility pilot run under ICMR 2017 principles; not formally EC-approved."**

Never claim an approval you don't have.

**The DPDP Act 2023 and Rules 2025** [Gov]:
- The Rules were notified on 13 Nov 2025 and are phased in. **The main obligations (notice, consent, security, erasure) apply from about 13 May 2027** ([Deccan Herald](https://www.deccanherald.com/amp/story/india%2Fcentre-notifies-dpdp-rules-implementation-planned-in-phases-spread-over-12-18-months-3798465)).
- The research exemption (s.17(2)(b) / Rule 16) needs Second Schedule standards and **no decisions about individuals** ([Rule 16](https://dpdpa.com/dpdparules/rule16.html), [Second Schedule](https://dpdpa.com/schedule/schedule2.html)).
- Neither strictly binds an October 2026 pilot, but **[Ruko] follow the Act anyway**, since banks will ask. That means:
  - a notice per purpose;
  - consent that can be withdrawn;
  - only the data needed;
  - erasure on request;
  - a fixed deletion date.

**Background on authorised deception:**
- In a randomised test, authorised-deception consent **didn't weaken the effect, hurt recruitment or retention, or cause harm**, and most participants preferred it ([Martin & Katz 2010, Pain](https://yorkspace.library.yorku.ca/xmlui/handle/10315/7987)) [PR].
- CeDEx's "some payments may not be genuine" is the same idea.

### 2.2 Consent wording outline (English master; read aloud in Hindi or Kannada; one page plus a teach-back)

1. **Who we are:**
   - "I am [name], a student building Ruko for a competition. This is not a bank, the police or the government."
   - Name the ethics review, or say plainly that there isn't one.
2. **Why:** "We want to learn whether Ruko helps people notice fake 'police' or 'officer' calls and stop before sending money."
3. **What happens:**
   - "Between [18] and [24 Oct], in hours you choose, you will get 3–4 calls. **Some will be practice scam calls and some will be ordinary calls. We will not tell you which, or exactly when.** That is how we see what happens in a real surprise."
   - "Some calls happen during my visits on a tablet. One will be a real phone call to your phone."
4. **What a practice scam call is like:**
   - "A made-up office, 'Central Investigation Cell – DRILL'. A computer voice and a cartoon caller. It may sound strict and say you are in trouble. **That can feel stressful for a moment.**"
5. **Your safety rules** (also printed on a card):
   - **Say "RUKO" or hang up at any time. The call ends at once.**
   - Practice calls only ever use the **practice bank screen** we set up. **We will never ask you to open your real bank app or UPI, or to share a real OTP, card number, Aadhaar or password.** If anyone ever asks for those, **it is not us**: hang up and call your family or 1930.
   - Every practice call ends with the words "This was a Ruko practice drill". I will call you from my number [shown] within 5 minutes.
6. **Family:**
   - "Please name one family member. They will know the study dates, not the call times, and may get practice alerts marked DRILL."
   - The family member gives their own consent.
7. **Risks and benefits:**
   - Risks: a few minutes of worry or embarrassment.
   - Benefits: practice, a safety card, and your feedback shapes the tool. A small thank-you gift (not money that could sway the decision).
8. **What we record:**
   - The steps you reached, times, button taps, and your answers to short questions.
   - **No audio or video recording. No transcripts kept. No real bank details.**
   - You are "P07". The list linking your name to P07 stays on paper with me and is **destroyed by [30 Nov 2026]**.
9. **Your choices:**
   - Taking part is voluntary. You can stop at any time without giving a reason.
   - You can ask us to **delete your results up to [26 Oct]**.
   - Results are shown only as group numbers on 28 Oct. No names, faces or voices.
10. **Separate yes/no boxes:**
    - (a) the one real phone call;
    - (b) practice alerts to my family member;
    - (c) photos or video for the demo (**a separate consent**; default no);
    - (d) contact me for future studies.
11. **Contacts:**
    - the facilitator's phone;
    - an independent adult contact;
    - the Elders' Helpline **1090** (Bengaluru City Police with Nightingales Medical Trust);
    - **1930** and **cybercrime.gov.in**.
12. **Teach-back** (all 3 must be correct; re-explain up to twice; otherwise don't enrol):
    - "What will happen in the next week?" (Surprise practice calls.)
    - "How do you stop a call?" (Say RUKO or hang up.)
    - "Will a practice call ever ask you to use your real bank or OTP?" (No.)
13. **Signatures:** the participant (an impartial witness if they can't read), the facilitator, and the date. **Store the consent version** (e.g. `trial-consent-v1-en`).

### 2.3 Debrief scripts

**A. Immediate debrief (after every call, 3–5 min, in person or a call back within 5 min):**
1. "**This was a Ruko practice call.** It's [name]. **You are safe.** No money moved, and nothing has happened to your bank account or your name."
2. "These calls are written to fool anyone. Doctors, officers and engineers fall for real ones. **You did nothing wrong.**" Say this whatever they did; never "how could you".
3. "How are you feeling right now?" Show the 5 faces (§3.3).
4. One neutral question: "What made you decide to [stop / carry on]?" Note their answer as a code; don't argue.
5. **The same safety line for everyone, after every call:** "Remember: **police never arrest or question anyone on a phone or video call.** If anyone asks you to move money on a call, hang up and call family or 1930."
   - This is the same for both arms and both orders, so it doesn't bias the comparison. Safety comes before purity.
6. If more calls are due: "There may be more calls this week. **RUKO always ends them.**"
7. "Please don't tell other people in the study about the calls until [24 Oct]." Neighbours in the same housing society (RWA) talk to each other.

**B. Full debrief (final visit, 15–20 min):**
1. Reveal everything:
   - which calls were practice scams and which were ordinary;
   - why we didn't say when;
   - why Ruko was switched off for some calls.
2. Show **their own path** (their furthest step per call), kindly. Start with what they did well.
3. Teach the 3 rules plus actions:
   - No officer arrests anyone on a call.
   - Nobody genuine asks you to "move money to verify it".
   - Fear plus secrecy plus hurry means a scam.
   - **Actions:** hang up, call family on a number you know, then 1930 or cybercrime.gov.in.
4. Give them the printed safety card. Help them save 1930 in their phone.
5. **Ask about the deception** (a feasibility measure):
   - "How do you feel about not being told when the calls would come?" (fine / a bit uneasy / upset)
   - "Would you take part again?"
6. **Offer data withdrawal again**, especially if they're unhappy with the deception.
7. Debrief the family member. Give the thank-you gift.
8. **Check-in call 48 hours later** ("Any worries since?").

### 2.4 Distress and stop protocol

**Before enrolling, exclude anyone who:**
- has diagnosed dementia or cognitive impairment, or fails the teach-back;
- has been told by a doctor to avoid stress (heart conditions, anxiety disorder);
- **was a real scam victim in the last 12 months** (risk of reliving it);
- can't hear phone calls well enough;
- is recently bereaved or in a crisis.

**Limits on the script itself:**
- At most **12 minutes** per call.
- No threats to family members or children.
- No warrant showing their real name or ID.
- No "lock yourself in a room".
- No video of the person.
- Isolation demands are spoken only and end with the call.

| Level | Signs | What the facilitator does |
|---|---|---|
| **Any** | They say RUKO, ask to stop, or ICMR refusal cues (silence, restlessness) | **End the call at once** with the drill line. Log `ended_by = stop_word` or `facilitator_safety`. |
| **1 Mild** | Visibly worried, shaky voice; face 4 on the scale | End the call, do the immediate debrief, sit with them, offer water, check the face again after 10 min. Offer to skip the remaining calls. |
| **2 Moderate** | Crying, panic ("my heart", "I'll be jailed"), not back to their starting face within 15 min, or **they start acting in the real world** (opening their real bank app, heading to a bank or ATM, calling real police) | **Intervene at once** (call them or step in): "STOP. This is the Ruko practice." Stay with them and call their named family member. **No more calls for this person.** Keep their data only if they agree. Follow up the next day. |
| **3 Severe** | Chest pain, breathlessness, fainting, confusion | **Call 112 or 108** and the family. Stay with them. Record a serious adverse event. |

**Study-wide stop rules:**
- **Any serious adverse event pauses the whole study.**
- **2 or more moderate events** mean revising the script's intensity before continuing.
- Every event goes on the dashboard's feasibility panel.

---

## 3. Outcome measures

### 3.1 The "furthest step reached" scale (scam calls)

Both scam scripts must reach their milestones **in the same order**:
opening → accusation → secrecy/isolation demand → "verification" request → money instruction → bank → payee and amount → pay → follow-up demand.

The levels are defined by **observable acts**. The bank and Ruko events are logged automatically.

| Level | Name | Crisp definition (tick the highest that happened) | How it's detected |
|---|---|---|---|
| **0** | Ended at once | Hung up, said RUKO, or refused **before the accusation was finished** (about the first 60 s) | Manual tick plus `call_ended` |
| **1** | Heard the accusation, then ended | Stayed past the accusation, then ended or refused; agreed to nothing and shared nothing | Manual |
| **2** | Complied with control | **Agreed** to stay on the line, keep it secret, not tell family, or move to a "video statement", but did nothing more | Manual (an explicit "yes / theek hai" to the demand) |
| **3** | Disclosed | **Read out the on-screen "DRILL verification code"** (a fake stand-in for an OTP), or started giving account or ID details. *The facilitator logs "disclosed" only, never the values.* | Manual, or the drill UI logs `code_read` |
| **4** | Went to pay | Opened the practice bank, or said they would go to the bank or ATM | Bank event `bank_opened` |
| **5** | Started payment | Entered a payee **or** an amount | `payee_entered` / `amount_entered` |
| **6** | Pressed Pay | Pressed Pay / Send (**the same act in both arms**). Baseline: the mock money moves. Ruko: a warning, hold or approval fires. | `pay_pressed` |
| **7** | Persisted | After the first payment or block: **obeyed the follow-up demand**. Baseline: a second "security deposit" payment. Ruko: pressed "pay anyway", retried, asked family to approve under the caller's coaching, or switched to another route (cash, another app). | `override_attempt` / second `pay_pressed` |

Derived binary outcomes, **[Ruko] pre-specified:**
- **Primary (north star): `stopped_before_pay` = level ≤ 5.** This is a behavioural act that is **identical in both arms**. It answers "did the person stop before transferring?"
- **Secondary (system): `money_moved`** = a completed mock transfer. Baseline: level ≥ 6. Ruko: only if a hold was overridden. This credits the bank hold. It is **favourable to Ruko by design**, because the hold can't be released during a call, so always report it next to the primary, never alone.

**Coding rules:**
- Tick live. Levels 4–7 come from app events.
- If unsure between two levels, **code the level that is worse for Ruko's case**: the higher level in the Ruko arm, the lower level in the baseline arm.
- Every manual change to a level is logged with a reason.
- If a calm second person (e.g. the family member, who doesn't know the arm) can listen to a few calls, compare their codes (Scheibe's κ approach). Otherwise, state that the facilitator wasn't blind to the arm.

### 3.2 Control (genuine) calls: what counts as a false alarm

The controls must be **genuinely benign and verifiable**:
- **K1:** a "Practice Bank" branch reminding them to update KYC *at the branch*, with no link, OTP or money.
- **K2:** a courier confirming a delivery time, with nothing to pay.
- *K3 "relative asks for help"* only if **the real enrolled relative makes the call** from their own number. A stranger's voice claiming to be a relative is a voice-clone scam pattern, so flagging it would be *correct*. Spoofing a real contact was barred by a USENIX review board (see 03 §5).

| Code | Meaning | Counts as |
|---|---|---|
| C0 | Completed normally | OK |
| C1 | Completed **after checking** (called back on a known number, asked family) | OK, and good behaviour |
| C2 | Refused or hung up on a genuine request, with no system alarm | **Personal over-suspicion** |
| C3 | **Ruko said STOP or caution, a family alert fired, or a bank hold fired** on a genuine call | **System false alarm** (Ruko arm only) |

- **Primary false-alarm metric:** C3 among Ruko-arm controls.
- C2 in either arm measures **"drill paranoia"**, the generalised suspicion caused by the study itself.

### 3.3 Secondary measures

| Measure | Definition | When |
|---|---|---|
| **Time to stop (s)** | From `answered` to the first stop act (hang-up, RUKO, a clear refusal, the STOP screen's "End call", the bank's Cancel). If they never stopped, record it as censored at the call's end. Also **time from the first money demand to the stop**. | Auto timestamps plus manual |
| **What stopped them** | One primary reason plus everything that fired: self · Ruko check (the verdict) · STOP screen · family (alert acknowledged / they called family) · bank warning/hold · trusted-person approval · RUKO word · facilitator safety · technical failure | Auto events plus a post-call question |
| **Belief and confidence** | "While the call was going on, did you think it was real?" (yes / not sure / no). "How sure were you of what you did?" (1–5) | Straight after the call, **before** the debrief chat |
| **Distress** | A **5-face scale** (1 calm … 5 very upset), simplified from the single-item Distress Thermometer. A Distress Thermometer adapted for older care-home residents tracked depression and problem counts ([Elliott 2011](https://pubmed.ncbi.nlm.nih.gov/21547747/)) [PR]. The 5-face version itself is **not validated**; say so. | At the start of the session, after the call, and after the debrief. **Trigger: 4 or more, or a rise of 2 or more** → §2.4 |
| **Self-efficacy** | "How confident are you that you could spot and stop a fake police call?" (1–5) | At intake and at the final visit |
| **Prior awareness** | "Had you heard of 'digital arrest' before?" A strong moderator: 9% vs 34% losses ([FINRA](https://www.finrafoundation.org/exposed-to-scams)) | At intake |
| **Usability** | **Must:** 3 questions read aloud: "Was it easy to ask Ruko 'Is this a scam?'" (7-point, [SEQ style](https://measuringu.com/seq10/)); "Would you keep Ruko on?"; "Would you tell a friend?" **Optional:** the 10-item **SUS**, read aloud with 5-face answer cards. SUS is the most used tool with older adults (e.g. a mean of 76.3 in 30 older adults using Zoom, [study](https://telerehab.hpu.edu/index.php/Telerehab/article/view/6750)), but it's tiring for some. | After the Ruko block |
| **Feasibility** (CONSORT pilot) | Approached → eligible → consented; teach-back passed first time; calls delivered as planned; technical failures; distress events; drop-outs; data completeness; acceptance of the deception | Throughout |

---

## 4. Design and statistics for n = 10

### 4.1 The design: counterbalanced 2-arm crossover in blocks

- Each person has **2 blocks**: Baseline (Ruko off) and Ruko (Ruko on). Each block contains **1 scam call and 1 control call**, so 4 calls per person.
- **Block order is counterbalanced:** 5 people baseline-first (AB) and 5 Ruko-first (BA).
- Why controls sit inside each arm: Ruko's false-alarm rate has to come from **Ruko-arm controls**. Today's plan has controls with no arm (§8).
- **The washout** between blocks is **at least 48 hours** plus the other block's control call.
- **Two matched scam scripts** are used for the measured calls:
  - **S-A:** "Central Investigation Cell – DRILL": an Aadhaar-linked money-laundering case → digital arrest → "move funds to the Central Verification Account".
  - **S-B:** "a customs parcel with drugs" → transferred to the "Cyber Cell (DRILL)" → digital arrest → "security deposit".
  - They must have the same milestones, timings and pressure. **Pilot both on 2 non-participants before 18 Oct.**
  - The other scripts (TRAI, electricity, courier) stay as practice drills and demo material, to keep noise down.
- **The real phone call is the block-2 scam for everyone.**
  - This is a safety reason: the facilitator has already seen how the person copes with an in-person drill before an unaccompanied call at home.
  - It also balances the channel across arms automatically: AB → the Ruko call is real; BA → the baseline call is real. Record `channel` anyway.
- **"Ruko off" in BA:** the drill and the practice bank render in standard mode (plain confirm, no hold, no family alert), and the app shows "Ruko paused". The person still *knows* Ruko, which is the carryover in §4.2.

**Assignment table.** Generate a random permutation of P01–P10 → rows before enrolment, log the seed, and reveal each row only after consent and teach-back are saved. A replacement participant takes the same row as the person they replace.

| Row | Order | Call 1 | Call 2 | ← ≥48 h, Ruko setup (AB) or pause (BA) → | Call 3 | Call 4 |
|---|---|---|---|---|---|---|
| 1 | AB | S-A · Baseline · tablet | K1 · Baseline | | **S-B · Ruko · ☎ phone** | K2 · Ruko |
| 2 | AB | K1 · Baseline | S-B · Baseline · tablet | | K2 · Ruko | **S-A · Ruko · ☎** |
| 3 | AB | K2 · Baseline | S-A · Baseline · tablet | | K1 · Ruko | **S-B · Ruko · ☎** |
| 4 | AB | S-B · Baseline · tablet | K2 · Baseline | | **S-A · Ruko · ☎** | K1 · Ruko |
| 5 | AB | S-A · Baseline · tablet | K2 · Baseline | | **S-B · Ruko · ☎** | K1 · Ruko |
| 6 | BA | K2 · Ruko | S-A · Ruko · tablet | | K1 · Baseline | **S-B · Baseline · ☎** |
| 7 | BA | S-B · Ruko · tablet | K2 · Ruko | | **S-A · Baseline · ☎** | K1 · Baseline |
| 8 | BA | K1 · Ruko | S-A · Ruko · tablet | | K2 · Baseline | **S-B · Baseline · ☎** |
| 9 | BA | K1 · Ruko | S-B · Ruko · tablet | | K2 · Baseline | **S-A · Baseline · ☎** |
| 10 | BA | S-A · Ruko · tablet | K2 · Ruko | | **S-B · Baseline · ☎** | K1 · Baseline |

How it balances:
- Each script appears **5 times in each arm**.
- K1 and K2 each appear 5 times per arm.
- Scam-first (S-K-S-K) for 5 people and control-first (K-S-K-S) for 5. Control-first gives a **naive false-alarm reading** before any drill.
- The real call is 5 Ruko and 5 baseline.
- All 10 rows are different.

**If time runs short, use 3 calls:** drop the *baseline-arm* control and keep the Ruko-arm control, because that's the false-alarm metric.

### 4.2 Learning and carryover: name them, limit them, measure them

| Threat | Direction | Mitigation | How to check |
|---|---|---|---|
| **Forewarning from call 1** (the end-of-call drill reveal, the debrief and the safety line all warn about the next call; Scheibe: a warning lasts weeks) | AB: **inflates Ruko**. BA: inflates the baseline (against Ruko). | Counterbalance; different scripts in each block; the same safety line for everyone | **Period effect:** compare (baseline − Ruko) between AB and BA. A big difference means carryover. |
| **Education doesn't wear off** (in BA, the baseline comes *after* Ruko's onboarding) | Against Ruko | Accept it and report it: BA's baseline means "knows Ruko, tool off" | **First-period-only comparison** (5 vs 5, between people, uncontaminated): descriptive only |
| **"Drill paranoia"** (people suspect every call after the first drill) | For Ruko on scams, and **raises false alarms** | Control calls in both blocks; surprise timing inside a wide window | C2 rate before vs after the first scam |
| **Neighbours tell each other** | Unclear | Ask for silence until 24 Oct; stagger start dates within an RWA | Ask at the final debrief: "Had anyone told you about the calls?" |
| **The facilitator isn't blind** | For Ruko | Levels 4–7 auto-logged; the "worse for Ruko" coding rule; second coder where possible | Report it as a limitation |

**The alternative some reviewers prefer:** baseline-first for everyone (a pre-post design). It's simpler and gives a clean baseline, but every gain is mixed up with practice. **[Ruko]** Use the counterbalanced table above, and show the AB and BA results separately as well as pooled.

### 4.3 Analysis: pre-specified, done in `lib/trial.ts`

Report it as a **feasibility pilot** ([CONSORT pilot extension, Eldridge 2016, BMJ 355:i5239](https://doi.org/10.1136/bmj.i5239)):
- The title says "pilot".
- The objectives are feasibility questions.
- Include a flow diagram.
- Give estimates with CIs. **Tests are exploratory.**
- Report harms.
- State the progression criteria. Proposed: ≥8/10 complete all calls; ≥90% of calls delivered as scripted; 0 serious and ≤1 moderate distress events; ≥8/10 find the deception acceptable; ≥95% of logger fields complete.
- **Show every person's data.**

Register the outcomes before 18 Oct: commit this section plus the code with a timestamp, or use a free OSF registration [BG].

The paired 2×2 table for scam calls (k = stopped before pay):

|  | Ruko: stopped | Ruko: didn't stop |
|---|---|---|
| **Baseline: stopped** | a | c |
| **Baseline: didn't stop** | b | d |

So b = Ruko helped and c = Ruko hurt. The stop rates are p_R = (a+b)/n and p_B = (a+c)/n.

**1. Wilson 95% CI for k/n** (use it for every percentage on the dashboard), with z = 1.959964 and p̂ = k/n:

```ts
const d = 1 + z*z/n;
const centre = (p̂ + z*z/(2*n)) / d;
const half = (z/d) * Math.sqrt(p̂*(1-p̂)/n + z*z/(4*n*n));
// CI = [max(0, centre-half), min(1, centre+half)]
```

**2. Clopper–Pearson (exact) 95% CI.** Show it next to Wilson as the conservative one. Find the bounds by bisection on the binomial CDF:
- lower p_L solves P(X ≥ k | n, p_L) = 0.025 (0 if k = 0);
- upper p_U solves P(X ≤ k | n, p_U) = 0.025 (1 if k = n).

Reference values for n = 10 (checked in Node):

| k/10 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Wilson % | 0–27.8 | 1.8–40.4 | 5.7–51.0 | 10.8–60.3 | 16.8–68.7 | 23.7–76.3 | 31.3–83.2 | 39.7–89.2 | 49.0–94.3 | 59.6–98.2 | 72.2–100 |
| Clopper–Pearson % | 0–30.8 | 0.3–44.5 | 2.5–55.6 | 6.7–65.2 | 12.2–73.8 | 18.7–81.3 | 26.2–87.8 | 34.8–93.3 | 44.4–97.5 | 55.5–99.7 | 69.2–100 |

**3. McNemar on the discordant pairs** (b, c), with m = b + c and k = min(b, c):
- **Exact conditional:** p = min(1, 2·Σ_{i=0..k} C(m,i)·0.5^m).
- **Mid-p** (recommended by [Fagerland, Lydersen & Laake 2013](https://www.doi.org/10.1186/1471-2288-13-91) [PR]; it never exceeded the nominal level in 9,595 scenarios):
  - mid-p = 2·[Σ_{i=0..k} C(m,i)·0.5^m − 0.5·C(m,k)·0.5^m];
  - if b = c, mid-p = 1 − 0.5·C(m,b)·0.5^m.
- **Pre-specify the exact p as primary and show the mid-p beside it.**

| b–c | 4–0 | 5–0 | 6–0 | 6–1 | 7–0 | 7–1 | 8–1 |
|---|---|---|---|---|---|---|---|
| exact p | .125 | .0625 | .031 | .125 | .016 | .070 | .039 |
| mid-p | .0625 | .031 | .016 | .070 | .008 | .039 | .021 |

**4. 95% CI for the paired difference** p_R − p_B (Newcombe's hybrid score "method 10" [BG]):
- Get Wilson limits (l₁, u₁) for p_R and (l₂, u₂) for p_B.
- φ = (a·d − b·c) / √((a+b)(c+d)(a+c)(b+d)), with φ = 0 if the denominator is 0. D = p_R − p_B.
- Lower = D − √((p_R−l₁)² − 2φ(p_R−l₁)(u₂−p_B) + (u₂−p_B)²)
- Upper = D + √((u₁−p_R)² − 2φ(u₁−p_R)(p_B−l₂) + (p_B−l₂)²)
- Check value: a=3, b=5, c=0, d=2 → D = 0.50, CI 0.144 to 0.699.

**5. Wilcoxon signed-rank (exact) on the ordinal scale:**
- dᵢ = baseline_level − ruko_level (positive means Ruko kept them earlier). Drop zeros and rank |dᵢ| with average ranks for ties.
- W⁺ = the sum of ranks where dᵢ > 0, and T = the sum of all ranks.
- Exact two-sided p = (the number of the 2^m sign patterns with |W − T/2| ≥ |W⁺ − T/2|) / 2^m. Enumerating handles ties exactly.
- **Effect size:** the matched-pairs rank-biserial r = (W⁺ − W⁻)/T.
- Check value: diffs (5,3,1,2,4,0,1,5,0,3) → m = 8, W⁺ = 36, p = .0078, r = 1.

**6. Also report:**
- the false-alarm rate (C3 in Ruko-arm controls) as k/n with both CIs;
- the C2 rate per arm;
- median (IQR) time to stop per arm;
- what fired, as counts;
- **the AB vs BA split**, plus first-period-only descriptives;
- splits by `family_present`, by `channel` and by prior awareness: **descriptive only.**

**Honest power statement:**
- With 10 pairs, the exact McNemar only reaches p < .05 if **at least 6 people change and all change in Ruko's favour** (5–0 gives p = .0625).
- A stop rate of 8/10 still has a CI of 44–97%.
- The pilot's value is the **effect-size estimate, the ordinal shift, the false-alarm ceiling and the feasibility data** for a bank-sized trial. It is not a significance claim.

---

## 5. Running it in Bengaluru

### 5.1 Recruitment (until 17 Oct)

**Who:**
- aged 60 or over, living in Bengaluru, with their own mobile phone;
- has made a UPI or net-banking payment, or has a family member who does;
- can follow a phone call in English, Hindi or Kannada.

**Aim for a mix:** at least 4 women, at least 3 people aged 70+, and at least 3 who haven't heard of "digital arrest".

**Where to find people:**

| Channel | Why | Notes |
|---|---|---|
| **RWA WhatsApp groups**, through the RWA secretary | Fastest; gatekeeper permission first (ICMR Box 9.4 "gatekeeper consent") | Stagger start dates so neighbours don't compare notes |
| **Nightingales Medical Trust**: Elders' Helpline **1090**, run with Bengaluru City Police since 2002 (180k+ calls by 2018) | Credibility, plus a **referral route for distress**; ideal independent reviewer | [Better India](https://www.thebetterindia.com/97720/elder-abuse-helpline-bengaluru/), [helpline listing](https://findahelpline.com/organizations/elders-helpline-nightingales-medical-trust). Its hours are reported inconsistently, so verify them. |
| **Dignity Foundation** day-care centre (Vijayanagar), which also runs a 24×7 elder helpline | Elders who gather regularly, plus staff support | [Annual report 2024](https://www.dignityfoundation.com/wp-content/uploads/2024/11/Annual-Report-2024_DF_v8.pdf) |
| **HelpAge India**, Bengaluru office (Lal Bagh Road) | Agecare programmes and day-care links | [Wikipedia](https://en.wikipedia.org/wiki/HelpAge_India); confirm the current contact |
| Places of worship (community halls), morning-walk groups (Lalbagh, Cubbon Park), pensioners' associations, a co-operative bank branch | Reach people who aren't in RWAs | [BG]; the bank branch doubles as a pilot-partner pitch |
| Own grandparents, classmates' families | Easy to reach | **A dependency relationship (ICMR §6.9):** have someone else take consent, and watch for silent refusal |

**What to say when recruiting:** "Help test a free tool that helps elders stop fake police calls. About 2½ hours over one week, with a small thank-you gift."

### 5.2 Timeline per person, and the 18–24 Oct calendar

| When | What | Length |
|---|---|---|
| **Visit 0** (13–17 Oct) | Consent, teach-back, intake (age band, awareness, phone/UPI use, lives alone, starting face and self-efficacy), family member's consent; **BA rows: Ruko onboarding** | 45–60 min |
| **Block 1** (from 18 Oct) | 2 calls: the tablet call during a "let's check the app" visit (the tablet rings partway through), and the control. Immediate debrief after each. | Visit about 40 min |
| Gap of ≥48 h | **AB rows: Ruko onboarding visit** (20 min); BA rows: "Ruko paused" | — |
| **Block 2** | Control (in a visit or by phone) + **the real phone call at home**, at a surprise time within the consented hours | About 30 min of contact |
| **Final visit** (by 24 Oct) | Full debrief, usability questions, deception acceptability, data-withdrawal offer, safety card, gift | 20–30 min |
| +48 h | Check-in call | 5 min |

- That's about 2.5 hours per person, so about 25 hours of contact for 10 people, plus travel.
- **Start 3–4 people per day** on 18–19 Oct so everyone finishes by 24 Oct.

### 5.3 Running the surprise real call safely

- **Only inside the window** the person chose. Skip their no-call times (meals, prayer, rest).
- **Never** while they're likely to be driving or out on the street. If they say they're busy, the "caller" says they'll call back, and the call is rescheduled.
- **The facilitator operates the caller** (scripted dialogue on the laptop through Phone Link) and listens live the whole time, with the §2.4 stop protocol open on screen.
- **The drill announcement** opens the call if no family member is present (as DECISIONS requires), and **always closes it**. The facilitator calls back from their known number within 5 minutes.
- **Hard stop if the person moves towards real money:** opening their real bank or UPI app, saying they'll go to the bank or ATM, or giving real numbers. End the call and intervene immediately.
- The practice bank and Ruko are on their phone (installed at Visit 0). Bank events carry the `trial_call_id`, so levels 4–7 are logged without anyone watching.
- **The family member gets "DRILL"-tagged alerts.** They know the dates but not the times, and are asked not to tip the elder off.

### 5.4 Facilitator checklist (print one per call)

**Before:**
- [ ] row and call number match the plan; arm set in the logger
- [ ] script S-A, S-B, K1 or K2 loaded
- [ ] Ruko on or paused as planned
- [ ] the practice bank linked to this call
- [ ] inside the person's window
- [ ] the family contact number to hand
- [ ] stop protocol open
- [ ] the starting face recorded (in-person calls)

**During:**
- [ ] tap the milestones live (L0–L7)
- [ ] note anything unexpected
- [ ] end at 12 minutes, at RUKO, or at any distress sign

**After:**
- [ ] drill line said
- [ ] immediate debrief (A1–A7)
- [ ] faces after the call and after the debrief
- [ ] belief and confidence
- [ ] what stopped them
- [ ] level confirmed, with a reason if changed manually
- [ ] deviations and technical failures noted
- [ ] adverse-event level 0–3
- [ ] next call no earlier than the washout allows

### 5.5 What to record and what not to

| Record (pseudonymous, code P01–P10) | Never record |
|---|---|
| Row, order, arm, script, channel, timestamps of events, level, stop reasons, faces, confidence, usability, feasibility counts, deviations, adverse events | **Names, phone numbers or addresses in the trial tables** (the code-to-name key stays on paper or in one offline file) |
| Age **band**, gender, language, phone type, UPI use, lives alone, prior awareness, family present | **Audio, video or transcripts** of any call; real bank, UPI, Aadhaar, OTP or card details; photos without the separate consent |
| `seeded = false` and the consent version on every real row | Free-text notes containing digits or names (the logger should warn) |

**Retention:**
- Delete a withdrawn person's rows on request until 26 Oct.
- Destroy the name key by 30 Nov 2026.
- After that, only anonymous, aggregate data stays.

---

## 6. How to word the results (for 28 Oct)

> "Feasibility pilot, 10 adults aged 60+ in Bengaluru, 18–24 Oct 2026, run under ICMR 2017 principles [EC status]. Without Ruko, **X/10** stopped before pressing pay (Wilson 95% CI …). With Ruko, **Y/10** (…). Paired difference … (95% CI …), exact McNemar p = … (exploratory). On the 8-step scale, the median moved from … to … (Wilcoxon p = …). Ruko raised a false alarm on **Z/10** genuine calls (…). No serious adverse events; **N/10** said the surprise design was acceptable. Order effects: AB … vs BA … Small sample; not proof of effect; it sizes the next trial."

Always show the 10 individual paths (a slope chart). It's the most honest and the most persuasive view.

---

## 7. Sources

- **Simulated-scam precedents:**
  - Lin et al. 2019 ([PMC7274040](https://pmc.ncbi.nlm.nih.gov/articles/PMC7274040)); Oliveira ([Enigma 2017](https://www.usenix.org/conference/enigma2017/conference-program/presentation/oliveira))
  - Scheibe et al. 2014 ([PMC4199235](https://pmc.ncbi.nlm.nih.gov/articles/PMC4199235); [Stanford](https://longevity.stanford.edu/forewarning-reduces-fraud-susceptibility-in-vulnerable-consumers))
  - Yu et al. 2023 ([PMC10517371](https://pmc.ncbi.nlm.nih.gov/articles/PMC10517371/))
  - CeDEx ([paper](https://www.nottingham.ac.uk/cedex/documents/papers/cedex-discussion-paper-2023-08.pdf))
  - Hashmi et al. 2023 ([PDF](https://web.lums.edu.pk/~mobin/publications/2023/vishing-CHI23.pdf))
  - ViKing ([arXiv](https://arxiv.org/pdf/2409.13793))
  - Uganda IVR ([GASA](https://gasa.org/knowledge-base/blog/what-ugandas-ivr-trial-shows-about-practice-based-scam-prevention))
  - Singapore NSSE ([CSA](https://www.csa.gov.sg/news-events/press-releases/csa-and-mha-launch-national-simulated-scams-exercise-as-part-of-exercise-sg-ready-2026/))
- **Ethics and law:**
  - [ICMR 2017 guidelines](https://ethics.ncdirindia.org/asset/pdf/ICMR_National_Ethical_Guidelines.pdf) (§5.11, §9.2.6 Box 9.4, §9.2.9 Box 9.5, Box 6.2, §6.9, Table 2.1, §2.2)
  - [Martin & Katz 2010](https://yorkspace.library.yorku.ca/xmlui/handle/10315/7987)
  - [DPDP Rule 16](https://dpdpa.com/dpdparules/rule16.html), [Second Schedule](https://dpdpa.com/schedule/schedule2.html), [phasing](https://www.deccanherald.com/amp/story/india%2Fcentre-notifies-dpdp-rules-implementation-planned-in-phases-spread-over-12-18-months-3798465)
- **Statistics and reporting:** [Fagerland 2013](https://www.doi.org/10.1186/1471-2288-13-91); [CONSORT pilot extension](https://doi.org/10.1136/bmj.i5239)
- **Measures:** [Distress Thermometer for the Elderly](https://pubmed.ncbi.nlm.nih.gov/21547747/); [SUS with older adults](https://telerehab.hpu.edu/index.php/Telerehab/article/view/6750); [SEQ](https://measuringu.com/seq10/); [FINRA Exposed to Scams](https://www.finrafoundation.org/exposed-to-scams)
- **Bengaluru partners:** [Nightingales 1090](https://www.thebetterindia.com/97720/elder-abuse-helpline-bengaluru/); [Dignity Foundation](https://www.dignityfoundation.com/wp-content/uploads/2024/11/Annual-Report-2024_DF_v8.pdf); [HelpAge India](https://en.wikipedia.org/wiki/HelpAge_India)

---

## 8. How the code compares with this document (checked 9 Oct)

`0005_trials.sql` and `lib/trial.ts` already have most of this: pseudonymous `participants`, `trial_calls` with `furthest_step` 0–7, `stopped_by`, Wilson, Clopper–Pearson, exact McNemar and the exact Wilcoxon. The differences:

1. **The primary outcome is reversed.**
   - The code's `isProtected` (≤6, "money didn't move") is labelled primary, and `stoppedBeforeSend` (≤5) secondary.
   - Level 6 ("pressed send, held") can only happen in the Ruko arm. Baseline jumps from 5 to 7. So the primary favours Ruko **by construction**.
   - **Recommend:** make `stoppedBeforeSend` (≤5) primary, with level 6 = "pressed Pay (either arm)" and level 7 = "persisted / follow-up payment". Add a separate `money_moved` boolean.
2. **The scale order differs:** code 2 = details, 3 = complied with secrecy; here 2 = complied, 3 = disclosed. Either works **only if both scripts put the milestones in that order**. Pick one and make the scripts match.
3. **Controls have no arm** (`arm = 'control'`), so Ruko's false-alarm rate can't be separated from the person's own suspicion.
   - **Recommend:** controls carry `arm` baseline/ruko with `is_scam = false`.
   - Replace `participant_refused` with `control_outcome` C0–C3.
4. **`planFor`** fixes S-C-S-C for everyone and rotates 5 scripts. **Recommend** the 10-row table in §4.1: 2 matched scripts, arm-tagged controls, mixed within-block order, the real call in block 2.
5. **Missing fields:**
   - participants: `row`, `gender`, `prior_awareness`, `teachback_passed`, `teachback_attempts`, `self_efficacy_pre/post`, `deception_acceptable`, `withdraw_data`
   - calls: `block`, `period`, `ended_by` (as distinct from `stopped_by`), `interventions[]`, `t_money_ask_s`, `belief_real`, `stress_pre/post/after_debrief` (only one `stress` today), `adverse_event_level`, `deviation`, `level_edit_log`, `facilitator_in_room`, `call_capped`
6. **Statistics to add:** McNemar **mid-p**; the Newcombe paired-difference CI; the rank-biserial r; AB-vs-BA and first-period summaries.

---

## 9. Not verified this session

- Whether the Rush/JAMA paper itself describes a debrief (only a secondary summary says so).
- CeDEx's ethics wording.
- Exact per-group n in Scheibe.
- The full CONSORT pilot item list, including the "progression criteria" item numbers.
- Newcombe 1998 (method 10 is from memory; the formula was checked numerically, not against the paper).
- That 108 (ambulance) and 112 (emergency) are current in Bengaluru [BG].
- Whether the 1090 helpline is 24×7 today.
- Pensioners' associations and park walking groups as recruitment routes.
- The DPDP Act section-by-section commencement dates (only the Rules' phasing was confirmed).
- No Indian simulated-scam study was found, but the search wasn't exhaustive (Google Scholar not searched).

---

## Top 10 implications for Ruko's trial software

1. **Primary outcome = `stopped_before_pay` (level ≤ 5), the same act in both arms.** Show `money_moved` as a separate, clearly labelled system outcome. Change `isProtected` / `stoppedBeforeSend` in `lib/trial.ts` and their dashboard labels.
2. **Use the scale with definitions:** 0 Ended at once · 1 Heard the accusation, ended · 2 Complied with control · 3 Disclosed (DRILL code) · 4 Went to pay · 5 Started payment · 6 Pressed Pay · 7 Persisted. The `SCALE` constant should carry `short`, `long` and a `detectedBy` field (manual / bank event). Both scripts must emit the milestones in this order.
3. **`trial_calls` fields to add:** `block`, `period`, `call_type` (scam/control) with **controls carrying the arm**, `ended_by`, `interventions[]`, `t_money_ask_s`, `belief_real`, `stress_pre/post/after_debrief`, `control_outcome` (C0–C3), `adverse_event_level` (0–3), `deviation`, `facilitator_in_room`, `call_capped`, `level_edit_log` (who, when, from → to, why).
4. **`participants` fields to add:** `row` (1–10), `order` (AB/BA), `gender`, `prior_awareness`, `teachback_passed` and `attempts`, `self_efficacy_pre/post`, `deception_acceptable`, `would_repeat`, `withdraw_data`, `consent_flags` (real call / family alerts / photos / recontact).
5. **An append-only `trial_events` table** fed automatically by the drill UI, the practice bank and the Ruko app, keyed by `trial_call_id`: `answered`, `accusation_done`, `isolation_ask`, `code_read`, `bank_opened`, `payee_entered`, `amount_entered`, `pay_pressed`, `warning_shown`, `hold_placed`, `cancel_pressed`, `override_attempt`, `ruko_check_opened`, `verdict`, `stop_screen_shown`, `family_alert_sent`, `family_ack`, `stopword`, `ended`. The furthest level and time to stop are **derived** from these, with manual override.
6. **A facilitator "live call" screen** (phone-width, works offline with a local queue):
   - a big running timer and L0–L7 milestone buttons;
   - stop-reason chips;
   - distress buttons (Mild / Moderate / Severe), each opening the matching protocol step;
   - a red **"End now + drill line"** button;
   - a 12-minute cap warning.
7. **An allocation and schedule screen:**
   - the 10-row table from §4.1, pre-generated from a logged seed;
   - each row revealed only after consent and teach-back are saved;
   - the per-person call plan with checkboxes;
   - **the ≥48 h washout enforced** (it blocks scheduling the next block early);
   - each person's call window and no-call times.
8. **Arm switching:** the drill UI, the practice bank and the Ruko layer read `arm` from the active trial call. Baseline = plain confirm, no hold, no family alert, and "Ruko paused" shown. Ruko = full flow. Family alerts in trials carry a **DRILL** tag.
9. **The results dashboard**, with a banner reading **"FEASIBILITY PILOT · REAL TRIAL DATA (n = …)"**, or "SEEDED DEMO DATA" when seeded. It needs:
   - the headline k/10 per arm with Wilson **and** Clopper–Pearson CIs;
   - the paired 2×2 table (a, b, c, d);
   - exact McNemar p **and mid-p**;
   - the Newcombe CI for the difference;
   - a stacked bar of levels per arm;
   - a **10-line slope chart** (each person, baseline → Ruko);
   - Wilcoxon p and rank-biserial r;
   - the false-alarm rate (C3 in Ruko-arm controls) with CI, and the C2 rate per arm;
   - median time to stop;
   - what-fired counts;
   - **AB vs BA and first-period** panels;
   - splits by family_present, channel and prior awareness (labelled descriptive);
   - a feasibility panel (CONSORT flow counts, distress and adverse events, deviations, completeness against the progression criteria).
10. **Privacy and integrity built in:**
    - only codes in trial tables;
    - a free-text check that warns on digits or names;
    - no audio or transcript storage paths at all;
    - deleting a withdrawn participant's data removes their rows from every table;
    - an "analysis locked at …" timestamp plus the hash of the pre-registered outcomes shown on the dashboard;
    - CSV export;
    - `scripts/check-trial.ts` unit tests against the reference values here: 8/10 → CP 44.4–97.5 and Wilson 49.0–94.3; McNemar 5–0 → exact .0625 / mid-p .031; Newcombe (3,5,0,2) → 0.144–0.699; Wilcoxon example → p = .0078.
