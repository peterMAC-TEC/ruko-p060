// Checks the trial statistics and allocation against the reference values in
// docs/research/06-trial-methodology.md. Run: npx tsx scripts/check-trial.ts
import {
  ALLOCATION_TABLE,
  clopperPearson,
  mcnemarExact,
  mcnemarMidP,
  median,
  MEASURED,
  newcombePaired,
  orderOf,
  planForRow,
  rowOrder,
  summarize,
  wilcoxonSignedRank,
  wilson,
  type CallRow,
} from "../lib/trial";

let failed = 0;
const near = (name: string, got: number, want: number, tol = 0.0006) => {
  const ok = Math.abs(got - want) <= tol;
  if (!ok) failed++;
  console.log(`${ok ? "ok " : "FAIL"} ${name.padEnd(46)} got ${got.toFixed(4)} want ${want.toFixed(4)}`);
};
const is = (name: string, cond: boolean) => {
  if (!cond) failed++;
  console.log(`${cond ? "ok " : "FAIL"} ${name}`);
};

// Intervals (doc §4.3 reference table for n = 10).
near("wilson 8/10 lower", wilson(8, 10)[0], 0.49, 0.001);
near("wilson 8/10 upper", wilson(8, 10)[1], 0.943, 0.001);
near("wilson 5/10 lower", wilson(5, 10)[0], 0.2366);
near("clopper-pearson 8/10 lower", clopperPearson(8, 10)[0], 0.444, 0.001);
near("clopper-pearson 8/10 upper", clopperPearson(8, 10)[1], 0.975, 0.001);
near("clopper-pearson 0/10 upper", clopperPearson(0, 10)[1], 0.3085);
near("clopper-pearson 10/10 lower", clopperPearson(10, 10)[0], 0.6915);

// McNemar exact and mid-p.
near("mcnemar 5-0 exact", mcnemarExact(5, 0), 0.0625);
near("mcnemar 5-0 mid-p", mcnemarMidP(5, 0), 0.03125);
near("mcnemar 6-1 exact", mcnemarExact(6, 1), 0.125);
near("mcnemar 6-1 mid-p", mcnemarMidP(6, 1), 0.0703, 0.001);
near("mcnemar 8-1 exact", mcnemarExact(8, 1), 0.039, 0.001);
near("mcnemar 8-1 mid-p", mcnemarMidP(8, 1), 0.021, 0.001);
near("mcnemar 0-0", mcnemarExact(0, 0), 1);

// Newcombe paired-difference CI.
const nc = newcombePaired(3, 5, 0, 2);
near("newcombe (3,5,0,2) diff", nc.diff, 0.5);
near("newcombe (3,5,0,2) lower", nc.ci[0], 0.144, 0.002);
near("newcombe (3,5,0,2) upper", nc.ci[1], 0.699, 0.002);

// Wilcoxon signed-rank with rank-biserial r.
const w = wilcoxonSignedRank([5, 3, 1, 2, 4, 0, 1, 5, 0, 3]);
is("wilcoxon example m = 8, W+ = 36", w.n === 8 && w.wPlus === 36);
near("wilcoxon example p", w.p, 0.0078, 0.0002);
near("wilcoxon example r", w.r, 1);
near("wilcoxon symmetric", wilcoxonSignedRank([1, -1, 2, -2]).p, 1);
near("median even", median([1, 2, 3, 4]) ?? -1, 2.5);

// Allocation table (doc §4.1): balance across the 10 rows.
const plans = ALLOCATION_TABLE.map((_, i) => planForRow(i + 1));
const count = (f: (c: ReturnType<typeof planForRow>[number]) => boolean) => plans.flat().filter(f).length;
for (const slot of ["SA", "SB", "K1", "K2"] as const) {
  for (const arm of ["baseline", "ruko"] as const) {
    is(`${slot} (${MEASURED[slot]}) used 5x ${arm}`, count((c) => c.slot === slot && c.arm === arm) === 5);
  }
}
is("every person: 1 scam + 1 control in each arm", plans.every((p) => (["baseline", "ruko"] as const).every((a) => p.filter((c) => c.arm === a && c.isScam).length === 1 && p.filter((c) => c.arm === a && !c.isScam).length === 1)));
is("each block is one arm", plans.every((p) => p[0].arm === p[1].arm && p[2].arm === p[3].arm && p[0].arm !== p[2].arm));
is("5 AB and 5 BA", ALLOCATION_TABLE.filter((_, i) => orderOf(i + 1) === "AB").length === 5);
is("5 start scam-first", plans.filter((p) => p[0].isScam).length === 5);
is("real call is the block-2 scam, 5 per arm", count((c) => c.channel === "phone" && c.block === 2 && c.isScam && c.arm === "ruko") === 5 && count((c) => c.channel === "phone") === 10);
is("two different scam scripts per person", plans.every((p) => new Set(p.filter((c) => c.isScam).map((c) => c.scriptId)).size === 2));
is("all 10 rows differ", new Set(ALLOCATION_TABLE.map((r) => JSON.stringify(r))).size === 10);
const order = rowOrder();
is(`row order is a permutation of 1-10 (${order.join(",")})`, [...order].sort((a, b) => a - b).join() === "1,2,3,4,5,6,7,8,9,10");
is("row order is reproducible", rowOrder().join() === order.join());

// Summary: primary outcome is "stopped before pay" in both arms.
const row = (pid: string, order_no: number, arm: "baseline" | "ruko", step: number, scam = true, extra: Partial<CallRow> = {}): CallRow => ({
  participant_id: pid,
  order_no,
  block: order_no <= 2 ? 1 : 2,
  arm,
  script_id: "s",
  is_scam: scam,
  status: "ended",
  channel: "browser",
  family_present: false,
  furthest_step: step,
  money_moved: arm === "baseline" && step >= 6,
  stopped_by: step <= 5 ? "self" : null,
  time_to_stop_s: 100,
  ruko_level: null,
  family_alerted: null,
  bank_held: null,
  control_outcome: null,
  adverse_event_level: 0,
  stress: 2,
  debriefed: true,
  ...extra,
});
const s = summarize([
  row("p1", 1, "baseline", 7),
  row("p1", 3, "ruko", 3),
  row("p2", 1, "ruko", 6),
  row("p2", 3, "baseline", 6),
  row("p1", 2, "baseline", 1, false, { control_outcome: "C2" }),
  row("p2", 2, "ruko", 1, false, { control_outcome: "C3" }),
  row("p1", 4, "ruko", 1, false, { control_outcome: "C0" }),
]);
is("baseline stopped 0/2", s.baseline.stopped.k === 0 && s.baseline.stopped.n === 2);
is("ruko stopped 1/2 (pressing Pay counts against Ruko)", s.ruko.stopped.k === 1);
is("2x2: b = 1, d = 1", s.paired.b === 1 && s.paired.d === 1 && s.paired.a === 0 && s.paired.c === 0);
is("orders: p1 AB, p2 BA", s.byOrder.AB.n === 1 && s.byOrder.BA.n === 1);
is("false alarms 1/2 Ruko-arm controls", s.controls.rukoArm.falseAlarms.k === 1 && s.controls.rukoArm.falseAlarms.n === 2);
is("over-suspicion baseline 1/1", s.controls.overSuspicion.baseline.k === 1);
is("first period: 1 baseline, 1 ruko", s.firstPeriod.baseline.n === 1 && s.firstPeriod.ruko.n === 1);

console.log(failed ? `\n${failed} trial checks FAILED` : "\nall trial checks passed");
process.exit(failed ? 1 : 0);
