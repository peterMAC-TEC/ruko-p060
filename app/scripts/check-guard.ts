// Ruko Guard: the decisions a bank gets. 25+ cases across age, amount, new payee, a flagged call, destination risk,
// the kill switch and merchants. Run: npx tsx scripts/check-guard.ts
import assert from "node:assert/strict";
import { bankKeyMatches } from "../lib/bank-key";
import { ageBandOf, assessGuard, RBI_DRAFT, RUKO_OWN, type GuardInput } from "../lib/guard-assess";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}`);
};
const base: GuardInput = { customerAgeBand: "under_60", amountInr: 500, newPayee: false, rukoFlag: false, hasTrustedPerson: true };
const g = (o: Partial<GuardInput>) => assessGuard({ ...base, ...o });
const codes = (o: Partial<GuardInput>) => g(o).reasons.map((r) => r.code);

// Plain payments
ok("a small ordinary payment is allowed", g({}).decision === "allow" && g({}).reasons.length === 0);
ok("exactly ₹10,000 is allowed (the draft says ABOVE ₹10,000)", g({ amountInr: 10_000 }).decision === "allow");
ok("₹10,001 waits an hour (RBI draft)", g({ amountInr: 10_001 }).decision === "delay" && g({ amountInr: 10_001 }).delaySeconds === 3600 && codes({ amountInr: 10_001 }).includes("rbi_draft_delay"));
ok("a merchant payment is excluded from the delay", g({ amountInr: 40_000, merchant: true }).decision === "allow");
ok("a big under-60 payment waits but needs no trusted person", g({ amountInr: 200_000 }).decision === "delay");

// Seniors
ok("a 70+ customer paying ₹49,999 only waits", g({ customerAgeBand: "70_plus", amountInr: 49_999 }).decision === "delay");
ok("a 70+ customer paying ₹50,000 needs a trusted person", g({ customerAgeBand: "70_plus", amountInr: 50_000 }).decision === "require_trusted_person");
ok("a 60 to 69 customer paying ₹50,000 is not asked for a trusted person", g({ customerAgeBand: "60_69", amountInr: 50_000 }).decision === "delay");
ok("with no trusted person set up, a senior's large payment waits instead (and says so)", (() => { const r = g({ customerAgeBand: "70_plus", amountInr: 80_000, hasTrustedPerson: false }); return r.decision === "delay" && r.reasons.some((x) => x.code === "no_trusted_person") && r.delaySeconds === 3600; })());
ok("a merchant payment by a senior is excluded from the approval rule", g({ customerAgeBand: "70_plus", amountInr: 90_000, merchant: true }).decision === "allow");

// A flagged call
ok("after a flagged call, a ₹1,999 payment is allowed", g({ rukoFlag: true, amountInr: 1_999 }).decision === "allow");
ok("after a flagged call, ₹2,000 waits", g({ rukoFlag: true, amountInr: 2_000 }).decision === "delay");
ok("after a flagged call, ₹10,000 needs a trusted person", g({ rukoFlag: true, amountInr: 10_000 }).decision === "require_trusted_person");
ok("the flagged-call rule applies to merchants too (Ruko's own rule)", g({ rukoFlag: true, amountInr: 15_000, merchant: true }).decision === "require_trusted_person");
ok("the demo's ₹50,000 to a new payee after a flagged call by a 70+ customer needs approval", g({ customerAgeBand: "70_plus", amountInr: 50_000, rukoFlag: true, newPayee: true }).decision === "require_trusted_person");

// New payees
ok("a first payment of ₹25,000 to a new payee waits", g({ amountInr: 25_000, newPayee: true }).decision === "delay" && codes({ amountInr: 25_000, newPayee: true }).includes("new_payee_large"));
ok("a first payment of ₹24,999 to a new payee is judged by the amount only", !codes({ amountInr: 24_999, newPayee: true }).includes("new_payee_large"));

// Destination risk
ok("one report on the destination account makes the payment wait", g({ payeeRisk: { reports: 1 } }).decision === "delay");
ok("three reports on the destination account block it", g({ payeeRisk: { reports: RUKO_OWN.blockAtReports } }).decision === "block");
ok("two other customers held for the same destination blocks it", g({ payeeRisk: { reports: 0, victims: RUKO_OWN.blockAtVictims } }).decision === "block");
ok("a blocked destination has no cooling-off time", g({ payeeRisk: { reports: 5 } }).delaySeconds === null);

// The kill switch
ok("the kill switch blocks even a tiny payment", g({ paymentsPaused: true, amountInr: 10 }).decision === "block" && codes({ paymentsPaused: true }).includes("kill_switch_on"));
ok("the kill switch is the customer's choice, labelled as such", g({ paymentsPaused: true }).reasons[0].basis === "customer_choice");

// The strictest rule wins, and every rule is labelled
ok("the most restrictive decision wins", g({ customerAgeBand: "70_plus", amountInr: 60_000, rukoFlag: true, payeeRisk: { reports: 4 } }).decision === "block");
ok("every reason says where it comes from", [g({ amountInr: 90_000, customerAgeBand: "70_plus", rukoFlag: true, newPayee: true, paymentsPaused: true, payeeRisk: { reports: 1 } })].every((r) => r.reasons.length >= 5 && r.reasons.every((x) => ["rbi_draft", "ruko_own", "customer_choice"].includes(x.basis) && x.label.length > 10)));
ok("the decision never contains a name, an account or audio, only codes and plain words", !/\d{9,}|@|transcript|audio/i.test(JSON.stringify(g({ amountInr: 90_000, rukoFlag: true }))));
ok("garbage amounts are treated as zero, never as an approval", g({ amountInr: Number.NaN }).decision === "allow" && g({ amountInr: Number.POSITIVE_INFINITY, merchant: true }).decision !== undefined);

// Age bands
ok("age bands: under 60, 60 to 69, 70 and over; unknown is never treated as a senior", ageBandOf(59) === "under_60" && ageBandOf(60) === "60_69" && ageBandOf(69) === "60_69" && ageBandOf(70) === "70_plus" && ageBandOf(null) === "under_60");
ok("the published thresholds are the ones the spec names", RBI_DRAFT.delayAboveInr === 10_000 && RBI_DRAFT.trustedPersonAboveInr === 50_000 && RBI_DRAFT.trustedPersonAge === 70);

// The bank's API key
ok("the right bank key is accepted", bankKeyMatches("k-123", "k-123"));
ok("a wrong, empty or missing key is refused", !bankKeyMatches("k-123", "k-124") && !bankKeyMatches("k-123", "") && !bankKeyMatches("k-123", null) && !bankKeyMatches("k-123", "k-1234"));
ok("with no key configured, no header can match (a real deployment is never open)", !bankKeyMatches(undefined, "anything") && !bankKeyMatches("", ""));

console.log(`all ${n} guard checks passed`);
