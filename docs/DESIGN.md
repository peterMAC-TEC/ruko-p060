# Ruko's look: "Ink"

Chosen by the user on 22 Oct from three directions (see `design/ruko-design-directions.html`: Pause, Signal and Ink). It applies to the whole app.

## The idea

Quiet and refined, like a good book. White paper, ink black, one grey, hairlines. Red is kept for danger, so **a red word on a white page is the loudest thing Ruko ever does**. The big words are set in a large, light serif. Everything else is a clear sans-serif at 20px or more.

## Rules

- **One thing per screen.** One main action, always in the same place, 64px or taller.
- **Words, not icons.** Every button says what it does, in English or Hinglish. Icons only help.
- **Black is the action colour.** The main button is a black, rounded rectangle with white text. Secondary actions are plain rows with a hairline under them and an arrow or icon at the right.
- **Red only for danger:** the STOP screen, the family alert's "Call now" button, "I've been scammed", live warnings. Never for decoration.
- **Flat.** No gradients, glows or drop shadows. A card is a 1px hairline (`shadow-soft` is now a hairline).
- **Calm until it matters.** Home, questions and the Companion are white and quiet. STOP is the one screen that gets a huge red word and a red top edge.
- **Contrast:** body text `#0a0a0a` on `#ffffff` (21:1); secondary text `#666666` (5.7:1); red `#d6291f` on white (4.9:1).

## Type

| Role | Font | Where |
|---|---|---|
| Display | Newsreader, light, optical size on, italic for the one main action | Greetings, questions, the STOP word, the Companion's lines, the family alert |
| Interface | Public Sans 400, 600 | Buttons, lists, labels, forms |
| Hindi (Devanagari) | Noto Sans Devanagari | Wherever Hindi text appears |
| Numbers and codes | JetBrains Mono | Lab and console only |

The `display` utility class (in `app/globals.css`) sets the display voice. The wordmark is the italic word "ruko".

## Colour tokens (`app/globals.css`)

`paper #ffffff` · `paper-2 #f5f5f3` · `ink #0a0a0a` · `ink-soft #666666` · `hair #e4e4e2` · `alarm #d6291f` · `alarm-soft #fdecea` · `warn #7a4b00` on `warn-soft #f7f2e7` (the "be careful" state only).

The older names (`calm`, `gold`, `emerald-card`) still exist and now point at these colours, so a screen that has not been restyled by hand still follows the look. The demo page, the fraud console and the landing page keep their dark "night and signal red" style on purpose.

## Where it shows

Elder home, "Is this a scam?" and its result, STOP, Companion, family alert, survey bot, Ruko Family, help, settings, sign-in and the practice bank.

## Not changed

What Ruko does. This is colour, type and layout only.

## v3 (22 Oct): the Guardian and a livelier front door

Same Ink foundation; this adds a character, a motion language and two supporting colours. Logic, thresholds and routes are unchanged.

- **Colours:** ink `#171717`, hairline `#e8e8e8`, danger red `#d92d20` (red is still only for danger), plus **reassurance green** `#e5f0e8` (text `#1f5a37`) for "you did well" and **warm cream** `#f4e8cf` for warmth. Never colour alone: every state is also in words.
- **The Guardian** (`components/brand/Guardian.tsx`): a geometric shield with two eyes and the bar from the Ruko mark. Moods: `safe` (relaxed, gentle bob and blink), `checking` (attentive, looks side to side), `danger` (steady, brows flat, red bar, **completely still**), `after` (soft eyes and smile, green bar). It never covers text or controls and is `aria-hidden` unless given a label. On the landing page the eyes follow the pointer (`LiveGuardian`).
- **Where it appears:** landing hero, elder home greeting, each question (checking), the STOP screen (danger, small, beside the label), the Companion (after).
- **Motion** (`globals.css`: `m-rise`, `m-slide`, `m-fade`, `m-pop`, `g-*`, `press`): used only to show a change of state. Everything is inside `prefers-reduced-motion: no-preference`, so reduced-motion users get static screens. **No animation on the STOP screen beyond a 0.2 s fade**, and no flashing, shaking or pulsing urgency anywhere.
- **Focus:** one 3px ink focus ring on all links, buttons and fields.
- **Question screens:** "Question 2 of 5" in 20px, two enormous Yes/No buttons (112px, 30px text), "Not sure" below, the 1930 bar always visible.
- **STOP:** the huge red word, the scam's name and rule, then "Do not transfer money. Hang up and verify independently." and one button, "I have hung up".
- **After stopping:** the Companion opens with "You have paused. That was a good step." on a green panel, then asks one question at a time. In the free step the person can pick one of four situations (fixed, reviewed guidance, no AI) or open **What can I say?** (three lines to read aloud or copy).
- **Honest states:** the family alert says "alerted in Ruko" (not "will call you"); a failed alert says nobody has been told and offers 1930; the Circle explains what family can see; the practice bank says no real money moves or is frozen.

## Motion layer (23 Oct)

**Principle:** motion guides attention or shows state; it never hides information or delays anyone. Two levels. **Stage screens** (home hero, control room, live call, results) may be expressive. **Elder screens** (STOP, Companion, family alert, mock bank, check) stay calm: no moving text while it is being read, nothing flashing, one gentle entrance at most.

**Tokens** (`app/globals.css`, `:root`): `--m-ease` (cubic-bezier 0.22, 1, 0.36, 1), `--m-fast` 160 ms (taps, hovers), `--m-base` 320 ms (transitions), `--m-slow` 700 ms (text reveals), `--m-stagger` 70 ms. Only `transform` and `opacity` are animated. Keyframes: `ruko-word`, `ruko-ring`, `ruko-buzz`, `ruko-shimmer`, `ruko-line`, `ruko-stop-in`, `ruko-pop`.

**Reduced motion:** the system setting or the in-app **Reduce motion** switch (footer on every page, top bar of the call) turns every animation and transition off. The choice is remembered (`localStorage: ruko-motion`). The components below then show their final state at once, so nothing is lost.

| Component (`components/motion/`) | Use | Do / don't |
|---|---|---|
| `WordByWord` | Big headlines: words rise in one by one; the `accent` word settles letter by letter. | Do use once per page. Don't use on elder screens or on text people must read while it moves. Screen readers get one still sentence. |
| `RotatingWords` | A short phrase cycling (hero). | Do give `staticSentence`. Don't use more than one. Static first phrase when motion is off. |
| `Reveal` | A section fades up once when scrolled into view. | Never replays. Visible at once when reduced. |
| `CountUp` | Numbers (impact figures) count up in view. | The real value is in the page from the start. |
| `Waveform` | Circular bars that follow the caller's voice (Web Audio analyser on the playing clip), your voice while listening, or a gentle simulated wave for the browser voice. | Decorative (`aria-hidden`). Still ring when reduced. |
| `KaraokeCaption` | Caller's words lit one by one in step with the audio, previous line faded above. | The whole line is always readable; only colour changes. |
| `TensionMeter` | "Pressure rising", 7 steps, stage view only. | Words and a number say the same thing. |
| `TacticChip` | A tactic the engine spotted; tap for one plain line. | |
| `CallTimeline` | The call as a line that draws itself, furthest step lit. | |
| `MotionToggle` | The Reduce motion switch. | Keep it easy to find. |

CSS helpers: `.m-word`, `.m-ring` (ringing pulse), `.m-buzz` (answer button), `.m-stop-in` (the one entrance for STOP), `.m-lift`, `.m-tap`, `.m-route` (soft fade between pages, `app/template.tsx`). The palette is unchanged; motion comes from timing, scale and opacity.
