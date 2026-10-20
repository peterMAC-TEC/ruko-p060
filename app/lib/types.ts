// Mirrors supabase/migrations (0001–0003).

export type Role = "elder" | "family" | "fraud_analyst" | "researcher";
export type Language = "en" | "hi" | "kn" | "ta" | "te" | "ml" | "mr" | "bn";

export interface User {
  id: string;
  name: string;
  phone: string;
  language: Language;
  role: Role;
  /** Linked Supabase Auth login; null for demo people and not-yet-signed-in invitees. */
  auth_id?: string | null;
  email?: string | null;
  /** Used for the trusted-person rule (RBI proposal: 70+). */
  birth_year?: number | null;
  /** How readily the guided check shows STOP: 1, 2 or 3 "yes" answers. */
  sensitivity?: "low" | "normal" | "high";
  /** Off only for a practice account during a trial's baseline (without-Ruko) call. */
  ruko_enabled?: boolean;
  /** Server only (never sent to a browser): scrypt hashes of the practice bank PIN and the duress PIN. */
  pin_hash?: string | null;
  duress_hash?: string | null;
  pin_fails?: number;
  pin_locked_until?: string | null;
}

/** A user as the browser may see it: no PIN hashes or lock state. */
export function publicUser(u: User | undefined | null) {
  if (!u) return null;
  const { pin_hash, duress_hash, pin_fails, pin_locked_until, ...rest } = u;
  void pin_hash;
  void duress_hash;
  void pin_fails;
  void pin_locked_until;
  return { ...rest, hasPin: Boolean(u.pin_hash), hasDuressPin: Boolean(u.duress_hash) };
}

/** One consent per purpose (DPDP: specific, itemised, withdrawable). */
export type ConsentScope =
  | "call_signals"
  | "app_usage"
  | "transcript"
  | "family_alerts"
  | "transaction_risk"
  | "drills";

export interface Consent {
  user_id: string;
  scope: ConsentScope;
  granted_at: string;
  revoked_at: string | null;
  notice_version?: string;
  lang?: string;
  /** The elder's own words from teach-back. */
  teach_back?: string | null;
}

/** What the phone (or the demo signal panel) reports about the current call. */
export interface CallSignals {
  elder_id: string;
  on_call: boolean;
  unknown_number: boolean;
  /** Minutes of the current call, or of the call that ended most recently. */
  call_minutes: number;
  /** When the most recent call ended; null while on the call or if there was none. */
  call_ended_at: string | null;
  updated_at: string;
}

/** "elder" = the elder pressed "Tell my family" themselves. */
export type RiskSource = "agent" | "signal" | "bank" | "elder";

export interface RiskEvent {
  id: string;
  elder_id: string;
  source: RiskSource;
  score: number;
  reasons: Reason[];
  created_at: string;
}

export type TransferStatus = "held" | "released" | "blocked" | "completed" | "cancelled";
export type Channel = "upi" | "imps" | "neft" | "rtgs" | "cash" | "fd_break";

export interface Transfer {
  id: string;
  elder_id: string;
  amount: number;
  payee: string;
  payee_account: string;
  flagged: boolean;
  score: number;
  reasons: Reason[];
  status: TransferStatus;
  channel: Channel;
  /** A trusted person must approve before it can go. */
  needs_approval: boolean;
  /** Seeded rows are labelled everywhere they appear. */
  seeded: boolean;
  created_at: string;
  hold_until: string | null;
  decided_at: string | null;
  /** Paid with the duress PIN: shown to the customer as sent, really frozen. */
  duress?: boolean;
  /** Consented coercion signals captured while the payment was made. */
  behaviour?: PaymentBehaviour | null;
  /** Salted hash of the destination account, for mule analytics. */
  payee_hash?: string | null;
  /** Set only on the customer's own view of a duress payment: shown as "processing". */
  facade?: "processing";
}

/** How a payment was made (lib/coercion.ts). Counts and timings only, never keystrokes. */
export interface PaymentBehaviour {
  pastedPayee: boolean;
  appSwitches: number;
  /** Gaps of 1.5 s or more between digits while typing the amount. */
  amountPauses: number;
  amountEdits: number;
  confirmDwellMs: number;
  flowMs: number;
}

/** One reason a rule fired. `consent` names the scope it relied on, if any. */
export interface Reason {
  code: string;
  label: string;
  points: number;
  hard: boolean;
  consent?: ConsentScope;
}

export interface Payee {
  elder_id: string;
  name: string;
  account: string;
  first_paid_at: string;
}

export interface CircleRow {
  elder_id: string;
  member_id: string;
  relation: string;
  code_word_hash: string | null;
  /** The one trusted person who approves large payments. */
  trusted: boolean;
}

/** A Ruko Family member as the app shows them. */
export interface CircleMember {
  id: string;
  name: string;
  phone: string;
  relation: string;
  trusted: boolean;
}

export type InviteStatus = "pending" | "accepted" | "declined" | "revoked";

export interface Invite {
  id: string;
  elder_id: string;
  name: string;
  phone: string;
  relation: string;
  token_hash: string;
  status: InviteStatus;
  member_id: string | null;
  created_at: string;
  expires_at: string;
  decided_at: string | null;
}

export type AlertChannel = "sms" | "voice" | "app";
export type AlertStatus = "sent" | "ack_calling" | "ack_fine";

export interface Alert {
  id: string;
  risk_event_id: string;
  member_id: string;
  channel: AlertChannel;
  status: AlertStatus;
  message: string;
  ts: string;
}

export type ApprovalStatus = "pending" | "approved" | "declined";

export interface Approval {
  id: string;
  transfer_id: string;
  member_id: string;
  status: ApprovalStatus;
  created_at: string;
  decided_at: string | null;
}

export interface Protection {
  elder_id: string;
  active: boolean;
  since: string | null;
  reason: string | null;
  cleared_by: string | null;
  cleared_at: string | null;
}
