# Judge Q&A for Ruko

Short, honest answers. Say only what is built.

**Isn't Apple (or Google or Samsung) already doing this?**
They are sensors at the phone. Apple's Call Screening answers unknown numbers and shows a transcript; Google's Scam Detection warns on the device. Both warn only the person under pressure, stop at the end of the call, run on newer phones, and the digital-arrest scam mostly runs on WhatsApp video. Neither tells the family or stands in front of the payment. Ruko is the response layer, and a phone transcript can be shared straight into it.

**Why don't you intercept the call?**
The brief forbids interception without consent, and an ordinary app cannot do it. Ruko needs no recording: the person, or the family, tells it what is happening, and it protects the moment the money moves. That also makes it adoptable by banks and regulators.

**Is this a real call?**
No. The call is simulated inside the page, with a fictional officer. A web app cannot ring or answer real phone calls. Real call screening needs a phone line from a provider or a native Android app, plus consent and legal review.

**Is the bank real? Did money move?**
No. It is a practice bank, labelled MOCK BANK. No real money moves or is frozen. A real deployment needs a bank partner; the pause, approval and signed-notice flow is built so a pilot is possible.

**Have you tested it with older adults?**
Not yet. The ten-person field trial is designed (consent script, protocol, scoring, dashboard). What we have is a simulator across 30 scam role-plays and 24 genuine calls, live tests, and 14 automated test suites. We have no field-trial numbers and we do not claim any.

**What about false alarms?**
In the simulator Ruko's own check false-alarmed on 1 of 24 genuine calls, and it never claims zero. Too little information gives "I can't tell yet", never a false all-clear and never an alarm. The STOP rule is simple and visible: two "yes" answers, or two serious scam phrases. The trial measures it.

**What if the AI is wrong?**
The AI never decides. It reads words and photos into warning signs with the exact quote, so the reason is visible. Code decides STOP. AI can raise a warning but cannot lower a STOP. If the AI is off or slow, a plain phrase check runs. The live call uses no AI at all: the officer is scripted code.

**Why did the officer sound scripted?**
He is. Three wordings per stage, a counter for each kind of resistance, and a rule that he always reaches the money ask in about a minute, so the demo cannot stall. We chose reliability over improvisation for a live room.

**Privacy and consent?**
A consent screen before every call. No audio or transcripts of real people are kept: the call lives in memory and is gone when it ends; only signal codes are saved. The officer never asks for an OTP, card, Aadhaar, password or PIN, uses no real names, and the only thing he asks for is a transfer on the practice bank. Saying RUKO or tapping STOP ends the call at once.

**What stops a scammer who copies a family member's voice?**
Nothing in the voice itself, and that is the point: a perfect voice is not proof. After a flagged call, approving a payment needs the family code word set in advance. Declining never needs it. The check is on the server, not just on the screen.

**What is your moat?**
Not the AI. The family network (every household added makes the next more useful), bank partnerships that reach the payment moment, an India-specific scam data loop, and measured proof of how many people stop.

**Who pays?**
Banks and insurers (fewer fraud losses and claims, and a payment pause only they can offer), telecoms (trust), and families, who get it free.

**Can it scale?**
It is a web app on Vercel with a Postgres database, installable on the home screen, with no app-store step. The next steps that matter are a bank pilot, a real-call route, and more Indian languages.

**What are the facts behind the problem?**
Each number on the Impact page has its source on screen: ₹22,845 crore lost to cyber fraud in 2024 (Ministry of Home Affairs, July 2025); 1,03,488 senior-citizen fraud complaints and about ₹4,005 crore in 2025 (Ministry of Home Affairs, Rajya Sabha); digital-arrest cases 60,676 in 2023 and 1,23,672 in 2024 (Government reply in Parliament); 47% of Indian adults in a 2023 McAfee survey had experienced or knew someone who had experienced an AI voice scam. "AI could make scams rise again" is our hypothesis, labelled as such.

**What is not built?**
Answering real calls, real bank integration, AI rewording of the officer, voice cloning (deliberately not built), a live second-language voice beyond browser speech, and the field trial.
