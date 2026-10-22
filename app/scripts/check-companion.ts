// Ruko Companion checks: the script, the safety filter on the AI's replies, and the offline answers.
// Run: npx tsx scripts/check-companion.ts
import assert from "node:assert/strict";
import { ELDER_STATUSES, FAMILY_LINE, MAX_REPLY_CHARS, STEPS, actionsFor, fallbackAnswer, safeReply, type StepId } from "../lib/companion";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

// The script is complete and can always finish.
const ids = Object.keys(STEPS) as StepId[];
ok("every option leads somewhere or does something", ids.every((s) => STEPS[s].options.every((o) => o.to || o.action)));
ok("every step points only at steps that exist", ids.every((s) => STEPS[s].options.every((o) => !o.to || o.to in STEPS)));
ok("every line and button has English and Hinglish", ids.every((s) => STEPS[s].say.en && STEPS[s].say.hing && STEPS[s].options.every((o) => o.label.en && o.label.hing)));
ok("no step has more than 3 buttons (one decision at a time)", ids.every((s) => STEPS[s].options.length <= 3));
ok("every status has a line for the family", ELDER_STATUSES.every((s) => FAMILY_LINE[s]));

// Walk every path from the start: nothing is a dead end, and the script never asks for money.
const reach = new Set<StepId>(["hello"]);
for (let i = 0; i < 10; i++) for (const s of [...reach]) for (const o of STEPS[s].options) if (o.to) reach.add(o.to);
ok("every step can be reached from the start", reach.size === ids.length, `${reach.size}/${ids.length}`);
ok("the script never tells anyone to send, pay or share", ids.every((s) => !/\b(please|you should)\s+(send|pay|transfer|share)\b/i.test(STEPS[s].say.en)));
ok("the script never blames", ids.every((s) => !/your fault\b(?!.*not)/i.test(STEPS[s].say.en.replace(/not your fault/gi, ""))));
ok("the 'paid' path leads to 1930", STEPS.paid.options.some((o) => o.action === "call_1930"));
ok("the 'paid' path also offers the report that helps warn others", STEPS.paid.options.some((o) => o.action === "report") && STEPS.free.options.some((o) => o.action === "report"));
ok("the scared path leads to family", STEPS.scared.options.some((o) => o.action === "call_family"));

// The AI's replies are only shown when safe.
ok("a calm, short reply passes", safeReply("Please hang up. Nobody can arrest you on a video call.") !== null);
ok("'do not send money' is allowed", safeReply("Please do not send money to anyone who called you.") !== null);
ok("telling them to send money is refused", safeReply("You should send the money to the safe account to clear your name.") === null);
ok("telling them to share the OTP is refused", safeReply("Please share the OTP so they can verify you.") === null);
ok("telling them to install an app is refused", safeReply("Just download the app they sent.") === null);
ok("investment advice is refused", safeReply("You could invest the money in a mutual fund instead.") === null);
ok("legal advice is refused", safeReply("Hire a lawyer and apply for bail.") === null);
ok("blame is refused", safeReply("It was your fault for answering.") === null);
ok("'It is not your fault' is allowed, in both languages", safeReply("It is not your fault.") !== null && safeReply("Isme aapki galti nahi hai.") !== null);
ok("a long reply is refused", safeReply("x".repeat(MAX_REPLY_CHARS + 1)) === null);
ok("an empty reply is refused", safeReply("  ") === null && safeReply(undefined) === null);
ok("Hinglish 'mat bhejiye' is allowed", safeReply("Paise mat bhejiye, kripya call kaat dijiye.") !== null);

// Offline answers.
const q = (text: string, lang: "en" | "hing" = "en") => fallbackAnswer(text, lang);
ok("asked about money → don't send", /do not send/i.test(q("they want me to transfer money to a safe account").reply));
ok("asked about OTP → never tell", /never tell/i.test(q("should I give my OTP?").reply));
ok("asked about arrest → doesn't exist, hang up", q("am I going to jail, there is a warrant").intent === "hang_up");
ok("'I already paid' → 1930", q("I already sent the money").intent === "already_paid" && actionsFor("already_paid")[0] === "call_1930");
ok("scared → family", q("I am very scared").intent === "call_family");
ok("Hinglish question gets a Hinglish answer", /mat bhejiye/.test(q("paise bhejna hai kya?", "hing").reply));
ok("anything else → the safe default", q("what is the weather").intent === "other" && /hang up/i.test(q("what is the weather").reply));
ok("every offline answer passes the safety filter", ["send money", "otp please", "police arrest", "already paid", "scared", "family call", "weather"].every((x) => safeReply(q(x).reply) !== null && safeReply(q(x, "hing").reply) !== null));

console.log(`all ${n} companion checks passed`);
