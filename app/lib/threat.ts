// Ruko's threat engine: every signal Ruko sees (the call check, the caller's
// number, how a payment is being made, family, the bank) becomes a tactic
// observation, and the observations are fused into one live estimate of "this
// person is in a scam right now", mapped onto the stages of the attack.
//
// The model is a naive-Bayes log-odds sum with three corrections that matter
// for real fraud signals:
//   1. evidence decays (a call five hours ago says little about now);
//   2. correlated evidence is discounted (several signs of the same stage are
//      not independent: the strongest counts fully, the rest at half weight);
//   3. coverage across stages is itself evidence (a coordinated attack walks
//      the kill chain: authority → fear → isolation → money).
// Counter-evidence (a cryptographically verified call from the real bank)
// lowers the estimate, which is what keeps false alarms down.
//
// Likelihood ratios are expert priors from docs/research/01, 03 and 08, to be
// re-fitted on trial data. Pure functions: no I/O, tested in scripts/check-threat.ts.

export type StageId = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7";

export const STAGES: Array<{ id: StageId; name: string; hint: string }> = [
  { id: "S1", name: "Contact", hint: "An unknown, foreign or reported number gets through" },
  { id: "S2", name: "Authority", hint: "The caller claims to be police, a court, the bank or a courier" },
  { id: "S3", name: "Fear", hint: "An accusation: drugs, money laundering, an arrest warrant" },
  { id: "S4", name: "Isolation", hint: "Stay on the call or camera, tell no one" },
  { id: "S5", name: "Control", hint: "Install an app, share the screen, read out an OTP" },
  { id: "S6", name: "Extraction", hint: "Move money to a 'safe' account, break an FD, withdraw cash" },
  { id: "S7", name: "Re-victimisation", hint: "A second demand, or a 'recovery' fee" },
];

export type TacticId =
  | "RT01"
  | "RT02"
  | "RT03"
  | "RT04"
  | "RT05"
  | "RT06"
  | "RT07"
  | "RT08"
  | "RT09"
  | "RT10"
  | "RT11"
  | "RT12"
  | "RT13"
  | "RT14"
  | "RT15"
  | "RT16"
  | "RT17";

export interface Tactic {
  id: TacticId;
  stage: StageId | null; // null = meta evidence (duress, self-report, verified call)
  name: string;
  /** Default likelihood ratio P(signal | scam) / P(signal | no scam). <1 is counter-evidence. */
  lr: number;
  /** Minutes for the evidence to lose half its weight. */
  halfLife: number;
  elder: { en: string; hi: string };
}

const MIN = 1;
const HOUR = 60;
const DAY = 24 * HOUR;

export const TACTICS: Record<TacticId, Tactic> = {
  RT01: { id: "RT01", stage: "S1", name: "Risky caller number", lr: 4, halfLife: 2 * HOUR, elder: { en: "The number that called is risky", hi: "कॉल करने वाला नंबर जोखिम भरा है" } },
  RT02: { id: "RT02", stage: "S2", name: "Impersonated authority", lr: 5, halfLife: 2 * HOUR, elder: { en: "The caller claims to be an official", hi: "कॉल करने वाला खुद को अधिकारी बताता है" } },
  RT03: { id: "RT03", stage: "S3", name: "Accusation or arrest threat", lr: 15, halfLife: 3 * HOUR, elder: { en: "You were threatened with arrest or a case", hi: "आपको गिरफ़्तारी या केस की धमकी दी गई" } },
  RT04: { id: "RT04", stage: "S3", name: "Manufactured urgency", lr: 3, halfLife: 2 * HOUR, elder: { en: "You were told to act right now", hi: "आपसे तुरंत कुछ करने को कहा गया" } },
  RT05: { id: "RT05", stage: "S4", name: "Isolation: stay on the call", lr: 10, halfLife: 3 * HOUR, elder: { en: "You were told to stay on the call or camera", hi: "आपसे कॉल या कैमरे पर रहने को कहा गया" } },
  RT06: { id: "RT06", stage: "S4", name: "Secrecy demand", lr: 8, halfLife: 3 * HOUR, elder: { en: "You were told to keep it secret", hi: "आपसे इसे गुप्त रखने को कहा गया" } },
  RT07: { id: "RT07", stage: "S5", name: "Remote access or app install", lr: 8, halfLife: 6 * HOUR, elder: { en: "You were asked to install an app or share your screen", hi: "आपसे ऐप डालने या स्क्रीन दिखाने को कहा गया" } },
  RT08: { id: "RT08", stage: "S5", name: "Credential harvest (OTP, PIN)", lr: 12, halfLife: 6 * HOUR, elder: { en: "You were asked for an OTP or PIN", hi: "आपसे OTP या PIN माँगा गया" } },
  RT09: { id: "RT09", stage: "S6", name: "Payment to a 'safe' or 'verification' account", lr: 25, halfLife: 12 * HOUR, elder: { en: "Money is going to a 'safe' or 'verification' account", hi: "पैसा 'सेफ़' या 'वेरिफ़िकेशन' खाते में जा रहा है" } },
  RT10: { id: "RT10", stage: "S6", name: "Liquidation (unusual amount, FD break, cash)", lr: 4, halfLife: 12 * HOUR, elder: { en: "An unusually large amount is being moved", hi: "बहुत बड़ी रकम भेजी जा रही है" } },
  RT11: { id: "RT11", stage: "S6", name: "Coerced payment behaviour", lr: 3, halfLife: 2 * HOUR, elder: { en: "The payment looks like it's being dictated", hi: "लगता है भुगतान किसी के कहने पर हो रहा है" } },
  RT12: { id: "RT12", stage: "S6", name: "Mule destination account", lr: 60, halfLife: 7 * DAY, elder: { en: "Other people were scammed into paying this account", hi: "दूसरे लोगों से भी ठगी करके इसी खाते में पैसा डलवाया गया" } },
  RT13: { id: "RT13", stage: "S7", name: "Repeat demand", lr: 5, halfLife: DAY, elder: { en: "Another payment soon after a held one", hi: "रोके गए भुगतान के तुरंत बाद एक और भुगतान" } },
  RT14: { id: "RT14", stage: null, name: "Duress signalled by the customer", lr: 500, halfLife: DAY, elder: { en: "You used your safety PIN", hi: "आपने अपना सुरक्षा PIN इस्तेमाल किया" } },
  RT15: { id: "RT15", stage: "S2", name: "Claims to be the bank, but no verified bank call", lr: 6, halfLife: 2 * HOUR, elder: { en: "Your bank's app shows no call from them", hi: "आपके बैंक के ऐप में उनकी कोई कॉल नहीं दिख रही" } },
  RT16: { id: "RT16", stage: null, name: "The customer raised concern", lr: 3, halfLife: 6 * HOUR, elder: { en: "You asked your family for help", hi: "आपने परिवार से मदद माँगी" } },
  RT17: { id: "RT17", stage: null, name: "Verified call from the real bank", lr: 0.3, halfLife: 30 * MIN, elder: { en: "Your bank really is calling (verified)", hi: "आपका बैंक सच में कॉल कर रहा है (सत्यापित)" } },
};

export type ThreatSource = "radar" | "number" | "bank" | "behaviour" | "mule" | "duress" | "family" | "callintent" | "drill";

export interface Observation {
  tactic: TacticId;
  at: string; // ISO time
  source: ThreatSource;
  /** Overrides the tactic's default likelihood ratio (e.g. a stronger number report). */
  lr?: number;
  /** Short, non-identifying explanation for analysts ("STOP after 2 yes answers"). */
  evidence?: string;
}

export type ThreatLevel = "none" | "watch" | "elevated" | "high" | "critical";

export const BASE_RATE = 0.01; // prior: 1 in 100 "is something wrong right now" moments
export const LEVELS: Array<{ level: ThreatLevel; min: number }> = [
  { level: "critical", min: 0.95 },
  { level: "high", min: 0.8 },
  { level: "elevated", min: 0.5 },
  { level: "watch", min: 0.2 },
  { level: "none", min: 0 },
];

export interface ActiveTactic {
  tactic: TacticId;
  stage: StageId | null;
  weight: number; // decayed log-LR contribution actually used
  lr: number;
  at: string;
  sources: ThreatSource[];
  evidence: string[];
}

export interface ThreatAssessment {
  probability: number;
  logOdds: number;
  level: ThreatLevel;
  /** Furthest kill-chain stage with live evidence. */
  stage: StageId | null;
  stagesActive: StageId[];
  tactics: ActiveTactic[];
  duress: boolean;
  verifiedCall: boolean;
  playbook: PlaybookAction[];
}

const logit = (p: number) => Math.log(p / (1 - p));
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));
export const decay = (ageMinutes: number, halfLife: number) => (ageMinutes <= 0 ? 1 : Math.pow(0.5, ageMinutes / halfLife));

/** Evidence older than this many half-lives is dropped entirely. */
const MAX_HALF_LIVES = 6;

export function assess(observations: Observation[], now = new Date()): ThreatAssessment {
  // 1. Per tactic, keep the strongest decayed observation (repeats are not new evidence).
  const best = new Map<TacticId, ActiveTactic>();
  for (const o of observations) {
    const t = TACTICS[o.tactic];
    if (!t) continue;
    const age = (now.getTime() - Date.parse(o.at)) / 60_000;
    if (age < -5 || age > t.halfLife * MAX_HALF_LIVES) continue;
    const lr = o.lr ?? t.lr;
    const w = Math.log(lr) * decay(age, t.halfLife);
    const prev = best.get(o.tactic);
    if (!prev || Math.abs(w) > Math.abs(prev.weight)) {
      best.set(o.tactic, {
        tactic: o.tactic,
        stage: t.stage,
        weight: w,
        lr,
        at: o.at,
        sources: [...new Set([...(prev?.sources ?? []), o.source])],
        evidence: [...(prev?.evidence ?? []), ...(o.evidence ? [o.evidence] : [])].slice(-3),
      });
    } else {
      prev.sources = [...new Set([...prev.sources, o.source])];
      if (o.evidence) prev.evidence = [...prev.evidence, o.evidence].slice(-3);
    }
  }
  let active = [...best.values()].filter((a) => Math.abs(a.weight) > 0.05);
  // A verified call from the real bank lowers the estimate, but never cancels
  // money going to a "safe account" or a known mule account (docs/research/08).
  if (active.some((a) => (a.tactic === "RT09" || a.tactic === "RT12") && a.weight > 0)) active = active.filter((a) => a.tactic !== "RT17");

  // 2. Within one stage, the strongest tactic counts fully, the others at half
  //    weight (they are correlated: one scammer, one script).
  let sum = logit(BASE_RATE);
  const byStage = new Map<StageId | "meta", ActiveTactic[]>();
  for (const a of active) {
    const k = a.stage ?? "meta";
    byStage.set(k, [...(byStage.get(k) ?? []), a]);
  }
  for (const [k, list] of byStage) {
    const sorted = list.toSorted((x, y) => y.weight - x.weight);
    sorted.forEach((a, i) => {
      const factor = k === "meta" || i === 0 || a.weight < 0 ? 1 : 0.5;
      a.weight = a.weight * factor;
      sum += a.weight;
    });
  }

  // 3. Coverage across the kill chain is evidence of a coordinated attack.
  const stagesActive = STAGES.map((s) => s.id).filter((id) => active.some((a) => a.stage === id && a.weight > 0.3));
  if (stagesActive.length >= 4) sum += Math.log(6);
  else if (stagesActive.length === 3) sum += Math.log(3);

  const duress = active.some((a) => a.tactic === "RT14");
  const verifiedCall = active.some((a) => a.tactic === "RT17");
  let probability = sigmoid(sum);
  if (duress) probability = Math.max(probability, 0.99);
  const level = LEVELS.find((l) => probability >= l.min)!.level;
  const stage = stagesActive.at(-1) ?? null;

  return {
    probability,
    logOdds: sum,
    level,
    stage,
    stagesActive,
    tactics: active.toSorted((a, b) => b.weight - a.weight),
    duress,
    verifiedCall,
    playbook: playbookFor(level, { duress, stage }),
  };
}

// ---------- the response playbook ----------

export type PlaybookAction =
  | "nudge" // gentle "check before you pay" on the next payment
  | "stop_on_payment" // a STOP screen before any payment
  | "money_lock" // the protection hold: large payments wait for family or bank
  | "alert_family" // the Ruko Family alert with "what to say"
  | "bank_review" // the fraud desk queue, top priority
  | "bank_callback" // the bank makes a verified call to the customer
  | "freeze_outbound"; // every outbound channel paused (duress)

export function playbookFor(level: ThreatLevel, ctx: { duress: boolean; stage: StageId | null }): PlaybookAction[] {
  if (ctx.duress) return ["freeze_outbound", "money_lock", "alert_family", "bank_review", "bank_callback"];
  switch (level) {
    case "critical":
      return ["money_lock", "alert_family", "bank_review", "bank_callback"];
    case "high":
      return ["money_lock", "alert_family", "bank_review"];
    case "elevated":
      return ["stop_on_payment", "bank_review"];
    case "watch":
      return ["nudge"];
    default:
      return [];
  }
}

export const PLAYBOOK_LABEL: Record<PlaybookAction, string> = {
  nudge: "Gentle check before the next payment",
  stop_on_payment: "STOP screen before any payment",
  money_lock: "Money Lock: large payments wait for family or bank",
  alert_family: "Alert Ruko Family with what to say",
  bank_review: "Fraud desk review (priority)",
  bank_callback: "Bank makes a verified call-back",
  freeze_outbound: "Freeze every outbound channel",
};

/** For the rules engine: points and whether the fused threat alone should hold a payment. */
export function threatPoints(a: Pick<ThreatAssessment, "level" | "probability">): { points: number; hard: boolean } {
  switch (a.level) {
    case "critical":
    case "high":
      return { points: 60, hard: true };
    case "elevated":
      return { points: 35, hard: false };
    case "watch":
      return { points: 15, hard: false };
    default:
      return { points: 0, hard: false };
  }
}

// ---------- mapping existing signals onto tactics ----------

/** Radar identities that claim official authority, with how strongly that alone points to a scam. */
export const IDENTITY_LR: Record<string, number> = {
  police: 8,
  courier: 3,
  bank: 2,
  electricity: 3,
  customer_care: 2,
  investment: 4,
  video_stranger: 4,
  loan: 3,
  tech_support: 4,
  family: 1.5,
};

/** The guided-check questions → tactics. */
export const QUESTION_TACTIC: Record<string, TacticId[]> = {
  stay_on_call: ["RT05"],
  pay_avoid_arrest: ["RT03", "RT09"],
  install_app: ["RT07"],
  share_otp: ["RT08"],
  keep_secret: ["RT06"],
};

/** Rules-engine reason codes → tactics. */
export const REASON_TACTIC: Record<string, TacticId> = {
  scam_payee_name: "RT09",
  amount_extreme: "RT10",
  amount_large: "RT10",
  fd_break_under_pressure: "RT10",
  large_cash: "RT10",
  during_long_call: "RT05",
  after_long_call: "RT05",
  payee_pasted: "RT11",
  app_switching: "RT11",
  dictated_amount: "RT11",
  hesitation: "RT11",
  mule_cluster: "RT12",
  mule_reported: "RT12",
  repeat_attempt: "RT13",
};
