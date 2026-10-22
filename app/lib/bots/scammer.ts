import type { DrillScript, DrillStep, Stage } from "../drill";
import { DISCLOSURE } from "../drill";
import { checkCallerLine, NEUTRAL_BRIDGE } from "./guard";
import { classify, type Intent } from "./intent";

// The role-play scammer bot, for consented practice calls only (the trial lab).
// A mix of a fixed script and a live reply:
//   - The SPINE is the drill script's own steps, in order, so every participant meets the same
//     stages (accusation, secrecy, money request) and results stay comparable.
//   - The REPLY is chosen from what the person actually said (lib/bots/intent.ts): hesitation gets the
//     script's pressure line, a question for proof gets a made-up ID, a refusal gets one more push and then
//     the call ends kindly. An optional AI "bridge" sentence can answer an unexpected question first;
//     it is checked by guard.ts and dropped if unsafe.
// Guardrails: fictional agency only, practice bank only, never a real OTP/PIN/Aadhaar, and the call
// ends after two refusals (the distress protocol). Nothing the person says is stored, only the intent.

export type Lang = "en" | "hi";

export interface BotState {
  /** Index into the spine of the step to say next. */
  i: number;
  /** Pushes made on the current step. */
  pushes: number;
  refusals: number;
  proofs: number;
  moneyAsked: boolean;
  ended: "complete" | "gave_up" | null;
}

export interface BotTurn {
  text: string;
  stepId: string;
  stage: Stage;
  kind: "line" | "pressure" | "end";
  /** What the person's last words were classified as (a code, never the words). */
  intent: Intent | null;
  /** Suggested level on the "furthest step" scale for the facilitator to confirm (docs/research/06 s.3.1). */
  suggestLevel: number | null;
  ended: boolean;
  state: BotState;
}

const SKIP = new Set(["drill_disclosure", "debrief"]);

/** The steps the bot walks through, in order. "Pressure" steps are held back for when they are needed. */
export function spine(script: DrillScript): DrillStep[] {
  return script.steps.filter((s) => !SKIP.has(s.id) && s.stage !== "pressure");
}
const pressureSteps = (script: DrillScript) => script.steps.filter((s) => s.stage === "pressure");
const debriefOf = (script: DrillScript) => script.steps.find((s) => s.id === "debrief");

const line = (s: { line_en: string; line_hi: string }, lang: Lang) => (lang === "hi" ? s.line_hi : s.line_en);
const branch = (s: DrillStep, lang: Lang) => (s.branches?.hesitate ? (lang === "hi" ? s.branches.hesitate.hi : s.branches.hesitate.en) : null);

/** Made-up proof, clearly fictional (the agency is the drill's own). */
const PROOF = {
  en: "My ID is C I C four four seven one, Central Investigation Cell, drill office. You may note it down. Now please listen carefully.",
  hi: "मेरा आईडी सी आई सी चार चार सात एक है, सेंट्रल इन्वेस्टिगेशन सेल, ड्रिल ऑफ़िस। आप नोट कर सकते हैं। अब कृपया ध्यान से सुनिए।",
} as const;
const SECRECY_REMINDER = {
  en: "This case is confidential. Speaking to anyone about it will be treated as obstruction.",
  hi: "यह केस गोपनीय है। इसके बारे में किसी से बात करना बाधा माना जाएगा।",
} as const;
const GENERIC_PUSH = {
  en: "Time is running short. Please cooperate so we can close this today.",
  hi: "समय कम है। कृपया सहयोग कीजिए ताकि आज ही यह निपट जाए।",
} as const;
const GIVE_UP_SCAM = {
  en: "Very well. The matter will go through the formal process. Goodbye.",
  hi: "ठीक है। मामला औपचारिक प्रक्रिया से जाएगा। नमस्ते।",
} as const;
const GIVE_UP_CONTROL = {
  en: "No problem at all. Thank you for your time. Goodbye.",
  hi: "कोई बात नहीं। आपके समय के लिए धन्यवाद। नमस्ते।",
} as const;

export const initialState = (): BotState => ({ i: 0, pushes: 0, refusals: 0, proofs: 0, moneyAsked: false, ended: null });

const turn = (script: DrillScript, state: BotState, t: Omit<BotTurn, "state" | "ended"> & { ended?: boolean }): BotTurn => ({
  ...t,
  ended: t.ended ?? false,
  state,
});

/** The first thing said when the person answers: the drill disclosure (when no family is present) and the opening line. */
export function openingTurn(script: DrillScript, lang: Lang, familyPresent: boolean): BotTurn {
  const steps = spine(script);
  const first = steps[0];
  const text = [familyPresent ? null : DISCLOSURE[lang], line(first, lang)].filter(Boolean).join(" ");
  return turn(script, { ...initialState(), i: 1 }, { text, stepId: first.id, stage: first.stage, kind: "line", intent: null, suggestLevel: null });
}

const sayStep = (script: DrillScript, s: DrillStep, state: BotState, lang: Lang, intent: Intent | null, extra = ""): BotTurn => {
  const money = s.stage === "pivot_money" || s.stage === "instruct_transfer";
  return turn(
    script,
    { ...state, moneyAsked: state.moneyAsked || money },
    { text: `${extra ? `${extra} ` : ""}${line(s, lang)}`, stepId: s.id, stage: s.stage, kind: "line", intent, suggestLevel: null },
  );
};

function endCall(script: DrillScript, state: BotState, lang: Lang, intent: Intent | null, by: "complete" | "gave_up", text: string): BotTurn {
  const d = debriefOf(script);
  return turn(
    script,
    { ...state, ended: by },
    { text: `${text} ${d ? line(d, lang) : ""}`.trim(), stepId: "debrief", stage: "close", kind: "end", intent, suggestLevel: null, ended: true },
  );
}

/** Suggest where on the 0-7 scale this reply puts the person. The facilitator confirms; the practice phone fills levels 4-7. */
function suggest(intent: Intent, stage: Stage, answeredBefore: number): number | null {
  if (intent === "refuse") return answeredBefore <= 1 ? 0 : 1;
  if (intent === "code_read") return 3;
  if (intent === "agree_secret") return 2;
  if (intent === "comply" && (stage === "isolate" || stage === "secrecy")) return 2;
  if (intent === "will_pay") return 4;
  return null;
}

/**
 * The bot's next turn, given what the person just said.
 * `heard` is the person's words (used for the intent only, then dropped). `bridge` is an optional AI sentence that answers
 * an unexpected question; it is used only if guard.ts accepts it.
 */
export function nextTurn(
  script: DrillScript,
  state: BotState,
  heard: string | null | undefined,
  lang: Lang,
  opts: { bridge?: string | null; bankHeld?: boolean; relentless?: boolean } = {},
): BotTurn {
  const steps = spine(script);
  const intent = classify(heard);
  const prevStep = steps[Math.max(0, Math.min(steps.length - 1, state.i - 1))];
  const isScam = script.is_scam;
  const level = suggest(intent, prevStep.stage, state.i);
  const withLevel = (t: BotTurn): BotTurn => ({ ...t, suggestLevel: level });

  // The person said the stop word: the caller screen ends the call itself; nothing more to say.
  if (intent === "stop_word") return withLevel(endCall(script, state, lang, intent, "gave_up", ""));

  // The bank held a payment: the script's override line, if it has one.
  if (opts.bankHeld) {
    const override = pressureSteps(script).find((s) => /override/.test(s.id)) ?? pressureSteps(script)[1];
    if (override) return withLevel({ ...sayStep(script, override, state, lang, intent), kind: "pressure" });
  }

  // Stress-test mode (the lab harness only, never with a real participant): a scammer who does not give up. Every
  // push-back gets a pressure line and the script moves on toward the money request regardless.
  const pushing = ["refuse", "hesitate", "ask_proof", "mention_family", "question", "other"].includes(intent);
  if (opts.relentless && isScam && pushing) {
    const push =
      intent === "mention_family" ? SECRECY_REMINDER[lang] : intent === "ask_proof" && state.proofs === 0 ? PROOF[lang] : (branch(prevStep, lang) ?? GENERIC_PUSH[lang]);
    const counts = { refusals: state.refusals + (intent === "refuse" ? 1 : 0), proofs: state.proofs + (intent === "ask_proof" ? 1 : 0), pushes: state.pushes + 1 };
    if (state.i >= steps.length) {
      return withLevel(turn(script, { ...state, ...counts }, { text: push, stepId: prevStep.id, stage: prevStep.stage, kind: "pressure", intent, suggestLevel: null }));
    }
    const next = steps[state.i];
    const money = next.stage === "pivot_money" || next.stage === "instruct_transfer";
    return withLevel(
      turn(
        script,
        { ...state, ...counts, i: state.i + 1, moneyAsked: state.moneyAsked || money },
        { text: `${push} ${line(next, lang)}`, stepId: next.id, stage: next.stage, kind: "pressure", intent, suggestLevel: null },
      ),
    );
  }

  if (intent === "refuse") {
    const refusals = state.refusals + 1;
    // Second refusal, or a refusal on a genuine call: end kindly. Nobody is pushed a third time.
    if (refusals >= 2 || !isScam) {
      return withLevel(endCall(script, { ...state, refusals }, lang, intent, "gave_up", (isScam ? GIVE_UP_SCAM : GIVE_UP_CONTROL)[lang]));
    }
    const hes = branch(prevStep, lang);
    return withLevel(
      turn(script, { ...state, refusals, pushes: state.pushes + 1 }, { text: hes ?? GENERIC_PUSH[lang], stepId: prevStep.id, stage: prevStep.stage, kind: "pressure", intent, suggestLevel: null }),
    );
  }

  if (intent === "ask_proof" && isScam) {
    const proofs = state.proofs + 1;
    // Give proof once; after that treat it as stalling.
    if (proofs === 1) {
      return withLevel(turn(script, { ...state, proofs }, { text: PROOF[lang], stepId: prevStep.id, stage: "verify_fake", kind: "line", intent, suggestLevel: null }));
    }
    const hes = branch(prevStep, lang);
    return withLevel(turn(script, { ...state, proofs, pushes: state.pushes + 1 }, { text: hes ?? GENERIC_PUSH[lang], stepId: prevStep.id, stage: prevStep.stage, kind: "pressure", intent, suggestLevel: null }));
  }

  if (intent === "mention_family" && isScam) {
    return withLevel(turn(script, { ...state, pushes: state.pushes + 1 }, { text: SECRECY_REMINDER[lang], stepId: prevStep.id, stage: "secrecy", kind: "pressure", intent, suggestLevel: null }));
  }

  if ((intent === "hesitate" || intent === "question" || intent === "other") && isScam && state.pushes < 2) {
    const hes = branch(prevStep, lang);
    const bridgeOk = opts.bridge && checkCallerLine(opts.bridge).ok ? opts.bridge : null;
    const text = [bridgeOk, hes ?? (bridgeOk ? "" : GENERIC_PUSH[lang])].filter(Boolean).join(" ");
    return withLevel(turn(script, { ...state, pushes: state.pushes + 1 }, { text: text || NEUTRAL_BRIDGE[lang === "hi" ? "hi" : "en"], stepId: prevStep.id, stage: prevStep.stage, kind: "pressure", intent, suggestLevel: null }));
  }

  // Going along (or a genuine call, or pushed enough already): the next step of the script.
  if (state.i >= steps.length) return withLevel(endCall(script, state, lang, intent, "complete", ""));
  return withLevel(sayStep(script, steps[state.i], { ...state, i: state.i + 1, pushes: 0 }, lang, intent));
}
