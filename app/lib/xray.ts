// X-Ray: what happened inside Ruko for one turn of the live call, step by step, in the judges' five boxes:
//   1 Frontend (user input) → 2 Backend (application logic) → 3 Services (AI, database, tools) →
//   4 Backend prepares the result (checks, formats) → 5 Frontend displays the output.
// Pure code. A trace holds signal codes and timings only, never the words, so it can be kept and shown later.
import { assess, TACTICS, type Observation, type TacticId, type ThreatLevel } from "./threat";

/** The officer's tactics (lib/demo-officer.ts) mapped onto the threat engine's tactic catalogue (lib/threat.ts). */
export const OFFICER_TO_RT: Record<string, TacticId[]> = {
  contact: ["RT02"],
  authority: ["RT02"],
  deflect_proof: ["RT02"],
  fear: ["RT03"],
  threat: ["RT03"],
  urgency: ["RT04"],
  calm_pressure: ["RT04"],
  isolation: ["RT05", "RT06"],
  forbid_family: ["RT06"],
  payment_ask: ["RT09"],
  refund_promise: ["RT09"],
  closing: ["RT11"],
};

export interface ThreatRead {
  probability: number;
  logOdds: number;
  level: ThreatLevel;
  tactics: { id: TacticId; name: string; lr: number }[];
}

/** The threat engine's log-odds fusion over the tactics the caller has used so far. */
export function threatFromUsed(used: string[], now = new Date()): ThreatRead {
  const ids = [...new Set(used.flatMap((u) => OFFICER_TO_RT[u] ?? []))];
  const obs: Observation[] = ids.map((t) => ({ tactic: t, at: now.toISOString(), source: "drill" }));
  const a = assess(obs, now);
  return {
    probability: a.probability,
    logOdds: a.logOdds,
    level: a.level,
    tactics: ids.map((id) => ({ id, name: TACTICS[id].name, lr: TACTICS[id].lr })),
  };
}

export type AiMode = "classified" | "low_confidence" | "skipped_rules_knew" | "skipped_short" | "off" | "offline" | "timeout" | "failed";

export interface TurnTrace {
  n: number;
  /** 1 Frontend: the presenter's turn. Words are counted, never kept. */
  input: { via: "voice" | "typed" | "silence"; words: number; ms: number };
  /** 2 Backend: rules read the turn (intent and objection, in code). */
  rules: { intent: string; objection: string | null; ms: number };
  /** 3 Services: the AI classifier (optional), with its confidence. */
  ai: { mode: AiMode; objection: string | null; state: string | null; confidence: number | null; ms: number; model?: string };
  /** 2 Backend: the state machine's decision and the threat engine's fusion. */
  decision: { kind: string; stage: string | null; move: string; objectionUsed: string | null; ms: number };
  threat: ThreatRead & { ms: number };
  /** 4 Backend prepares: the guard checks the line that will be spoken, then it is matched to a recording. */
  guard: { ok: boolean; why: string | null; recorded: boolean; ms: number };
  /** 5 Frontend: what the person sees and hears. */
  output: { caption: true; tacticsShown: number; stopNow: boolean };
  totalMs: number;
}

export const XRAY_KEY = "ruko-xray-last";

/** A trace with nothing that could identify a person: it is already codes and numbers, this just drops nothing-extra. */
export const safeTrace = (t: TurnTrace): TurnTrace => ({ ...t });

export const BOXES = [
  { id: 1, title: "Frontend", sub: "user input" },
  { id: 2, title: "Backend", sub: "application logic" },
  { id: 3, title: "Services", sub: "AI · database · tools" },
  { id: 4, title: "Backend", sub: "prepares the result" },
  { id: 5, title: "Frontend", sub: "displays the output" },
] as const;

/** A synthetic sample (clearly labelled) for when no call has been made on this device yet. */
export const SAMPLE_TRACE: TurnTrace[] = [
  {
    n: 3,
    input: { via: "voice", words: 7, ms: 0 },
    rules: { intent: "other", objection: null, ms: 0.2 },
    ai: { mode: "classified", objection: "doubt", state: "doubting", confidence: 0.86, ms: 2410 },
    decision: { kind: "counter", stage: "authority", move: "obj-doubt-1", objectionUsed: "doubt", ms: 0.1 },
    threat: { ...threatFromUsed(["contact", "fear", "isolation", "authority"]), ms: 0.1 },
    guard: { ok: true, why: null, recorded: true, ms: 0.1 },
    output: { caption: true, tacticsShown: 3, stopNow: false },
    totalMs: 2412,
  },
];
