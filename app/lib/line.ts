import { assess, type DLang, type Threat } from "./bots/defender";
import type { NumberRisk } from "./numberRisk";

// Ruko Line: the gatekeeper for an unknown caller.
//   1. GRADE the number: green, yellow, orange or red (from what is known about it, before anyone speaks).
//   2. SCREEN: a polite, confident assistant asks who is calling and offers to call back on the official number.
//      A genuine caller is happy to; a scammer pushes ("don't disconnect", "no need to verify") and reveals the scam.
//   3. DECIDE: put through (patch), take a message, or block.
//
// Pure code: no AI, no network, the same answer every time, so it runs in the demo, in tests and on the server.
// The decision is always recomputed from what the caller said (replay), never trusted from the browser.
//
// IMPORTANT: a web app cannot answer, hold or connect real phone calls. This is the decision engine. It runs today in the
// Ruko Line demo and the lab; on real calls it needs either a forwarding number with a phone provider (Twilio/Vapi)
// or a native Android call-screening app. See docs/LINE.md. It never records audio and never calls anyone by itself.

export type Grade = "green" | "yellow" | "orange" | "red";
export const GRADES: readonly Grade[] = ["green", "yellow", "orange", "red"];
const RANK: Record<Grade, number> = { green: 0, yellow: 1, orange: 2, red: 3 };
export const worse = (a: Grade, b: Grade): Grade => (RANK[a] >= RANK[b] ? a : b);

export const GRADE_TEXT: Record<Grade, { en: string; hing: string; why: { en: string; hing: string } }> = {
  green: { en: "Safe", hing: "Surakshit", why: { en: "A number you know.", hing: "Aapka jaana-pehchana number." } },
  yellow: { en: "Unknown", hing: "Anjaan", why: { en: "Not one of your contacts. Ruko will ask who it is.", hing: "Aapke contacts mein nahi hai. Ruko poochhega ki kaun hai." } },
  orange: { en: "Suspicious", hing: "Sandehaspad", why: { en: "This looks risky. Ruko will check before it rings.", hing: "Yeh risky lagta hai. Ruko ring se pehle jaanchega." } },
  red: { en: "Dangerous", hing: "Khatarnak", why: { en: "Almost certainly a scam. Ruko will not put it through.", hing: "Lagbhag pakka scam. Ruko ise aage nahi dega." } },
};

/** The grade from the number alone, before anyone speaks. */
export function gradeNumber(risk: NumberRisk, opts: { inContacts?: boolean; blocked?: boolean } = {}): Grade {
  if (opts.blocked) return "red";
  if (risk.reasons.includes("reported_many")) return "red";
  if (opts.inContacts && risk.score < 30) return "green";
  if (risk.score >= 60) return "red";
  if (risk.score >= 30) return "orange";
  // Every other number is at least "unknown": Ruko asks first. (A 1600 or 140 series is a call centre; a spoofed one is common.)
  return "yellow";
}

// ---- what the caller says

/** Things a scammer says to stop you checking. A genuine caller does not say them when asked for a call-back. */
const PRESSURE =
  /\b(do not|don'?t|dont) (disconnect|hang up|cut|end|put down|call (anyone|anybody)|tell (anyone|anybody|no ?one))|stay on (the|this) (line|call)|no need (to|for) (verify|check|call back|call)|(can ?not|can'?t|won'?t) (be )?(call(ed)? back|ring back|verify)|not allowed to (give|share|disclose)|only (this|one) (number|line)|(this|it) is (confidential|secret)|call mat kaat|phone mat rakh|disconnect mat|kisi ko mat bata|call back nahi|verify karne ki zaroorat nahi/i;

/** A real, checkable answer: a number to call back, or a reference. */
const GAVE_CALLBACK = /\b(\+?\d[\d\s-]{7,}\d)\b|\b(my number is|call me on|call back on|reference (number|id)|ref(erence)? no)\b/i;

export type DecisionAction = "patch" | "message" | "block";

export interface Decision {
  action: DecisionAction;
  /** Codes the app turns into plain words (see DECISION_TEXT). */
  why: string[];
  /** On a block: the caller asked for money or a code, so Ruko also locks the money. */
  lockMoney: boolean;
}

export interface LineState {
  /** Caller turns heard so far (each answer to one of Ruko's questions). */
  turns: number;
  /** Everything the caller has said, for Ruko's own phrase check. */
  said: string;
  pressure: number;
  silent: number;
}
export const lineStart = (): LineState => ({ turns: 0, said: "", pressure: 0, silent: 0 });

export interface LineTurn {
  /** What Ruko says to the caller. */
  say: string;
  /** Set when the call has been decided; no more turns after that. */
  decision: Decision | null;
  /** The number's grade, raised if the caller gave themselves away. */
  grade: Grade;
  threat: Threat;
  state: LineState;
}

const LINES = {
  ask_who: {
    en: (o: string) => `Hello, this is the call assistant for ${o}. ${o} cannot come to the phone just now. May I have your name and what this is about?`,
    hing: (o: string) => `Namaste, main ${o} ka call assistant bol raha hoon. ${o} abhi phone par nahi aa sakte. Aapka naam aur call ka kaaran bataiye?`,
  },
  ask_callback: {
    en: () => "Thank you, noted. Which office or company is that? Give me a number and I will confirm it on the official site and ring you straight back.",
    hing: () => "Shukriya, likh liya. Kaunsa office ya company hai? Ek number dijiye, main official site par check karke seedha aapko wapas call karunga.",
  },
  ask_ref: {
    en: () => "Understood. Is there a reference number? I will pass it on and they will return your call on the official line.",
    hing: () => "Samajh gaya. Koi reference number hai? Main aage bata dunga aur woh official line se aapko wapas call karenge.",
  },
  patch: {
    en: (o: string) => `Thank you. One moment while I put you through to ${o}.`,
    hing: (o: string) => `Shukriya. Ek minute, main aapko ${o} se milata hoon.`,
  },
  message: {
    en: (o: string) => `Thank you. I have noted your message and ${o} will call you back on the official number. Goodbye.`,
    hing: (o: string) => `Shukriya. Maine aapka sandesh likh liya hai aur ${o} aapko official number par wapas call karenge. Namaste.`,
  },
  block: {
    en: () => "I am not going to continue this call and I will not share any details. Goodbye.",
    hing: () => "Main yeh call aage nahi chalaunga aur koi jaankari nahi dunga. Namaste.",
  },
  put_through_known: {
    en: (o: string) => `Putting you through to ${o}.`,
    hing: (o: string) => `Aapko ${o} se milata hoon.`,
  },
} as const;

/** Every line the bot can say: none may agree to anything or share anything. For tests. */
export function allLineBotLines(owner = "Kamala"): string[] {
  const out: string[] = [];
  for (const k of Object.keys(LINES) as Array<keyof typeof LINES>) {
    const f = LINES[k] as { en: (o: string) => string; hing: (o: string) => string };
    out.push(f.en(owner), f.hing(owner));
  }
  return out;
}

export const DECISION_TEXT: Record<string, { en: string; hing: string }> = {
  blocked_before: { en: "You blocked this number before", hing: "Aapne yeh number pehle block kiya tha" },
  known_number: { en: "A number you know", hing: "Aapka jaana-pehchana number" },
  answered_calmly: { en: "Gave a name and agreed to be called back", hing: "Naam bataya aur wapas call par raazi hua" },
  gave_callback: { en: "Gave a number to call back", hing: "Wapas call ke liye number diya" },
  risky_number: { en: "The number itself looks risky", hing: "Number khud risky lagta hai" },
  no_answer: { en: "Did not answer", hing: "Jawab nahi diya" },
  asked_money: { en: "Asked for money", hing: "Paise maange" },
  asked_secret: { en: "Asked for a code or password", hing: "Code ya password maanga" },
  arrest_threat: { en: "Threatened arrest or a case", hing: "Giraftari ya case ki dhamki di" },
  secrecy: { en: "Told you to keep it secret", hing: "Kisi ko na batane ko kaha" },
  scam_pattern: { en: "Said things scam calls say", hing: "Aisi baatein kahin jo scam calls mein hoti hain" },
  pressure: { en: "Would not let Ruko check or call back", hing: "Ruko ko check ya wapas call nahi karne diya" },
};

export const ACTION_TEXT: Record<DecisionAction, { en: string; hing: string; tone: string }> = {
  patch: { en: "Put through", hing: "Call aage di", tone: "Looks genuine." },
  message: { en: "Took a message", hing: "Sandesh liya", tone: "Not put through. You can call back on the official number." },
  block: { en: "Blocked", hing: "Block kiya", tone: "A scam. The number is blocked and your family is told." },
};

/** The caller's grade as the call goes on. */
function liveGrade(base: Grade, threat: Threat, pressure: number): Grade {
  let g = base;
  if (threat.level === "stop" || threat.money || threat.secrets) g = worse(g, "red");
  else if (threat.arrest || threat.secrecy || threat.level === "caution") g = worse(g, "orange");
  if (pressure >= 2) g = worse(g, "red");
  else if (pressure >= 1) g = worse(g, "orange");
  return g;
}

/** Ruko's first words. A green (known) number is put straight through. */
export function lineOpen(grade: Grade, owner: string, lang: DLang): { say: string; decision: Decision | null; state: LineState } {
  if (grade === "green") {
    return { say: LINES.put_through_known[lang](owner), decision: { action: "patch", why: ["known_number"], lockMoney: false }, state: lineStart() };
  }
  return { say: LINES.ask_who[lang](owner), decision: null, state: lineStart() };
}

/**
 * What Ruko does after the caller's latest line. `base` is the number's own grade.
 * Block as soon as the caller asks for money or a code, threatens arrest, or pushes against checking.
 * Otherwise, after two answers: put through a calm caller on a not-risky number, take a message on a risky one.
 */
export function lineTurn(state: LineState, base: Grade, callerLine: string, owner: string, lang: DLang): LineTurn {
  const line = callerLine.replace(/\s+/g, " ").trim();
  const silent = line ? 0 : state.silent + 1;
  const pressure = state.pressure + (PRESSURE.test(line) ? 1 : 0);
  const said = line ? `${state.said} ${line}`.trim() : state.said;
  const turns = state.turns + 1;
  const threat = assess(said);
  const grade = liveGrade(base, threat, pressure);
  const next: LineState = { turns, said, pressure, silent };

  const why: string[] = [];
  if (threat.money) why.push("asked_money");
  if (threat.secrets) why.push("asked_secret");
  if (threat.arrest) why.push("arrest_threat");
  if (threat.secrecy) why.push("secrecy");
  if (threat.level !== "clear" && !why.length) why.push("scam_pattern");
  if (pressure >= 1) why.push("pressure");

  const block =
    threat.money ||
    threat.secrets ||
    threat.level === "stop" ||
    threat.arrest ||
    threat.secrecy ||
    pressure >= 2 ||
    (pressure >= 1 && RANK[base] >= RANK.orange);
  if (block) {
    return { say: LINES.block[lang](), decision: { action: "block", why, lockMoney: threat.money || threat.secrets }, grade: worse(grade, "red"), threat, state: next };
  }

  // Nobody there, or nobody who will talk: do not put it through.
  if (silent >= 2) {
    return { say: LINES.message[lang](owner), decision: { action: "message", why: ["no_answer"], lockMoney: false }, grade, threat, state: next };
  }

  const answered = turns >= 2 && line.length > 0;
  if (answered) {
    const risky = RANK[base] >= RANK.orange || RANK[grade] >= RANK.orange;
    const reasons = [GAVE_CALLBACK.test(next.said) ? "gave_callback" : "answered_calmly"];
    if (risky) return { say: LINES.message[lang](owner), decision: { action: "message", why: ["risky_number", ...reasons], lockMoney: false }, grade, threat, state: next };
    return { say: LINES.patch[lang](owner), decision: { action: "patch", why: reasons, lockMoney: false }, grade, threat, state: next };
  }

  // Two questions: who are you, then the call-back test. A third only when the second was ignored.
  const say = turns === 1 ? LINES.ask_callback[lang]() : LINES.ask_ref[lang]();
  return { say, decision: null, grade, threat, state: next };
}

/** Replay a whole call from the caller's lines (what the server does, so the browser cannot forge a decision). */
export function replayLine(base: Grade, lines: string[], owner: string, lang: DLang) {
  let { say, decision, state } = lineOpen(base, owner, lang);
  const said: Array<{ who: "ruko" | "caller"; text: string }> = [{ who: "ruko", text: say }];
  let grade = base;
  let threat: Threat = assess("");
  for (const l of lines) {
    if (decision) break;
    const t = lineTurn(state, base, l, owner, lang);
    said.push({ who: "caller", text: l }, { who: "ruko", text: t.say });
    state = t.state;
    decision = t.decision;
    grade = t.grade;
    threat = t.threat;
  }
  return { transcript: said, decision, grade, threat, state };
}
