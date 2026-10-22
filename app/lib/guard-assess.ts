// Ruko Guard: the decision a bank or UPI app asks for BEFORE it moves money. Pure code (no AI, no database, no
// network), so the same function serves the HTTP endpoint (/api/guard/assess), the mock bank's payment pipeline and the tests.
//
// Every rule says where it comes from:
//   rbi_draft       the RBI discussion paper (reported Apr 2026, a DRAFT, not a final rule), as press summaries describe it
//   ruko_own        Ruko's own choice
//   customer_choice the customer's own switch (the kill switch)
// The paper is a draft and the exact thresholds are from secondary reports, so they are constants a bank can change.

export type AgeBand = "under_60" | "60_69" | "70_plus";
export type GuardDecision = "allow" | "delay" | "require_trusted_person" | "block";
export type Basis = "rbi_draft" | "ruko_own" | "customer_choice";

export interface GuardInput {
  customerAgeBand: AgeBand;
  amountInr: number;
  /** First payment to this payee. */
  newPayee: boolean;
  /** The RBI draft leaves merchant payments out of the delay and the trusted-person rule. */
  merchant?: boolean;
  /** Ruko flagged a risky call for this customer recently (Money Lock is on). */
  rukoFlag: boolean;
  /** What is known about the destination account (reports from other customers, other customers who paid it and were held). */
  payeeRisk?: { reports: number; victims?: number };
  hasTrustedPerson: boolean;
  /** The customer's kill switch: all digital payments paused. */
  paymentsPaused?: boolean;
}

export interface GuardReason {
  code: string;
  basis: Basis;
  label: string;
}

export interface GuardResult {
  decision: GuardDecision;
  /** Cooling-off, in seconds, when the decision is "delay" (also the fallback when approval is needed but nobody is set up). */
  delaySeconds: number | null;
  reasons: GuardReason[];
  version: "guard-1";
}

/** The RBI draft's figures as reported. Banks can override these. UNVERIFIED against the paper itself: see docs/RESEARCH-UPI-BANKS.md. */
export const RBI_DRAFT = {
  /** A delay of up to one hour on account-to-account transfers ABOVE this amount, merchants excluded. */
  delayAboveInr: 10_000,
  delaySeconds: 3600,
  /** Trusted-person confirmation for customers of this age or more... */
  trustedPersonAge: 70,
  /** ...above this amount (secondary reports; optional in the draft). */
  trustedPersonAboveInr: 50_000,
} as const;

/** Ruko's own choices, on top of the draft. */
export const RUKO_OWN = {
  /** After a flagged call, a payment this size or more waits. */
  flagMinInr: 2_000,
  /** After a flagged call, a payment this size or more needs a trusted person. */
  flagApprovalAboveInr: 10_000,
  /** A first payment to a new payee this size or more waits. */
  newPayeeDelayAboveInr: 25_000,
  /** Reports on the destination account that stop the payment. */
  blockAtReports: 3,
  blockAtVictims: 2,
} as const;

const RANK: Record<GuardDecision, number> = { allow: 0, delay: 1, require_trusted_person: 2, block: 3 };

export function assessGuard(i: GuardInput): GuardResult {
  const reasons: GuardReason[] = [];
  let decision = "allow" as GuardDecision;
  let delaySeconds: number | null = null;
  const raise = (d: GuardDecision) => {
    if (RANK[d] > RANK[decision]) decision = d;
  };
  const add = (code: string, basis: Basis, label: string) => reasons.push({ code, basis, label });
  const needApproval = (code: string, basis: Basis, label: string) => {
    if (i.hasTrustedPerson) {
      add(code, basis, label);
      raise("require_trusted_person");
    } else {
      // Nobody to ask: fall back to the cooling-off, and say so.
      add(code, basis, label);
      add("no_trusted_person", "ruko_own", "No trusted person is set up, so the payment waits for the cooling-off instead.");
      raise("delay");
      delaySeconds = Math.max(delaySeconds ?? 0, RBI_DRAFT.delaySeconds);
    }
  };

  const amount = Number.isFinite(i.amountInr) ? i.amountInr : 0;

  if (i.paymentsPaused) {
    add("kill_switch_on", "customer_choice", "The customer paused all digital payments. They need the family code word to resume.");
    raise("block");
  }
  const reports = i.payeeRisk?.reports ?? 0;
  const victims = i.payeeRisk?.victims ?? 0;
  if (reports >= RUKO_OWN.blockAtReports || victims >= RUKO_OWN.blockAtVictims) {
    add("payee_reported_many", "ruko_own", "The destination account has been reported as a scam account by several people.");
    raise("block");
  } else if (reports >= 1) {
    add("payee_reported", "ruko_own", "The destination account has been reported as a scam account.");
    raise("delay");
    delaySeconds = Math.max(delaySeconds ?? 0, RBI_DRAFT.delaySeconds);
  }

  const aged = i.customerAgeBand === "70_plus";
  if (!i.merchant && aged && amount >= RBI_DRAFT.trustedPersonAboveInr) {
    needApproval("senior_trusted_person", "rbi_draft", `Customers aged ${RBI_DRAFT.trustedPersonAge}+ need a trusted person to confirm payments of ₹${RBI_DRAFT.trustedPersonAboveInr.toLocaleString("en-IN")} or more (the RBI draft, optional).`);
  }
  if (i.rukoFlag && amount >= RUKO_OWN.flagApprovalAboveInr) {
    needApproval("flagged_call_approval", "ruko_own", "Ruko flagged a risky call for this customer, so a trusted person must confirm this payment.");
  } else if (i.rukoFlag && amount >= RUKO_OWN.flagMinInr) {
    add("flagged_call_delay", "ruko_own", "Ruko flagged a risky call for this customer, so this payment waits.");
    raise("delay");
    delaySeconds = Math.max(delaySeconds ?? 0, RBI_DRAFT.delaySeconds);
  }
  if (!i.merchant && amount > RBI_DRAFT.delayAboveInr) {
    add("rbi_draft_delay", "rbi_draft", `Transfers above ₹${RBI_DRAFT.delayAboveInr.toLocaleString("en-IN")} wait up to an hour, and can be cancelled (the RBI draft).`);
    raise("delay");
    delaySeconds = Math.max(delaySeconds ?? 0, RBI_DRAFT.delaySeconds);
  }
  if (i.newPayee && amount >= RUKO_OWN.newPayeeDelayAboveInr) {
    add("new_payee_large", "ruko_own", "A large first payment to a new payee waits.");
    raise("delay");
    delaySeconds = Math.max(delaySeconds ?? 0, RBI_DRAFT.delaySeconds);
  }

  // Only a plain delay carries a cooling-off time; an approval or a block does not.
  if (decision === "allow" || decision === "block") delaySeconds = null;
  if (decision === "require_trusted_person") delaySeconds = null;
  return { decision, delaySeconds, reasons, version: "guard-1" };
}

/** Age in years to the band the API uses. Unknown age is treated as under 60 (no senior rule is applied on a guess). */
export function ageBandOf(age: number | null | undefined): AgeBand {
  if (age == null) return "under_60";
  return age >= 70 ? "70_plus" : age >= 60 ? "60_69" : "under_60";
}
