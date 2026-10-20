// Sanity checks for the bank rules engine. Run: npx tsx scripts/check-rules.ts
import assert from "node:assert/strict";
import { evaluateTransfer, type RuleContext } from "../lib/rules";
import { seedData } from "../lib/seed";

const { payees, transfers, signals } = seedData();
const base: RuleContext = { amount: 0, payee: "", payeeAccount: "", knownPayees: payees, history: transfers };
const quiet = { ...signals[0] };
const scamCall = { ...signals[0], on_call: true, unknown_number: true, call_minutes: 95 };
const elder72 = { elderAge: 72, hasTrustedPerson: true };

type Expect = { flagged: boolean; scam?: boolean; approval?: boolean };
const cases: Array<[string, Partial<RuleContext>, Expect]> = [
  ["usual electricity bill", { amount: 1900, payee: "BESCOM electricity", payeeAccount: "bescom@ybl", signals: quiet }, { flagged: false }],
  ["money to daughter", { amount: 4000, payee: "Priya Iyer", payeeAccount: "priya@okhdfc", signals: quiet }, { flagged: false }],
  ["small new payee", { amount: 800, payee: "Lakshmi Tailors", payeeAccount: "lakshmi@oksbi", signals: quiet }, { flagged: false }],
  ["RBI safe account", { amount: 480000, payee: "RBI Safe Account", payeeAccount: "rbi.verify@axis", signals: quiet }, { flagged: true, scam: true }],
  ["big new payee during long unknown call", { amount: 250000, payee: "Arun Mehta", payeeAccount: "arun.m@ybl", signals: scamCall }, { flagged: true, scam: true }],
  ["usual payee during long call", { amount: 1500, payee: "Nandini Milk (Ravi)", payeeAccount: "ravi.milk@oksbi", signals: scamCall }, { flagged: true, scam: true }],
  ["high Ruko score alone", { amount: 1500, payee: "Nandini Milk (Ravi)", payeeAccount: "ravi.milk@oksbi", signals: quiet, rukoScore: 85 }, { flagged: true, scam: true }],
  ["no consent: signals absent", { amount: 1500, payee: "Nandini Milk (Ravi)", payeeAccount: "ravi.milk@oksbi" }, { flagged: false }],
  // Trusted person (RBI proposal: 70+, ₹50k+)
  ["72-year-old pays daughter ₹60k: needs OK, not a scam", { amount: 60000, payee: "Priya Iyer", payeeAccount: "priya@okhdfc", signals: quiet, ...elder72 }, { flagged: true, scam: false, approval: true }],
  ["72-year-old pays daughter ₹40k: below threshold", { amount: 40000, payee: "Priya Iyer", payeeAccount: "priya@okhdfc", signals: quiet, ...elder72 }, { flagged: false }],
  ["68-year-old pays daughter ₹60k: rule doesn't apply", { amount: 60000, payee: "Priya Iyer", payeeAccount: "priya@okhdfc", signals: quiet, elderAge: 68, hasTrustedPerson: true }, { flagged: false }],
  // The hold follows the elder
  ["protection active, ₹20k to known payee", { amount: 20000, payee: "Priya Iyer", payeeAccount: "priya@okhdfc", signals: quiet, protectionActive: true }, { flagged: true, scam: true }],
  ["protection active, ₹2k milk bill still goes", { amount: 2000, payee: "Nandini Milk (Ravi)", payeeAccount: "ravi.milk@oksbi", signals: quiet, protectionActive: true }, { flagged: false }],
  // Money-raising steps
  ["FD break during scam call", { amount: 900000, payee: "FD closure", payeeAccount: "fd-001", channel: "fd_break", signals: scamCall }, { flagged: true, scam: true }],
  ["FD break on a quiet day", { amount: 900000, payee: "FD closure", payeeAccount: "fd-001", channel: "fd_break", signals: quiet }, { flagged: false }],
  ["₹2 lakh cash after FD break", { amount: 200000, payee: "Cash withdrawal", payeeAccount: "branch", channel: "cash", signals: quiet, recentFdBreak: true }, { flagged: true, scam: true }],
  ["₹5k cash on a quiet day", { amount: 5000, payee: "Cash withdrawal", payeeAccount: "branch", channel: "cash", signals: quiet }, { flagged: false }],
  // Threat engine (fused signals) replaces the single call-check score
  ["threat high: milk bill held", { amount: 1500, payee: "Nandini Milk (Ravi)", payeeAccount: "ravi.milk@oksbi", signals: quiet, threat: { level: "high", probability: 0.9, stagesActive: ["S2", "S3", "S4"] } }, { flagged: true, scam: true }],
  ["threat watch: milk bill still goes", { amount: 1500, payee: "Nandini Milk (Ravi)", payeeAccount: "ravi.milk@oksbi", signals: quiet, threat: { level: "watch", probability: 0.25, stagesActive: [] } }, { flagged: false }],
  ["threat present: old rukoScore ignored (no double count)", { amount: 1500, payee: "Nandini Milk (Ravi)", payeeAccount: "ravi.milk@oksbi", signals: quiet, rukoScore: 85, threat: { level: "none", probability: 0.01, stagesActive: [] } }, { flagged: false }],
  // Mule intelligence
  ["new payee, 2 other victims paid it: held", { amount: 9000, payee: "S Kumar", payeeAccount: "skumar77@ybl", signals: quiet, payeeIntel: { victims: 2, reports: 0 } }, { flagged: true, scam: true }],
  ["new payee, reported 3 times: held", { amount: 3000, payee: "S Kumar", payeeAccount: "skumar77@ybl", signals: quiet, payeeIntel: { victims: 0, reports: 3 } }, { flagged: true, scam: true }],
  ["new payee, clean account: goes", { amount: 3000, payee: "S Kumar", payeeAccount: "skumar77@ybl", signals: quiet, payeeIntel: { victims: 0, reports: 0 } }, { flagged: false }],
  // Coercion signals alone never hold a payment (capped), but add up with others
  ["pasted + app switching + dictated, known payee: goes", { amount: 1500, payee: "Nandini Milk (Ravi)", payeeAccount: "ravi.milk@oksbi", signals: quiet, behaviour: { pastedPayee: true, appSwitches: 3, amountPauses: 3, amountEdits: 0, confirmDwellMs: 60000, flowMs: 90000 } }, { flagged: false }],
  ["coercion + new payee + 6x amount: held", { amount: 12000, payee: "Arun Mehta", payeeAccount: "arun.m@ybl", signals: quiet, behaviour: { pastedPayee: true, appSwitches: 2, amountPauses: 2, amountEdits: 0, confirmDwellMs: 5000, flowMs: 60000 } }, { flagged: true, scam: true }],
  // Repeat attempt after a hold
  ["repeat large attempt after a hold, new payee: held", { amount: 30000, payee: "Arun Mehta", payeeAccount: "arun.m@ybl", signals: quiet, recentHeld: 1 }, { flagged: true, scam: true }],
];

for (const [name, patch, want] of cases) {
  const r = evaluateTransfer({ ...base, ...patch });
  assert.equal(r.flagged, want.flagged, `${name}: flagged ${r.flagged} (score ${r.score})`);
  if (want.scam !== undefined) assert.equal(r.scam, want.scam, `${name}: scam ${r.scam}`);
  if (want.approval !== undefined) assert.equal(r.needsApproval, want.approval, `${name}: approval ${r.needsApproval}`);
  console.log(`ok  ${name.padEnd(52)} score ${String(r.score).padStart(3)}  ${r.reasons.map((x) => x.code).join(", ")}`);
}
console.log(`all ${cases.length} rules checks passed`);
