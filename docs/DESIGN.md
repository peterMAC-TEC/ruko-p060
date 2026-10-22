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
