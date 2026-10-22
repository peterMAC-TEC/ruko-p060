// The officer's brain: objection reading, the offline answer tree, the AI-reply guard, and 40 simulated calls with a
// scripted presenter who tries every kind of resistance. Run: npx tsx scripts/check-officerbrain.ts
import assert from "node:assert/strict";
import { checkCallerLine } from "../lib/bots/guard";
import { officerNext, officerOpen, officerStart, rukoShouldStep, type OfficerState, type OfficerTurn } from "../lib/demo-officer";
import { extractName, guardAiReply, objectionOf, objectionReply, OBJECTION_LINES, OBJECTIONS, redactForAi, type Lang } from "../lib/officer-brain";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

// 1. Reading the objection
const READ: [string, string | null][] = [
  ["Is this real? Who are you?", "doubt"],
  ["Which department are you from?", "department"],
  ["I will call my son first", "family"],
  ["I don't have that much money", "no_money"],
  ["This is nonsense, stop this bakwas", "angry"],
  ["I am scared, please help", "scared"],
  ["I am hanging up now", "leave"],
  ["Are you a bot?", "ask_bot"],
  ["Send it to me in writing", "written"],
  ["okay", null],
  ["", null],
  ["RUKO", null],
];
for (const [text, want] of READ) ok(`reads "${text}" as ${want}`, objectionOf(text) === want, `got ${objectionOf(text)}`);

// 2. The offline tree: every objection has 3+ wordings in both languages, short, and safe
for (const o of OBJECTIONS) {
  const lines = OBJECTION_LINES[o];
  ok(`${o}: three or more wordings`, lines.length >= 3);
  ok(`${o}: every wording is 25 words or fewer and passes the drill guard`, lines.every((l) => [l.en, l.hing].every((t) => t.split(/\s+/).length <= 25 && checkCallerLine(t).ok)), lines.map((l) => l.en).filter((t) => t.split(/\s+/).length > 25 || !checkCallerLine(t).ok).join(" | "));
  const a = objectionReply(o, 0, "en");
  ok(`${o}: never the same line twice in a row`, objectionReply(o, 0, "en", a) !== a);
}
ok("'are you a bot' never claims to be a real person", OBJECTION_LINES.ask_bot.every((l) => !/real (person|officer)\b/i.test(l.en.replace(/not a real officer/i, "")) && /role-play|actor|demo|practice/i.test(l.en)));

// 3. The guard against hostile AI replies
const BAD: [string, string, string][] = [
  ["Please tell me the OTP on your phone now.", "payment_ask", "asks for an OTP"],
  ["Read me your card number and the CVV please.", "payment_ask", "asks for a card"],
  ["Share your Aadhaar number so I can verify you.", "authority", "asks for Aadhaar"],
  ["Enter your UPI PIN to continue the verification.", "payment_ask", "asks for a PIN"],
  ["I am from the CBI and this is a serious case against you.", "fear", "real agency"],
  ["This is Officer Sharma from the Enforcement Directorate.", "authority", "real officer and agency"],
  ["My badge is X-9921, case file is open in front of me.", "authority", "different badge"],
  ["Call me back on 9876543210 for the case file details now.", "authority", "phone number"],
  ["Madam, listen carefully " + "and stay on the line ".repeat(6), "isolation", "too long"],
  ["You idiot, stop wasting time and stay on the line now.", "urgency", "abusive"],
  ["Cooperate or I will hurt you and your family, stay on the line.", "isolation", "violence"],
  ["Yes I am a real person, a human officer, please stay on the line.", "isolation", "claims to be human"],
  ["Transfer fifty thousand rupees to the account right now please.", "fear", "payment ask in the wrong stage"],
  ["The garden looks lovely and the weather is great.", "urgency", "leaves the stage"],
  ["", "fear", "empty"],
];
for (const [text, stage, why] of BAD) ok(`guard rejects: ${why}`, !guardAiReply(text, stage).ok, text.slice(0, 40));
const GOOD: [string, string][] = [
  ["I understand your doubt, Asha ji. Case C-2291 is open on my screen; verify after, but first stay on the line.", "authority"],
  ["Please do not be afraid. This is a case I can help with, but we must act quickly.", "fear"],
  ["Transfer fifty thousand rupees to the verification account now. It is refundable, and I stay on the line.", "payment_ask"],
];
for (const [text, stage] of GOOD) ok(`guard allows a safe ${stage} reply`, guardAiReply(text, stage).ok, JSON.stringify(guardAiReply(text, stage)));
ok("digits are never sent to the AI", !/\d{3}/.test(redactForAi("my card is 4111 1111 1111 1111 and otp 482913")));
ok("a name is picked up when given", extractName("my name is Asha") === "Asha" && extractName("I am scared") === null && extractName("I am not sure") === null);

// 4. Forty simulated calls
const speakMs = (t: string) => Math.round((t.split(/\s+/).length / 2.6) * 1000);
type P = (t: OfficerTurn, i: number) => string;
const PRESENTERS: Record<string, P> = {
  refuses: () => "No, I will not do this",
  doubts: () => "Is this real? Who are you?",
  "calls son": () => "I will call my son",
  "which department": () => "Which department are you from?",
  "no money": () => "I don't have that much money",
  angry: () => "This is nonsense, stop this bakwas",
  silent: () => "",
  leaving: () => "I am hanging up now",
  "gives an OTP": () => "the code is 4 7 2 1 and my card is 4111 1111 1111 1111",
  "asks bot": () => "Are you a bot?",
  scared: () => "I am scared, please help me",
  writing: () => "Send it in writing",
  mixed: (_t, i) => ["I will call my son", "who are you", "", "no money", "bakwas", "are you a bot"][i % 6],
};
let calls = 0;
let slowest = 0;
for (const lang of ["en", "hing"] as Lang[]) {
  for (const [name, p] of Object.entries(PRESENTERS)) {
    for (const seed of [0, 1, 2]) {
      let state: OfficerState = officerStart(seed);
      let turn = officerOpen(state, lang);
      state = turn.state;
      let t = speakMs(turn.text);
      const said: string[] = [turn.text];
      let i = 0;
      while (!state.reachedPayment && i < 30) {
        turn = officerNext(state, p(turn, i), (t += 4000), lang);
        state = turn.state;
        t += speakMs(turn.text);
        said.push(turn.text);
        i++;
      }
      calls++;
      slowest = Math.max(slowest, t);
      assert.ok(state.reachedPayment && rukoShouldStep(state), `${lang}/${name}/${seed}: no payment ask`);
      assert.ok(t <= 90_000, `${lang}/${name}/${seed}: ${(t / 1000).toFixed(0)}s`);
      assert.ok(said.every((s, k) => k === 0 || s !== said[k - 1]), `${lang}/${name}/${seed}: the same line twice in a row`);
      assert.ok(said.every((s) => checkCallerLine(s).ok), `${lang}/${name}/${seed}: unsafe line`);
      assert.ok(said.every((s) => !/4111|4 7 2 1/.test(s)), `${lang}/${name}/${seed}: repeated a number back`);
      assert.ok(JSON.stringify(state).indexOf("4111") < 0, `${lang}/${name}/${seed}: stored a number`);
    }
  }
}
ok(`${calls} simulated calls: payment ask reached in time, no repeats, nothing unsafe, nothing stored`, true, `slowest ${(slowest / 1000).toFixed(0)}s`);
{
  const s0 = officerOpen(officerStart(0), "en").state;
  const t0 = Date.now();
  const e = officerNext(s0, "RUKO", 3000, "en");
  ok("RUKO ends the call at once (well under 200 ms of logic)", e.kind === "end" && Date.now() - t0 < 50);
  const named = officerNext(officerNext(s0, "my name is Asha", 1000, "en").state, "I will call my son", 5000, "en");
  ok("the person's name is used once given", /Asha ji/.test(named.text) || named.kind !== "counter", named.text.slice(0, 40));
}
console.log(`all ${n} officer-brain checks passed`);
