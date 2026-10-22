// Ruko Line: the grade, the screening bot and its decisions, and the drill scripts replayed as calls to the gatekeeper.
// Run: npx tsx scripts/check-line.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { checkCallerLine } from "../lib/bots/guard";
import type { DrillLibrary } from "../lib/drill";
import { allLineBotLines, gradeNumber, lineOpen, replayLine, type Grade } from "../lib/line";
import { scoreNumber } from "../lib/numberRisk";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

// ---- grading the number
const g = (num: string, o: { inContacts?: boolean; blocked?: boolean; scam?: number } = {}): Grade =>
  gradeNumber(scoreNumber(num, { inContacts: o.inContacts, reports: { scam: o.scam ?? 0, notScam: 0, unsure: 0 } }), o);
ok("a saved contact is green", g("+919845000002", { inContacts: true }) === "green");
ok("an unknown Indian mobile is yellow", g("+919800000000") === "yellow");
ok("an international number is orange", g("+4412345678901") === "orange");
ok("a number many people reported is red", g("+919800000001", { scam: 5 }) === "red");
ok("a number the person blocked is red, even if saved", g("+919845000002", { inContacts: true, blocked: true }) === "red");
ok("a bank 1600 number is yellow, never green", g("1600123456") === "yellow");

// ---- a green call is put straight through
const open = lineOpen("green", "Kamala", "en");
ok("green: put through at once", open.decision?.action === "patch" && /Putting you through/.test(open.say));
ok("non-green: asks who is calling and decides nothing yet", lineOpen("yellow", "Kamala", "en").decision === null);

// ---- genuine callers
const courier = ["This is Raj from the delivery company, I am outside with a parcel for Mrs Iyer.", "It is Swift Couriers, my number is 98 45 12 34 56, call me back on it."];
const r1 = replayLine("yellow", courier, "Kamala", "en");
ok("a genuine courier on an unknown number is put through", r1.decision?.action === "patch", r1.decision?.why.join());
const r2 = replayLine("yellow", ["Hi, it's Dr Mehta's clinic, about the appointment tomorrow.", "Yes, call the clinic on 080 2345 6789."], "Kamala", "en");
ok("a clinic reminder is put through", r2.decision?.action === "patch");
const r3 = replayLine("orange", courier, "Kamala", "en");
ok("the same call from a risky number is not put through, a message is taken, nobody is accused", r3.decision?.action === "message" && r3.decision.why.includes("risky_number"));
const r4 = replayLine("yellow", ["", ""], "Kamala", "en");
ok("a silent caller (a robocall) is not put through", r4.decision?.action === "message" && r4.decision.why[0] === "no_answer");

// ---- scammers
const arrest = ["This is Officer Sethi from the Central Investigation Cell, a case has been registered against you.", "Do not disconnect this call. There is a warrant and you will be arrested."];
const s1 = replayLine("yellow", arrest, "Kamala", "en");
ok("a digital-arrest caller is blocked", s1.decision?.action === "block");
const s2 = replayLine("yellow", ["I am from the bank. You must transfer your savings to a safe account today."], "Kamala", "en");
ok("a money request is blocked on the first answer, and locks the money", s2.decision?.action === "block" && s2.decision.lockMoney);
const s3 = replayLine("yellow", ["I am calling about your parcel.", "No need to verify, don't hang up, just stay on the line."], "Kamala", "en");
ok("pushing against the call-back test is blocked", s3.decision?.action === "block" && s3.decision.why.includes("pressure"));
const s4 = replayLine("red", ["Hello, it is customs.", "Do not disconnect please."], "Kamala", "en");
ok("on a red number a single push is enough", s4.decision?.action === "block");
ok("a blocked call turns the grade red", s1.grade === "red");
ok("a block that asked for money says so", s2.decision!.why.includes("asked_money"));
ok("Hinglish works the same", replayLine("yellow", ["Main police se bol raha hoon, aapke naam par warrant hai.", "Call mat kaat, kisi ko mat bata."], "Kamala", "hing").decision?.action === "block");

// ---- the bot's own lines are safe
const bad = allLineBotLines("Kamala").filter((l) => !checkCallerLine(l).ok && !/\d{7,}/.test(l));
ok("the bot's lines name nobody, ask for nothing, and are short", bad.length === 0, bad[0]);
ok("the bot never agrees to pay or share", allLineBotLines().every((l) => !/\b(i will (send|transfer|pay)|here is my (otp|pin|account))\b/i.test(l)));

// ---- the drill scripts as calls (the real scam and genuine-call library the trial uses)
const lib = JSON.parse(readFileSync(path.join(process.cwd(), "data", "drill-scripts.json"), "utf8")) as DrillLibrary;
let scams = 0;
let blocked = 0;
let putThrough = 0;
let controls = 0;
let wrongfulBlocks = 0;
for (const s of lib.scripts) {
  const callerLines = s.steps.filter((st) => !/disclosure|debrief/.test(st.id)).map((st) => st.line_en);
  const r = replayLine("yellow", callerLines, "Kamala", "en");
  if (s.is_scam) {
    scams++;
    if (r.decision?.action === "block") blocked++;
    else console.log(`  (kept off the phone but not blocked: ${s.id} -> ${r.decision?.action ?? "undecided"})`);
    if (r.decision?.action !== "block" && r.decision?.action !== "message") putThrough++;
  } else {
    controls++;
    if (r.decision?.action === "block") {
      wrongfulBlocks++;
      console.log(`  (WRONGLY blocked: ${s.id} ${r.decision.why.join()})`);
    }
  }
}
ok("every genuine-call drill script is NOT blocked (false alarms)", wrongfulBlocks === 0, `${controls} genuine calls`);
ok("no scam drill script is ever put through to the person", putThrough === 0, `${scams} scams`);
ok("most scam drill scripts are blocked outright", blocked >= scams - 2, `${blocked}/${scams} blocked, the rest kept off the phone`);

console.log(`\n${n} checks passed`);
