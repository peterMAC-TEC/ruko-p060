// Family setup: the Rule Card sentence and the checklist logic. Run: npx tsx scripts/check-setup.ts
import assert from "node:assert/strict";
import { ruleCard } from "../lib/rule-card";
import { setupStatus, TEST_ALERT_CODE } from "../lib/setup-status";

let n = 0;
const ok = (name: string, cond: boolean) => {
  assert.ok(cond, name);
  n++;
  console.log(`ok  ${name}`);
};

// Rule Card
ok("the Rule Card is one sentence that names the trusted person", ruleCard("Priya").rule === "If anyone asks for money on a call, hang up and call Priya. Never stay on the line.");
ok("the Rule Card has a Hinglish version", /Priya ko phone kijiye/.test(ruleCard("Priya", "hing").rule));
ok("with no trusted person it points to 1930, never to nobody", /1930/.test(ruleCard(null).rule) && /1930/.test(ruleCard("  ", "hing").rule));
ok("the Rule Card never tells anyone to pay, share a code or stay on the line", ["en", "hing"].every((l) => !/\b(send money|pay|otp|stay on the line\b(?! *\.)\b)/i.test(ruleCard("Priya", l as "en" | "hing").rule.replace("Never stay on the line.", ""))));

// Checklist
const none = setupStatus({ trustedName: null, codeWordSet: false, events: [] });
ok("nothing done yet: 0 of 4, not complete", none.done === 0 && !none.complete);
ok("a trusted person means the Rule Card is set", setupStatus({ trustedName: "Priya", codeWordSet: false, events: [] }).ruleCardSet);
ok("the code word counts only when it is really set", setupStatus({ trustedName: "Priya", codeWordSet: true, events: [] }).codeWordSet);
const test = setupStatus({ trustedName: "Priya", codeWordSet: true, events: [{ source: "elder", reasonCodes: [TEST_ALERT_CODE] }] });
ok("a test alert counts as a test, not as a drill", test.testAlertReceived && !test.drillDone && test.done === 3);
const drill = setupStatus({ trustedName: "Priya", codeWordSet: true, events: [{ source: "elder", reasonCodes: [TEST_ALERT_CODE] }, { source: "agent", reasonCodes: ["pattern_digital_arrest"] }] });
ok("a real Ruko STOP counts as the practice drill", drill.drillDone && drill.complete && drill.done === 4);
ok("the checklist cannot be completed by a tick box alone", !setupStatus({ trustedName: "Priya", codeWordSet: true, events: [] }).complete);

console.log(`all ${n} setup checks passed`);
