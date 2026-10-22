// The scripted call demo: Ruko must step in because its own check says STOP, before the scammer asks for money.
// Run: npx tsx scripts/check-demo.ts
import assert from "node:assert/strict";
import { checkCallerLine } from "../lib/bots/guard";
import { plan, readingMs, SCENE_TEXT, type DemoLang } from "../lib/demo-call";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

for (const lang of ["en", "hing"] as DemoLang[]) {
  const withRuko = plan(lang, true);
  const moneyIndex = withRuko.beats.findIndex((b) => /fifty thousand|pachas hazaar/i.test(b.text));
  const rukoIndex = withRuko.beats.findIndex((b) => b.who === "ruko");
  ok(`${lang}: Ruko steps in because its own check says STOP`, withRuko.rukoAfterScammerLine !== null && !withRuko.moneyAskedBeforeStop);
  ok(`${lang}: the scammer never gets to ask for money`, moneyIndex === -1, `Ruko speaks at beat ${rukoIndex + 1}`);
  ok(`${lang}: the call ends with the family told`, withRuko.beats[withRuko.beats.length - 1].scene === "family");
  ok(`${lang}: the person hangs up before anything else`, withRuko.beats[rukoIndex + 1].who === "kamala" && /hanging up|call kaat/i.test(withRuko.beats[rukoIndex + 1].text));

  const without = plan(lang, false);
  ok(`${lang}: without Ruko the scammer asks for money and the call ends in loss`, without.beats.some((b) => /fifty thousand|pachas hazaar/i.test(b.text)) && without.beats[without.beats.length - 1].scene === "lost");
  ok(`${lang}: Ruko never speaks in the without-Ruko version`, !without.beats.some((b) => b.who === "ruko"));

  const all = [...withRuko.beats, ...without.beats];
  ok(`${lang}: Ruko never tells anyone to pay or share anything`, all.filter((b) => b.who === "ruko").every((b) => !/\b(send|transfer|pay) (the )?money (to|now)|share (your |the )?(otp|pin)/i.test(b.text)));
  ok(`${lang}: no real names or real numbers`, all.every((b) => b.who !== "scammer" || checkCallerLine(b.text.split(" ").slice(0, 28).join(" ")).ok));
  ok(`${lang}: the scammer asks for no real OTP, card or Aadhaar number`, all.filter((b) => b.who === "scammer").every((b) => !/\b(otp|cvv|aadhaar number|card number|password)\b/i.test(b.text)));
}
ok("every scene caption exists in both languages", Object.values(SCENE_TEXT.en).every(Boolean) && Object.values(SCENE_TEXT.hing).every(Boolean));
ok("reading time is sensible", readingMs("Hello") >= 1200 && readingMs("x".repeat(500)) <= 9000);

console.log(`all ${n} demo-call checks passed`);
