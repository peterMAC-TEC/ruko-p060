# Ruko field test: role-played scam calls with 10 older adults and their families

**Card P060 build expectation:** test the intervention with ten older adults and their families using role-played scams.
**North star:** the share of role-played scam calls where the person **stops before transferring**.

This page is the whole protocol on one page. Use it to run the sessions. The detail behind each choice (ethics, statistics, sources) is in [research/06-trial-methodology.md](research/06-trial-methodology.md). The facilitator's keystrokes are in [TRIAL_RUNBOOK.md](TRIAL_RUNBOOK.md). The scripts themselves are in `app/data/drill-scripts.json`, with the research behind them in [research/07-scam-call-scripts.md](research/07-scam-call-scripts.md).

## 1. The design in one paragraph

- **Who:** 10 adults aged 60 or over in Bengaluru, each with one family member (their "Ruko Family" contact).
- **Calls:** each person gets **4 calls in 2 blocks**, at least 48 hours apart.
  - Each block has **1 practice scam call and 1 ordinary (genuine) call**.
  - One block is **without Ruko** (the baseline) and one is **with Ruko**. The order follows a fixed allocation table: 5 people start without Ruko and 5 start with it.
- **During the call:** the practice phone shows a practice bank. Money can only "move" there.
- **What we measure:** whether the person **stops before pressing Pay**. That is the north star.
- **False alarms:** the genuine calls tell us how often Ruko warns when nothing is wrong.
- **Wording:** report it as a **feasibility pilot**, not a proof.

## 2. Roles

| Person | What they do |
|---|---|
| **Participant** (the older adult) | Uses the practice phone as they would their own. They can say **"RUKO"** or hang up at any time. |
| **Family member** | Consents separately. Knows the study dates, but not the call times. Receives the practice alerts (marked DRILL) on their own phone (`/family`), and calls back as they would for real. **This call-back is the intervention.** |
| **Facilitator** (you) | Runs `/lab` on the laptop and reads, or plays, the "officer". Ticks how far the call got, runs the debrief and watches for distress. Never acts as the participant's family. |

## 3. Consent script (read aloud; a printed copy is signed)

Read it in the person's language. The Hindi lines for the safety rules are below. Take separate consent from the family member.

> 1. I am [name], a student building Ruko, a safety app, for a competition. I am not from a bank, the police or the government. [Name the ethics reviewer, or say: "This study has not been formally reviewed by an ethics committee."]
> 2. We want to learn whether Ruko helps people notice fake "police" or "officer" calls and stop before sending money.
> 3. Over the next week you will get **4 calls**. **Some are practice scam calls and some are ordinary calls. I won't tell you which, or exactly when.** That's how we see what happens in a real surprise.
> 4. A practice scam call comes from a made-up office, the "Central Investigation Cell – DRILL". It may sound strict and say you are in trouble. That can feel stressful for a moment.
> 5. **Your safety rules:**
>    - Say **"RUKO"** or hang up at any time, and the call ends at once.
>    - We will **never** ask you to open your real bank app or UPI, or to share a real OTP, card number, Aadhaar or password. If anyone ever asks for those, it is not us. Hang up and call your family or **1930**.
>    - Every practice call ends with "This was a Ruko practice drill", and I will call you within 5 minutes.
> 6. Please name one family member. They will know the dates, not the times, and their phone may get practice alerts marked DRILL.
> 7. **What we record:** the steps you reached, times, and button taps. **No audio, no video, no transcripts, no real bank details.** You are a code (P01–P10). The paper list linking your name to your code is destroyed by 30 Nov 2026.
> 8. **About Ruko's AI check:** in the with-Ruko calls you may press "Tell me what they said" or "Show me a photo". The words, the voice clip or the picture go to Google's Gemini AI to be read, and Ruko itself keeps none of them. Please don't show real documents during practice.
> 9. Taking part is voluntary. You can stop at any time, and ask us to delete your results until 26 Oct. Results are shown only as group numbers.
> 10. Separate yes/no boxes: (a) one real phone call to your own phone; (b) practice alerts to my family member; (c) photos or video for the demo (default **no**); (d) contact me for future studies.

**Teach-back** (all three must be right; re-explain up to twice; otherwise don't enrol):
1. "What will happen this week?" (Surprise practice calls.)
2. "How do you stop a call?" (Say RUKO or hang up.)
3. "Will a practice call ever ask you to use your real bank or OTP?" (No.)

**Hindi safety lines:**
- कभी भी "रुको" बोलिए या फ़ोन रख दीजिए, कॉल तुरंत बंद हो जाएगी।
- हम कभी आपका असली बैंक ऐप, UPI, OTP, कार्ड नंबर, आधार या पासवर्ड नहीं माँगेंगे।
- अगर कोई माँगे, तो वह हम नहीं हैं: फ़ोन रखिए और परिवार को या 1930 पर फ़ोन कीजिए।

## 4. The scripts

All callers are fictional ("Central Investigation Cell – DRILL"): no real agency names, badges, logos or officers (BNS §204). Every script opens with a drill disclosure in the consent window, and the stop word "RUKO" ends it.

| Id | Kind | What happens | Stages |
|---|---|---|---|
| `scam_digital_arrest` | **Measured scam** | Officer: your Aadhaar is linked to a money-laundering case; you are under "digital arrest"; stay on video, tell no one, move savings to a "safe account" for verification | open → hook → fake proof → fear → isolate → secrecy → pivot to money → transfer → pressure |
| `scam_courier_drugs` | **Measured scam** | Courier: a parcel in your name held at the airport with drugs; the call is "transferred to police"; then the same money demand | same milestones |
| `control_bank_kyc` | **Measured control** | The practice bank reminds you to update KYC **at the branch**. No link, no OTP, no money. | open → hook → close |
| `control_courier_delivery` | **Measured control** | A courier confirms a delivery time, with nothing to pay | open → hook → close |
| `scam_courier_aadhaar`, `scam_telecom_disconnect`, `scam_electricity_cut` | Practice or demo only | Other common scripts | — |
| `control_relative_favour`, `control_power_outage` | Practice only | The relative's-favour call is only used when **the real enrolled relative** makes it from their own number | — |

The two measured scams reach the same milestones in the same order, so "how far did they get" means the same thing in both.

## 5. Running one call (facilitator)

1. **Set up:** run the app on the laptop (`npm run dev -- -p 3200`), open `/lab`, enrol the person (code, age band, consent and teach-back ticked) and open their **phone link** on the practice phone. The family member opens `/family` on their own phone.
2. **Before the call:** record mood (5 faces), language and channel. Open the caller screen. For a with-Ruko call, Ruko is on the practice phone; for a baseline call it shows "paused".
3. **The call:** read the script line by line (Space = next, H = hesitation line, E = end). Tick levels 0–3 as they happen. Levels 4–7 are filled in by the practice phone itself.
4. **Distress:** use the Mild, Moderate or Severe button. Severe ends the call; call 112/108 and the family. Any serious event pauses the whole study, and 2 moderate ones mean softening the scripts.
5. **After the call:** ask "Did you think it was real?" **before** the debrief. Then debrief (section 7), record mood again and save. For genuine calls, code C0–C2. C3 (a Ruko false alarm) is set automatically.

## 6. How the north star is measured

**Furthest step reached** on each scam call (the same observable acts in both arms):

| Level | What happened | Stopped before transferring? |
|---|---|---|
| 0 | Ended at once (hung up, said RUKO, refused) before the accusation finished | **Yes** |
| 1 | Heard the accusation, then ended or refused | **Yes** |
| 2 | Agreed to stay on the line or keep it secret, nothing more | **Yes** |
| 3 | Read out the on-screen DRILL code (a stand-in for an OTP) | **Yes** |
| 4 | Opened the practice bank, or said they'd go to the bank | **Yes** |
| 5 | Entered a payee or an amount | **Yes** |
| 6 | Pressed **Pay** | No |
| 7 | Obeyed a follow-up demand (a second payment, "pay anyway", another route) | No |

- **North star = stopped before transferring = level ≤ 5.**
  - With Ruko: stopped calls ÷ with-Ruko scam calls.
  - Without Ruko: the same, for the baseline calls.
  - The headline is the with-Ruko share next to the baseline share, for the same 10 people.
- **Coding rule:** if unsure between two levels, tick the one that is worse for Ruko.
- **Secondary:** "money moved" (a completed mock transfer). This credits the bank hold, so it is always shown next to the primary, never alone.
- **False alarms:** the share of with-Ruko **genuine** calls where Ruko warned, alerted the family or held a payment (C3). C2 (the person refused a genuine call by themselves) measures study-induced suspicion in both arms.
- **Also recorded:** the time from the first scam line to the stop, whether the family member called back, and mood before and after.
- **Where to read it:** `/results`. It shows the north star with exact intervals, the paired with/without table (McNemar), a slope chart per person, false alarms, carryover and feasibility, plus a CSV export. With 10 people, a significant difference needs at least 6 people to change, all towards Ruko, so report it as feasibility.

## 7. Debrief (after every call, the same for everyone)

1. "This was a Ruko practice call. You are safe. No money moved, and nothing happened to your bank account or your name."
2. "These calls are written to fool anyone. You did nothing wrong." Say this whatever they did.
3. "How are you feeling?" (5 faces.) "What made you decide to stop / carry on?" (Note a code; don't argue.)
4. The same safety line for everyone: "**Police never arrest or question anyone on a phone or video call.** If anyone asks you to move money on a call, hang up and call family or 1930."
5. "Please don't tell others in the study about the calls until 24 Oct."

At the final visit: reveal which calls were practice and which genuine, show them their own path kindly, and give them the safety card.

## 8. What is recorded, and what isn't

- **Recorded:** the code (P01…), age band, levels with timestamps, what the practice phone did, mood, and corrections with a reason.
- **Never recorded:** names, phone numbers, audio, video or transcripts. The AI check stores signal codes only, never the words or the photo.
- **Withdrawal** keeps finished calls. **Erase** deletes the person, every call and their practice account.

## 9. Checklist per call (print one each)

- [ ] Consent version noted, teach-back passed, family member consented
- [ ] Practice phone on its home screen; with-Ruko or baseline as the allocation says
- [ ] Family member's `/family` screen open with sound on (with-Ruko calls)
- [ ] Mood before
- [ ] Levels ticked live; "Did you think it was real?" asked before the debrief
- [ ] Debrief read; mood after; saved
- [ ] Next block at least 48 h later
