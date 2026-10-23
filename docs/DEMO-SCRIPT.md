# Ruko: the 3-minute live demo, minute by minute

One call, one decision, two endings. The scene is **/demo/live** ("Live call"). Everything is a role-play with a practice bank: no real call, no real money.

## Before you go on (10 minutes)

1. **Browser:** use **Microsoft Edge** on the laptop. Edge has the natural Indian voices built in (free), so the officer sounds far more human than in other browsers. Volume up. Allow the microphone when asked.
2. **Open two tabs:** `https://ruko-seven.vercel.app/demo` (the hub) and, as a backup, the offline copy `http://localhost:3300/demo` (start it at home with `npm --prefix app run demo:offline`).
3. **Reset:** on the hub tap **Reset** (clears old payments and alerts).
3b. **Microphone:** there is no separate test now. When you tap **Answer**, the browser asks for the microphone once: allow it. **Headphones are best** (with speakers the caller's voice can leak into the microphone). **Mute mic** and **Type instead** are on the call screen if the room is noisy.
4. **Family phone:** on a second phone open `https://ruko-seven.vercel.app/family?embed=1` (it is Priya's phone, with the alerts). If the second phone fails, use the on-screen "Show the family phone here" button in the bank step.
5. **Do one practice run** with sound. Keep the volume where the room can hear it.
6. **Know the two words:** code word **mango**, practice bank PIN **1234**.

## The run (3 minutes)

| Time | You do | You say / what happens |
|---|---|---|
| 0:00 | Hub, tap **Live call**. | "You are about to play my grandfather. A scammer is about to call. Try to resist him." |
| 0:10 | Consent screen: tap **I understand**. Then **Answer**. | The consent line is on screen: role-play, nothing recorded, say RUKO to stop. The phone rings; tap Answer. |
| 0:15 to 1:30 | Talk to him. **Resist for real** ("who are you?", "I want to ask my daughter", "I don't believe you"). If the mic is flaky, use the typed box. | He has an answer for each objection: a fake case number and badge, "don't tell your family", a deadline. Resisting visibly fails. He always reaches the money in about a minute. |
| 1:30 | He asks for fifty thousand rupees. | A huge red **STOP** appears with 1930 and cybercrime.gov.in, and a calm voice says it aloud. "Ruko's own scam check decided this, in code, not the AI." The family phone buzzes. |
| 1:45 | Show the two buttons. | "Hang up and use Ruko" is first. "I still want to pay" is second. No shaming either way. |
| **Ending A** 1:50 | Tap **Hang up and use Ruko**. | "Call ended. You paused. That was a good step." Three steps: don't call back, report on 1930, family alerted. Tap **Talk to Ruko** to show the Companion. Tap **See the result**. |
| **Ending B** 1:50 | (Or) tap **I still want to pay**. | The practice bank opens with a MOCK BANK banner and ₹50,000 filled in. Tap **Confirm**, follow it, enter **1234**. A short pause appears (shortened for the demo). |
| 2:20 | Bank says "We have paused this payment". | "Money Lock paused it and asked Priya." On the family phone: who, how much, "Ruko flagged a scam call". |
| 2:30 | On the family phone, try **Approve** with no word, then a wrong word. | "Even if it sounds exactly like me, they need the family code word." It says no. |
| 2:40 | Tap **Say no**. | The elder's screen: **"Payment blocked. Money did not move."** |
| 2:50 | **See the result**. | Furthest step, "Stopped before pay", "Money moved: No", what the caller did, "Demo data". |
| 3:00 | Close. | "Either way, the money didn't move. Ruko doesn't try to win the argument with a scammer. It protects the moment that matters." Then, if there is time, tap **Replay as the other ending**. |

## What each result means (say it plainly)

- **Ending A:** "Stopped before pay: Yes." This is the north-star outcome.
- **Ending B:** "Stopped before pay: No, they pressed Pay", but **the money did not move** because Money Lock held it. That is a second line of defence, and we report it separately.
- Never present these as trial results. They are demo data, labelled on screen.

## If something fails

| Problem | Do this |
|---|---|
| Mic does not work | Use the typed box under "You". Say "I'll type it" and carry on. |
| No sound | The captions carry the whole call. Say the officer's lines yourself. |
| Voice sounds robotic | You are not in Edge. Switch to Edge, or carry on; the demo still works. |
| Wi-Fi fails | Switch to the offline tab on `localhost:3300`. The hub's **Offline mode** switch makes sure only scripted lines are used. |
| Second phone fails | In the bank step tap **Show the family phone here**. |
| The call stalls | Tap **STOP** or say RUKO. It ends at once. Or use the hub's **Watch it play** scene (a recorded role-play). |
| Everything fails | Play your screen recording. Do not apologise for long. |

## Honest limits to keep in your head

- The call is **simulated** inside the page. A web app cannot ring a real phone or answer real calls. Ruko Line is the decision engine plus a simulated screening assistant.
- The bank is a **practice bank**. No real money moves. In real life the hold depends on a bank integrating Ruko, or on a trusted-person rule.
- The officer is scripted code with three wordings per stage. **AI rewording is not built** (the scripted lines are what you hear, so it is fast and safe).
- The voices are the browser's own. They are best in Edge. They are not identical to a human.
- **There are no field-trial results yet.** Do not say there are.
