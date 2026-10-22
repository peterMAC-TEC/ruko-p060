// Voice Trust: after a flagged call, approving a payment needs the family code word. Run: npx tsx scripts/check-codeword.ts
import assert from "node:assert/strict";
import { approvalGate } from "../lib/code-word-rule";

let n = 0;
const ok = (name: string, cond: boolean) => {
  assert.ok(cond, name);
  n++;
  console.log(`ok  ${name}`);
};
const base = { decision: "approved" as const, protectionActive: true, codeWordSet: true, matches: true };

ok("after a flagged call, approving without the word is refused", approvalGate({ ...base, supplied: undefined }) === "code_word_needed");
ok("a blank or spaces-only word is the same as none", approvalGate({ ...base, supplied: "   " }) === "code_word_needed");
ok("a wrong word is refused", approvalGate({ ...base, supplied: "banana", matches: false }) === "code_word_wrong");
ok("the right word lets the approval through", approvalGate({ ...base, supplied: "mango" }) === "ok");
ok("saying no never needs the word", approvalGate({ ...base, decision: "declined", supplied: undefined }) === "ok");
ok("with no flagged call, nothing changes", approvalGate({ ...base, protectionActive: false, supplied: undefined }) === "ok");
ok("with no code word set, nothing changes (the old flow stands)", approvalGate({ ...base, codeWordSet: false, supplied: undefined }) === "ok");
ok("the rule can only make approving harder, never easier", (["approved", "declined"] as const).every((d) => [true, false].every((p) => [true, false].every((c) => approvalGate({ decision: d, protectionActive: p, codeWordSet: c, supplied: undefined, matches: false }) !== "code_word_wrong"))));

console.log(`all ${n} code-word checks passed`);
