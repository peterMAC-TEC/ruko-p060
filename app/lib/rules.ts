import { coercionReasons } from "./coercion";
import { STAGES, threatPoints, type StageId, type ThreatLevel } from "./threat";
import type { CallSignals, Channel, Payee, PaymentBehaviour, Reason, Transfer } from "./types";

// Bank-side rules engine. Pure, so it can be tested without a server.
// Rules only ever add points. A "hard" reason holds the payment whatever the
// total, and nothing (including the LLM) can switch a hard reason off.
// Risk comes from behaviour, never from the reason the customer gives:
// digital-arrest victims are coached to say "it's for a property".

export const FLAG_THRESHOLD = 50;
export const COOLING_OFF_MINUTES = 60; // RBI April 2026 proposal: 1-hour lag
export const LARGE_PAYMENT = 10_000; // RBI proposal threshold for the lag
export const TRUSTED_PERSON_AMOUNT = 50_000; // RBI proposal: 70+ need approval above this
export const TRUSTED_PERSON_AGE = 70;
const LONG_CALL_MINUTES = 20;
const AFTER_CALL_WINDOW_MINUTES = 30;

const SCAM_PAYEE =
  /\b(rbi|reserve bank|safe ?(account|custody)|verification|escrow|nodal|cbi|customs|police|court|narcotics|ed\b|enforcement)/i;

const PAYMENT_CHANNELS: Channel[] = ["upi", "imps", "neft", "rtgs"];

export interface RuleContext {
  amount: number;
  payee: string;
  payeeAccount: string;
  channel?: Channel;
  knownPayees: Payee[];
  history: Transfer[];
  /** Present only when the elder has granted the `call_signals` consent. */
  signals?: CallSignals;
  /** Highest recent score from the Ruko voice check or call signals. */
  rukoScore?: number;
  /** An earlier scam was spotted and not yet cleared by family or the bank. */
  protectionActive?: boolean;
  /** A fixed deposit was closed early in the last 24 hours. */
  recentFdBreak?: boolean;
  elderAge?: number;
  /** The elder has a trusted person who can approve. */
  hasTrustedPerson?: boolean;
  /** The fused threat engine's view (lib/threat.ts). When present it replaces rukoScore. */
  threat?: { level: ThreatLevel; probability: number; stagesActive: StageId[] };
  /** How the payment was made (consented coercion signals, lib/coercion.ts). */
  behaviour?: PaymentBehaviour | null;
  /** What is known about the destination account (mule intelligence). */
  payeeIntel?: { reports: number; victims: number };
  /** Payments held, blocked or cancelled in the last 24 hours. */
  recentHeld?: number;
  now?: Date;
}

export interface RuleResult {
  score: number;
  /** Held for any reason, including trusted-person approval. */
  flagged: boolean;
  /** Held because it looks like a scam (not only waiting for approval). */
  scam: boolean;
  /** The trusted person must approve before it can go. */
  needsApproval: boolean;
  reasons: Reason[];
}

export function median(xs: number[]) {
  if (xs.length === 0) return 0;
  const s = xs.toSorted((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

function liveCall(s: CallSignals | undefined, now: Date) {
  if (!s?.unknown_number || s.call_minutes < LONG_CALL_MINUTES) return { during: false, after: false, since: 0 };
  if (s.on_call) return { during: true, after: false, since: 0 };
  if (!s.call_ended_at) return { during: false, after: false, since: 0 };
  const since = (now.getTime() - Date.parse(s.call_ended_at)) / 60_000;
  return { during: false, after: since <= AFTER_CALL_WINDOW_MINUTES, since };
}

export function evaluateTransfer(ctx: RuleContext): RuleResult {
  const reasons: Reason[] = [];
  const now = ctx.now ?? new Date();
  const channel = ctx.channel ?? "upi";
  const isPayment = PAYMENT_CHANNELS.includes(channel);
  const call = liveCall(ctx.signals, now);

  if (channel === "fd_break") {
    // Closing an FD early isn't a payment, but it's how digital-arrest victims
    // raise the money. Pause it only when there's a live scam signal.
    if (call.during || ctx.protectionActive) {
      reasons.push({
        code: "fd_break_under_pressure",
        label: call.during
          ? `Closing a fixed deposit early while on a ${ctx.signals!.call_minutes}-minute call with an unknown number`
          : "Closing a fixed deposit early after Ruko paused a payment",
        points: 50,
        hard: true,
        consent: call.during ? "call_signals" : undefined,
      });
    }
    return finish(reasons);
  }

  if (isPayment && SCAM_PAYEE.test(`${ctx.payee} ${ctx.payeeAccount}`)) {
    reasons.push({
      code: "scam_payee_name",
      label: `Payee "${ctx.payee}" sounds like a government "safe account". No agency ever asks you to move money to one.`,
      points: 60,
      hard: true,
    });
  }

  const isNew =
    isPayment && !ctx.knownPayees.some((p) => p.account.toLowerCase() === ctx.payeeAccount.toLowerCase());
  if (isNew) {
    reasons.push({ code: "new_payee", label: "First payment to this payee", points: 25, hard: false });
  }

  const past = ctx.history
    .filter((t) => t.status === "completed" && t.channel !== "fd_break")
    .map((t) => t.amount);
  const typical = median(past);
  if (typical > 0) {
    const ratio = ctx.amount / typical;
    if (ratio >= 10) {
      reasons.push({
        code: "amount_extreme",
        label: `${inr(ctx.amount)} is ${Math.round(ratio)}× the usual payment (${inr(typical)})`,
        points: 40,
        hard: isNew,
      });
    } else if (ratio >= 5) {
      reasons.push({
        code: "amount_large",
        label: `${inr(ctx.amount)} is ${Math.round(ratio)}× the usual payment (${inr(typical)})`,
        points: 30,
        hard: false,
      });
    }
  }

  if (call.during) {
    reasons.push({
      code: "during_long_call",
      label: `On a ${ctx.signals!.call_minutes}-minute call with an unknown number right now`,
      points: 35,
      hard: true,
      consent: "call_signals",
    });
  } else if (call.after) {
    reasons.push({
      code: "after_long_call",
      label: `${Math.max(1, Math.round(call.since))} min after a ${ctx.signals!.call_minutes}-minute call with an unknown number`,
      points: 30,
      hard: false,
      consent: "call_signals",
    });
  }

  // Mule intelligence: other customers were stopped paying this account, or it was reported.
  if (isPayment && ctx.payeeIntel) {
    const { victims, reports } = ctx.payeeIntel;
    if (victims >= 2 || reports >= 3) {
      reasons.push({
        code: "mule_cluster",
        label:
          victims >= 2
            ? `${victims} other customers were stopped paying this account as a likely scam in the last 30 days`
            : `This account has been reported ${reports} times as a scam account`,
        points: 60,
        hard: true,
      });
    } else if (victims === 1 || reports >= 1) {
      reasons.push({ code: "mule_reported", label: "This account has been linked to a reported scam", points: 25, hard: false });
    }
  }

  // Coercion signals from how the payment was made (capped, never hard on their own).
  if (isPayment) reasons.push(...coercionReasons(ctx.behaviour));

  // A second large attempt soon after one was stopped: the scammer pushing again.
  if ((ctx.recentHeld ?? 0) >= 1 && ctx.amount >= LARGE_PAYMENT) {
    reasons.push({ code: "repeat_attempt", label: "Another large payment soon after one was stopped", points: 25, hard: false });
  }

  if (ctx.threat) {
    // The fused view across every signal Ruko has (call check, number, family, bank).
    const { points, hard } = threatPoints(ctx.threat);
    if (points > 0) {
      const stages = ctx.threat.stagesActive.map((id) => STAGES.find((x) => x.id === id)!.name.toLowerCase()).join(" → ");
      reasons.push({
        code: "threat_engine",
        label: `Ruko sees an active scam pattern (${Math.round(ctx.threat.probability * 100)}%${stages ? `: ${stages}` : ""})`,
        points,
        hard,
      });
    }
  } else if (ctx.rukoScore !== undefined && ctx.rukoScore >= 40) {
    reasons.push({
      code: "ruko_risk",
      label: `Ruko's call check rated the call ${ctx.rukoScore}/100 risky`,
      points: Math.round(ctx.rukoScore * 0.5),
      hard: ctx.rukoScore >= 70,
    });
  }

  // The hold follows the elder: one warning just sends victims to another bank
  // or channel (Rajkot, Sep 2026), so it stays until family or the bank clears it.
  if (ctx.protectionActive && ctx.amount >= LARGE_PAYMENT) {
    reasons.push({
      code: "protection_active",
      label: "Ruko paused an earlier payment today. Large payments wait until your family or the bank clears it.",
      points: 40,
      hard: true,
    });
  }

  if (ctx.recentFdBreak && ctx.amount >= LARGE_PAYMENT) {
    reasons.push({
      code: "fd_broken_recently",
      label: "A fixed deposit was closed early in the last 24 hours",
      points: 30,
      hard: false,
    });
  }

  if (channel === "cash" && ctx.amount >= TRUSTED_PERSON_AMOUNT && (call.during || ctx.protectionActive || ctx.recentFdBreak)) {
    reasons.push({
      code: "large_cash",
      label: `${inr(ctx.amount)} cash withdrawal while there are signs of a scam (scammers now collect cash in person)`,
      points: 35,
      hard: true,
    });
  }

  if (
    isPayment &&
    ctx.hasTrustedPerson &&
    (ctx.elderAge ?? 0) >= TRUSTED_PERSON_AGE &&
    ctx.amount >= TRUSTED_PERSON_AMOUNT
  ) {
    reasons.push({
      code: "trusted_person_required",
      label: `Payments of ${inr(TRUSTED_PERSON_AMOUNT)} or more need your trusted person's OK (RBI has proposed this for people over ${TRUSTED_PERSON_AGE})`,
      points: 0,
      hard: true,
    });
  }

  return finish(reasons);
}

function finish(reasons: Reason[]): RuleResult {
  const score = Math.min(100, reasons.reduce((n, r) => n + r.points, 0));
  const needsApproval = reasons.some((r) => r.code === "trusted_person_required");
  const scamReasons = reasons.filter((r) => r.code !== "trusted_person_required");
  const scam = score >= FLAG_THRESHOLD || scamReasons.some((r) => r.hard);
  return { score, flagged: scam || needsApproval, scam, needsApproval, reasons };
}

export function ageFrom(birthYear: number | null | undefined, now = new Date()) {
  return birthYear ? now.getFullYear() - birthYear : undefined;
}
