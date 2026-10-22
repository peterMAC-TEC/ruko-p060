import "server-only";
import { isDemoId } from "./auth";
import { alertCircle } from "./circle";
import { recordEvent } from "./metrics";
import { classifyPin, LOCK_MINUTES, MAX_TRIES } from "./pin";
import { assessGuard, ageBandOf } from "./guard-assess";
import { hashAccount } from "./privacy";
import { ageFrom, COOLING_OFF_MINUTES, evaluateTransfer } from "./rules";
import { REASON_TACTIC, type ThreatSource } from "./threat";
import { assessElder, duressActive, observe, recordAction, type NewObservation } from "./threat-server";
import {
  addPayee,
  createApprovals,
  createTransfer,
  getPinState,
  getProtection,
  getSignals,
  getTransfer,
  getUser,
  hasConsent,
  listCircle,
  listPayees,
  listTransfers,
  payeeIntel,
  recordPinFailure,
  recentFdBreak,
  recentRisk,
  setProtection,
  updateTransfer,
  updateUser,
} from "./store";
import type { Channel, PaymentBehaviour, Transfer } from "./types";

/** Which source each rules-engine reason is evidence from. */
const TACTIC_SOURCE: Record<string, ThreatSource> = {
  payee_pasted: "behaviour",
  app_switching: "behaviour",
  dictated_amount: "behaviour",
  hesitation: "behaviour",
  during_long_call: "bank",
  after_long_call: "bank",
};

// Everything that happens when an elder tries to move money, in one place.

export interface PaymentInput {
  amount: number;
  payee: string;
  payeeAccount: string;
  channel: Channel;
  /** The 4-digit UPI PIN typed on the practice bank (the duress PIN also works, silently). */
  pin?: string;
  /** How the payment was made (lib/coercion.ts); used only with transaction_risk consent. */
  behaviour?: PaymentBehaviour | null;
}

export type PinError = { pinError: "wrong" | "locked" | "unset"; triesLeft?: number; lockedUntil?: string };

/**
 * Checks the PIN. Wrong tries count towards a short lock (account-level, so
 * spoofing an IP to dodge the per-client rate limit doesn't help); the duress
 * PIN is reported as such. Used by payments and by PIN changes.
 */
export async function verifyPin(
  elderId: string,
  pin: string | undefined,
  opts: { duressIsWrong?: boolean } = {},
): Promise<"ok" | "duress" | PinError> {
  const state = await getPinState(elderId);
  if (!state) return { pinError: "wrong" };
  if (state.pin_locked_until && Date.parse(state.pin_locked_until) > Date.now()) return { pinError: "locked", lockedUntil: state.pin_locked_until };
  const result = await classifyPin(pin ?? "", state, { sandbox: isDemoId(elderId) });
  if (result === "unset") return { pinError: "unset" };
  // Where the duress PIN has no meaning (changing settings) it counts as a wrong
  // try like any other, so it can't be told apart or used to dodge the lock (review H2).
  if (result === "wrong" || (result === "duress" && opts.duressIsWrong)) {
    const { fails, lockedUntil } = await recordPinFailure(elderId, MAX_TRIES, LOCK_MINUTES);
    return lockedUntil ? { pinError: "locked", lockedUntil } : { pinError: "wrong", triesLeft: Math.max(0, MAX_TRIES - fails) };
  }
  if (state.pin_fails) await updateUser(elderId, { pin_fails: 0, pin_locked_until: null });
  return result;
}

export async function submitPayment(
  elderId: string,
  input: PaymentInput,
): Promise<{ transfer: Transfer; riskEventId: string | undefined } | PinError> {
  const pin = await verifyPin(elderId, input.pin);
  if (typeof pin === "object") return pin;
  if (pin === "duress") return duressPayment(elderId, input);
  // While a duress freeze is on, every payment quietly "processes" too: a hold
  // screen now would tell a scammer watching the phone what happened (review H1).
  if (await duressActive(elderId)) return duressPayment(elderId, input, { repeat: true });

  // Call signals and transaction risk are used only with the elder's consent.
  const [signalsAllowed, behaviourAllowed, elder, circle, protection, fd] = await Promise.all([
    hasConsent(elderId, "call_signals"),
    hasConsent(elderId, "transaction_risk"),
    getUser(elderId),
    listCircle(elderId),
    getProtection(elderId),
    recentFdBreak(elderId),
  ]);
  const payeeHash = input.channel === "cash" || input.channel === "fd_break" ? null : hashAccount(input.payeeAccount);
  const behaviour = behaviourAllowed ? (input.behaviour ?? null) : null;
  const digital = ["upi", "imps", "neft", "rtgs"].includes(input.channel);

  // The customer's kill switch: every digital payment is blocked until the family code word resumes them.
  if (digital && protection.payments_paused) {
    const transfer = await createTransfer({
      elder_id: elderId,
      amount: input.amount,
      payee: input.payee,
      payee_account: input.payeeAccount,
      channel: input.channel,
      flagged: true,
      score: 0,
      reasons: [
        { code: "guard_kill_switch_on", label: "Ruko Guard (the customer's own choice): all digital payments are paused. The family code word resumes them.", points: 0, hard: true },
        { code: "guard_decision_block", label: "Ruko Guard decision: block", points: 0, hard: false },
      ],
      needs_approval: false,
      status: "blocked",
      hold_until: null,
      payee_hash: payeeHash,
      behaviour,
    });
    return { transfer, riskEventId: undefined };
  }

  // A trial's baseline call: the practice account behaves like a bank without Ruko.
  if (elder?.ruko_enabled === false) {
    const transfer = await createTransfer({
      elder_id: elderId,
      amount: input.amount,
      payee: input.payee,
      payee_account: input.payeeAccount,
      channel: input.channel,
      flagged: false,
      score: 0,
      reasons: [],
      needs_approval: false,
      status: "completed",
      hold_until: null,
      payee_hash: payeeHash,
      behaviour,
    });
    return { transfer, riskEventId: undefined };
  }

  const [knownPayees, history, signals, risk, intel, threat] = await Promise.all([
    listPayees(elderId),
    listTransfers({ elderId }),
    signalsAllowed ? getSignals(elderId) : undefined,
    recentRisk(elderId),
    payeeHash ? payeeIntel(payeeHash, elderId) : Promise.resolve(undefined),
    assessElder(elderId),
  ]);
  const trusted = circle.members.filter((m) => m.trusted);
  const dayAgo = Date.now() - 86_400_000;
  const recentHeld = history.filter(
    (t) => !t.seeded && ["held", "blocked", "cancelled"].includes(t.status) && Date.parse(t.created_at) >= dayAgo,
  ).length;

  const result = evaluateTransfer({
    ...input,
    knownPayees,
    history,
    signals,
    rukoScore: risk?.score,
    protectionActive: protection.active,
    recentFdBreak: Boolean(fd),
    elderAge: ageFrom(elder?.birth_year),
    hasTrustedPerson: trusted.length > 0,
    threat: threat.assessment,
    behaviour,
    payeeIntel: intel,
    recentHeld,
  });

  // Ruko Guard: the same decision a real bank would ask for over POST /api/guard/assess (lib/guard-assess.ts).
  // The mock bank merges it with its own rules: whichever is stricter wins.
  const guard = digital
    ? assessGuard({
        customerAgeBand: ageBandOf(ageFrom(elder?.birth_year)),
        amountInr: input.amount,
        newPayee: result.reasons.some((r) => r.code === "new_payee"),
        rukoFlag: protection.active,
        payeeRisk: intel ? { reports: intel.reports, victims: intel.victims } : undefined,
        hasTrustedPerson: trusted.length > 0,
        paymentsPaused: false,
      })
    : null;
  const guardReasons = guard
    ? [
        ...guard.reasons.map((r) => ({ code: `guard_${r.code}`, label: `Ruko Guard (${r.basis.replace("_", " ")}): ${r.label}`, points: 0, hard: false })),
        { code: `guard_decision_${guard.decision}`, label: `Ruko Guard decision: ${guard.decision.replace(/_/g, " ")}`, points: 0, hard: false },
      ]
    : [];
  const guardHolds = Boolean(guard && guard.decision !== "allow");
  const guardBlocks = guard?.decision === "block";
  const flagged = result.flagged || guardHolds;
  const needsApproval = result.needsApproval || guard?.decision === "require_trusted_person";
  const holdMinutes = Math.max(COOLING_OFF_MINUTES, guard?.delaySeconds ? guard.delaySeconds / 60 : 0);

  const transfer = await createTransfer({
    elder_id: elderId,
    amount: input.amount,
    payee: input.payee,
    payee_account: input.payeeAccount,
    channel: input.channel,
    flagged,
    score: result.score,
    reasons: [...result.reasons, ...guardReasons],
    needs_approval: needsApproval,
    status: guardBlocks ? "blocked" : flagged ? "held" : "completed",
    hold_until: flagged && !guardBlocks ? new Date(Date.now() + holdMinutes * 60_000).toISOString() : null,
    payee_hash: payeeHash,
    behaviour,
  });

  // What this payment told us, as tactic observations for the threat engine.
  const observations: NewObservation[] = [];
  for (const r of result.reasons) {
    const tactic = REASON_TACTIC[r.code];
    if (!tactic || observations.some((o) => o.tactic === tactic)) continue;
    const lr = r.code === "mule_cluster" ? 60 + 20 * Math.max(0, (intel?.victims ?? 0) - 2) : r.code === "mule_reported" ? 8 : undefined;
    observations.push({ tactic, source: r.code.startsWith("mule") ? "mule" : TACTIC_SOURCE[r.code] ?? "bank", lr, evidence: r.code });
  }

  if (!flagged) {
    if (input.channel !== "cash" && input.channel !== "fd_break") {
      await addPayee({ elder_id: elderId, name: input.payee, account: input.payeeAccount, first_paid_at: transfer.created_at });
    }
    // Weak signals still go into the picture; the playbook may nudge or escalate.
    if (observations.length) await observe(elderId, observations, { amount: input.amount });
    return { transfer, riskEventId: undefined };
  }

  if (needsApproval && !guardBlocks) await createApprovals(transfer.id, trusted.map((m) => m.id));

  let riskEventId: string | undefined;
  if (result.scam) {
    // The hold now follows the elder across payments and channels until family
    // or the bank clears it, and the family is called in straight away.
    if (!protection.active) {
      await setProtection(elderId, {
        active: true,
        since: new Date().toISOString(),
        reason: result.reasons.find((r) => r.hard)?.label ?? "Ruko paused a risky payment",
        cleared_by: null,
        cleared_at: null,
      });
    }
    const { riskEvent } = await alertCircle(elderId, { source: "bank", score: result.score, reasons: result.reasons });
    riskEventId = riskEvent.id;
    await recordAction(elderId, "money_lock", "bank", `held ${transfer.id.slice(0, 8)}`);
    await recordAction(elderId, "alert_family", "bank", `score ${result.score}`);
    await recordEvent("money_lock_triggered", { value: input.amount, demo: isDemoId(elderId) });
  }
  await observe(elderId, observations, { floor: result.scam ? "high" : undefined, amount: input.amount });

  return { transfer, riskEventId };
}

/**
 * The duress PIN: the person is being forced to pay. The screen shows the
 * payment as sent (so a scammer watching on video sees nothing unusual); in
 * reality every outbound payment is frozen, the family gets an urgent alert
 * and the fraud desk sees it at the top of the queue.
 */
async function duressPayment(elderId: string, input: PaymentInput, opts: { repeat?: boolean } = {}) {
  const transfer = await createTransfer({
    elder_id: elderId,
    amount: input.amount,
    payee: input.payee,
    payee_account: input.payeeAccount,
    channel: input.channel,
    flagged: true,
    score: 100,
    reasons: [
      opts.repeat
        ? { code: "duress", label: "Payment attempted while a duress freeze is on", points: 100, hard: true }
        : { code: "duress", label: "The customer used their duress (safety) PIN", points: 100, hard: true },
    ],
    needs_approval: false,
    status: "held",
    hold_until: null,
    duress: true,
    payee_hash: input.channel === "cash" || input.channel === "fd_break" ? null : hashAccount(input.payeeAccount),
    behaviour: input.behaviour ?? null,
  });
  // Remember the payee as a normal payment would, so the payee list doesn't give it away.
  if (input.channel !== "cash" && input.channel !== "fd_break") {
    await addPayee({ elder_id: elderId, name: input.payee, account: input.payeeAccount, first_paid_at: transfer.created_at });
  }
  await observe(
    elderId,
    [opts.repeat ? { tactic: "RT13", source: "duress", evidence: `payment during duress freeze · ${input.channel}` } : { tactic: "RT14", source: "duress", evidence: `duress PIN · ${input.channel}` }],
    { amount: input.amount, floor: "critical" },
  );
  await recordEvent("money_lock_triggered", { value: input.amount, demo: isDemoId(elderId) });
  return { transfer: customerView(transfer), riskEventId: undefined };
}

/** What the customer's own screen shows: a duress payment looks like a normal pending one. */
export function customerView(t: Transfer): Transfer {
  if (!t.duress) return t;
  // "Processing" rather than "sent": a normal-looking pending payment is less likely to make the
  // scammer push harder when the money doesn't arrive (docs/research/08 §3).
  return { ...t, status: "completed", facade: "processing", flagged: false, score: 0, reasons: [], hold_until: null, decided_at: t.created_at, duress: false };
}

/** Releases a held payment and remembers the payee. */
export async function releaseTransfer(t: Transfer) {
  const updated = await updateTransfer(t.id, { status: "released", decided_at: new Date().toISOString() });
  if (t.channel !== "cash" && t.channel !== "fd_break") {
    await addPayee({ elder_id: t.elder_id, name: t.payee, account: t.payee_account, first_paid_at: new Date().toISOString() });
  }
  return updated;
}

/**
 * After a trusted person decides. A "no" cancels the payment. A "yes" releases
 * it only when approval was the sole reason it was held; if it also looked like
 * a scam, the bank still has to check it.
 */
export async function applyApprovalDecision(transferId: string, decision: "approved" | "declined") {
  const t = await getTransfer(transferId);
  if (!t || t.status !== "held") return { transfer: t, outcome: "unchanged" as const };

  if (decision === "declined") {
    const transfer = await updateTransfer(t.id, { status: "cancelled", decided_at: new Date().toISOString() });
    await recordEvent("payment_abandoned", { value: t.amount, demo: isDemoId(t.elder_id) });
    return { transfer, outcome: "cancelled" as const };
  }

  const scamReasons = t.reasons.filter((r) => r.code !== "trusted_person_required");
  const stillRisky = t.score >= 50 || scamReasons.some((r) => r.hard);
  if (stillRisky) return { transfer: t, outcome: "bank_check" as const };

  // One trusted person's "yes" is enough (RBI proposal: a single trusted person).
  return { transfer: await releaseTransfer(t), outcome: "released" as const };
}
