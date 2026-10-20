import type {
  Alert,
  Approval,
  CallSignals,
  CircleRow,
  Consent,
  Invite,
  Payee,
  Protection,
  Transfer,
  User,
} from "./types";

// Demo data. Every seeded transfer carries `seeded: true` and is labelled in
// the UI. The people here are fictional.

// Fixed UUIDs so the same demo people exist in memory and in Supabase.
export const DEMO_ELDER_ID = "00000000-0000-4000-8000-000000000001";
export const DEMO_FAMILY_ID = "00000000-0000-4000-8000-000000000002";
export const DEMO_ANALYST_ID = "00000000-0000-4000-8000-000000000003";
export const DEMO_USER_IDS = [DEMO_ELDER_ID, DEMO_FAMILY_ID, DEMO_ANALYST_ID];

const daysAgo = (d: number, h = 11) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 0, 0, 0);
  return t.toISOString();
};

export function seedData() {
  const users: User[] = [
    // Kamala is 72, so the trusted-person rule (RBI proposal: 70+) applies to her.
    { id: DEMO_ELDER_ID, name: "Kamala Iyer", phone: "+91 98450 00001", language: "en", role: "elder", birth_year: 1954 },
    { id: DEMO_FAMILY_ID, name: "Priya Iyer", phone: "+91 98450 00002", language: "en", role: "family" },
    { id: DEMO_ANALYST_ID, name: "Fraud desk", phone: "", language: "en", role: "fraud_analyst" },
  ];

  const consents: Consent[] = [
    { user_id: DEMO_ELDER_ID, scope: "call_signals", granted_at: daysAgo(30), revoked_at: null },
    { user_id: DEMO_ELDER_ID, scope: "app_usage", granted_at: daysAgo(30), revoked_at: null },
    { user_id: DEMO_ELDER_ID, scope: "family_alerts", granted_at: daysAgo(30), revoked_at: null },
    { user_id: DEMO_ELDER_ID, scope: "transaction_risk", granted_at: daysAgo(30), revoked_at: null },
    { user_id: DEMO_FAMILY_ID, scope: "family_alerts", granted_at: daysAgo(30), revoked_at: null },
  ];

  const payees: Payee[] = [
    { elder_id: DEMO_ELDER_ID, name: "Priya Iyer", account: "priya@okhdfc", first_paid_at: daysAgo(400) },
    { elder_id: DEMO_ELDER_ID, name: "BESCOM electricity", account: "bescom@ybl", first_paid_at: daysAgo(300) },
    { elder_id: DEMO_ELDER_ID, name: "Apollo Pharmacy", account: "apollo.pharmacy@icici", first_paid_at: daysAgo(200) },
    { elder_id: DEMO_ELDER_ID, name: "Nandini Milk (Ravi)", account: "ravi.milk@oksbi", first_paid_at: daysAgo(150) },
  ];

  // Two months of ordinary spending gives the rules a baseline.
  const history: Array<[number, string, string, number]> = [
    [58, "BESCOM electricity", "bescom@ybl", 1840],
    [52, "Apollo Pharmacy", "apollo.pharmacy@icici", 2310],
    [45, "Nandini Milk (Ravi)", "ravi.milk@oksbi", 1500],
    [40, "Priya Iyer", "priya@okhdfc", 5000],
    [33, "Apollo Pharmacy", "apollo.pharmacy@icici", 1975],
    [28, "BESCOM electricity", "bescom@ybl", 1720],
    [21, "Nandini Milk (Ravi)", "ravi.milk@oksbi", 1500],
    [14, "Apollo Pharmacy", "apollo.pharmacy@icici", 2640],
    [9, "Priya Iyer", "priya@okhdfc", 3000],
    [3, "BESCOM electricity", "bescom@ybl", 1910],
  ];

  const transfers: Transfer[] = history.map(([d, payee, account, amount], i) => ({
    id: `00000000-0000-4000-9000-${String(i).padStart(12, "0")}`,
    elder_id: DEMO_ELDER_ID,
    amount,
    payee,
    payee_account: account,
    flagged: false,
    score: 0,
    reasons: [],
    status: "completed",
    channel: "upi",
    needs_approval: false,
    seeded: true,
    created_at: daysAgo(d),
    hold_until: null,
    decided_at: daysAgo(d),
  }));

  const signals: CallSignals = {
    elder_id: DEMO_ELDER_ID,
    on_call: false,
    unknown_number: false,
    call_minutes: 0,
    call_ended_at: null,
    updated_at: new Date().toISOString(),
  };

  // Priya has accepted her invite and is Kamala's trusted person; the code
  // word is left for the elder to set.
  const circles: CircleRow[] = [
    { elder_id: DEMO_ELDER_ID, member_id: DEMO_FAMILY_ID, relation: "daughter", code_word_hash: null, trusted: true },
  ];
  const alerts: Alert[] = [];
  const invites: Invite[] = [];
  const approvals: Approval[] = [];
  const protection: Protection[] = [
    { elder_id: DEMO_ELDER_ID, active: false, since: null, reason: null, cleared_by: null, cleared_at: null },
  ];

  return { users, consents, payees, transfers, signals: [signals], circles, alerts, invites, approvals, protection };
}

/**
 * Demo numbers for Scam Radar, with community reports seeded on demo reset.
 * Fictional numbers, and every report is tagged demo.
 */
export const DEMO_NUMBERS: Array<{ number: string; scam: number; notScam: number; patternId: string; note: string }> = [
  { number: "+91 98765 43210", scam: 214, notScam: 3, patternId: "digital_arrest", note: "Fake police" },
  { number: "+855 23 456 789", scam: 37, notScam: 0, patternId: "courier_drugs", note: "Courier parcel, from abroad" },
  { number: "+91 90000 11122", scam: 12, notScam: 1, patternId: "kyc_block", note: "KYC block" },
  { number: "1600123456", scam: 0, notScam: 18, patternId: "", note: "A real bank's 1600 number" },
];

/**
 * A trial participant's practice account: a sandbox elder with a mock bank
 * (the same ordinary spending history as the demo) and a stand-in family
 * member, so Ruko's STOP, family alert and bank hold all work during a call.
 * No real name or number: the participant is only "P03".
 */
export function practiceAccount(accountId: string, familyId: string, code: string, birthYear: number) {
  const base = seedData();
  const swap = <T extends { elder_id: string }>(r: T): T => ({ ...r, elder_id: accountId });
  const users: User[] = [
    { id: accountId, name: `Practice ${code}`, phone: "", language: "en", role: "elder", birth_year: birthYear },
    { id: familyId, name: "Family (practice)", phone: "", language: "en", role: "family" },
  ];
  const consents: Consent[] = (["call_signals", "app_usage", "family_alerts", "transaction_risk", "drills"] as const).map((scope) => ({
    user_id: accountId,
    scope,
    granted_at: new Date().toISOString(),
    revoked_at: null,
  }));
  return {
    users,
    consents,
    payees: base.payees.filter((p) => p.name !== "Priya Iyer").map(swap),
    transfers: base.transfers.filter((t) => t.payee !== "Priya Iyer").map((t) => ({ ...swap(t), id: crypto.randomUUID() })),
    signals: base.signals.map(swap),
    circles: [{ elder_id: accountId, member_id: familyId, relation: "family", code_word_hash: null, trusted: true }] as CircleRow[],
    protection: base.protection.map(swap),
  };
}

/** Kamala's practice duress ("safety") PIN for the demo. Her normal practice PIN is 1234. */
export const DEMO_DURESS_PIN = "4321";

/** Demo mule accounts with community/bank reports (tagged demo). */
export const DEMO_MULES: Array<{ account: string; reports: number; patternId: string }> = [
  { account: "rbi.verify@axis", reports: 6, patternId: "digital_arrest" },
  { account: "safe.custody@ybl", reports: 4, patternId: "digital_arrest" },
];
