# Ruko (P060): questions before we build

> **Answered on 8 Oct 2026. The answers are in `docs/DECISIONS.md`, which is the source of truth.**

**How to answer:** put an `x` in the box you pick, like `- [x]`, or write after **Answer:**. Skip any question you don't care about, and I'll use the option marked *(my default)*. Save the file and tell me "done".

---

## A. Housekeeping

**A1. The old Policy X-Ray files in this folder.** The original is safe in `claud 2/ai-hackathon-solo/`.
- [ ] Delete them from this folder; I approve *(my default)*
- [ ] I'll delete them myself with the command you gave
- [ ] Move them into an `_old-policy-xray/` subfolder instead

**A2. Have you placed your bet on P060 on the ForgeX site?**
- [ ] Yes, it's mine
- [ ] Not yet, but I will today
- [ ] Not yet, and I'm still deciding

**A3. Why the switch from P056?** This tells me what to protect against.
- [ ] P056 was taken
- [ ] I like P060 more
- [ ] Someone (a mentor or classmate) advised it
- **Answer:**

**A4. Who wrote the master prompt?**
- [ ] Me, with an AI
- [ ] A mentor or organiser gave it to me
- [ ] Downloaded or shared by someone else
- **Answer:** Is it a strict spec, or a starting point I can cut down?

---

## B. Time, team and the event

**B1. Team.**
- [ ] Solo *(my default)*
- [ ] With teammates. **How many, and what are their skills?**

**B2. Hours a day you can give this.**
- [ ] Under 2
- [ ] 2–4 *(my default)*
- [ ] 4–8
- [ ] More than 8

**B3. Key dates.** These set the whole schedule.
- Build phase starts: **Answer:**
- Build phase ends / submission: **Answer:**
- Demo or judging day: **Answer:**

**B4. How is it judged?**
- [ ] Live demo on stage
- [ ] Recorded video
- [ ] Judges try the product themselves
- [ ] Don't know yet
- How long is the pitch? **Answer:**

**B5. Do judges care more about real trial results or a polished product?**
- [ ] Real results (the north-star number)
- [ ] The product
- [ ] Both equally *(my default)*
- [ ] Don't know

---

## C. The 10 older adults (the north star depends on this)

**C1. Who will you test with?** Tick all that apply.
- [ ] My own parents or grandparents
- [ ] Forge classmates' parents or grandparents
- [ ] Neighbours or a residents' association
- [ ] A senior-citizens' group or club
- [ ] Other: **Answer:**

**C2. How confident are you of getting 10?**
- [ ] Sure
- [ ] Probably, with effort
- [ ] 5 or fewer is realistic

**C3. Where are they?**
- [ ] Mostly in Bengaluru, so I can be in person
- [ ] Spread across cities, so remote
- [ ] A mix

**C4. Languages they're most comfortable in.** Tick all that apply.
- [ ] Hindi
- [ ] English
- [ ] Kannada
- [ ] Tamil
- [ ] Telugu
- [ ] Malayalam
- [ ] Marathi
- [ ] Bengali
- [ ] Other: **Answer:**

**C5. Their phones.**
- [ ] Mostly Android
- [ ] Mostly iPhone
- [ ] Mixed
- [ ] Some have basic phones only (no smartphone)

**C6. Do they use UPI or net banking themselves?**
- [ ] Most do
- [ ] Some do
- [ ] Few do; family handles money

**C7. Has anyone you'll test with been scammed or nearly scammed?** The safety rules exclude recent victims, people with memory problems and people with heart conditions.
- [ ] No
- [ ] Yes. **Answer:** (no names needed)

---

## D. The drill: how the role-played scam reaches them

This is the biggest decision. It decides the cost, the legal risk and how real the test feels.

**D1. How should the role-played scam call reach the elder?**
- [ ] **In the browser or app:** they open a link and the "officer" talks to them there. No phone network, cheapest, safest. *(my default)*
- [ ] **A real phone call** to their number through Twilio/Exotel. Feels real, but costs more, needs caller-ID care and is a bigger consent issue.
- [ ] Both: browser for practice, a real call for one final test

**D2. Video or voice only?** Real digital-arrest scams use video calls with fake uniforms.
- [ ] Voice only *(my default; no fake uniforms or badges, which keeps us clear of BNS §204)*
- [ ] A voice plus a simple animated or illustrated caller, not a real person
- [ ] Discuss with me

**D3. How much do they know beforehand?** The brief requires consent.
- [ ] They consent upfront: "sometime this week you'll get a practice scam." The exact time is a surprise. *(my default)*
- [ ] They know the exact time
- [ ] A family member schedules it and is present

**D4. Is a family member present during the drill?**
- [ ] Yes, always *(my default for safety)*
- [ ] Nearby or on call, not in the room
- [ ] No

**D5. Experiment design.** The prompt wants each person to get a scam call **without Ruko** (baseline), then one **with Ruko**, plus harmless "control" calls to measure false alarms. That's 3–4 calls per person.
- [ ] Fine, do the full design
- [ ] Too many. Keep it to 2 calls each (one without, one with) *(my default)*
- [ ] Simpler: just one call with Ruko, and compare against a written quiz
- **Answer:** Days needed between calls?

**D6. Which scam scripts?** Tick all you want.
- [ ] "CBI digital arrest" *(must have)*
- [ ] Customs parcel with drugs
- [ ] Courier/FedEx + Aadhaar misuse
- [ ] TRAI: "your number will be cut off"
- [ ] Electricity bill disconnection
- [ ] Other: **Answer:**

**D7. Can the scam script say "CBI", "police" or "customs"?** It won't use real officer names, badges or logos either way.
- [ ] Yes, generic agency names are fine in a consented drill *(my default)*
- [ ] No, use made-up agency names
- [ ] Ask a mentor first

---

## E. What to build (scope)

The master prompt has 4 parts. At 2–4 hours a day, solo, all 4 at full depth is a lot.

**E1. Rank them from 1 (must have) to 4 (cut first).**
- [ ] Ruko App: the "Is this call real?" voice check — rank: **_**
- [ ] Family Safety Circle: alerts to family — rank: **_**
- [ ] Bank-side friction: mock transfer, cooling-off screen, fraud console — rank: **_**
- [ ] Scam simulator and test lab: AI scammer, trial logging, results dashboard — rank: **_**

**E2. Minimum you'd be happy demoing.**
- [ ] The simulator + results dashboard + family alert *(my default; this proves the north star)*
- [ ] All 4, even if shallow
- [ ] Other: **Answer:**

**E3. Earlier idea from the analysis:** an elder takes a practice call while family watches a live "pressure meter", then a cinematic debrief explains every trick that was used. Keep this?
- [ ] Yes, blend it in (pressure meter + debrief) *(my default; it's the most visual part)*
- [ ] No, stick to the master prompt
- [ ] Discuss

**E4. App type.**
- [ ] Web app that installs on the phone (PWA) only *(my default)*
- [ ] Also a native Android app (Expo) for real call detection; adds days

**E5. Real family alerts during trials?**
- [ ] Yes, real SMS and calls to family members
- [ ] On screen only (the family member's phone shows the alert in the app) *(my default; free and reliable)*
- [ ] SMS only

---

## F. Accounts, keys and money

**F1. Which do you already have?** Tick all that apply.
- [ ] Anthropic API key
- [ ] Vercel (petermac-tec)
- [ ] Supabase
- [ ] Vapi or Retell
- [ ] Sarvam AI
- [ ] ElevenLabs
- [ ] Deepgram
- [ ] Twilio
- [ ] Exotel
- [ ] MSG91
- [ ] None of the voice/phone ones yet

**F2. Total budget for paid services during the hackathon.**
- [ ] ₹0, only free tiers
- [ ] Up to ₹2,000
- [ ] Up to ₹5,000 *(my default; the analysis estimated under ₹3,000)*
- [ ] More: **Answer:**

**F3. Whose card pays for services?**
- [ ] Mine
- [ ] Mesa / the programme gives credits
- [ ] Don't know

**F4. Is a database needed?** It stores trial results and consents.
- [ ] Supabase as the prompt says *(my default)*
- [ ] Keep it simpler
- [ ] Don't mind, you choose

---

## G. Look and feel

**G1. Product name.**
- [ ] Ruko *(my default)*
- [ ] Something else: **Answer:**

**G2. Mood.**
- [ ] Calm and trustworthy, like a bank or health app
- [ ] Cinematic and dramatic, like the Bean & Beyond sites
- [ ] Calm for the elder's screens, dramatic for the demo and dashboard *(my default)*

**G3. Default language on the elder's screens.**
- [ ] Hindi first, English toggle
- [ ] English first, Hindi toggle
- [ ] Their own language (from C4) first

**G4. Apps or sites whose look you like.** **Answer:**

---

## H. Demo day

**H1. Who plays the elder on stage?**
- [ ] A real participant (with consent)
- [ ] A classmate or friend
- [ ] Me
- [ ] Recorded video only

**H2. Live AI call on stage?**
- [ ] Yes, live, with a backup video *(my default)*
- [ ] Recorded only; too risky live

**H3. The business story you'll pitch.**
- [ ] Banks and insurers pay (friction + family alerts as a white-label kit) *(the master prompt's choice)*
- [ ] Families pay a small subscription
- [ ] Don't care for the hackathon; focus on the north star

---

## I. Anything else

**I1. Lines I must never cross,** beyond the safety rules in the master prompt. **Answer:**

**I2. Anything from the master prompt you disagree with?** **Answer:**

**I3. Anything you want that isn't in it?** **Answer:**
