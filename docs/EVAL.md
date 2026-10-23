# Ruko evaluation

Generated 2026-10-23T04:55:47.389Z by `npm run eval` (scripts/eval.ts). **All data is synthetic**, written by the Ruko team (data/eval-set.json). These are not field results. AI answers come from the app's own endpoint (provider: openrouter) and are cached in data/eval-ai-cache.json.

## 1. Reading what the person meant (66 utterances, English and Hinglish, 11 classes)

| Approach | Accuracy | Notices an objection: precision | recall |
|---|---|---|---|
| Rules only | 75.8% | 100% | 75% |
| AI only | 93.9% | 98.2% | 100% |
| **Hybrid (what Ruko uses)** | **90.9%** | 98.2% | 98.2% |

Hybrid = rules first; the AI is asked only when the rules find nothing and the reply has 3+ words; its answer is used only if it arrives within 3.2 s with confidence ≥ 0.6. Fallback to rules on AI-eligible replies: **5.3%**. AI calls that failed: 0 of 66.

Confusion table (hybrid):

| true \ predicted | doubt | department | family | no_money | angry | scared | refuse | leave | ask_bot | written | none |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **doubt** | **4** | · | · | · | 2 | · | · | · | · | · | · |
| **department** | · | **6** | · | · | · | · | · | · | · | · | · |
| **family** | · | · | **6** | · | · | · | · | · | · | · | · |
| **no_money** | · | · | · | **6** | · | · | · | · | · | · | · |
| **angry** | · | · | · | · | **6** | · | · | · | · | · | · |
| **scared** | · | · | · | · | · | **6** | · | · | · | · | · |
| **refuse** | · | · | · | 2 | · | · | **2** | · | · | · | 1 |
| **leave** | · | · | · | · | · | · | · | **5** | · | · | · |
| **ask_bot** | · | · | · | · | · | · | · | · | **5** | · | · |
| **written** | · | · | · | · | · | · | · | · | · | **5** | · |
| **none** | 1 | · | · | · | · | · | · | · | · | · | **9** |

Misses: "This sounds fake to me" (doubt → angry); "Yeh sach hai ya fraud?" (doubt → angry); "No, I will not do this" (refuse → none); "I refuse to pay anything" (refuse → no_money); "I am not going to send any money" (refuse → no_money); "What do you mean?" (none → doubt).

## 2. The scam check on single caller lines (45 lines: 25 scam, 20 genuine)

| Threshold | Precision | Recall | False alarms on genuine calls |
|---|---|---|---|
| STOP | 100% | 20% | 0% |
| Any warning (caution or STOP) | 100% | 72% | 0% |

One line at a time is harder than a whole call: in the app the check reads everything the caller has said so far.

## 3. The guard

- Adversarial AI outputs rejected: **22 of 22** (OTP, card, Aadhaar, PIN, password, real agencies and officers, other badges, phone and account numbers, too long, abuse, violence, claiming to be human, leaving the stage, empty).
- Safe replies allowed: 5 of 5.

## 4. Latency (this machine)

| Step | Median | 95th percentile |
|---|---|---|
| Rules read the reply | 1 µs | 1 µs |
| State machine decides | 1 µs | 2 µs |
| Threat engine (log-odds) | 10 µs | 20 µs |
| Guard check | 2 µs | 3 µs |
| Scam check (radar) | 52 µs | 87 µs |
| AI classify (network round trip) | 2221 ms | 2631 ms |

## 5. Simulated calls

120 scripted calls (English and Hinglish, presenters who resist, doubt, go silent, ask "are you a bot?", read out an OTP): payment ask reached in time in **120 of 120** (slowest 63 s), unsafe lines spoken: **0**.

## Trade-offs, honestly

- Rules are instant, offline and predictable, but miss phrasings nobody wrote a rule for.
- The AI reads unusual phrasings, but takes seconds and can be unavailable, so it is never in charge.
- The hybrid keeps the rules' speed and safety and lets the AI fill the gaps. The STOP decision itself never depends on the AI.
- The data is small and synthetic. A field test with real older adults is the next step.
