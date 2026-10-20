import "server-only";
import { z } from "zod";
import { runTask } from "../index";
import type { AiImage } from "../provider";

// Voice: turn what someone said (a transcript, or an audio clip when the browser can't transcribe)
// into facts about the bill. Never amounts: the split engine does the money.

const HINGLISH = `People speak Indian English and Hinglish, often tipsy, in a noisy bar, and speech-to-text mishears them.
- Numbers: ek=1, do=2, teen=3, char=4, paanch=5, chhe=6; "a couple"=2; "one more" adds 1.
- "thoda", "thode", "thoda sa", "some", "a bit of", "shared" = a shared portion of a dish, not whole units.
- "main", "mein", "I", "me", "mera", "maine" = the speaker. "aur" = and. "sab", "sabne", "everyone", "all of us" = everyone.
- Expect mishearings: "king fisher"/"kingfish" = Kingfisher, "old mug"/"oldmonk" = Old Monk, "nacho" = Nachos, "paneer tika" = Paneer Tikka.
- Only use the ids given. If a phrase matches nothing, put it in unmatched. Never invent items or people.`;

export type VoiceInput = { transcript: string } | { audio: AiImage };

const input = (v: VoiceInput, what: string) =>
  "transcript" in v
    ? { prompt: `What they said (speech-to-text, may be wrong): "${v.transcript.slice(0, 500)}"\n\n${what}`, images: undefined }
    : { prompt: `The audio clip is what they said. Transcribe it into "heard", then:\n\n${what}`, images: [v.audio] };

const confidence = z.number().min(0).max(1).describe("How sure you are, 0 to 1");

/** "Not right?": the speaker says what they had. */
export async function matchClaim(v: VoiceInput, speaker: string, lines: { id: string; name: string; quantity: number }[]) {
  const schema = z.object({
    heard: z.string().describe("What was said, cleaned up"),
    items: z.array(
      z.object({
        lineId: z.enum(lines.map((l) => l.id) as [string, ...string[]]),
        units: z.number().int().min(1).describe("How many units the speaker had; 1 for a shared portion"),
        shared: z.boolean().describe("true when they had only part of a shared dish"),
        phrase: z.string().describe("The exact words from 'heard' that refer to this item"),
        confidence,
      }),
    ),
    unmatched: z.array(z.string()),
  });
  const bill = lines.map((l) => `${l.id}: ${l.name} (×${l.quantity} on the bill)`).join("\n");
  const r = await runTask(schema, input(v, `${HINGLISH}\n\nThe speaker is ${speaker}. They are saying what they themselves had.\nBill lines:\n${bill}`));
  return r;
}

/** A quick question about one line: who had it? */
export async function matchCard(v: VoiceInput, line: { name: string; quantity: number }, people: { id: string; name: string }[], speaker?: string) {
  const schema = z.object({
    heard: z.string(),
    everyone: z.boolean().describe("true if they said everyone shared it"),
    people: z.array(
      z.object({
        personId: z.enum(people.map((p) => p.id) as [string, ...string[]]),
        units: z.number().int().min(1),
        phrase: z.string(),
        confidence,
      }),
    ),
    unmatched: z.array(z.string()),
  });
  const list = people.map((p) => `${p.id}: ${p.name}`).join("\n");
  return runTask(
    schema,
    input(
      v,
      `${HINGLISH}\n\nQuestion: who had the ${line.name} (×${line.quantity} on the bill)?${speaker ? ` The speaker is ${speaker}.` : " The speaker may be anyone at the table."}\nPeople:\n${list}\nUnits: how many each person had; 1 each if they shared it.`,
    ),
  );
}

/** Who's here: names and switches said out loud. */
export async function matchPeople(v: VoiceInput) {
  const schema = z.object({
    heard: z.string(),
    people: z.array(
      z.object({
        name: z.string().describe("First name, capitalised"),
        isVeg: z.boolean(),
        noAlcohol: z.boolean().describe("true for 'no alcohol', 'doesn't drink', 'sober', 'driving'"),
        isBirthday: z.boolean(),
        phrase: z.string(),
      }),
    ),
  });
  return runTask(schema, input(v, `${HINGLISH}\n\nThey are listing who is at the table, maybe with "veg", "no alcohol" or "birthday" after a name.`));
}
