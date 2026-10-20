# Ruko pilot: facilitator runbook

How to run the feasibility pilot with the trial lab. The method, ethics and statistics are in `research/06-trial-methodology.md`, and the scripts are in `research/07-scam-call-scripts.md` (`data/drill-scripts.json`). This page covers only the steps.

## What you need
- **The laptop:** run `npm run dev -- -p 3200`. Open **http://localhost:3200/lab** in Chrome; it works best for the voice.
- **The participant's phone:** on the same Wi-Fi, it opens `http://<laptop IP>:3200/…`.
  - Find the laptop's IP with `ipconfig`. It was 10.182.58.133 on 9 Oct.
  - Tapping works fully. The phone's microphone (Ruko's voice answers) needs https, so tapping is the way in sessions.
- **For the real call:** the block-2 scam goes out through Phone Link + VB-Cable, as chosen on 8 Oct. The caller screen's sound is routed into the call.
- **Printed for every call:** the consent form, the debrief sheet and the distress protocol (doc 06 §2.2–2.4).

## Before the first session (by 17 Oct)
1. Pilot both measured scam scripts (`scam_digital_arrest`, `scam_courier_drugs`) on two non-participants.
2. Decide on ethics review (doc 06 §2.1).
   - Deception studies normally need an ethics committee.
   - Either get an independent reviewer, or state in the pitch that the study was not formally approved.
3. Freeze the outcomes: commit `lib/trial.ts` and doc 06 §3–4 with a timestamp. This is the pre-registration.
4. On `/lab`, switch to **Illustrative** and press **Remove**, or keep it, since it's labelled. Real and seeded data never mix.

## Each person
1. **Consent and teach-back** (on paper).
2. **Enrol on `/lab`.**
   - Fill in age band and the intake questions.
   - Tick both boxes: consent on file, teach-back passed.
   - Enrolling reveals their **allocation row**, which sets the order of the 4 calls (doc 06 §4.1).
   - Rows are handed out in a fixed random order, seed `20261018`.
3. **Phone link:** press it and open the link on their phone. The phone becomes a **practice phone** with Sahyog Bank, Ruko, Messages and Phone.
4. **For each call,** open it from their card.
   1. Ask how they feel (5 faces), set the language and channel, and open the **caller screen** in a second window. Press **Ready**.
   2. Put their phone back on its home screen. Press **Start call**. The caller screen rings and they choose whether to answer.
   3. Read the script:
      - **Space** = next line, **H** = the hesitation line, **E** = end.
      - Tick levels 0–3 as they happen. Levels 4–7 fill in from the phone automatically: opening the bank, entering payee or amount, pressing Pay, a second payment.
      - If they read out the DRILL code shown in their Messages, tick **3**.
      - If unsure between two levels, tick the one that is **worse for Ruko**.
   4. **Distress:** the Mild/Moderate/Severe buttons. Severe ends the call.
      - **RUKO: stop now** ends it at once.
      - So does the person saying "RUKO" (heard by the caller screen in Chrome) or hanging up.
   5. **After the call:**
      - Ask "did you think it was real?" *before* the debrief.
      - Record distress, then debrief using the script line.
      - Record distress again, then save.
      - For genuine calls, code C0–C2. C3 (a Ruko false alarm) is set automatically.
5. **Block 2** is at least **48 hours** later. The console warns you if it's sooner.

**Practice PIN:** every practice payment asks for the UPI PIN **1234** (shown on the PIN pad). With Ruko on, a live scam pattern first shows a 30-second pause screen.

## What is recorded, and what isn't
- **Recorded:** codes (P01…), age band, the answers above, levels with timestamps, what the practice phone did, and any corrections with your reason.
- **Never recorded:** names, phone numbers, audio, video or transcripts. The notes box warns if you type a number.
- **Withdrawal:** keeps finished calls. **Erase** deletes the person, every call and their practice account.

## Results
- `/results` shows the north star with exact intervals: "stopped before pay", with vs without Ruko.
- It also shows the paired table, McNemar (exact and mid-p), the Newcombe CI, a slope chart per person, false alarms, carryover checks and feasibility.
- **CSV** exports every call for analysis elsewhere.
- Report it as a **feasibility pilot**. With 10 people, p < .05 needs at least 6 people to change, all towards Ruko.

## Quick test without a participant
1. On `/lab`, enrol a test person.
2. Open their **Phone link** in a second browser tab, and the caller screen in a third.
3. Run a call.
4. When you're done, press **Erase** on the test person, then open `/lab/device/clear` to reset that browser.
