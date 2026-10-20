import "server-only";
import { createHash } from "node:crypto";
import { cookies, headers } from "next/headers";
import { getViewer } from "./auth";
import { isPrivateHost } from "./guard";
import { flags } from "./flags";
import {
  createParticipant,
  createPracticeAccount,
  createTrialCalls,
  deleteSeededTrial,
  getParticipant,
  listParticipants,
  listTrialCalls,
  practiceActivity,
  resetPracticeAccount,
  updateTrialCall,
} from "./store";
import {
  birthYearFor,
  familyIdFor,
  orderOf,
  planForRow,
  rowForEnrolment,
  TRIAL_ACCOUNT_PREFIX,
  type AgeBand,
  type ControlOutcome,
  type Participant,
  type StoppedBy,
  type TrialCall,
  type TrialEvent,
} from "./trial";

// The trial lab's server logic (method: docs/research/06-trial-methodology.md).
// Only the facilitator uses it: open in DEMO_MODE (their laptop), otherwise a
// researcher or bank-staff login.

export const TRIAL_CONSENT_VERSION = "trial-consent-v1-2026-10";

export const LAB_COOKIE = "ruko_lab";

/**
 * The facilitator only.
 * - A researcher or bank-staff login always works.
 * - In a production build (any deployment): the lab key cookie set by
 *   /lab/unlock?key=RUKO_LAB_KEY. Host headers are never trusted there
 *   (security review M1: Host / X-Forwarded-Host are client-controlled).
 * - In development with DEMO_MODE: the facilitator's own laptop or LAN.
 */
export async function labAllowed(): Promise<boolean> {
  const role = (await getViewer())?.user?.role;
  if (role === "researcher" || role === "fraud_analyst") return true;
  if (!flags.DEMO_MODE) return false;
  if (process.env.NODE_ENV === "production") {
    const key = process.env.RUKO_LAB_KEY;
    const cookie = (await cookies()).get(LAB_COOKIE)?.value;
    return Boolean(key && cookie && cookie === createHash("sha256").update(key).digest("hex"));
  }
  const h = await headers();
  return isPrivateHost(h.get("host"));
}

export const labDenied = () => Response.json({ error: "The trial lab is for the facilitator only." }, { status: 403 });

const secondsSince = (iso: string | null) => (iso ? Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 1000)) : 0);

export interface NewParticipant {
  age_band: AgeBand;
  gender: Participant["gender"];
  language: string;
  phone_type: Participant["phone_type"];
  uses_upi: boolean | null;
  lives_alone: boolean | null;
  family_present_default: boolean;
  prior_awareness: boolean | null;
  teachback_passed: boolean;
  teachback_attempts: number;
  self_efficacy_pre: number | null;
}

/** Enrols the next participant: code P01…, the next allocation row, a practice account and the call plan. */
export async function enrol(input: NewParticipant): Promise<Participant> {
  const all = await listParticipants();
  const real = all.filter((p) => !p.seeded);
  const used = new Set(all.map((p) => p.code));
  let n = real.length + 1;
  while (used.has(`P${String(n).padStart(2, "0")}`)) n++;
  const code = `P${String(n).padStart(2, "0")}`;

  // Rows are handed out in the logged random order; a person's row is only revealed now, after consent.
  const row = rowForEnrolment(real.length);
  const plan = planForRow(row);
  const accountId = TRIAL_ACCOUNT_PREFIX + crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  await createPracticeAccount(accountId, familyIdFor(accountId), code, birthYearFor(input.age_band));

  const p = await createParticipant({
    ...input,
    code,
    account_id: accountId,
    row_no: row,
    arm_order: orderOf(row),
    self_efficacy_post: null,
    deception_acceptable: null,
    consent_version: TRIAL_CONSENT_VERSION,
    consent_at: new Date().toISOString(),
    plan,
    withdrawn_at: null,
    notes: null,
    seeded: false,
  });
  await createTrialCalls(
    plan.map((c) => ({
      participant_id: p.id,
      order_no: c.order,
      block: c.block,
      arm: c.arm,
      script_id: c.scriptId,
      is_scam: c.isScam,
      channel: c.channel,
      lang: input.language === "hi" ? ("hi" as const) : ("en" as const),
      family_present: input.family_present_default,
    })),
  );
  return p;
}

/** Hours since this person's block 1 ended (for the ≥48 h washout check), or null. */
export async function washoutHours(call: TrialCall): Promise<number | null> {
  if ((call.block ?? 1) !== 2) return null;
  const siblings = await listTrialCalls({ participantId: call.participant_id });
  const ends = siblings.filter((c) => (c.block ?? 1) === 1 && c.ended_at).map((c) => Date.parse(c.ended_at as string));
  return ends.length ? (Date.now() - Math.max(...ends)) / 3_600_000 : null;
}

/** Starts a call: a clean practice account (Ruko off for baseline) and the clock. */
export async function startCall(
  call: TrialCall,
  opts: { lang: "en" | "hi"; channel: "browser" | "phone"; familyPresent: boolean; stressPre?: number | null; facilitatorInRoom?: boolean },
) {
  const p = await getParticipant(call.participant_id);
  if (p?.account_id) await resetPracticeAccount(p.account_id, p.code, birthYearFor(p.age_band), call.arm !== "baseline");
  return updateTrialCall(call.id, {
    status: "live",
    started_at: new Date().toISOString(),
    ended_at: null,
    lang: opts.lang,
    channel: opts.channel,
    family_present: opts.familyPresent,
    stress_pre: opts.stressPre ?? null,
    facilitator_in_room: opts.facilitatorInRoom ?? true,
    live: { seq: 0 },
    // The scale applies to scam calls only; genuine calls get a C0–C3 code instead.
    furthest_step: call.is_scam ? 0 : null,
    step_times: call.is_scam ? { "0": 0 } : {},
    events: [{ t: 0, kind: "started" }],
    level_edit_log: [],
    stopped_by: null,
    time_to_stop_s: null,
    money_moved: false,
    control_outcome: null,
  });
}

/** Raises the furthest step (never lowers it) and stamps when each level was first reached. */
export function raiseStep(call: TrialCall, level: number): Partial<TrialCall> {
  if (call.furthest_step !== null && level <= call.furthest_step) return {};
  const stamps = { ...call.step_times };
  for (let l = (call.furthest_step ?? -1) + 1; l <= level; l++) stamps[String(l)] ??= secondsSince(call.started_at);
  return { furthest_step: level, step_times: stamps };
}

export function withEvent(call: TrialCall, kind: string, detail?: string): Partial<TrialCall> {
  const e: TrialEvent = { t: secondsSince(call.started_at), kind, ...(detail ? { detail } : {}) };
  return { events: [...(call.events ?? []), e] };
}

/** Practice-phone events → scale levels (doc §3.1). */
const EVENT_LEVEL: Record<string, number> = {
  bank_opened: 4,
  payee_entered: 5,
  amount_entered: 5,
};

/** An event from the participant's practice phone, applied to their live call. */
export async function recordPracticeEvent(accountId: string, kind: string, detail?: string) {
  const participant = (await listParticipants()).find((p) => p.account_id === accountId);
  if (!participant) return null;
  const live = (await listTrialCalls({ participantId: participant.id })).find((c) => c.status === "live");
  if (!live) return null;
  let patch: Partial<TrialCall> = withEvent(live, kind, detail);
  const level = EVENT_LEVEL[kind];
  if (level !== undefined && live.is_scam) patch = { ...patch, ...raiseStep(live, level) };
  if (kind === "money_ask_heard" && live.t_money_ask_s === null) patch.t_money_ask_s = secondsSince(live.started_at);
  return updateTrialCall(live.id, patch);
}

export interface Activity {
  transfers: Array<{ id: string; amount: number; payee: string; status: string; at: string }>;
  rukoChecks: Array<{ level: "stop" | "caution" | "clear"; at: string }>;
  familyAlerted: boolean;
  tellFamily: boolean;
}

/**
 * Reads what the practice account logged during this call (payments, Ruko
 * checks, family alerts) and folds it into the call record, so the key
 * outcomes don't depend on the facilitator's clicks.
 */
export async function syncFromActivity(call: TrialCall): Promise<{ call: TrialCall; activity: Activity | null }> {
  const p = await getParticipant(call.participant_id);
  if (!p?.account_id || !call.started_at) return { call, activity: null };
  const a = await practiceActivity(p.account_id);
  const activity: Activity = {
    transfers: a.transfers.map((t) => ({ id: t.id, amount: t.amount, payee: t.payee, status: t.status, at: t.created_at })),
    rukoChecks: a.risk
      .filter((r) => r.source === "agent")
      .map((r) => ({ level: r.score >= 70 ? "stop" : r.score >= 40 ? "caution" : "clear", at: r.created_at })),
    familyAlerted: a.alerts.length > 0,
    tellFamily: a.risk.some((r) => r.source === "elder"),
  };
  if (call.status !== "live") return { call, activity };

  let patch: Partial<TrialCall> = {};
  const n = a.transfers.length;
  const moved = a.transfers.some((t) => t.status === "completed" || t.status === "released");
  const held = a.transfers.some((t) => t.status === "held" || t.status === "blocked" || t.status === "cancelled");
  if (call.is_scam) {
    // Pressing Pay is level 6 in both arms; a second payment is level 7 (persisted).
    if (n >= 2) patch = { ...patch, ...raiseStep(call, 7) };
    else if (n === 1) patch = { ...patch, ...raiseStep(call, 6) };
  }
  if (moved && !call.money_moved) patch.money_moved = true;
  const order = { clear: 0, caution: 1, stop: 2 } as const;
  const top = activity.rukoChecks.reduce<"stop" | "caution" | "clear" | null>((best, c) => (!best || order[c.level] > order[best] ? c.level : best), null);
  if (activity.rukoChecks.length && call.ruko_used !== true) patch.ruko_used = true;
  if (top && top !== call.ruko_level) patch.ruko_level = top;
  if (activity.familyAlerted && !call.family_alerted) patch.family_alerted = true;
  if (held && !call.bank_held) patch.bank_held = true;
  if (!Object.keys(patch).length) return { call, activity };
  return { call: (await updateTrialCall(call.id, patch)) ?? call, activity };
}

/** Ending a call: time to stop, who stopped it, and C3 for a system alarm on a genuine call. */
export function endPatch(call: TrialCall, stoppedBy: StoppedBy | null): Partial<TrialCall> {
  const seconds = secondsSince(call.started_at);
  const paid = (call.furthest_step ?? 0) >= 6;
  const systemAlarm = call.ruko_level === "stop" || call.ruko_level === "caution" || Boolean(call.family_alerted) || Boolean(call.bank_held);
  const control: ControlOutcome | null = call.is_scam ? null : call.arm === "ruko" && systemAlarm ? "C3" : call.control_outcome;
  return {
    status: "ended",
    ended_at: new Date().toISOString(),
    live: { ...call.live, seq: (call.live.seq ?? 0) + 1, kind: "end", ended: true },
    stopped_by: !call.is_scam || paid ? (call.is_scam ? (call.stopped_by ?? null) : null) : (stoppedBy ?? call.stopped_by ?? "self"),
    // Time to stop is censored (null) if they pressed Pay; it doesn't apply to genuine calls.
    time_to_stop_s: !call.is_scam || paid ? null : (call.time_to_stop_s ?? seconds),
    ruko_used: call.ruko_used ?? false,
    money_moved: call.money_moved ?? false,
    control_outcome: control,
    ...withEvent(call, "ended", stoppedBy ?? undefined),
  };
}

// ---------- seeded (illustrative) data ----------

/**
 * Ten fictional participants (D01–D10) on the real allocation table, with
 * plausible outcomes, so the results dashboard can be shown before the trial.
 * Always labelled "illustrative".
 */
export async function seedIllustrativeTrial() {
  await deleteSeededTrial();
  const bands: AgeBand[] = ["65-69", "70-74", "60-64", "75-79", "70-74", "80+", "65-69", "70-74", "60-64", "75-79"];
  // Furthest step [baseline, with Ruko] per row, and what stopped them with Ruko.
  const outcomes: Array<[number, number, StoppedBy]> = [
    [6, 3, "ruko_check"],
    [6, 6, "bank_hold"],
    [5, 2, "self"],
    [7, 5, "bank_hold"],
    [3, 1, "ruko_check"],
    [6, 4, "family"],
    [6, 7, "self"],
    [6, 3, "ruko_check"],
    [2, 2, "self"],
    [6, 5, "ruko_check"],
  ];
  const controls: Array<[ControlOutcome, ControlOutcome]> = [
    ["C0", "C0"],
    ["C1", "C0"],
    ["C0", "C3"],
    ["C0", "C0"],
    ["C2", "C0"],
    ["C0", "C1"],
    ["C0", "C0"],
    ["C0", "C0"],
    ["C1", "C0"],
    ["C0", "C2"],
  ];
  const day = (d: number, h: number) => new Date(Date.UTC(2026, 9, 18 + d, h, 0, 0)).toISOString();

  for (let i = 0; i < 10; i++) {
    const row = i + 1;
    const plan = planForRow(row);
    const p = await createParticipant({
      code: `D${String(row).padStart(2, "0")}`,
      account_id: null,
      row_no: row,
      arm_order: orderOf(row),
      age_band: bands[i],
      gender: i % 2 ? "f" : "m",
      language: i % 3 === 0 ? "hi" : "en",
      phone_type: i === 5 ? "feature" : "smartphone",
      uses_upi: i !== 5,
      lives_alone: i % 4 === 0,
      family_present_default: i % 3 === 1,
      prior_awareness: i % 3 === 0,
      teachback_passed: true,
      teachback_attempts: i === 4 ? 2 : 1,
      self_efficacy_pre: 2 + (i % 3),
      self_efficacy_post: 3 + (i % 3),
      deception_acceptable: i !== 7,
      consent_version: TRIAL_CONSENT_VERSION,
      consent_at: day(0, 4),
      plan,
      withdrawn_at: null,
      notes: null,
      seeded: true,
    });
    const [base, ruko, by] = outcomes[i];
    await createTrialCalls(
      plan.map((c, k) => {
        const step = c.isScam ? (c.arm === "baseline" ? base : ruko) : null;
        const paid = step !== null && step >= 6;
        const start = day(c.block === 1 ? 1 : 4, 5 + k);
        return {
          participant_id: p.id,
          order_no: c.order,
          block: c.block,
          arm: c.arm,
          script_id: c.scriptId,
          is_scam: c.isScam,
          channel: c.channel,
          lang: i % 3 === 0 ? ("hi" as const) : ("en" as const),
          family_present: i % 3 === 1,
          status: "ended" as const,
          started_at: start,
          ended_at: start,
          furthest_step: step,
          money_moved: c.isScam ? (c.arm === "baseline" ? paid : step === 7) : false,
          stopped_by: c.isScam ? (paid ? null : c.arm === "ruko" ? by : "self") : null,
          time_to_stop_s: c.isScam && !paid ? 60 + ((i * 37 + k * 53) % 300) : null,
          ruko_used: c.arm === "ruko",
          ruko_level: c.arm === "ruko" ? (c.isScam ? (by === "ruko_check" ? "stop" : "caution") : controls[i][1] === "C3" ? "caution" : "clear") : null,
          family_alerted: c.arm === "ruko" && c.isScam && (by === "family" || by === "ruko_check"),
          bank_held: c.arm === "ruko" && c.isScam && paid,
          control_outcome: c.isScam ? null : controls[i][c.arm === "baseline" ? 0 : 1],
          belief_real: c.isScam ? (step !== null && step >= 3 ? ("yes" as const) : ("unsure" as const)) : null,
          stress_pre: 1 + (i % 2),
          stress: 1 + ((i + k) % 4),
          stress_after: 1 + ((i + k) % 2),
          adverse_event_level: i === 6 && c.isScam && c.arm === "ruko" ? 1 : 0,
          confidence: 2 + ((i * k) % 4),
          debriefed: true,
          seeded: true,
        };
      }),
    );
  }
}
