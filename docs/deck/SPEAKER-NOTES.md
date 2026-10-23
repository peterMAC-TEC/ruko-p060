# Ruko pitch deck: speaker notes

Open https://ruko-seven.vercel.app/deck in Chrome or Edge. F = fullscreen, P = presenter view (notes, timer, next slide), → / space = next, ← = back, M = motion level, R = restart. A slide can be opened directly: /deck#9.

Totals: 3-minute live pitch 3:00 · Loom walkthrough 6:00 (includes a live demo on slide 7).

## 1. 1 Problem

- **3-minute pitch:** 25 s (from 0:00)
  > Ruko means 'stop'. This is how the scam starts: 'This is the CBI. Your Aadhaar is linked to a crime. Do not hang up. Do not tell your family.' Older adults are kept on video for hours until they transfer their savings. Families find out after the money is gone.
- **Loom:** 35 s (from 0:00)
  > Ruko means 'stop'. This is how the scam starts: 'This is the CBI. Your Aadhaar is linked to a crime. Do not hang up. Do not tell your family.' Older adults are kept on video for hours until they transfer their savings. Families find out after the money is gone.

## 2. 2 Current state

- **3-minute pitch:** 20 s (from 0:25)
  > Today's workflow: the call, fear, isolation, the transfer, and the family finds out days later. The help that exists comes too late: awareness campaigns, and 1930 after the loss. Nobody steps in before the money moves.
- **Loom:** 30 s (from 0:35)
  > Today's workflow: the call, fear, isolation, the transfer, and the family finds out days later. The help that exists comes too late: awareness campaigns, and 1930 after the loss. Nobody steps in before the money moves.

## 3. 3 Opportunity

- **3-minute pitch:** 20 s (from 0:45)
  > Digital-arrest complaints doubled in a year, to 1,23,672 in 2024: about 340 a day, with about ₹1,935 crore lost. Senior citizens filed over a lakh fraud complaints in 2025 and lost about ₹4,005 crore. Early 2025 data suggests a fall, so awareness helps; we think AI voices could reverse it, which is our hypothesis.
- **Loom:** 30 s (from 1:05)
  > Digital-arrest complaints doubled in a year, to 1,23,672 in 2024: about 340 a day, with about ₹1,935 crore lost. Senior citizens filed over a lakh fraud complaints in 2025 and lost about ₹4,005 crore. Early 2025 data suggests a fall, so awareness helps; we think AI voices could reverse it, which is our hypothesis.

## 4. 4 Solution

- **3-minute pitch:** 35 s (from 1:05)
  > Our mentor asked: is the intervention at the right time, and will a panicking person act right? We don't rely on them. Before the call, the family sets Ruko up calmly. During the call, one big STOP with one action, and the family is told silently. At the money, the payment waits for the family's code word, even if the person is fully convinced.
- **Loom:** 120 s (from 1:35)
  > Our mentor asked whether the intervention comes at the right time. We don't rely on a panicking person. Three layers: before, during, at the money. Let me show it live with a new call. [Switch to ruko-seven.vercel.app, press 2. Answer and play the older person with your own new replies. Show STOP. Choose 'I still want to pay': the bank pauses it, the family phone gets the request, refuse it: 'Money did not move'. Press X to show the trace.]

## 5. 5 AI thinking

- **3-minute pitch:** 25 s (from 1:40)
  > Where AI adds value: it reads what the person meant when the rules can't tell, extracts scam signs from speech, text or a photo, and words calm guidance. Measured on our synthetic test set: rules alone read 75.8% of replies right, with AI 90.9%. And code keeps it safe: the guard blocked all 22 unsafe AI outputs, zero false STOPs on genuine calls.
- **Loom:** 40 s (from 3:35)
  > Where AI adds value: it reads what the person meant when the rules can't tell, extracts scam signs from speech, text or a photo, and words calm guidance. Measured on our synthetic test set: rules alone read 75.8% of replies right, with AI 90.9%. And code keeps it safe: the guard blocked all 22 unsafe AI outputs, zero false STOPs on genuine calls.

## 6. 6 Architecture

- **3-minute pitch:** 25 s (from 2:05)
  > Inputs: voice, a number, a message, a payment. The AI model reads and words, with a confidence score. Logic decides: the call state machine, the threat engine fusing 17 tactics with log-odds, the guard. Tools act: Money Lock, the Ruko Guard API, family alerts, Supabase with signal codes only. Outputs: STOP, the family alert, the payment paused. AI reads and words; code decides.
- **Loom:** 45 s (from 4:15)
  > Inputs: voice, a number, a message, a payment. The AI model reads and words, with a confidence score. Logic decides: the call state machine, the threat engine fusing 17 tactics with log-odds, the guard. Tools act: Money Lock, the Ruko Guard API, family alerts, Supabase with signal codes only. Outputs: STOP, the family alert, the payment paused. AI reads and words; code decides.

## 7. 7 Impact

- **3-minute pitch:** 15 s (from 2:30)
  > Time: a warning before the money moves, not days after. Quality: measured safety and accuracy, 526 automated checks. Scale: any phone, Hinglish, and banks can plug in through the Ruko Guard API. Next: a field test with 10 older adults.
- **Loom:** 30 s (from 5:00)
  > Time: a warning before the money moves, not days after. Quality: measured safety and accuracy, 526 automated checks. Scale: any phone, Hinglish, and banks can plug in through the Ruko Guard API. Next: a field test with 10 older adults.

## 8. 8 Business model and close

- **3-minute pitch:** 15 s (from 2:45)
  > Business, as hypotheses we will test: banks and payment apps pay for the Ruko Guard API per protected account, families get core protection free with a paid family plan, telcos and insurers later. Either way, the money didn't move. Ruko doesn't try to win the argument with a scammer. It protects the moment that matters.
- **Loom:** 30 s (from 5:30)
  > Business, as hypotheses we will test: banks and payment apps pay for the Ruko Guard API per protected account, families get core protection free with a paid family plan, telcos and insurers later. Either way, the money didn't move. Ruko doesn't try to win the argument with a scammer. It protects the moment that matters.

## Sources used on the slides

- Digital-arrest complaints, 2023 and 2024: Rajya Sabha reply, 12 Mar 2025 (rsdebate.nic.in), via Inc42
- ₹1,935 crore lost to digital arrest in 2024: same Rajya Sabha reply, via Inc42
- 2025 fall to 58,249 complaints: secondary summary of I4C data (Drishti IAS); original release not seen
- 1,03,488 complaints and ₹4,005 crore from senior citizens, 2025: MHA written reply, Rajya Sabha, via Asianet Newsable
- ₹22,845 crore lost to cyber fraud in 2024: MHA reply in Parliament, July 2025, via Scroll
- ≈ ₹7,200 a second: our arithmetic, the 2024 total divided by the seconds in a year
- 47% of Indian adults experienced an AI voice scam or knew someone who had: McAfee, The Artificial Imposter, 2023 (1,010 Indian respondents)
- RBI discussion paper on payment friction, reported Apr 2026: a DRAFT, not a final rule
- Measured by `npm run eval` on 66 + 45 + 27 synthetic, hand-written examples (23 Oct 2026). Not field results.
- 526 automated checks in 20 test suites (`npm test`), counted 23 Oct 2026
