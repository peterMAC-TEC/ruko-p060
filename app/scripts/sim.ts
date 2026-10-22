// Runs the scammer bot over every drill script, in English and Hindi, clean and with speech-to-text noise,
// against (a) a person who just goes along, to test Ruko's own check on the whole call, and (b) the defender bot.
// Run: npm run sim                 (Ruko's own check)
//      npm run sim -- --defender   (the defender bot's calls)
//      npm run sim -- --relentless (the defender vs a scammer that never gives up)
//      npm run sim -- --json
import { readFileSync } from "node:fs";
import path from "node:path";
import { runAll, summarize } from "../lib/bots/harness";
import type { DrillLibrary } from "../lib/drill";

const lib = JSON.parse(readFileSync(path.join(process.cwd(), "data", "drill-scripts.json"), "utf8")) as DrillLibrary;
const results = runAll(lib);

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ goesAlong: summarize(results, "goes_along"), defender: summarize(results, "defender"), results }, null, 2));
} else {
  const who = process.argv.includes("--relentless") ? "relentless" : process.argv.includes("--defender") ? "defender" : "goes_along";
  const pad = (s: string | number | null, n: number) => String(s ?? "-").padEnd(n);
  console.log(pad("script", 28), pad("lang", 5), pad("noise", 6), pad("end", 16), pad("lines", 6), pad("flag", 5), pad("STOP", 5), pad("money", 6), "result");
  for (const r of results.filter((x) => x.who === who)) {
    const verdict = r.isScam
      ? r.stoppedBeforeMoney
        ? "STOP before money"
        : r.warnedBeforeMoney
          ? "warned before money (no STOP)"
          : r.firstFlagLine
            ? "warned only after money asked"
            : "MISSED"
      : r.falseAlarm || r.defenderFalseAlarm
        ? "FALSE ALARM"
        : "ok (no alarm)";
    console.log(pad(r.scriptId, 28), pad(r.lang, 5), pad(r.noise, 6), pad(r.endedBy, 16), pad(r.turns, 6), pad(r.firstFlagLine, 5), pad(r.stopLine, 5), pad(r.moneyLine, 6), verdict);
  }
  const a = summarize(results, "goes_along");
  const d = summarize(results, "defender");
  console.log(`\nRUKO'S OWN CHECK on the whole call: ${a.scamRuns} scam runs. STOP before the money request in ${a.stoppedBeforeMoney}; a warning or STOP before it in ${a.warnedBeforeMoney}; any warning in ${a.warnedAtAll}; median STOP on line ${a.medianStopLine ?? "-"}.`);
  console.log(`  Genuine calls: ${a.controlRuns}. Ruko false alarms: ${a.rukoFalseAlarms}.`);
  console.log(`DEFENDER BOT vs scammer bot: ${d.scamRuns} scam runs. The defender left the call itself in ${d.defenderExits}. Times it agreed to pay or share anything: ${d.leaks}. Guardrail breaks by the scammer: ${d.guardBreaks}.`);
  console.log(`  Genuine calls: ${d.controlRuns}. Defender false alarms: ${d.defenderFalseAlarms}.`);
  const rl = summarize(results, "relentless");
  console.log(`DEFENDER vs a RELENTLESS scammer (never gives up): ${rl.scamRuns} scam runs. The defender left the call itself in ${rl.defenderExits}. Times it agreed to pay or share anything: ${rl.leaks}. Guardrail breaks: ${rl.guardBreaks}.`);
}
