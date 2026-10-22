// Test vectors for the Android grader: the web app's own number grading (lib/numberRisk.ts + lib/line.ts) is the reference,
// and the Kotlin grader must give the same grade for the same input. This writes android/test-vectors/number-vectors.csv
// (or, with --check, fails if the file is out of date).
// Run: npx tsx scripts/gen-android-vectors.ts [--check]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { gradeNumber } from "../lib/line";
import { classifyNumber, normalizeNumber, scoreNumber } from "../lib/numberRisk";

// number, inContacts, scamReports, notScamReports, blockedByUser
const CASES: Array<[string, boolean, number, number, boolean]> = [
  ["+919845000002", true, 0, 0, false],
  ["+919800000000", false, 0, 0, false],
  ["9800000000", false, 0, 0, false],
  ["09800000000", false, 0, 0, false],
  ["+91 98000 11122", false, 0, 0, false],
  ["+4412345678901", false, 0, 0, false],
  ["004412345678901", false, 0, 0, false],
  ["+12025550123", false, 0, 0, false],
  ["1600123456", false, 0, 0, false],
  ["+911600123456", false, 0, 0, false],
  ["1400123456", false, 0, 0, false],
  ["140012345", false, 0, 0, false],
  ["12345", false, 0, 0, false],
  ["112", false, 0, 0, false],
  ["+918041234567", false, 0, 0, false],
  ["+919800000001", false, 1, 0, false],
  ["+919800000001", false, 2, 0, false],
  ["+919800000001", false, 3, 0, false],
  ["+919800000001", false, 5, 0, false],
  ["+919800000001", false, 40, 2, false],
  ["+919800000001", false, 1, 3, false],
  ["+919800000001", false, 0, 5, false],
  ["+919800000001", false, 2, 9, false],
  ["+4412345678901", false, 2, 0, false],
  ["+4412345678901", false, 0, 4, false],
  ["+919845000002", true, 5, 0, false],
  ["+919845000002", true, 0, 0, true],
  ["+919800000000", false, 0, 0, true],
  ["not a number", false, 0, 0, false],
  ["", false, 0, 0, false],
];

const header = "# number,inContacts,scamReports,notScamReports,blocked,normalized,kind,score,grade";
const lines = CASES.map(([n, c, s, ns, b]) => {
  const risk = scoreNumber(n, { inContacts: c, reports: { scam: s, notScam: ns, unsure: 0 } });
  const grade = gradeNumber(risk, { inContacts: c, blocked: b });
  return [JSON.stringify(n).replace(/,/g, ";"), c, s, ns, b, normalizeNumber(n), classifyNumber(normalizeNumber(n)), risk.score, grade].join(",");
});
const out = [header, ...lines, ""].join("\n");

const file = path.join(process.cwd(), "..", "android", "test-vectors", "number-vectors.csv");
if (process.argv.includes("--check")) {
  const have = existsSync(file) ? readFileSync(file, "utf8").replace(/\r\n/g, "\n") : "";
  if (have !== out) {
    console.error("android/test-vectors/number-vectors.csv is out of date: run npx tsx scripts/gen-android-vectors.ts");
    process.exit(1);
  }
  console.log(`ok  the Android test vectors match the web grader (${CASES.length} cases)`);
} else {
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, out, "utf8");
  console.log(`wrote ${CASES.length} vectors to ${file}`);
}
