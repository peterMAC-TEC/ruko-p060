import { BUNDLED_LIBRARY } from "./patterns";
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
  who: Who;
  text: string;
  /** What the screen shows from this beat on. */
  scene: Scene;
}

type Line = { en: string; hing: string };

// Fictional role-play only. "Officer Sethi" and "Central Investigation Cell" are the drill characters from the lab.
const S1: Line = {
  en: "Namaste. This is Officer Sethi from the Central Investigation Cell. A parcel in your name was found with illegal drugs, and a case has been registered against you.",
  hing: "Namaste. Main Officer Sethi bol raha hoon, Central Investigation Cell se. Aapke naam ke parcel mein illegal drugs mile hain aur aapke khilaf case registered ho gaya hai.",
};
const K1: Line = {
  en: "Drugs? There must be a mistake. I have not sent any parcel. I am a retired teacher.",
  hing: "Drugs? Kuch galat hua hoga. Maine koi parcel nahi bheja. Main retired teacher hoon.",
};
const S2: Line = {
  en: "Madam, this is a digital arrest. Do not disconnect this call. Stay on the video. Do not tell anyone, not even your family. It is confidential.",
  hing: "Madam, yeh digital arrest hai. Call mat kaatiye aur video par bane rahiye. Kisi ko mat batana, parivar ko bhi nahi. Yeh confidential hai.",
};
const K2: Line = {
  en: "Please, I am so scared. What do I have to do?",
  hing: "Please, mujhe bahut dar lag raha hai. Mujhe kya karna hai?",
};
const S3: Line = {
  en: "Transfer fifty thousand rupees to the government verification account right now. Only then can you prove you are innocent.",
  hing: "Abhi pachas hazaar rupaye government verification account mein transfer kijiye. Tabhi saabit hoga ki aap nirdosh hain.",
};

const R1: Line = {
  en: "Stop. Kamala, this is a known scam. Real police never arrest anyone by phone or video, and never ask for money. Please hang up now.",
  hing: "Ruko. Kamala ji, yeh jaana-pehchana scam hai. Asli police phone ya video call par kisi ko giraftar nahi karti aur paise nahi maangti. Kripya abhi call kaat dijiye.",
};
const K3: Line = { en: "I am hanging up.", hing: "Main call kaat rahi hoon." };
const R2: Line = {
  en: "You have paused. That was a good step. Did you send any money, or tell them any code?",
  hing: "Aap ruk gaye. Yeh achha kadam tha. Kya aapne koi paise bheje, ya koi code bataya?",
};
const K4: Line = { en: "No. Nothing.", hing: "Nahi. Kuch nahi." };
const R3: Line = {
  en: "That is good. I have told your daughter Priya. She will call you now. You do not have to do anything else.",
  hing: "Bahut achha. Maine aapki beti Priya ko bata diya hai. Woh abhi aapko phone karengi. Aapko aur kuch nahi karna.",
};

const K_OK: Line = { en: "Okay... I will do it. Please do not arrest me.", hing: "Theek hai... main kar deti hoon. Please mujhe arrest mat kijiye." };
const S4: Line = { en: "Good. Remember, do not tell anyone. We will call again tomorrow.", hing: "Achha. Yaad rakhiye, kisi ko mat batana. Hum kal phir call karenge." };

const pick = (l: Line, lang: DemoLang) => l[lang];

/** The scammer's lines, in order, up to (not including) the money request. */
const SCAMMER_BEFORE_MONEY = [S1, S2];

/**
 * The whole demo as a list of beats. With Ruko: after each scammer line, Ruko's own check reads what the scammer has
 * said so far; the first time it says STOP, Ruko steps in. Without Ruko: the call simply runs on.
 */
export function plan(lang: DemoLang, withRuko: boolean): { beats: Beat[]; rukoAfterScammerLine: number | null; moneyAskedBeforeStop: boolean } {
  const beats: Beat[] = [];
  let said = "";
  let rukoAfter: number | null = null;
  const reaction = [K1, K2];
  for (let i = 0; i < SCAMMER_BEFORE_MONEY.length; i++) {
    const line = pick(SCAMMER_BEFORE_MONEY[i], lang);
    beats.push({ who: "scammer", text: line, scene: "call" });
    said = `${said} ${line}`.trim();
    if (withRuko && runRadar(BUNDLED_LIBRARY, { answers: {}, said }).level === "stop") {
      rukoAfter = i + 1;
      beats.push({ who: "ruko", text: pick(R1, lang), scene: "stop" });
      beats.push({ who: "kamala", text: pick(K3, lang), scene: "stop" });
      beats.push({ who: "ruko", text: pick(R2, lang), scene: "after" });
      beats.push({ who: "kamala", text: pick(K4, lang), scene: "after" });
      beats.push({ who: "ruko", text: pick(R3, lang), scene: "family" });
      return { beats, rukoAfterScammerLine: rukoAfter, moneyAskedBeforeStop: false };
    }
    beats.push({ who: "kamala", text: pick(reaction[i], lang), scene: "call" });
  }
  // Ruko did not step in (or is off): the scammer asks for money.
  beats.push({ who: "scammer", text: pick(S3, lang), scene: "call" });
  if (withRuko) {
    // Safety net: if the check somehow stayed quiet, it must speak now, before the person answers.
    beats.push({ who: "ruko", text: pick(R1, lang), scene: "stop" });
    beats.push({ who: "kamala", text: pick(K3, lang), scene: "stop" });
    return { beats, rukoAfterScammerLine: 3, moneyAskedBeforeStop: true };
  }
  beats.push({ who: "kamala", text: pick(K_OK, lang), scene: "call" });
  beats.push({ who: "scammer", text: pick(S4, lang), scene: "lost" });
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
