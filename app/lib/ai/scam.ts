import "server-only";
import { z } from "zod";
import type { Identity, PatternLibrary } from "../patterns";
import { cleanSigns, SIGN_IDS, SIGN_TEXT, type Sign } from "../signs";
import { runTask } from "./index";
import type { AiMedia } from "./provider";

// "Tell me what they said" / "Show me": what someone said (a transcript, or a
// voice clip when the browser can't transcribe) or showed (a screenshot of a
// "warrant", an ID card, a message) → warning signs with evidence. The model
// only reports what it sees or hears; code decides the verdict (lib/signs.ts).

const IDENTITIES = [
  "police",
  "courier",
  "bank",
  "electricity",
  "customer_care",
  "family",
  "investment",
  "video_stranger",
  "loan",
  "tech_support",
  "unknown",
] as const satisfies readonly Identity[];

export type ReadInput = { transcript: string } | { audio: AiMedia } | { image: AiMedia };

export interface ReadResult {
  heard: string;
  identity: Identity;
  patternId: string | null;
  signs: Sign[];
}

const SPEECH = `The person is an older adult in India. They speak English, Hindi or Hinglish, and speech-to-text often mishears them.
- They are usually retelling a call in their own words: "he said I am under digital arrest", "unhone kaha kisi ko mat batana".
- Hindi/Hinglish: "giraftaar" = arrest, "kisi ko mat batana" / "kisi ko na bataye" = tell no one, "paise bhejo" / "transfer karo" = send money, "khata" = account, "parcel mein drugs" = drugs in a parcel, "camera band mat karna" = stay on camera.
- Mishearings: "see bee eye" = CBI, "any desk" = AnyDesk, "aadhar" = Aadhaar, "digital rest" = digital arrest.`;

function instructions(lib: PatternLibrary, what: "speech" | "image") {
  const signs = SIGN_IDS.map((id) => `- ${id}: ${SIGN_TEXT[id].model}`).join("\n");
  const patterns = lib.patterns.map((p) => `- ${p.id}: ${p.name.en}`).join("\n");
  return `${what === "speech" ? SPEECH : "The image is a screenshot or photo the person was sent or shown: a message, a letter, a 'warrant', an ID card, a video-call screen."}

Report the warning signs of an impersonation scam that are clearly present. The signs:
${signs}

Rules:
- Only report a sign when the ${what === "speech" ? "words" : "image"} clearly show it. Never guess, never report a sign "just in case".
- evidence: for speech, copy the exact words (in the language and script they were said or transcribed in), at most 20 words. For an image, copy the exact visible text, or describe the visual detail in a few words ("a police uniform", "a round seal").
- A normal call or message (family, a delivery update, a bank reminder that asks for nothing) has no signs. Say so with an empty list.
- identity: who the caller or sender claims to be; "unknown" if they don't say.
- patternId: the scam it most looks like, or "none".
Scam patterns:
${patterns}`;
}

export async function readScamSigns(lib: PatternLibrary, input: ReadInput): Promise<ReadResult> {
  const ids = lib.patterns.map((p) => p.id);
  const schema = z.object({
    heard: z
      .string()
      .describe(
        "For speech: what was said, cleaned up, in the language spoken. For an image: one or two plain sentences on what it shows, including its key text.",
      ),
    identity: z.enum(IDENTITIES),
    patternId: z.enum(["none", ...ids] as [string, ...string[]]),
    signs: z.array(z.object({ id: z.enum(SIGN_IDS), evidence: z.string() })),
  });

  let request: { prompt: string; media?: AiMedia[] };
  if ("transcript" in input) {
    request = { prompt: `What they said (speech-to-text, may be wrong): "${input.transcript.slice(0, 1500)}"\n\n${instructions(lib, "speech")}` };
  } else if ("audio" in input) {
    request = {
      prompt: `The audio clip is the person telling you about a call. Transcribe it into "heard", then:\n\n${instructions(lib, "speech")}`,
      media: [input.audio],
    };
  } else {
    request = { prompt: instructions(lib, "image"), media: [input.image] };
  }

  const r = await runTask(schema, request);
  return {
    heard: r.heard.trim().slice(0, 1500),
    identity: r.identity,
    patternId: r.patternId === "none" ? null : r.patternId,
    signs: cleanSigns(r.signs),
  };
}
