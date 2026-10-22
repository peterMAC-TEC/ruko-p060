import { BUNDLED_LIBRARY } from "./patterns";
import script from "../data/demo-call-script.json";
import { runRadar } from "./radar";

// The scripted phone-call demo ("Watch Ruko step in"): a role-play with three synthetic voices, the scammer,
// Kamala (the older person) and Ruko. Nothing here is a real call or a real person.
//
// The moment Ruko steps in is NOT a timer: after each thing the scammer says, Ruko's own scam check (the same
// code that shows STOP in the app) reads everything the scammer has said so far, and Ruko speaks only when that
// check says STOP. The test (scripts/check-demo.ts) proves this happens before the scammer asks for money.

export type DemoLang = "en" | "hing";
export type Who = "scammer" | "kamala" | "ruko";
export type Scene = "call" | "stop" | "after" | "family" | "lost";

export interface Beat {
  /** The line's id: the audio files are named after it (public/demo-audio/<en|hi>/<id>.mp3). */
  id: string;
  who: Who;
  text: string;
  /** What the screen shows from this beat on. */
  scene: Scene;
  /** The caller cuts in over the end of the line before this one, this many ms before it finishes. */
  cutsInMs?: number;
}

// The words live in app/data/demo-call-script.json (shared with scripts/make-demo-audio.py, which records them).
const LINES = new Map((script.lines as Array<{ id: string; who: Who; en: string; hing: string }>).map((l) => [l.id, l]));
function beat(id: string, lang: DemoLang, scene: Scene, cutsInMs?: number): Beat {
  const l = LINES.get(id);
  if (!l) throw new Error(`demo line ${id} is missing`);
  return { id, who: l.who, text: l[lang], scene, ...(cutsInMs ? { cutsInMs } : {}) };
}
const textOf = (id: string, lang: DemoLang) => LINES.get(id)![lang];

/**
 * The whole demo as a list of beats. With Ruko: after each scammer line, Ruko's own check reads what the scammer has
 * said so far; the first time it says STOP, Ruko steps in. Without Ruko: the call simply runs on.
 */
export function plan(lang: DemoLang, withRuko: boolean): { beats: Beat[]; rukoAfterScammerLine: number | null; moneyAskedBeforeStop: boolean } {
  const beats: Beat[] = [beat("k0", lang, "call")];
  let said = "";
  const rounds = [
    { scammer: "s1", kamala: "k1" },
    { scammer: "s2", kamala: "k2" },
  ];
  for (let i = 0; i < rounds.length; i++) {
    // The caller talks over the end of her reply (a real caller does not wait).
    beats.push(beat(rounds[i].scammer, lang, "call", i === 1 ? 900 : undefined));
    said = `${said} ${textOf(rounds[i].scammer, lang)}`.trim();
    if (withRuko && runRadar(BUNDLED_LIBRARY, { answers: {}, said }).level === "stop") {
      beats.push(beat("r1", lang, "stop"), beat("k3", lang, "stop"), beat("r2", lang, "after"), beat("k4", lang, "after"), beat("r3", lang, "family"));
      return { beats, rukoAfterScammerLine: i + 1, moneyAskedBeforeStop: false };
    }
    beats.push(beat(rounds[i].kamala, lang, "call"));
  }
  // Ruko did not step in (or is off): the scammer asks for money.
  beats.push(beat("s3", lang, "call", 700));
  if (withRuko) {
    // Safety net: if the check somehow stayed quiet, it must speak now, before the person answers.
    beats.push(beat("r1", lang, "stop"), beat("k3", lang, "stop"));
    return { beats, rukoAfterScammerLine: 3, moneyAskedBeforeStop: true };
  }
  beats.push(beat("kok", lang, "call"), beat("s4", lang, "lost", 600));
  return { beats, rukoAfterScammerLine: null, moneyAskedBeforeStop: false };
}

export const SCENE_TEXT: Record<DemoLang, { setup: string; withoutEnd: string; withEnd: string; family: string; stop: string }> = {
  en: {
    setup: "Kamala, 72, a retired teacher, is at home. Her phone rings. (A role-play: all voices are synthetic.)",
    withoutEnd: "Without Ruko, the call runs on and the money goes. (Simulated.) Her family finds out days later.",
    withEnd: "Pressure, then Ruko, then she stopped. The money did not move.",
    family: "\"Your mother may be on a scam call. Please call her now.\"",
    stop: "Do not transfer money. Hang up and verify independently.",
  },
  hing: {
    setup: "Kamala, 72 saal, retired teacher, ghar par hain. Unka phone bajta hai. (Role-play: saari awaazein nakli hain.)",
    withoutEnd: "Ruko ke bina call chalti rehti hai aur paise chale jaate hain. (Simulated.) Parivar ko kuch din baad pata chalta hai.",
    withEnd: "Pressure, phir Ruko, phir woh ruk gayi. Paise nahi gaye.",
    family: "\"Aapki maa scam call par ho sakti hain. Abhi unhe phone kijiye.\"",
    stop: "Paise transfer mat kijiye. Call kaatiye aur khud alag se pata kijiye.",
  },
};

/** Roughly how long a line takes to say, for when the browser has no speech voices (so the demo still plays as captions). */
export const readingMs = (text: string) => Math.min(9000, 1200 + text.length * 55);
