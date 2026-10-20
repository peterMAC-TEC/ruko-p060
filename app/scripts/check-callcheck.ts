// Sanity checks for "Is this call real?". Run: npx tsx scripts/check-callcheck.ts
import assert from "node:assert/strict";
import { scoreCall, type Level } from "../lib/callcheck";

const cases: Array<[string, Parameters<typeof scoreCall>[0], string, Level]> = [
  ["classic digital arrest, all yes", { authority: "yes", arrest: "yes", secrecy: "yes", money: "yes" }, "", "high"],
  ["arrest threat + secrecy only", { arrest: "yes", secrecy: "yes" }, "", "high"],
  ["elder just says the phrase", {}, "They said I am under digital arrest", "high"],
  ["Hindi: digital arrest + don't tell", {}, "उन्होंने कहा डिजिटल अरेस्ट है, किसी को मत बताना", "high"],
  ["courier parcel + money", {}, "FedEx said my parcel had drugs and asked me to transfer money for verification", "high"],
  ["authority only, nothing else", { authority: "yes", arrest: "no", secrecy: "no", money: "no" }, "", "low"],
  ["says it's the bank, not 1600, asks OTP", { bank_number: "yes", money: "yes" }, "", "high"],
  ["unsure on everything", { authority: "unsure", arrest: "unsure", secrecy: "unsure", money: "unsure", bank_number: "unsure" }, "", "medium"],
  ["grandson asking about lunch", { authority: "no", arrest: "no", secrecy: "no", money: "no", bank_number: "no" }, "my grandson asked what I cooked", "low"],
];

for (const [name, answers, said, want] of cases) {
  const r = scoreCall(answers, said);
  assert.equal(r.level, want, `${name}: got ${r.level} (${r.score}) ${r.signals.join(",")}`);
  console.log(`ok  ${name.padEnd(42)} ${r.level.padEnd(6)} ${String(r.score).padStart(3)}  ${r.kind}  ${r.signals.join(", ")}`);
}
console.log(`all ${cases.length} call-check cases passed`);
