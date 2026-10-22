import type { DrillLibrary, DrillScript } from "../drill";
import { BUNDLED_LIBRARY } from "../patterns";
import { runRadar } from "../radar";
import { assess, defend, defenderStart, ALL_DEFENDER_LINES, type DLang } from "./defender";
import { checkCallerLine } from "./guard";
import { initialState, nextTurn, openingTurn, spine, type BotState } from "./scammer";

// The test harness: the role-play scammer bot against the defender bot, over every drill script, in
// English and Hindi, clean and with the kind of noise speech-to-text adds. No people and no AI, so it is
// instant, free, and gives the same answer every time, which makes it a regression test for Ruko.
//
// What it measures (honestly):
//   - DETECTION: on which line of a scam did Ruko's own phrase check first say "be careful" and first say STOP,
//     and was that before the caller asked for money? On genuine calls, did it warn when it shouldn't (false alarm)?
//   - HOLDING: how many turns did the defender hold, and did the call end by the defender leaving or the scammer giving up?
//   - SAFETY: did the defender ever agree to pay or hand over anything? (It must be zero.)
// What it does NOT measure: whether a real older person would stop. That is the trial's job (/results).

export type Noise = "clean" | "asr1" | "asr2";
export const NOISES: Noise[] = ["clean", "asr1", "asr2"];

/** goes_along: a person who says "okay" to everything. defender: the defender bot vs the kind scammer. relentless: the defender vs a scammer who never gives up. */
export type Who = "defender" | "goes_along" | "relentless";

export interface RunResult {
  /** Who answers the caller: the defender bot, or a person who just goes along ("okay") so Ruko is tested on the whole call. */
  who: Who;
  scriptId: string;
  title: string;
  isScam: boolean;
  lang: "en" | "hi";
  noise: Noise;
  turns: number;
  endedBy: "defender_exit" | "scammer_gave_up" | "script_complete" | "max_turns";
  /** Scammer line (1-based) where Ruko first warned, and first showed STOP. Null if never. */
  firstFlagLine: number | null;
  stopLine: number | null;
  /** Scammer line (1-based) where money was first asked. Null if never. */
  moneyLine: number | null;
  /** Scams only: Ruko said STOP before the money request. */
  stoppedBeforeMoney: boolean | null;
  /** Scams only: Ruko said "be careful" or STOP before the money request. */
  warnedBeforeMoney: boolean | null;
  /** Genuine calls only: Ruko warned or stopped. */
  falseAlarm: boolean | null;
  /** Genuine calls only: the defender wrongly treated the caller as a threat. */
  defenderFalseAlarm: boolean | null;
  /** Times the defender agreed to pay, share or hand over anything. Must be 0. */
  leaks: number;
  /** Times a scammer line broke the drill's guardrails (real names, real secrets). Must be 0. */
  guardBreaks: number;
  familyAlertedAtLine: number | null;
}

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MISHEAR: Array<[RegExp, string]> = [
  [/\barrest\b/gi, "a rest"],
  [/\bwarrant\b/gi, "war rant"],
  [/\bverification\b/gi, "vary fication"],
  [/\bconfidential\b/gi, "confident shall"],
  [/\bcase\b/gi, "k's"],
  [/\bsavings\b/gi, "say wings"],
];

/** What speech-to-text might make of a line: no punctuation or capitals, some words dropped or misheard. */
export function addNoise(text: string, noise: Noise, seed: number): string {
  if (noise === "clean") return text;
  const r = rng(seed);
  let t = text.toLowerCase().replace(/[.,;:!?'"]/g, "");
  const dropRate = noise === "asr1" ? 0.06 : 0.14;
  if (noise === "asr2") for (const [re, to] of MISHEAR) if (r() < 0.5) t = t.replace(re, to);
  return t
    .split(/\s+/)
    .filter(() => r() > dropRate)
    .join(" ");
}

const COMPLIANCE = /\b(i will (send|transfer|pay)|i'?ll (send|transfer|pay)|here is (my|the) (otp|code|pin)|my (otp|pin|password) is|ok(ay)? i('| wi)ll)\b|\b(?!1930\b)\d{4,}\b/i;

export function runOne(script: DrillScript, lang: "en" | "hi", noise: Noise, seed = 1, who: Who = "defender"): RunResult {
  const dlang: DLang = "en";
  const dlangFor: DLang = lang === "hi" ? "hing" : dlang;
  let bot: BotState = initialState();
  let dstate = defenderStart();
  let turn = openingTurn(script, lang, true);
  const heard: string[] = [];
  let firstFlagLine: number | null = null;
  let stopLine: number | null = null;
  let moneyLine: number | null = null;
  let familyAlertedAtLine: number | null = null;
  let defenderFalseAlarm = false;
  let leaks = 0;
  let guardBreaks = 0;
  let turns = 0;
  let endedBy: RunResult["endedBy"] = "max_turns";
  const MAX = Math.max(24, spine(script).length * 3);

  for (let n = 1; n <= MAX; n++) {
    turns = n;
    bot = turn.state;
    const spoken = addNoise(turn.text, noise, seed * 100 + n);
    heard.push(spoken);
    if (!checkCallerLine(turn.text).ok && !turn.text.includes("Ruko") && !/Central Investigation Cell|C I C/.test(turn.text)) {
      // Scripted lines name the fictional cell and may say OTP only to warn; count only real names and long numbers.
      if (/\b(cbi|rbi|trai|sbi|hdfc|icici|fedex|dhl)\b/i.test(turn.text) || /\d[\d\s-]{6,}\d/.test(turn.text)) guardBreaks++;
    }
    if (turn.stage === "pivot_money" || turn.stage === "instruct_transfer") moneyLine ??= n;
    const soFar = heard.join(" ");
    const level = runRadar(BUNDLED_LIBRARY, { answers: {}, said: soFar }).level;
    if (level !== "clear") firstFlagLine ??= n;
    if (level === "stop") stopLine ??= n;
    if (turn.ended) {
      endedBy = turn.state.ended === "complete" ? "script_complete" : "scammer_gave_up";
      break;
    }
    if (who === "goes_along") {
      turn = nextTurn(script, bot, "okay", lang);
      if (turn.ended) {
        turns = n + 1;
        endedBy = "script_complete";
        break;
      }
      continue;
    }
    const d = defend(dstate, soFar, dlangFor);
    dstate = d.state;
    if (d.alertFamily) familyAlertedAtLine ??= n;
    if (!script.is_scam && d.tactic !== "thanks") defenderFalseAlarm = true;
    if (COMPLIANCE.test(d.text)) leaks++;
    if (d.end) {
      endedBy = "defender_exit";
      break;
    }
    turn = nextTurn(script, bot, d.text, lang, { relentless: who === "relentless" });
    if (turn.ended) {
      turns = n + 1;
      endedBy = turn.state.ended === "complete" ? "script_complete" : "scammer_gave_up";
      break;
    }
  }

  const scam = script.is_scam;
  return {
    who,
    scriptId: script.id,
    title: script.title_en,
    isScam: scam,
    lang,
    noise,
    turns,
    endedBy,
    firstFlagLine,
    stopLine,
    moneyLine,
    stoppedBeforeMoney: scam ? stopLine !== null && (moneyLine === null || stopLine <= moneyLine) : null,
    warnedBeforeMoney: scam ? firstFlagLine !== null && (moneyLine === null || firstFlagLine <= moneyLine) : null,
    falseAlarm: scam ? null : firstFlagLine !== null,
    defenderFalseAlarm: scam ? null : defenderFalseAlarm,
    leaks,
    guardBreaks,
    familyAlertedAtLine,
  };
}

export function runAll(lib: DrillLibrary): RunResult[] {
  const out: RunResult[] = [];
  for (const script of lib.scripts)
    for (const lang of ["en", "hi"] as const)
      for (const noise of NOISES)
        for (const who of ["goes_along", "defender", "relentless"] as const) out.push(runOne(script, lang, noise, noise === "clean" ? 1 : noise === "asr1" ? 7 : 13, who));
  return out;
}

export interface Summary {
  scamRuns: number;
  stoppedBeforeMoney: number;
  warnedBeforeMoney: number;
  warnedAtAll: number;
  medianStopLine: number | null;
  defenderExits: number;
  controlRuns: number;
  rukoFalseAlarms: number;
  defenderFalseAlarms: number;
  leaks: number;
  guardBreaks: number;
}

const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) / 2)] : null);

export function summarize(all: RunResult[], who?: Who): Summary {
  const rs = who ? all.filter((r) => r.who === who) : all;
  const scams = rs.filter((r) => r.isScam);
  const controls = rs.filter((r) => !r.isScam);
  return {
    scamRuns: scams.length,
    stoppedBeforeMoney: scams.filter((r) => r.stoppedBeforeMoney).length,
    warnedBeforeMoney: scams.filter((r) => r.warnedBeforeMoney).length,
    warnedAtAll: scams.filter((r) => r.firstFlagLine !== null).length,
    medianStopLine: median(scams.map((r) => r.stopLine).filter((x): x is number => x !== null)),
    defenderExits: scams.filter((r) => r.endedBy === "defender_exit").length,
    controlRuns: controls.length,
    rukoFalseAlarms: controls.filter((r) => r.falseAlarm).length,
    defenderFalseAlarms: controls.filter((r) => r.defenderFalseAlarm).length,
    leaks: rs.reduce((n, r) => n + r.leaks, 0),
    guardBreaks: rs.reduce((n, r) => n + r.guardBreaks, 0),
  };
}

export { assess, ALL_DEFENDER_LINES };
