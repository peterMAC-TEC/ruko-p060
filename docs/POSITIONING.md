# Ruko: positioning, the layer, and the moat

## The line

> **Your phone can spot the scam. Ruko stops the money.**

Short forms for slides and the landing page:
- **The pause between pressure and payment.**
- **The pause button for scam calls.**

## The positioning statement

**For** older adults in India, and the families who worry about them,
**who** are pressured by fake police, banks and couriers on phone and WhatsApp calls,
**Ruko is** the safety layer that turns any warning into a pause, a call from family, and a payment that waits,
**unlike** phone call screening and scam detectors, which warn only the person under pressure and stop at the end of the call,
**Ruko** works on any channel, brings in the people who can break the spell, and puts friction in front of the money, and it measures whether people actually stop.

## What Apple, Google and Samsung do, and what they do not

Verified 22 Oct 2026 (sources in the chat that produced this document; re-check before presenting):
- **Apple iOS 26 Call Screening** answers unknown numbers, asks name and reason, shows a transcript, and lets the person decide. It does not judge a scam, and India/Hindi support is unclear.
- **Google Scam Detection** (Pixel 9/10 in India; Samsung Galaxy S26 rolling out, India unconfirmed) warns during a call on the device. Newer flagships only; not on by default.
- **Digital arrest** mostly runs on **WhatsApp video calls**, and nothing found says these phone-level tools cover them.

They are very good **sensors at the phone**. They are not a **response**: no family, no payment, no after-care, and most 65-to-85-year-olds in India are not on those phones.

## Ruko as the layer in between

Ruko does not compete with the sensors. It is what happens next.

```
 SIGNALS IN (anything that suggests pressure)        RUKO'S BRAIN (code decides)        ACTIONS OUT
 ─────────────────────────────────────────────       ───────────────────────────        ─────────────────────────
 The person's answers and words / photo       ──┐                                    ┌─► STOP + Hang up
 Share to Ruko: any message, any app, any     ──┤    Scam Radar (rules + patterns)   ├─► Family Circle alert + script
   call-screening transcript                    ├─►  Threat engine (kill chain)  ──► ├─► Companion (calm, next step)
 Number reputation (community, hashed)        ──┤    Ruko Line (grade + screen)      ├─► Money Lock / bank pause
 Signed notices from the real bank            ──┤    AI only reads; code decides     ├─► Trusted-person approval
 Family signals                               ──┘                                    └─► 1930 / cybercrime.gov.in
```

| Part | Status today |
|---|---|
| Person's answers, words, photo | Built |
| **Share to Ruko** from any app (Android Chrome install; text) | **Built 22 Oct** |
| Number reputation, signed bank notices | Built |
| Family Circle, Companion, Money Lock, fraud desk | Built (practice bank) |
| Ruko Line (grade, screen, put through / message / block) | Decision engine built; answering real calls needs a phone line or an Android app |
| Reading Apple/Google alerts automatically | Not possible (no API); the person shares the transcript instead |
| Real bank, telecom and DoT feeds | Needs partners; designed for (signed notices already work in the mock) |

How it boosts what people already have: an iPhone's Call Screening transcript can be **shared to Ruko** in one tap and becomes a STOP, a family alert and a held payment. A Pixel's warning becomes the moment the person opens Ruko instead of the moment they ignore it.

## The moat (what is hard to copy)

Features are copyable. These are not:
1. **The family network.** Every household that adds a Circle is a node; the alert only works because people in it are real. It grows household by household, and each new family makes Ruko more useful to the next.
2. **The payment moment.** Phones cannot touch the transfer. Ruko's bank-side friction (pause, approval, mule check, signed notices) is only reachable through bank partnerships, which become harder to replace the more they are used.
3. **An India-specific data loop.** Scam patterns in English and Hinglish, community number reports (hashed), and field-trial results sharpen the check with each household, and nobody else has this for older Indians.
4. **Proof.** The north-star number (the share who stop before paying, against a without-Ruko baseline) is the evidence banks, insurers and regulators need. OS features have no such published number.
5. **Privacy by design.** No call interception, no recordings, codes not words. That is what lets a bank or regulator adopt it.

Honest note: the moat is the network, the bank relationships and the data, not the AI.

## Who pays and why (for the pitch, not built)

Banks and insurers (fewer fraud losses and claims), telecoms (trust), and families (peace of mind). The same layer serves all three.

## What to build next

1. Real-call route for Ruko Line (a Ruko number, or an Android app), with consent and legal review.
2. Image sharing (screenshots) through the Share sheet, using a service worker.
3. A bank pilot using the signed-notice and approval flow.
4. The 10-elder field trial, to turn the pitch into numbers.
