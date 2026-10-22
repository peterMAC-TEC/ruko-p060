// Share to Ruko: the text handed over by another app is cleaned and capped, and never trusted.
// Run: npx tsx scripts/check-share.ts
import assert from "node:assert/strict";
import { cleanShared, SHARED_MAX_CHARS } from "../lib/share";

let n = 0;
const ok = (name: string, cond: boolean) => {
  assert.ok(cond, name);
  n++;
  console.log(`ok  ${name}`);
};

ok("title, text and link are joined", cleanShared(["Alert", "Your account is blocked", "https://example.com/x"]) === "Alert\nYour account is blocked\nhttps://example.com/x");
ok("empty, missing and non-text parts are dropped", cleanShared([null, undefined, "", "   ", "hello"]) === "hello");
ok("nothing shared gives an empty string", cleanShared([]) === "" && cleanShared([null]) === "");
ok("control characters are removed", !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(cleanShared(["a\u0000b\u0007c"])));
ok("a very long share is cut to the limit", cleanShared(["x".repeat(SHARED_MAX_CHARS * 3)]).length === SHARED_MAX_CHARS);
ok("Hindi text survives", cleanShared(["आपका खाता बंद हो जाएगा"]) === "आपका खाता बंद हो जाएगा");
ok("markup is kept as plain text, never run (it is only ever shown as text)", cleanShared(["<script>alert(1)</script>"]) === "<script>alert(1)</script>");

console.log(`all ${n} share checks passed`);
