import { phraseHits, type Identity, type PatternLibrary, type ScamPattern } from "./patterns";

// Scam Radar's in-call guided check (v2). Pure and fast: it runs on the
// device against the cached library, so the STOP screen appears in well under
// a second and works offline. Nothing the person says leaves the device.

export type RadarQuestion = "stay_on_call" | "pay_avoid_arrest" | "install_app" | "share_otp" | "keep_secret";
export type Answer = "yes" | "no" | "unsure";
export type Sensitivity = "low" | "normal" | "high";

export const RADAR_QUESTIONS: RadarQuestion[] = ["stay_on_call", "pay_avoid_arrest", "install_app", "share_otp", "keep_secret"];

/** v2: two or more "yes" answers trigger STOP. Sensitivity moves that line. */
export const STOP_THRESHOLD: Record<Sensitivity, number> = { high: 1, normal: 2, low: 3 };

// When the person didn't say who called, the questions still hint at the scam.
const QUESTION_HINTS: Partial<Record<RadarQuestion, string>> = {
  pay_avoid_arrest: "digital_arrest",
  install_app: "otp_screenshare",
  share_otp: "kyc_block",
};

export interface RadarInput {
  identity?: Identity;
  answers: Partial<Record<RadarQuestion, Answer>>;
  said?: string;
  sensitivity?: Sensitivity;
}

export interface RadarResult {
  /** stop: full-screen STOP. caution: be careful, check first. clear: nothing found (never "safe"). */
  level: "stop" | "caution" | "clear";
  yes: number;
  pattern: ScamPattern | null;
  /** Codes only, for metrics and the family alert. */
  signals: string[];
}

export function runRadar(lib: PatternLibrary, input: RadarInput): RadarResult {
  const threshold = STOP_THRESHOLD[input.sensitivity ?? "normal"];
  const signals: string[] = [];
  let yes = 0;
  for (const q of RADAR_QUESTIONS) {
    if (input.answers[q] === "yes") {
      yes++;
      signals.push(`q_${q}`);
    }
  }

  // Which scam is it? Who they claimed to be wins, then what they said, then the answers.
  const byIdentity = input.identity && input.identity !== "unknown"
    ? lib.patterns.find((p) => p.identity.includes(input.identity!))
    : undefined;
  const byPhrase = lib.patterns
    .map((p) => ({ p, hits: phraseHits(p, input.said ?? "") }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits || (a.p.severity === "high" ? -1 : 1))[0];
  if (byPhrase) signals.push(`said_${byPhrase.p.id}`);

  let pattern: ScamPattern | null = byIdentity ?? byPhrase?.p ?? null;
  if (!pattern) {
    if (input.answers.keep_secret === "yes" && input.answers.stay_on_call === "yes") {
      pattern = lib.patterns.find((p) => p.id === "digital_arrest") ?? null;
    } else {
      const hinted = RADAR_QUESTIONS.find((q) => input.answers[q] === "yes" && QUESTION_HINTS[q]);
      pattern = hinted ? (lib.patterns.find((p) => p.id === QUESTION_HINTS[hinted]) ?? null) : null;
    }
  }

  // Hearing two or more of a serious scam's own phrases is a STOP by itself.
  const phraseStop = Boolean(byPhrase && byPhrase.hits >= 2 && byPhrase.p.severity === "high");
  const level: RadarResult["level"] =
    yes >= threshold || phraseStop ? "stop" : yes > 0 || byPhrase ? "caution" : "clear";

  return { level, yes, pattern, signals };
}
