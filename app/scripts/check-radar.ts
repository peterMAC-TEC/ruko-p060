// Scam Radar checks: the guided check and the number risk score.
// Run: npx tsx scripts/check-radar.ts
import assert from "node:assert/strict";
import { BUNDLED_LIBRARY as lib } from "../lib/patterns";
import { normalizeNumber, scoreNumber } from "../lib/numberRisk";
import { runRadar } from "../lib/radar";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

// Library
ok("library has the 10 v2 patterns", lib.patterns.length === 10);
for (const p of lib.patterns) {
  assert.ok(p.name.en && p.name.hi && p.rule.en && p.rule.hi, `${p.id} names and rules`);
  assert.equal(p.explain.en.length, 3, `${p.id} has 3 English lines`);
  assert.equal(p.explain.hi.length, 3, `${p.id} has 3 Hindi lines`);
  for (const src of p.phrases) new RegExp(src, "i"); // throws if a phrase is a bad regex
}
ok("every pattern has EN/HI name, rule, 3-line explain and valid phrases", true);

// Guided check: v2 says two or more "yes" answers trigger STOP, naming the scam.
const r1 = runRadar(lib, { identity: "police", answers: { stay_on_call: "yes", pay_avoid_arrest: "yes" } });
ok("fake police + 2 yes → STOP, digital arrest", r1.level === "stop" && r1.pattern?.id === "digital_arrest", r1.level);
const r2 = runRadar(lib, { answers: { install_app: "yes", share_otp: "yes" } });
ok("no identity, install app + OTP → STOP, named from the answers", r2.level === "stop" && r2.pattern?.id === "otp_screenshare", r2.pattern?.id);
const r3 = runRadar(lib, { identity: "bank", answers: { share_otp: "yes" } });
ok("bank + 1 yes → caution, not STOP", r3.level === "caution" && r3.pattern?.id === "kyc_block");
const r4 = runRadar(lib, { identity: "family", answers: {} });
ok("nothing answered yes → clear (never 'safe')", r4.level === "clear");
const r5 = runRadar(lib, { answers: {}, said: "They said I am under digital arrest and CBI has a warrant" });
ok("said two digital-arrest phrases → STOP with no answers", r5.level === "stop" && r5.pattern?.id === "digital_arrest");
const r6 = runRadar(lib, { answers: {}, said: "उन्होंने कहा डिजिटल अरेस्ट है, सीबीआई का वारंट है" });
ok("Hindi phrases → STOP, digital arrest", r6.level === "stop" && r6.pattern?.id === "digital_arrest");
const r7 = runRadar(lib, { answers: { install_app: "yes" }, said: "install AnyDesk so I can help with your refund" });
ok("AnyDesk + refund → names the screen-share scam", r7.pattern?.id === "otp_screenshare" || r7.pattern?.id === "fake_customer_care", r7.pattern?.id);
const r8 = runRadar(lib, { answers: { share_otp: "yes" }, sensitivity: "high" });
ok("high sensitivity: 1 yes → STOP", r8.level === "stop");
const r9 = runRadar(lib, { answers: { share_otp: "yes", install_app: "yes" }, sensitivity: "low" });
ok("low sensitivity: 2 yes → only caution", r9.level === "caution");
const r10 = runRadar(lib, { answers: { keep_secret: "yes", stay_on_call: "yes" } });
ok("secret + stay on call → digital arrest", r10.pattern?.id === "digital_arrest" && r10.level === "stop");

// Number risk
ok("normalises 10-digit mobile", normalizeNumber("98450 00001") === "+919845000001");
ok("normalises 0-prefixed mobile", normalizeNumber("09845000001") === "+919845000001");
ok("bank 1600 number is low and reassuring", (() => {
  const s = scoreNumber("1600123456");
  return s.level === "low" && s.reasons.includes("bank_series");
})());
ok("international unknown number → medium", scoreNumber("+855 12 345 678").level === "medium");
ok("unknown Indian mobile, no reports → low", scoreNumber("+91 98765 43210").level === "low");
ok("reported 214 times as fake police → high", (() => {
  const s = scoreNumber("+91 98765 43210", { reports: { scam: 214, notScam: 3, unsure: 5, topPattern: "digital_arrest" } });
  return s.level === "high" && s.reports === 214 && s.topPattern === "digital_arrest";
})());
ok("one scam report → medium-ish, not high", scoreNumber("+91 98765 43210", { reports: { scam: 1, notScam: 0, unsure: 0 } }).level !== "high");
ok("more 'not a scam' than 'scam' → low", scoreNumber("+91 98765 43210", { reports: { scam: 2, notScam: 9, unsure: 0 } }).level === "low");
ok("saved contact stays low even if international", scoreNumber("+44 7700 900123", { inContacts: true }).level === "low");

console.log(`all ${n} Scam Radar checks passed`);
