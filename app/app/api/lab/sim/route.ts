import { labAllowed, labDenied } from "@/lib/lab";
import { runAll, summarize } from "@/lib/bots/harness";
import { loadDrillLibrary } from "@/lib/drill-server";

// The simulator (lib/bots/harness.ts): the scammer bot against Ruko's own check and the defender bot, over every
// drill script, in English and Hindi, clean and with speech-to-text noise. Instant, free and repeatable.
// It tests Ruko's rules. It is not evidence about people: that is what the trial is for.
export async function GET() {
  if (!(await labAllowed())) return labDenied();
  const results = runAll(await loadDrillLibrary());
  return Response.json({
    goesAlong: summarize(results, "goes_along"),
    defender: summarize(results, "defender"),
    relentless: summarize(results, "relentless"),
    // One line per script for the whole-call check (clean, English): when Ruko warned and showed STOP, and when money was first asked.
    scripts: results
      .filter((r) => r.who === "goes_along" && r.noise === "clean")
      .map((r) => ({ id: r.scriptId, title: r.title, isScam: r.isScam, lang: r.lang, lines: r.turns, flag: r.firstFlagLine, stop: r.stopLine, money: r.moneyLine, falseAlarm: r.falseAlarm })),
  });
}
