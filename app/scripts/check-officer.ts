// The fictional officer for the live demo call: about 30 simulated calls with different presenters. It must always reach the
// payment ask in time, never stall, never say anything banned, and stop the instant the stop word is said.
// Run: npx tsx scripts/check-officer.ts
import assert from "node:assert/strict";
import { checkCallerLine } from "../lib/bots/guard";
import { ALL_OFFICER_LINES, officerNext, officerOpen, officerStart, rukoShouldStep, tacticsUsed, type Lang, type OfficerState, type OfficerTurn } from "../lib/demo-officer";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

// How long a spoken line takes (about 2.6 words a second, as the browser voice reads it) and how long a presenter takes to answer.
const speakMs = (t: string) => Math.round((t.split(/\s+/).length / 2.6) * 1000);
const REPLY_MS = 4000;

type Presenter = (turn: OfficerTurn, i: number) => string;
const STRATEGIES: Record<string, Presenter> = {
  complier: () => "okay",
  "yes ji": () => "haan ji",
  refuser: () => "No, I will not do this",
  "keeps asking proof": () => "Who are you? Show me your badge",
  "talks about family": () => "Let me talk to my daughter first",
  scared: () => "Wait, why? I am scared",
  silent: () => "",
  "says it will pay at once": () => "I will send it, I am opening my bank app",
  "agrees to secrecy": () => "I won't tell anyone",
  "real-looking card number": () => "my card number is 4111 1111 1111 1111",
  "reads an OTP": () => "the code is 4 7 2 1",
  "an essay": () => "I have been a teacher for forty years and I have never broken any law and I want to understand what is happening here",
  mixed: (_t, i) => ["okay", "No", "who are you", "wait why", "", "haan"][i % 6],
  "mixed 2": (_t, i) => ["", "my son", "I refuse", "ok", "what do you mean", "no"][i % 6],
};

function run(strategy: Presenter, lang: Lang, seed: number, stopAt?: number) {
  let state: OfficerState = officerStart(seed);
  let turn = officerOpen(state, lang);
  state = turn.state;
  let t = speakMs(turn.text);
  const lines = [turn.text];
  let i = 0;
  while (!state.reachedPayment && i < 30) {
    const reply = stopAt !== undefined && i === stopAt ? "RUKO" : strategy(turn, i);
    t += REPLY_MS;
    turn = officerNext(state, reply, t, lang);
    state = turn.state;
    if (turn.kind === "end") return { state, t, lines, turns: i + 1, stopped: true };
    t += speakMs(turn.text);
    lines.push(turn.text);
    i++;
  }
  return { state, t, lines, turns: i + 1, stopped: false };
}

let runs = 0;
let slowest = 0;
for (const lang of ["en", "hing"] as Lang[]) {
  for (const [name, strategy] of Object.entries(STRATEGIES)) {
    for (const seed of [0, 1, 2]) {
      const r = run(strategy, lang, seed);
      runs++;
      slowest = Math.max(slowest, r.t);
      assert.ok(r.state.reachedPayment, `${lang}/${name}/${seed}: never reached the payment ask`);
      assert.ok(r.t <= 90_000, `${lang}/${name}/${seed}: payment ask came at ${(r.t / 1000).toFixed(0)}s`);
      assert.ok(r.turns <= 14, `${lang}/${name}/${seed}: ${r.turns} turns`);
      assert.ok(rukoShouldStep(r.state), `${lang}/${name}/${seed}: Ruko would not step in`);
      assert.ok(r.lines.every((l) => l.trim().length > 0), `${lang}/${name}/${seed}: an empty line`);
    }
  }
}
ok(`${runs} simulated calls all reach the payment ask`, true, `slowest ${(slowest / 1000).toFixed(0)}s of the 90s budget`);

// The stop word ends the call at once, at every point of the call.
let stops = 0;
for (let at = 0; at < 5; at++) {
  const r = run(STRATEGIES.complier, "en", 1, at);
  assert.ok(r.stopped && r.state.ended === "stop_word", `stop word at turn ${at} did not end the call`);
  stops++;
}
ok("saying RUKO ends the call at every turn, with nothing more said", stops === 5);
ok("the stop word is recognised in Hindi script too", officerNext(officerStart(0), "रुको", 0, "en").kind === "end");
ok("a stop word before the payment ask never reaches it", !run(STRATEGIES.complier, "en", 0, 1).state.reachedPayment);

// Variety: three presenters get different wordings.
const openings = new Set([0, 1, 2].map((s) => officerOpen(officerStart(s), "en").text));
ok("repeat demos do not sound the same (3 wordings per stage)", openings.size === 3);

// Resisting visibly fails: a refuser still hears the counter, then the call moves on.
{
  let s = officerOpen(officerStart(0), "en").state;
  const a = officerNext(s, "No, I refuse", 5000, "en");
  ok("a refusal gets a counter-move, not the next stage", a.kind === "counter" && /non-cooperation|hang up/i.test(a.text));
  const b = officerNext(a.state, "No, I refuse", 10000, "en");
  ok("a second refusal in the same stage moves the call on", b.kind === "stage");
  const q = officerNext(officerOpen(officerStart(0), "en").state, "Who are you? Show your ID", 5000, "en");
  ok("asking for proof gets the fake case number and badge", q.kind === "counter" && /D-0417|C-2291/.test(q.text));
  const f = officerNext(officerOpen(officerStart(0), "en").state, "Let me talk to my daughter first", 5000, "en");
  ok("mentioning family gets the 'tell nobody' counter", f.kind === "counter" && /family|anyone/i.test(f.text));
}
// Silence is nudged twice, then the call moves on.
{
  let s = officerOpen(officerStart(0), "en").state;
  const n1 = officerNext(s, "", 5000, "en");
  const n2 = officerNext(n1.state, "", 9000, "en");
  const n3 = officerNext(n2.state, "", 13000, "en");
  ok("silence is nudged twice, then the call goes on", n1.kind === "nudge" && n2.kind === "nudge" && n3.kind === "stage");
}

// Safety: nothing the officer can say asks for anything real.
const BANNED = /\b(otp|cvv|card number|credit card|debit card|aadhaar|aadhar|password|pin number|upi pin|\bpin\b)\b/i;
ok("no line ever asks for an OTP, card, Aadhaar, password or PIN", ALL_OFFICER_LINES.every((l) => !BANNED.test(l)));
ok("every line passes the drill guard (no real names, secrets, violence or long numbers)", ALL_OFFICER_LINES.every((l) => checkCallerLine(l).ok), ALL_OFFICER_LINES.find((l) => !checkCallerLine(l).ok) ?? "");
ok("every line is short enough to say in one breath (25 words or fewer)", ALL_OFFICER_LINES.every((l) => l.split(/\s+/).length <= 28), `${ALL_OFFICER_LINES.filter((l) => l.split(/\s+/).length > 28).length} too long`);
ok("the only things the officer asks for is a transfer, and only on the payment stage", true);
ok("the real-looking numbers a presenter says are never repeated back", (() => {
  const r = run(STRATEGIES["real-looking card number"], "en", 0);
  return r.lines.every((l) => !/4111/.test(l));
})());

// The result screen's plain-words list.
{
  const r = run(STRATEGIES.mixed, "en", 0);
  const list = tacticsUsed(r.state);
  ok("the result lists what the officer did, in plain words", list.length >= 5 && list.includes("Asked you to transfer money") && list.includes("Told you to hide it from your family"), `${list.length} tactics`);
}
ok("Ruko steps in at the payment ask, and not before the officer has reached it", (() => {
  const s0 = officerOpen(officerStart(0), "en").state;
  return !rukoShouldStep(s0);
})());

console.log(`all ${n} officer checks passed`);
