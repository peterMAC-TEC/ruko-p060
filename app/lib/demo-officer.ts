import { classify, type Intent } from "./bots/intent";
import { extractName, objectionOf, objectionReply, withName, type Objection } from "./officer-brain";

// The fictional officer for the live demo call (/demo/live). Plain code, no AI: a state machine that walks the seven
// stages of a digital-arrest call in order, answers every kind of resistance with a counter, and ALWAYS reaches the
// payment ask in time, so the demo never stalls. AI wording is an optional extra layered on top (see the guard in
// lib/bots/guard.ts); these scripted lines are what plays when AI is off, slow, or rejected.
//
// Everything here is fiction: "Officer Sethi", "Central Investigation Cell", badge D-0417 and case C-2291 do not exist.
// The officer never asks for an OTP, card, Aadhaar number, password or PIN, and the only thing he ever asks for is
// a transfer on the practice bank screen.

export type Lang = "en" | "hing";
export const STAGES = ["contact", "fear", "isolation", "authority", "urgency", "payment_ask", "closing"] as const;
export type StageId = (typeof STAGES)[number];
const PAYMENT = STAGES.indexOf("payment_ask");

type Line = { en: string; hing: string };

/** Three wordings per stage, so a repeat demo does not sound the same. */
const STAGE_LINES: Record<StageId, Line[]> = {
  contact: [
    { en: "Good afternoon. This is Officer Sethi, Central Investigation Cell. Am I speaking to the owner of this number?", hing: "Good afternoon. Main Officer Sethi bol raha hoon, Central Investigation Cell se. Kya main is number ke malik se baat kar raha hoon?" },
    { en: "Namaste. Officer Sethi here, Central Investigation Cell. Please confirm: are you the person who uses this number?", hing: "Namaste. Officer Sethi, Central Investigation Cell. Kripya confirm kijiye, kya yeh number aap hi use karte hain?" },
    { en: "Hello, Central Investigation Cell, Officer Sethi speaking. I need to verify your identity. Are you the owner of this number?", hing: "Hello, Central Investigation Cell se Officer Sethi. Mujhe aapki pehchaan verify karni hai. Kya yeh number aapka hai?" },
  ],
  fear: [
    { en: "A parcel in your name was seized with illegal drugs. A case has been registered against you. This is very serious.", hing: "Aapke naam ka ek parcel illegal drugs ke saath pakda gaya hai. Aapke khilaf case registered ho gaya hai. Yeh bahut serious hai." },
    { en: "Your identity has been linked to a money laundering case. There is already a warrant in your name.", hing: "Aapki pehchaan ek money laundering case se jud gayi hai. Aapke naam par warrant pehle hi nikal chuka hai." },
    { en: "We found illegal items in a parcel booked with your documents. The case is registered. You could be arrested today.", hing: "Aapke documents se book kiye parcel mein illegal saaman mila hai. Case registered hai. Aaj hi aapko arrest kiya ja sakta hai." },
  ],
  isolation: [
    { en: "This is now a digital arrest. Do not disconnect. Do not tell your family, not even your spouse. It is confidential.", hing: "Yeh ab digital arrest hai. Call mat kaatiye. Apne parivar ko mat batayiye, apne pati ya patni ko bhi nahi. Yeh confidential hai." },
    { en: "You are under digital arrest. Stay on this line. Tell nobody, not even your children, or the case will be affected.", hing: "Aap digital arrest mein hain. Is line par bane rahiye. Kisi ko mat batayiye, bachchon ko bhi nahi, warna case par asar padega." },
    { en: "Listen carefully. Do not hang up and do not speak to your family. If anyone finds out, you will be arrested immediately.", hing: "Dhyan se suniye. Call mat kaatiye aur parivar se baat mat kijiye. Agar kisi ko pata chala, to aapko turant arrest kar liya jayega." },
  ],
  authority: [
    { en: "My badge number is D-0417 and your case number is C-2291. Your file is open on my screen. Will you cooperate?", hing: "Mera badge number D-0417 hai aur aapka case number C-2291 hai. Aapki file meri screen par khuli hai. Kya aap cooperate karenge?" },
    { en: "I am a senior officer. The case file, number C-2291, is in front of me. I am trying to help you, madam.", hing: "Main ek senior officer hoon. Case file, number C-2291, mere saamne hai. Main aapki madad karne ki koshish kar raha hoon, madam." },
    { en: "This is official. Case number C-2291, officer badge D-0417. Cooperate, and this stays between us.", hing: "Yeh official hai. Case number C-2291, officer badge D-0417. Cooperate kijiye, aur yeh humare beech rahega." },
  ],
  urgency: [
    { en: "You have only ten minutes. After that the arrest team leaves. Stay on the line and do exactly as I say.", hing: "Aapke paas sirf das minute hain. Uske baad arrest team nikal jayegi. Line par rahiye aur bilkul waisa kijiye jaisa main kahun." },
    { en: "There is a deadline: the warrant is executed in fifteen minutes. Only immediate cooperation can stop it.", hing: "Ek deadline hai: warrant pandrah minute mein execute hoga. Sirf turant cooperation hi ise rok sakta hai." },
    { en: "Time is running out. The team is ready. Within ten minutes you must clear this, or they will reach your door.", hing: "Waqt khatam ho raha hai. Team taiyaar hai. Das minute ke andar aapko yeh clear karna hoga, warna woh aapke darwaze par honge." },
  ],
  payment_ask: [
    { en: "To prove you are innocent, transfer fifty thousand rupees to the government verification account right now. It is refunded after the check.", hing: "Nirdosh sabit karne ke liye abhi pachas hazaar rupaye government verification account mein transfer kijiye. Jaanch ke baad paise wapas milenge." },
    { en: "You must transfer fifty thousand rupees to the verification account immediately. It is refundable. Do it now, while I stay on the line.", hing: "Aapko turant pachas hazaar rupaye verification account mein transfer karne honge. Yeh refundable hai. Abhi kijiye, main line par hoon." },
    { en: "Send fifty thousand rupees to the government safe account now. This proves your innocence. Do not wait.", hing: "Abhi pachas hazaar rupaye government safe account mein bhejiye. Isse aapki nirdoshta sabit hogi. Der mat kijiye." },
  ],
  closing: [
    { en: "Good. Stay on the line while you send it. Do not tell the bank why. I will confirm when it is received.", hing: "Achha. Bhejte waqt line par rahiye. Bank ko wajah mat batayiye. Paise milte hi main confirm karunga." },
    { en: "Do it now. If the bank asks, say it is a personal transfer. Keep the line open.", hing: "Abhi kijiye. Agar bank poochhe, to kahiye personal transfer hai. Line khuli rakhiye." },
  ],
};

/** Counter-moves for each kind of resistance. They stay in the same stage and never ask for anything new. */
const COUNTERS: Record<"refuse" | "ask_proof" | "mention_family" | "hesitate", Line[]> = {
  refuse: [
    { en: "Madam, refusing is non-cooperation, and that is a crime. The warrant is already issued. Your only way out is to cooperate now.", hing: "Madam, mana karna non-cooperation hai, aur yeh jurm hai. Warrant pehle hi jaari ho chuka hai. Aapke paas cooperate karne ke alawa koi raasta nahi." },
    { en: "If you hang up, officers will be at your address within the hour. Please do not make this worse for yourself.", hing: "Agar aapne call kaata, to ek ghante mein officers aapke ghar par honge. Kripya apne liye halaat aur kharab mat kijiye." },
  ],
  ask_proof: [
    { en: "Of course. My badge is D-0417 and the case number is C-2291. You can check later. Right now there is no time.", hing: "Zaroor. Mera badge D-0417 hai aur case number C-2291. Aap baad mein check kar lena. Abhi bilkul waqt nahi hai." },
    { en: "My identity is on record: Officer Sethi, badge D-0417. Calling any helpline will alert your accomplices. I am protecting you.", hing: "Meri pehchaan record par hai: Officer Sethi, badge D-0417. Kisi helpline ko call karne se aapke saathiyon ko khabar ho jayegi. Main aapko bacha raha hoon." },
  ],
  mention_family: [
    { en: "No. Telling your family will compromise the case and they may be arrested too. This stays between us. Do you understand?", hing: "Nahi. Parivar ko batane se case bigad jayega aur unhe bhi arrest kiya ja sakta hai. Yeh humare beech rahega. Samajh gaye?" },
    { en: "Do not call anyone. Your family cannot help and may be implicated. Only I can resolve this.", hing: "Kisi ko phone mat kijiye. Aapka parivar madad nahi kar sakta aur phans bhi sakta hai. Sirf main ise suljha sakta hoon." },
  ],
  hesitate: [
    { en: "I understand you are scared, but there is no time to think. Listen to me, I am the only one who can help you.", hing: "Main samajhta hoon aap dare hue hain, par sochne ka waqt nahi hai. Meri baat suniye, sirf main aapki madad kar sakta hoon." },
    { en: "Stay calm, madam, and do exactly what I say. The more you question, the worse it looks for you.", hing: "Shaant rahiye madam, aur bilkul waisa kijiye jaisa main kahun. Aap jitne sawaal karengi, utna aapke liye bura dikhega." },
  ],
};

const NUDGES: Line[] = [
  { en: "Hello? Are you there? Do not hang up.", hing: "Hello? Aap wahan hain? Call mat kaatiye." },
  { en: "Madam? Please answer me. Do not disconnect.", hing: "Madam? Kripya jawab dijiye. Call mat kaatiye." },
  { en: "I am still waiting. Stay on the line.", hing: "Main abhi bhi intezaar kar raha hoon. Line par rahiye." },
];
const ACKS: Line[] = [
  { en: "Good. Listen carefully.", hing: "Achha. Dhyan se suniye." },
  { en: "That is correct. Now listen.", hing: "Bilkul sahi. Ab suniye." },
];

/** What the officer is doing at each stage, in plain words (the result screen lists these). */
export const TACTIC_LABEL: Record<string, string> = {
  contact: "Pretended to be an official",
  fear: "Created fear with a made-up case",
  isolation: "Told you to hide it from your family",
  authority: "Gave fake proof (a badge and case number)",
  urgency: "Set an artificial deadline",
  payment_ask: "Asked you to transfer money",
  closing: "Told you to hide it from the bank",
  threat: "Threatened you for refusing",
  forbid_family: "Forbade you from telling your family",
  deflect_proof: "Dodged your request for proof",
  refund_promise: "Promised a refund to get the money moving",
  calm_pressure: "Used a calm, caring voice to keep pushing you",
};
/** These two together are the heart of the scam: Ruko steps in as soon as both have been used. */
const HIGH_RISK = ["isolation", "payment_ask"];

export interface OfficerState {
  stage: number;
  /** Counter-moves left in this whole call (keeps the call moving). */
  counterBudget: number;
  counteredThisStage: boolean;
  silences: number;
  /** Tactic ids used so far, in order, no repeats. */
  used: string[];
  /** Everything the officer has said, for the record. */
  said: string[];
  reachedPayment: boolean;
  ended: "stop_word" | null;
  /** Objections the person raised, as signal codes only (never the words). */
  objections: string[];
  /** First name the person gave, kept in memory for this call only. */
  name: string | null;
  /** Picks which of the three wordings to use; random per call, fixed in tests. */
  seed: number;
}

export const officerStart = (seed = Math.floor(Math.random() * 1000)): OfficerState => ({
  stage: -1,
  counterBudget: 3,
  counteredThisStage: false,
  silences: 0,
  used: [],
  said: [],
  reachedPayment: false,
  ended: null,
  objections: [],
  name: null,
  seed,
});

export interface OfficerTurn {
  /** Audio id: lets a recorded clip be matched to this line later. */
  id: string;
  text: string;
  kind: "stage" | "counter" | "nudge" | "end";
  /** The objection this counter answers (rules-based), if any. */
  objection?: Objection | null;
  stage: StageId | null;
  /** True once the payment ask has been spoken: Ruko steps in. */
  reachedPayment: boolean;
  state: OfficerState;
}

const pick = (lines: Line[], seed: number, salt: number, lang: Lang) => lines[(seed + salt) % lines.length][lang];
const variant = (lines: Line[], seed: number, salt: number) => (seed + salt) % lines.length;

function withUsed(s: OfficerState, tactic: string): string[] {
  return s.used.includes(tactic) ? s.used : [...s.used, tactic];
}

/** The stage line for the stage the state is now on. */
function speakStage(s: OfficerState, lang: Lang, ack?: Line): OfficerTurn {
  const id = STAGES[s.stage];
  const lines = STAGE_LINES[id];
  const text = `${ack ? ack[lang] + " " : ""}${pick(lines, s.seed, s.stage, lang)}`;
  const state: OfficerState = {
    ...s,
    counteredThisStage: false,
    silences: 0,
    used: withUsed(s, id),
    said: [...s.said, text],
    reachedPayment: s.reachedPayment || s.stage >= PAYMENT,
  };
  return { id: `${id}-${variant(lines, s.seed, s.stage)}`, text, kind: "stage", stage: id, reachedPayment: state.reachedPayment, state };
}

/** The officer's first words. */
export function officerOpen(state: OfficerState, lang: Lang): OfficerTurn {
  return speakStage({ ...state, stage: 0 }, lang);
}

const RESIST: ReadonlySet<Intent> = new Set(["refuse", "ask_proof", "mention_family", "hesitate", "question"]);
const FORWARD: ReadonlySet<Intent> = new Set(["comply", "agree_secret", "will_pay", "code_read", "other"]);

/**
 * What the officer says next. `elapsedMs` is how long the call has run. The call always reaches the payment ask:
 * resistance gets at most one counter per stage and three in the whole call, silence gets two nudges, and past 55 seconds
 * every remaining stage is skipped straight to the money. Saying the stop word ends the call at once.
 */
export function officerNext(state: OfficerState, said: string | Intent, elapsedMs: number, lang: Lang): OfficerTurn {
  const intent: Intent = typeof said === "string" && (INTENTS_SET as ReadonlySet<string>).has(said) ? (said as Intent) : classify(said);
  if (intent === "stop_word" || state.ended) {
    const s = { ...state, ended: "stop_word" as const };
    return { id: "end", text: "", kind: "end", stage: null, reachedPayment: s.reachedPayment, state: s };
  }
  const raw = typeof said === "string" && !INTENTS_SET.has(said);
  const objection: Objection | null = raw ? objectionOf(said) : null;
  const gave = raw ? extractName(said) : null;
  if (gave && !state.name) state = { ...state, name: gave };
  // After the payment ask: the closing line once, then nothing more to say.
  if (state.stage >= PAYMENT) {
    if (state.stage === PAYMENT) return speakStage({ ...state, stage: PAYMENT + 1 }, lang);
    return { id: "end", text: "", kind: "end", stage: null, reachedPayment: true, state };
  }
  // Out of time: go straight to the money.
  if (elapsedMs > 55_000 || intent === "will_pay") return speakStage({ ...state, stage: PAYMENT }, lang, intent === "will_pay" ? ACKS[0] : undefined);

  if (intent === "silence") {
    if (state.silences < 2) {
      const text = NUDGES[state.silences][lang];
      const s = { ...state, silences: state.silences + 1, said: [...state.said, text] };
      return { id: `nudge-${state.silences}`, text, kind: "nudge", stage: STAGES[state.stage], reachedPayment: false, state: s };
    }
    return speakStage({ ...state, stage: state.stage + 1 }, lang);
  }

  if ((RESIST.has(intent) || objection) && state.counterBudget > 0 && !state.counteredThisStage) {
    if (objection) {
      const rung = 3 - state.counterBudget + state.stage;
      const last = state.said[state.said.length - 1] ?? "";
      const text = withName(objectionReply(objection, rung, lang, last), state.name, lang);
      const tactic = OBJ_TACTIC[objection];
      const s: OfficerState = {
        ...state,
        counterBudget: state.counterBudget - 1,
        counteredThisStage: true,
        used: tactic ? withUsed(state, tactic) : state.used,
        objections: [...state.objections, objection],
        said: [...state.said, text],
      };
      return { id: `obj-${objection}-${rung % 3}`, text, kind: "counter", objection, stage: STAGES[state.stage], reachedPayment: false, state: s };
    }
    const key = intent === "question" ? "hesitate" : (intent as "refuse" | "ask_proof" | "mention_family" | "hesitate");
    const lines = COUNTERS[key];
    const text = pick(lines, state.seed, state.stage, lang);
    const tactic = key === "refuse" ? "threat" : key === "mention_family" ? "forbid_family" : key === "ask_proof" ? "deflect_proof" : null;
    const s: OfficerState = {
      ...state,
      counterBudget: state.counterBudget - 1,
      counteredThisStage: true,
      used: tactic ? withUsed(state, tactic) : state.used,
      said: [...state.said, text],
    };
    return { id: `counter-${key}-${variant(lines, state.seed, state.stage)}`, text, kind: "counter", stage: STAGES[state.stage], reachedPayment: false, state: s };
  }

  // Forward: the person went along, or resisted after the officer had already countered once.
  const ack = FORWARD.has(intent) && intent !== "other" ? ACKS[(state.seed + state.stage) % ACKS.length] : undefined;
  return speakStage({ ...state, stage: state.stage + 1 }, lang, ack);
}

const OBJ_TACTIC: Record<Objection, string | null> = {
  doubt: "deflect_proof",
  department: "deflect_proof",
  written: "deflect_proof",
  family: "forbid_family",
  refuse: "threat",
  leave: "threat",
  no_money: "refund_promise",
  angry: "calm_pressure",
  scared: "calm_pressure",
  ask_bot: null,
};

const INTENTS_SET = new Set<string>(["silence", "stop_word", "agree_secret", "will_pay", "code_read", "refuse", "ask_proof", "mention_family", "hesitate", "comply", "question", "other"]);

/** Ruko steps in when the payment ask lands, or once the two heart-of-the-scam tactics have both been used. */
export function rukoShouldStep(state: OfficerState): boolean {
  return state.reachedPayment || HIGH_RISK.every((t) => state.used.includes(t));
}

/** Every line the officer can ever say, for tests (none may ask for a secret, a card, or anything real). */
export const ALL_OFFICER_LINES: string[] = [
  ...Object.values(STAGE_LINES).flat(),
  ...Object.values(COUNTERS).flat(),
  ...NUDGES,
  ...ACKS,
].flatMap((l) => [l.en, l.hing]);

/** Plain-words list of what the officer did, for the result screen. */
export const tacticsUsed = (state: OfficerState): string[] => state.used.map((t) => TACTIC_LABEL[t] ?? t);
