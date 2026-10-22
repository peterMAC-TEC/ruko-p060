// The role-play bots: how the scammer reads a reply, its guardrails, the defender's playbook, and the
// harness results as regression gates (if a change makes Ruko worse, these fail).
// Run: npx tsx scripts/check-bots.ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { ALL_DEFENDER_LINES, assess, defend, defenderStart } from "../lib/bots/defender";
import { checkCallerLine } from "../lib/bots/guard";
import { runAll, summarize } from "../lib/bots/harness";
import { classify } from "../lib/bots/intent";
import { initialState, nextTurn, openingTurn, spine } from "../lib/bots/scammer";
import type { DrillLibrary } from "../lib/drill";
import { foldDevanagari, phraseHits, BUNDLED_LIBRARY } from "../lib/patterns";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

const lib = JSON.parse(readFileSync(path.join(process.cwd(), "data", "drill-scripts.json"), "utf8")) as DrillLibrary;
const get = (id: string) => lib.scripts.find((s) => s.id === id)!;
const arrest = get("scam_digital_arrest");
const kyc = get("control_bank_kyc");

// ---- what a person says → an intent
const c = classify;
ok("silence", c("") === "silence" && c("   ") === "silence");
ok("the stop word wins over everything", c("RUKO, stop, I will not pay") === "stop_word" && c("रुको") === "stop_word");
ok("going along: English, Hinglish, Hindi", c("okay") === "comply" && c("haan ji") === "comply" && c("ठीक है") === "comply");
ok("hesitating", c("wait, I'm scared") === "hesitate" && c("pata nahi, mujhe dar lag raha hai") === "hesitate" && c("why?") === "hesitate");
ok("refusing", c("no") === "refuse" && c("I am hanging up now") === "refuse" && c("I will call my son") === "refuse" && c("nahi karunga") === "refuse");
ok("asking for proof", c("who are you? show your ID") === "ask_proof" && c("aap kaun hain") === "ask_proof");
ok("mentioning family", c("let me ask my son") === "refuse" || c("let me ask my son") === "mention_family");
ok("agreeing to keep it secret", c("I won't tell anyone") === "agree_secret" && c("kisi ko nahi bataunga") === "agree_secret");
ok("saying they will pay", c("I'll send it now") === "will_pay" && c("bank app open kar raha hoon") === "will_pay" && c("bhej raha hoon") === "will_pay");
ok("reading out a 4-digit code", c("it is 4 7 2 1") === "code_read" && c("one two three four") === "code_read");
ok("the helpline number 1930 is not a code", c("I will call 1930") !== "code_read");

// ---- the scammer bot
const spineIds = spine(arrest).map((s) => s.id);
ok("the spine skips the disclosure, the debrief and the held-back pressure lines", !spineIds.includes("drill_disclosure") && !spineIds.includes("debrief") && !spineIds.some((id) => /cover|override/.test(id)));
const open = openingTurn(arrest, "en", false);
ok("with no family present the call opens with the practice disclosure", /practice call/i.test(open.text) && /Central Investigation Cell/.test(open.text));
ok("with family present it goes straight to the opening line", !/practice call/i.test(openingTurn(arrest, "en", true).text));

// going along follows the script in order, up to the money request, and the facilitator is told the person went along
let t = openingTurn(arrest, "en", true);
const order: string[] = [t.stepId];
for (let i = 0; i < 20 && !t.ended; i++) {
  t = nextTurn(arrest, t.state, "okay", "en");
  if (!t.ended) order.push(t.stepId);
}
ok("a person who goes along hears every step, in order", order.join() === spineIds.join(), `${order.length} steps`);
ok("…and then the call completes", t.ended && t.state.ended === "complete");
ok("the call reaches the money request", order.some((id) => /pivot|transfer/.test(id)));

const hes = nextTurn(arrest, openingTurn(arrest, "en", true).state, "wait, why?", "en");
ok("hesitating gets the script's pressure line and stays on the step", hes.kind === "pressure" && hes.text === arrest.steps.find((s) => s.id === "da_open")!.branches!.hesitate!.en);
const proof = nextTurn(arrest, openingTurn(arrest, "en", true).state, "who are you? show me your ID", "en");
ok("asking for proof gets a made-up ID from the fictional cell", /Central Investigation Cell/.test(proof.text) && /drill/i.test(proof.text));
const fam = nextTurn(arrest, openingTurn(arrest, "en", true).state, "I should ask my wife", "en");
ok("mentioning family gets the secrecy reminder", /confidential/i.test(fam.text));
const r1 = nextTurn(arrest, openingTurn(arrest, "en", true).state, "no I will not", "en");
ok("the first refusal gets one more push", !r1.ended && r1.kind === "pressure");
const r2 = nextTurn(arrest, r1.state, "no, I am hanging up", "en");
ok("the second refusal ends the call kindly with the debrief", r2.ended && /practice call/i.test(r2.text) && /Goodbye|नमस्ते/.test(r2.text));
const ctl = nextTurn(kyc, openingTurn(kyc, "en", true).state, "no thanks, I'll hang up", "en");
ok("on a genuine call, one refusal ends it politely", ctl.ended && /No problem/.test(ctl.text));
ok("it suggests where on the 0-7 scale the person is, for the facilitator to confirm", r1.suggestLevel === 0 && nextTurn(arrest, open.state, "1 2 3 4", "en").suggestLevel === 3 && nextTurn(arrest, open.state, "I'll send it", "en").suggestLevel === 4);
const bank = nextTurn(arrest, openingTurn(arrest, "en", true).state, "okay", "en", { bankHeld: true });
ok("when the bank holds the payment it uses the script's override line", bank.kind === "pressure" && /hold/i.test(bank.text));
let rel = openingTurn(arrest, "en", true);
for (let i = 0; i < 30; i++) rel = nextTurn(arrest, rel.state, "no, I refuse, I'm hanging up", "en", { relentless: true });
ok("the relentless scammer (lab stress test only) never gives up", !rel.ended);

// ---- the guardrails
ok("a safe made-up line passes", checkCallerLine("Please listen carefully. This case is serious.").ok);
ok("real agencies are refused", !checkCallerLine("This is the CBI calling").ok && !checkCallerLine("I am from FedEx").ok && !checkCallerLine("RBI has frozen your account").ok);
ok("asking for a real OTP, PIN or password is refused", !checkCallerLine("Tell me your OTP now").ok && !checkCallerLine("Read me your UPI PIN").ok && !checkCallerLine("Give me your card number").ok);
ok("long numbers (real accounts or phones) are refused, a 4-digit code is fine", !checkCallerLine("Send it to account 123456789012").ok && checkCallerLine("Read me the four-digit code 4471").ok);
ok("threats of violence and over-long lines are refused", !checkCallerLine("I will hurt you").ok && !checkCallerLine("word ".repeat(40)).ok);
const allLines = lib.scripts.flatMap((s) => s.steps.flatMap((st) => [st.line_en, st.line_hi, st.branches?.hesitate?.en ?? "", st.branches?.hesitate?.hi ?? ""]));
ok("no drill script names a real agency, bank or firm", allLines.every((l) => !/\b(cbi|rbi|trai|sbi|hdfc|icici|fedex|dhl|dtdc|amazon|flipkart|enforcement directorate)\b/i.test(l)));

// ---- the defender bot
ok("every defender line is calm and never agrees to anything", ALL_DEFENDER_LINES.every((l) => !/\b(i will (send|transfer|pay)|here is|my (otp|pin) is)\b/i.test(l)));
ok("the defender never says the stop word (that would end a lab call)", ALL_DEFENDER_LINES.every((l) => !/ruko|रुको/i.test(l)));
const polite = defend(defenderStart(), "Good morning, this is your bank. Your KYC is due. There is no hurry. We never ask for your OTP.", "en");
ok("a genuine call: polite thanks, no alarm, no family alert", polite.tactic === "thanks" && !polite.alertFamily && !polite.end);
const first = defend(defenderStart(), "This is the Central Investigation Cell. A parcel with drugs was booked in your name. You are under digital arrest.", "en");
ok("a threat: first it asks who they are and alerts the family", first.tactic === "verify" && first.alertFamily);
const second = defend(first.state, "You are under digital arrest. Do not disconnect.", "en");
ok("then it states the rule", second.tactic === "boundary" && !second.alertFamily);
ok("it asks for the family alert only once", !second.alertFamily && !defend(second.state, "arrest warrant, stay on the line", "en").alertFamily);
const ask = defend(defenderStart(), "Transfer four lakh rupees to the safe account now.", "en");
ok("a request for money ends the call at once", ask.tactic === "exit" && ask.end);
ok("so does a request to read out a code", defend(defenderStart(), "Please read me the four-digit case code on your screen.", "en").end);
ok("Hinglish works too", /Main/.test(defend(defenderStart(), "digital arrest warrant", "hing").text));
ok("Ruko's own check sees the whole call", assess("a parcel with drugs and a warrant").level !== "clear");

// ---- Ruko's phrase check (the engine behind the offline fallback)
ok("Hindi letters with a dot match the plain ones", foldDevanagari("गिरफ़्तार") === foldDevanagari("गिरफ्तार"));
const kycLib = BUNDLED_LIBRARY.patterns.find((p) => p.id === "kyc_block")!;
ok("a bank's 'we never ask for your OTP' is a warning, not a scam sign", phraseHits(BUNDLED_LIBRARY.patterns.find((p) => p.id === "otp_screenshare")!, "We will never ask for your OTP, PIN or password.") === 0);
ok("…but 'he asked for my OTP' still counts", phraseHits(BUNDLED_LIBRARY.patterns.find((p) => p.id === "otp_screenshare")!, "He asked me to tell him my OTP") >= 1);
ok("one common word (KYC) is only half a sign", phraseHits(kycLib, "Your KYC is due") === 0.5);
ok("two common words in one pattern still count only half", phraseHits(BUNDLED_LIBRARY.patterns.find((p) => p.id === "courier_drugs")!, "A parcel from the courier company") === 0.5);

// ---- the harness, as regression gates
const results = runAll(lib);
const along = summarize(results, "goes_along");
const kind = summarize(results, "defender");
const hard = summarize(results, "relentless");
ok(`Ruko warns before the money request in every scam run`, along.warnedBeforeMoney === along.scamRuns, `${along.warnedBeforeMoney}/${along.scamRuns}`);
ok(`Ruko shows STOP before the money request in at least 22 of 30 scam runs`, along.stoppedBeforeMoney >= 22, `${along.stoppedBeforeMoney}/${along.scamRuns}`);
ok(`Ruko false-alarms on at most 2 of 24 genuine-call runs`, along.rukoFalseAlarms <= 2, `${along.rukoFalseAlarms}/${along.controlRuns}`);
ok("the defender never agrees to pay or share anything, against any scammer", kind.leaks === 0 && hard.leaks === 0 && along.leaks === 0);
ok("the scammer bot never breaks a guardrail", along.guardBreaks === 0 && kind.guardBreaks === 0 && hard.guardBreaks === 0);
ok("the defender leaves a relentless scammer's call in every scam run", hard.defenderExits === hard.scamRuns, `${hard.defenderExits}/${hard.scamRuns}`);
ok("the defender false-alarms on at most 2 of 24 genuine calls", kind.defenderFalseAlarms <= 2, `${kind.defenderFalseAlarms}/${kind.controlRuns}`);

console.log(`all ${n} bot checks passed`);
