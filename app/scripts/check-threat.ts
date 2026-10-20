// Scenario tests for the threat engine. Run: npx tsx scripts/check-threat.ts
import { assess, decay, type Observation, type ThreatLevel } from "../lib/threat";

let failed = 0;
const is = (name: string, cond: boolean, detail = "") => {
  if (!cond) failed++;
  console.log(`${cond ? "ok " : "FAIL"} ${name}${detail ? `  (${detail})` : ""}`);
};
const now = new Date("2026-10-20T10:00:00Z");
const ago = (min: number) => new Date(now.getTime() - min * 60_000).toISOString();
const obs = (tactic: Observation["tactic"], min: number, extra: Partial<Observation> = {}): Observation => ({ tactic, at: ago(min), source: "radar", ...extra });
const order: ThreatLevel[] = ["none", "watch", "elevated", "high", "critical"];
const atLeast = (a: ThreatLevel, b: ThreatLevel) => order.indexOf(a) >= order.indexOf(b);

// Nothing → nothing.
is("no evidence: none", assess([], now).level === "none");

// One risky number alone is a watch, not an alarm.
const one = assess([obs("RT01", 1, { source: "number", lr: 8 })], now);
is("risky number alone ≤ watch", !atLeast(one.level, "elevated"), `${(one.probability * 100).toFixed(1)}%`);

// The classic digital arrest walks the chain and should reach critical.
const da = assess(
  [obs("RT01", 40, { source: "number" }), obs("RT02", 35, { lr: 8 }), obs("RT03", 30), obs("RT05", 25), obs("RT06", 20), obs("RT09", 1, { source: "bank" })],
  now,
);
is("digital arrest chain → critical", da.level === "critical", `${(da.probability * 100).toFixed(2)}%, stages ${da.stagesActive.join(",")}`);
is("furthest stage is Extraction", da.stage === "S6");
is("playbook locks money and calls family", da.playbook.includes("money_lock") && da.playbook.includes("alert_family"));

// Two signs of the same stage are discounted (correlated), so they count less than two different stages.
const sameStage = assess([obs("RT05", 1), obs("RT06", 1)], now);
const twoStages = assess([obs("RT05", 1), obs("RT03", 1)], now);
is("same-stage evidence is discounted", sameStage.logOdds < twoStages.logOdds, `${sameStage.logOdds.toFixed(2)} < ${twoStages.logOdds.toFixed(2)}`);

// Repeating the same observation is not new evidence.
const repeated = assess([obs("RT03", 1), obs("RT03", 2), obs("RT03", 3)], now);
const single = assess([obs("RT03", 1)], now);
is("repeats don't stack", Math.abs(repeated.logOdds - single.logOdds) < 1e-9);

// A genuine bank call: authority + verified call → stays low (no false alarm).
const genuine = assess([obs("RT02", 2, { lr: 2 }), obs("RT17", 1, { source: "callintent" })], now);
is("verified bank call keeps it low", !atLeast(genuine.level, "watch"), `${(genuine.probability * 100).toFixed(1)}%`);
// …while the same claim without a verified call is more suspicious.
const unverified = assess([obs("RT02", 2, { lr: 2 }), obs("RT15", 1, { source: "callintent" })], now);
is("unverified 'bank' call is riskier than verified", unverified.probability > genuine.probability * 5);

// A verified bank call can't cancel money going to a "safe account".
const safeAcct = assess([obs("RT09", 1, { source: "bank" }), obs("RT17", 1, { source: "callintent" })], now);
const safeAlone = assess([obs("RT09", 1, { source: "bank" })], now);
is("verified call can't cancel a safe-account payment", Math.abs(safeAcct.logOdds - safeAlone.logOdds) < 1e-9);

// Duress always goes critical and freezes everything.
const duress = assess([obs("RT14", 1, { source: "duress" })], now);
is("duress → critical + freeze", duress.level === "critical" && duress.playbook[0] === "freeze_outbound");

// Evidence decays: the same chain 12 hours later has faded.
const later = new Date(now.getTime() + 12 * 60 * 60_000);
const faded = assess([obs("RT02", 35, { lr: 8 }), obs("RT03", 30), obs("RT05", 25)], later);
is("call evidence fades after 12 h", !atLeast(faded.level, "elevated"), `${(faded.probability * 100).toFixed(1)}%`);
is("decay halves at one half-life", Math.abs(decay(60, 60) - 0.5) < 1e-9);

// Mule destination alone (strong, long-lived) is high-risk within a day.
const mule = assess([obs("RT12", 6 * 60, { source: "mule" }), obs("RT10", 5, { source: "bank" })], now);
is("mule account + big amount ≥ elevated", atLeast(mule.level, "elevated"), `${(mule.probability * 100).toFixed(1)}%`);

// A self-reported worry plus isolation reaches elevated (family should hear about it).
const worried = assess([obs("RT16", 2, { source: "family" }), obs("RT05", 3), obs("RT02", 4, { lr: 8 })], now);
is("worry + isolation + authority ≥ elevated", atLeast(worried.level, "elevated"), `${(worried.probability * 100).toFixed(1)}%`);

console.log(failed ? `\n${failed} threat checks FAILED` : "\nall threat checks passed");
process.exit(failed ? 1 : 0);
