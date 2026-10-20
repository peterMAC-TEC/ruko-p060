// The feasibility pilot (method: docs/research/06-trial-methodology.md):
// the outcome scale, the fixed allocation table, and the statistics for the
// results dashboard. Pure functions, no I/O, so the same code runs in the
// browser, on the server and in scripts/check-trial.ts.

export type Arm = "baseline" | "ruko" | "control"; // "control" only on legacy rows; controls now carry an arm
export type StoppedBy = "self" | "ruko_check" | "family" | "bank_hold" | "stop_word" | "facilitator";
export type AgeBand = "60-64" | "65-69" | "70-74" | "75-79" | "80+";
export type ControlOutcome = "C0" | "C1" | "C2" | "C3";
export const AGE_BANDS: AgeBand[] = ["60-64", "65-69", "70-74", "75-79", "80+"];

/**
 * The ordered "furthest step reached" scale for scam calls (lower is safer).
 * Every level is an observable act; 4–7 come from the practice phone.
 * Coding rule when unsure: pick the level that is worse for Ruko's case.
 */
export const SCALE = [
  { level: 0, short: "Ended at once", long: "Hung up, said RUKO, or refused before the accusation was finished", auto: false },
  { level: 1, short: "Heard it, then ended", long: "Stayed past the accusation, then ended or refused; agreed to nothing, shared nothing", auto: false },
  { level: 2, short: "Complied", long: "Agreed to stay on the line, keep it secret or not tell family", auto: false },
  { level: 3, short: "Disclosed", long: "Read out the on-screen DRILL code, or started giving account or ID details", auto: false },
  { level: 4, short: "Went to pay", long: "Opened the practice bank, or said they would go to the bank or ATM", auto: true },
  { level: 5, short: "Started payment", long: "Entered a payee or an amount", auto: true },
  { level: 6, short: "Pressed Pay", long: "Pressed Pay / Send (the same act in both arms)", auto: true },
  { level: 7, short: "Persisted", long: "Obeyed the follow-up demand: a second payment, a retry, or tried to get the hold lifted", auto: true },
] as const;

/** PRIMARY (north star): stopped before pressing Pay. The same act in both arms. */
export const stoppedBeforePay = (level: number | null | undefined) => level !== null && level !== undefined && level <= 5;

export const STOPPED_BY_LABEL: Record<StoppedBy, string> = {
  self: "On their own",
  ruko_check: "Ruko's check (STOP)",
  family: "Family",
  bank_hold: "Bank warning or hold",
  stop_word: "Said RUKO",
  facilitator: "Facilitator (safety)",
};

export const CONTROL_LABEL: Record<ControlOutcome, string> = {
  C0: "Completed normally",
  C1: "Completed after checking",
  C2: "Refused a genuine request",
  C3: "System false alarm",
};

// ---------- allocation: the fixed 10-row table (doc §4.1) ----------

/** The two matched scam scripts (S-A, S-B) and the two controls (K1, K2) used for measured calls. */
export const MEASURED = {
  SA: "scam_digital_arrest",
  SB: "scam_courier_drugs",
  K1: "control_bank_kyc",
  K2: "control_courier_delivery",
} as const;
type Slot = keyof typeof MEASURED;
type Cell = [Slot, "baseline" | "ruko"];

// Block 1 = calls 1–2, block 2 = calls 3–4 (≥48 h later). The block-2 scam is the real phone call.
const B = "baseline";
const R = "ruko";
export const ALLOCATION_TABLE: Cell[][] = [
  [["SA", B], ["K1", B], ["SB", R], ["K2", R]],
  [["K1", B], ["SB", B], ["K2", R], ["SA", R]],
  [["K2", B], ["SA", B], ["K1", R], ["SB", R]],
  [["SB", B], ["K2", B], ["SA", R], ["K1", R]],
  [["SA", B], ["K2", B], ["SB", R], ["K1", R]],
  [["K2", R], ["SA", R], ["K1", B], ["SB", B]],
  [["SB", R], ["K2", R], ["SA", B], ["K1", B]],
  [["K1", R], ["SA", R], ["K2", B], ["SB", B]],
  [["K1", R], ["SB", R], ["K2", B], ["SA", B]],
  [["SA", R], ["K2", R], ["SB", B], ["K1", B]],
];

/** The logged seed for the row order; rows are revealed one at a time as people enrol. */
export const ALLOCATION_SEED = 20261018;

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The random (but reproducible) order in which rows 1–10 are handed out. */
export function rowOrder(seed = ALLOCATION_SEED): number[] {
  const rows = Array.from({ length: ALLOCATION_TABLE.length }, (_, i) => i + 1);
  const rnd = mulberry32(seed);
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
}

export interface PlannedCall {
  order: number;
  block: 1 | 2;
  arm: "baseline" | "ruko";
  slot: Slot;
  scriptId: string;
  isScam: boolean;
  channel: "browser" | "phone";
}

/** The four calls for an allocation row (1–10). */
export function planForRow(row: number): PlannedCall[] {
  const cells = ALLOCATION_TABLE[(row - 1) % ALLOCATION_TABLE.length];
  return cells.map(([slot, arm], i) => {
    const block = (i < 2 ? 1 : 2) as 1 | 2;
    const isScam = slot === "SA" || slot === "SB";
    return { order: i + 1, block, arm, slot, scriptId: MEASURED[slot], isScam, channel: isScam && block === 2 ? "phone" : "browser" };
  });
}

/** AB = baseline block first, BA = Ruko block first. */
export const orderOf = (row: number): "AB" | "BA" => (ALLOCATION_TABLE[(row - 1) % ALLOCATION_TABLE.length][0][1] === "baseline" ? "AB" : "BA");

/** The row for the k-th person enrolled (0-based). */
export const rowForEnrolment = (k: number) => rowOrder()[k % ALLOCATION_TABLE.length];

// ---------- statistics ----------

/** Wilson score 95% interval for k successes out of n. */
export function wilson(k: number, n: number, z = 1.959964): [number, number] {
  if (n === 0) return [0, 1];
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = (p + (z * z) / (2 * n)) / d;
  const h = (z / d) * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

function logChoose(n: number, k: number) {
  let s = 0;
  for (let i = 1; i <= k; i++) s += Math.log(n - k + i) - Math.log(i);
  return s;
}
function binomPmf(n: number, k: number, p: number) {
  if (p <= 0) return k === 0 ? 1 : 0;
  if (p >= 1) return k === n ? 1 : 0;
  return Math.exp(logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
}
function binomCdf(n: number, k: number, p: number) {
  let s = 0;
  for (let i = 0; i <= k; i++) s += binomPmf(n, i, p);
  return Math.min(1, s);
}

/** Clopper–Pearson exact 95% interval (the conservative one for small n). */
export function clopperPearson(k: number, n: number, alpha = 0.05): [number, number] {
  if (n === 0) return [0, 1];
  const bisect = (f: (p: number) => number) => {
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 80; i++) {
      const mid = (lo + hi) / 2;
      if (f(mid) > 0) hi = mid;
      else lo = mid;
    }
    return (lo + hi) / 2;
  };
  const lower = k === 0 ? 0 : bisect((p) => 1 - binomCdf(n, k - 1, p) - alpha / 2);
  const upper = k === n ? 1 : bisect((p) => alpha / 2 - binomCdf(n, k, p));
  return [lower, upper];
}

/** Exact (binomial) McNemar on the discordant pairs b and c. */
export function mcnemarExact(b: number, c: number): number {
  const m = b + c;
  if (m === 0) return 1;
  return Math.min(1, 2 * binomCdf(m, Math.min(b, c), 0.5));
}

/** McNemar mid-p (Fagerland, Lydersen & Laake 2013). */
export function mcnemarMidP(b: number, c: number): number {
  const m = b + c;
  if (m === 0) return 1;
  const k = Math.min(b, c);
  if (b === c) return 1 - 0.5 * binomPmf(m, b, 0.5);
  return Math.min(1, 2 * (binomCdf(m, k, 0.5) - 0.5 * binomPmf(m, k, 0.5)));
}

/**
 * Newcombe's hybrid score 95% CI for the paired difference pR − pB.
 * a = both stopped, b = only with Ruko, c = only without, d = neither.
 */
export function newcombePaired(a: number, b: number, c: number, d: number): { diff: number; ci: [number, number] } {
  const n = a + b + c + d;
  if (n === 0) return { diff: 0, ci: [-1, 1] };
  const pR = (a + b) / n;
  const pB = (a + c) / n;
  const [l1, u1] = wilson(a + b, n);
  const [l2, u2] = wilson(a + c, n);
  const den = Math.sqrt((a + b) * (c + d) * (a + c) * (b + d));
  const phi = den === 0 ? 0 : (a * d - b * c) / den;
  const D = pR - pB;
  const lower = D - Math.sqrt(Math.max(0, (pR - l1) ** 2 - 2 * phi * (pR - l1) * (u2 - pB) + (u2 - pB) ** 2));
  const upper = D + Math.sqrt(Math.max(0, (u1 - pR) ** 2 - 2 * phi * (u1 - pR) * (pB - l2) + (pB - l2) ** 2));
  return { diff: D, ci: [Math.max(-1, lower), Math.min(1, upper)] };
}

/**
 * Exact two-sided Wilcoxon signed-rank test on paired differences (zeros
 * dropped, average ranks for ties) by enumerating sign patterns, plus the
 * matched-pairs rank-biserial r = (W+ − W−) / T.
 */
export function wilcoxonSignedRank(diffs: number[]): { n: number; wPlus: number; p: number; r: number } {
  const d = diffs.filter((x) => x !== 0);
  const n = d.length;
  if (n === 0) return { n: 0, wPlus: 0, p: 1, r: 0 };
  const abs = d.map((x, i) => ({ a: Math.abs(x), i })).sort((x, y) => x.a - y.a);
  const ranks = new Array<number>(n);
  for (let i = 0; i < n; ) {
    let j = i;
    while (j + 1 < n && abs[j + 1].a === abs[i].a) j++;
    const rk = (i + j + 2) / 2;
    for (let k = i; k <= j; k++) ranks[abs[k].i] = rk;
    i = j + 1;
  }
  const wPlus = d.reduce((s, x, i) => s + (x > 0 ? ranks[i] : 0), 0);
  const total = (n * (n + 1)) / 2;
  const observed = Math.abs(wPlus - total / 2);
  let extreme = 0;
  const combos = 2 ** n;
  for (let m = 0; m < combos; m++) {
    let w = 0;
    for (let i = 0; i < n; i++) if (Math.floor(m / 2 ** i) % 2 === 1) w += ranks[i];
    if (Math.abs(w - total / 2) >= observed - 1e-9) extreme++;
  }
  return { n, wPlus, p: Math.min(1, extreme / combos), r: (wPlus - (total - wPlus)) / total };
}

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function quantile(xs: number[], q: number): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const pos = (s.length - 1) * q;
  const lo = Math.floor(pos);
  return s[lo] + (s[Math.min(lo + 1, s.length - 1)] - s[lo]) * (pos - lo);
}

// ---------- the results summary ----------

export interface CallRow {
  participant_id: string;
  order_no: number;
  block: number | null;
  arm: Arm;
  script_id: string;
  is_scam: boolean;
  status: "ready" | "live" | "ended" | "aborted";
  channel: "browser" | "phone";
  family_present: boolean;
  furthest_step: number | null;
  money_moved: boolean | null;
  stopped_by: StoppedBy | null;
  time_to_stop_s: number | null;
  ruko_level: "stop" | "caution" | "clear" | null;
  family_alerted: boolean | null;
  bank_held: boolean | null;
  control_outcome: ControlOutcome | null;
  adverse_event_level: number | null;
  stress: number | null;
  debriefed: boolean;
}

export interface Rate {
  k: number;
  n: number;
  rate: number | null;
  wilson: [number, number];
  exact: [number, number];
}
const rate = (k: number, n: number): Rate => ({ k, n, rate: n ? k / n : null, wilson: wilson(k, n), exact: clopperPearson(k, n) });

export interface ArmStats {
  stopped: Rate; // primary: stopped before pay
  moneyMoved: Rate; // secondary (system)
  medianStep: number | null;
  steps: number[];
  timeToStop: { median: number | null; q1: number | null; q3: number | null };
}

export interface PersonPair {
  participant_id: string;
  order: "AB" | "BA";
  baseline: number;
  ruko: number;
}

export interface TrialSummary {
  participants: number;
  completedCalls: number;
  baseline: ArmStats;
  ruko: ArmStats;
  paired: {
    n: number;
    a: number; // both stopped
    b: number; // only with Ruko
    c: number; // only without Ruko
    d: number; // neither
    difference: { diff: number; ci: [number, number] };
    mcnemarExact: number;
    mcnemarMidP: number;
    wilcoxon: { n: number; wPlus: number; p: number; r: number };
    people: PersonPair[];
  };
  byOrder: Record<"AB" | "BA", { n: number; pRuko: number | null; pBaseline: number | null }>;
  firstPeriod: { baseline: Rate; ruko: Rate };
  controls: {
    rukoArm: { falseAlarms: Rate };
    overSuspicion: { baseline: Rate; ruko: Rate };
  };
  whatStopped: Record<StoppedBy, number>;
  safety: { adverseEvents: number; serious: number; debriefedShare: number | null };
}

function armStats(rows: CallRow[]): ArmStats {
  const done = rows.filter((r) => r.furthest_step !== null);
  const stops = done.filter((r) => stoppedBeforePay(r.furthest_step));
  const t = stops.map((r) => r.time_to_stop_s).filter((x): x is number => x !== null);
  return {
    stopped: rate(stops.length, done.length),
    moneyMoved: rate(done.filter((r) => r.money_moved).length, done.length),
    medianStep: median(done.map((r) => r.furthest_step as number)),
    steps: SCALE.map((s) => done.filter((r) => r.furthest_step === s.level).length),
    timeToStop: { median: median(t), q1: quantile(t, 0.25), q3: quantile(t, 0.75) },
  };
}

/** The person's arm order, read from their block-1 calls. */
function orderFor(rows: CallRow[], pid: string): "AB" | "BA" {
  const first = rows.filter((r) => r.participant_id === pid).sort((a, b) => a.order_no - b.order_no)[0];
  return first?.arm === "ruko" ? "BA" : "AB";
}

export function summarize(calls: CallRow[]): TrialSummary {
  const ended = calls.filter((c) => c.status === "ended");
  const scams = ended.filter((c) => c.is_scam && c.furthest_step !== null);
  const baseline = scams.filter((c) => c.arm === "baseline");
  const ruko = scams.filter((c) => c.arm === "ruko");

  const firstOf = (rows: CallRow[], pid: string) => rows.filter((r) => r.participant_id === pid).sort((a, b) => a.order_no - b.order_no)[0];
  const pids = [...new Set(scams.map((c) => c.participant_id))];
  const people: PersonPair[] = [];
  for (const pid of pids) {
    const b = firstOf(baseline, pid);
    const r = firstOf(ruko, pid);
    if (b && r) people.push({ participant_id: pid, order: orderFor(calls, pid), baseline: b.furthest_step as number, ruko: r.furthest_step as number });
  }
  const s = stoppedBeforePay;
  const a = people.filter((p) => s(p.ruko) && s(p.baseline)).length;
  const bOnlyRuko = people.filter((p) => s(p.ruko) && !s(p.baseline)).length;
  const cOnlyBase = people.filter((p) => !s(p.ruko) && s(p.baseline)).length;
  const d = people.filter((p) => !s(p.ruko) && !s(p.baseline)).length;

  const byOrder = (o: "AB" | "BA") => {
    const g = people.filter((p) => p.order === o);
    return {
      n: g.length,
      pRuko: g.length ? g.filter((p) => s(p.ruko)).length / g.length : null,
      pBaseline: g.length ? g.filter((p) => s(p.baseline)).length / g.length : null,
    };
  };

  // First period only: each person's block-1 scam call (between-people, uncontaminated by the other arm).
  const block1 = scams.filter((c) => (c.block ?? (c.order_no <= 2 ? 1 : 2)) === 1);
  const fp = (arm: "baseline" | "ruko") => {
    const rows = block1.filter((c) => c.arm === arm);
    return rate(rows.filter((c) => s(c.furthest_step)).length, rows.length);
  };

  const controls = ended.filter((c) => !c.is_scam);
  const rukoControls = controls.filter((c) => c.arm === "ruko");
  const c2 = (arm: "baseline" | "ruko") => {
    const rows = controls.filter((c) => c.arm === arm && c.control_outcome);
    return rate(rows.filter((c) => c.control_outcome === "C2").length, rows.length);
  };

  const whatStopped = Object.fromEntries(Object.keys(STOPPED_BY_LABEL).map((k) => [k, 0])) as Record<StoppedBy, number>;
  for (const c of ruko) if (c.stopped_by && s(c.furthest_step)) whatStopped[c.stopped_by]++;

  const adverse = ended.filter((c) => (c.adverse_event_level ?? 0) >= 1);
  return {
    participants: new Set(ended.map((c) => c.participant_id)).size,
    completedCalls: ended.length,
    baseline: armStats(baseline),
    ruko: armStats(ruko),
    paired: {
      n: people.length,
      a,
      b: bOnlyRuko,
      c: cOnlyBase,
      d,
      difference: newcombePaired(a, bOnlyRuko, cOnlyBase, d),
      mcnemarExact: mcnemarExact(bOnlyRuko, cOnlyBase),
      mcnemarMidP: mcnemarMidP(bOnlyRuko, cOnlyBase),
      wilcoxon: wilcoxonSignedRank(people.map((p) => p.baseline - p.ruko)),
      people,
    },
    byOrder: { AB: byOrder("AB"), BA: byOrder("BA") },
    firstPeriod: { baseline: fp("baseline"), ruko: fp("ruko") },
    controls: {
      rukoArm: { falseAlarms: rate(rukoControls.filter((c) => c.control_outcome === "C3").length, rukoControls.length) },
      overSuspicion: { baseline: c2("baseline"), ruko: c2("ruko") },
    },
    whatStopped,
    safety: {
      adverseEvents: adverse.length,
      serious: ended.filter((c) => (c.adverse_event_level ?? 0) >= 3).length,
      debriefedShare: ended.length ? ended.filter((c) => c.debriefed).length / ended.length : null,
    },
  };
}

/** A birth year in the middle of the age band, for the 70+ trusted-person rule. */
export function birthYearFor(band: AgeBand, year = new Date().getFullYear()) {
  const mid = { "60-64": 62, "65-69": 67, "70-74": 72, "75-79": 77, "80+": 82 }[band];
  return year - mid;
}

/** The fake codes shown on the practice phone for the "read me the code" step (never a real OTP). */
export function drillCodes(callId: string) {
  let h = 0;
  for (const ch of callId) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return { case4: String(1000 + (h % 9000)), track6: String(100000 + ((h >>> 3) % 900000)) };
}

/** Free text must never hold names or numbers: warn on long digit runs. */
export const looksIdentifying = (text: string) => /\d{5,}|\+91|@/.test(text);

// ---------- records ----------

export interface Participant {
  id: string;
  code: string;
  account_id: string | null;
  row_no: number | null;
  arm_order: "AB" | "BA" | null;
  age_band: AgeBand;
  gender: "f" | "m" | "x" | "na" | null;
  language: string;
  phone_type: "smartphone" | "feature" | "none" | null;
  uses_upi: boolean | null;
  lives_alone: boolean | null;
  family_present_default: boolean;
  prior_awareness: boolean | null;
  teachback_passed: boolean | null;
  teachback_attempts: number | null;
  self_efficacy_pre: number | null;
  self_efficacy_post: number | null;
  deception_acceptable: boolean | null;
  consent_version: string | null;
  consent_at: string | null;
  plan: PlannedCall[];
  withdrawn_at: string | null;
  notes: string | null;
  seeded: boolean;
  created_at: string;
}

/** What the caller screen is saying right now; `seq` changes on every new line. */
export interface LiveState {
  seq?: number;
  stepId?: string;
  kind?: "line" | "pressure" | "end";
  text?: string;
  ended?: boolean;
  /** The participant pressed Accept on the caller screen. */
  answered?: boolean;
}

export interface TrialEvent {
  t: number; // seconds from the start of the call
  kind: string;
  detail?: string;
}

export interface TrialCall extends CallRow {
  id: string;
  lang: "en" | "hi";
  live: LiveState;
  started_at: string | null;
  ended_at: string | null;
  step_times: Record<string, number>;
  ruko_used: boolean | null;
  participant_refused: boolean | null;
  confidence: number | null;
  belief_real: "yes" | "unsure" | "no" | null;
  stress_pre: number | null;
  stress_after: number | null;
  deviation: string | null;
  facilitator_in_room: boolean;
  t_money_ask_s: number | null;
  events: TrialEvent[];
  level_edit_log: Array<{ at: string; from: number | null; to: number; why: string }>;
  notes: string | null;
  seeded: boolean;
  created_at: string;
}

/** Practice accounts and their stand-in family member live in their own id range, so they act as a sandbox. */
export const TRIAL_ACCOUNT_PREFIX = "00000000-0000-4000-a000-";
export const TRIAL_FAMILY_PREFIX = "00000000-0000-4000-b000-";
export const isTrialAccountId = (id: string) => id.startsWith(TRIAL_ACCOUNT_PREFIX) || id.startsWith(TRIAL_FAMILY_PREFIX);
export const familyIdFor = (accountId: string) => TRIAL_FAMILY_PREFIX + accountId.slice(TRIAL_ACCOUNT_PREFIX.length);
