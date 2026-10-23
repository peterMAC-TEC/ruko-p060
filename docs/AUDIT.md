# Ruko: five-expert audit (23 Oct 2026, demo day)

Each note: what is weak today, what judges will remember, top 3 changes. The owner chose "score-first": build what earns marks on top of the current look, no full re-skin.

## Product lead
- **Weak:** the strongest proof (the code decides, and it is safe) was invisible. Judges saw a nice call but not the architecture or any numbers.
- **Remembered:** a scammer they argued with, a STOP they did not expect, and "AI reads. Code decides."
- **Top 3:** (1) make the architecture visible inside the call (X-Ray); (2) measured numbers on synthetic data (eval); (3) a 3-minute pitch mapped to the rubric.

## Product designer
- **Weak:** the emotional arc is good (tension, then relief), but the presenter has no control if something goes wrong on stage.
- **Remembered:** the fake officer's cap falling off at STOP, and "Money did not move."
- **Top 3:** (1) director keys (1 to 6, X, R, F); (2) a fixed-script switch so a rehearsed demo cannot wander; (3) keep elder screens calm and large whatever the stage screens do.

## Web designer / art director
- **Weak:** two looks (calm Ink for elders, dark control room for judges) are deliberate but not yet one brand.
- **Remembered:** the animated caller, the blueprint X-Ray, the red STOP.
- **Top 3:** (1) the blueprint look for architecture and eval, so "how it works" has its own visual voice; (2) one accent per job (cyan action, marigold decision, blue AI, red danger); (3) the full "SIGNAL" re-skin after the hackathon, not on demo day.

## App creator
- **Weak:** the voice depends on the browser; a real phone and a projector are untested.
- **Remembered:** "it works on any phone", the family phone buzzing.
- **Top 3:** (1) offline presenter mode verified (only localhost contacted); (2) installable PWA kept; (3) a share card for awareness (next).

## Software engineer
- **Weak:** no number showed the AI was safe and useful; the stop word could be delayed while the AI was thinking (fixed earlier today).
- **Remembered:** 22 of 22 unsafe AI outputs blocked, 0 false STOPs, code steps in microseconds.
- **Top 3:** (1) `npm run eval` with rules vs AI vs hybrid; (2) per-turn trace with timings (X-Ray, /architecture); (3) confidence threshold so a low-confidence AI reading is ignored.
