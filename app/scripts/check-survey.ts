// The survey bot: the questions, the skip rules, what is accepted and what is scrubbed, and the results.
// Run: npx tsx scripts/check-survey.ts
import assert from "node:assert/strict";
import { QUESTIONS, SURVEY_KINDS, incidentSummary, nextQuestion, scrub, summarize, toCsv, validate, visible, type Answers, type SurveyKind, type SurveyRow } from "../lib/survey";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

// every question is complete, in both languages
for (const k of SURVEY_KINDS) {
  const qs = QUESTIONS[k];
  ok(`${k}: every question has English and Hinglish text`, qs.every((q) => q.ask.en && q.ask.hing));
  ok(`${k}: question ids are unique`, new Set(qs.map((q) => q.id)).size === qs.length);
  ok(`${k}: every choice has options with both languages, scales have end labels`, qs.every((q) => (q.type === "choice" || q.type === "multi" ? !!q.options?.length && q.options.every((o) => o.label.en && o.label.hing && o.id) : true) && (q.type !== "scale" || (q.low && q.high))));
  ok(`${k}: option ids are unique within a question`, qs.every((q) => !q.options || new Set(q.options.map((o) => o.id)).size === q.options.length));
}

// skip rules
const idsOf = (k: SurveyKind, ctx: Parameters<typeof visible>[1], a: Answers = {}) => visible(k, ctx, a).map((q) => q.id);
ok("a control (genuine) call isn't asked whether it felt like a scam", !idsOf("participant", { arm: "control", isScam: false }).includes("belief_real"));
ok("someone without Ruko isn't asked about Ruko's warning", !idsOf("participant", { arm: "baseline", isScam: true }).includes("ruko_help") && idsOf("participant", { arm: "ruko", isScam: true }).includes("ruko_help"));
ok("the family isn't asked how fast they saw an alert they never saw", !idsOf("family", {}, { saw_alert: "no" }).includes("how_fast"));
ok("someone who never got a call skips the questions about the call", !idsOf("open", {}, { got_call: "never" }).includes("types") && !idsOf("open", {}, { got_call: "never" }).includes("what_did"));
ok("the loss question appears only after a loss", idsOf("open", {}, { got_call: "lost_money" }).includes("loss") && !idsOf("open", {}, { got_call: "once", what_did: ["hung_up"] }).includes("loss"));
ok("the loss question also appears if they say they sent money", idsOf("open", {}, { got_call: "once", what_did: ["paid"] }).includes("loss"));

// walking through
const ctx = { arm: "ruko" as const, isScam: true };
const walked: string[] = [];
let a: Answers = {};
for (let i = 0; i < 30; i++) {
  const q = nextQuestion("participant", ctx, a);
  if (!q) break;
  walked.push(q.id);
  a = { ...a, [q.id]: q.type === "scale" ? 3 : q.type === "multi" ? [q.options![0].id] : q.type === "choice" ? q.options![0].id : "fine" };
}
ok("walking through the participant survey ends, asking each question once", new Set(walked).size === walked.length && nextQuestion("participant", ctx, a) === null, walked.join(","));
ok("a skipped optional question is not asked again", nextQuestion("participant", ctx, { belief_real: "yes" }, new Set(["fear"]))?.id !== "fear");

// validation
const good = { belief_real: "yes", fear: 4, why: ["ruko_warned", "afraid_trouble"], thought_tell: "no", ruko_help: "a_lot", easy: 5, would_use: "yes" };
ok("a complete, valid answer set passes", validate("participant", ctx, good) !== null);
ok("a missing required answer fails", validate("participant", ctx, { ...good, fear: undefined }) === null);
ok("an optional answer may be missing", validate("participant", ctx, good) !== null);
ok("an unknown option fails", validate("participant", ctx, { ...good, belief_real: "definitely" }) === null);
ok("a scale outside 1-5 fails", validate("participant", ctx, { ...good, fear: 9 }) === null && validate("participant", ctx, { ...good, fear: 2.5 }) === null);
ok("a list with an unknown option fails", validate("participant", ctx, { ...good, why: ["ruko_warned", "hacked"] }) === null);
ok("answers to questions that do not apply are dropped", !("ruko_help" in (validate("participant", { arm: "baseline", isScam: true }, { ...good })!)));
ok("the family survey validates", validate("family", {}, { saw_alert: "yes", how_fast: "lt1", clear: 5, action: "called", trust: "yes" }) !== null);
ok("the open survey needs who, age, the call question, UPI and help", validate("open", {}, { who: "parent", age_band: "80+", got_call: "never", upi: "no", help_with: ["family_alert"] }) !== null && validate("open", {}, { who: "parent", got_call: "never" }) === null);
ok("a loss answer is accepted only when asked", validate("open", {}, { who: "parent", age_band: "75-79", got_call: "never", upi: "yes", help_with: ["practice"], loss: "gt1l" })!.loss === undefined);
ok("more than three 'what would help' picks fails", validate("open", {}, { who: "self", age_band: "65-69", got_call: "never", upi: "yes", help_with: ["family_alert", "talk_helper", "bank_pause", "caller_id"] }) === null);
ok("garbage input fails", validate("open", {}, null) === null && validate("open", {}, "text") === null);

// privacy: nothing identifying is kept
ok("emails are removed from free text", !scrub("write to rohan.k@gmail.com please").includes("@"));
ok("phone and account numbers are removed", !/\d{6}/.test(scrub("my number is 98450 12345 and account 123456789012")));
ok("links and handles are removed", !scrub("see https://x.com/abc and @someone").match(/https|@someone/));
ok("ordinary text is kept", scrub("The button was too small for me") === "The button was too small for me");
ok("text is capped at 500 characters", scrub("a".repeat(900)).length === 500);
const withText = validate("participant", ctx, { ...good, confusing: "Call me on 9845012345 or mail a@b.co" })!;
ok("scrubbing happens inside validate()", typeof withText.confusing === "string" && !/\d{6}/.test(withText.confusing as string) && !(withText.confusing as string).includes("@"));

// the incident report (from Ruko Companion)
const inc = { who: "police", channel: "video", asked: ["send_money", "keep_secret", "stay_video"], long: "1-3h", sent: "stopped", stopped_by: ["ruko"], told: "no" };
ok("an incident report validates", validate("incident", {}, inc) !== null);
ok("who, channel, what they asked, how long, whether money went and whether they told anyone are required", validate("incident", {}, { ...inc, who: undefined }) === null && validate("incident", {}, { ...inc, sent: undefined }) === null);
ok("'what helped you stop' appears only if they stopped; the loss only if they sent money", idsOf("incident", {}, { sent: "stopped" }).includes("stopped_by") && !idsOf("incident", {}, { sent: "stopped" }).includes("loss") && idsOf("incident", {}, { sent: "money" }).includes("loss") && !idsOf("incident", {}, { sent: "money" }).includes("stopped_by"));
const rep = incidentSummary(inc);
ok("the report reads as plain sentences about what happened", /video call/.test(rep.text) && /police, CBI, customs or a court/.test(rep.text) && /send money to an account/.test(rep.text) && /stopped before any money moved/.test(rep.text));
ok("the report holds no number, name or account", !/\d{4}/.test(rep.text.replace(/₹10,000|₹1 lakh|1930/g, "")));
ok("the report says what to add and where to report", rep.checklist.some((c) => /cybercrime\.gov\.in/.test(c)) && rep.checklist.some((c) => /caller's number/.test(c)));
ok("if money or an OTP went, the first step is to call 1930 now", /Call 1930 now/.test(incidentSummary({ ...inc, sent: "money", loss: "gt1l" }).checklist[0]) && /more than ₹1 lakh/.test(incidentSummary({ ...inc, sent: "money", loss: "gt1l" }).text) && /Call 1930 now/.test(incidentSummary({ ...inc, sent: "otp" }).checklist[0]));

// results
const rows: SurveyRow[] = [
  { kind: "participant" as const, arm: "ruko" as const, isScam: true, answers: { fear: 4, ruko_help: "a_lot", why: ["ruko_warned"] } },
  { kind: "participant" as const, arm: "ruko" as const, isScam: true, answers: { fear: 2, ruko_help: "a_little", why: ["ruko_warned", "afraid_trouble"] } },
  { kind: "participant" as const, arm: "baseline" as const, isScam: true, answers: { fear: 5, why: ["sounded_real"] } },
  { kind: "open" as const, arm: null, isScam: null, answers: { got_call: "several", comment: "Please add Hindi voice" } },
];
const s = summarize(rows);
ok("counts by kind", s.n.participant === 3 && s.n.open === 1 && s.n.family === 0);
ok("a scale's mean", Math.abs((s.tallies.participant.fear.mean ?? 0) - 11 / 3) < 1e-9);
ok("a multi-choice tally", s.tallies.participant.why.counts.ruko_warned === 2 && s.tallies.participant.why.counts.sounded_real === 1);
ok("participant answers are also split by arm", s.byArm["ruko/fear"].mean === 3 && s.byArm["baseline/fear"].mean === 5);
ok("free text is collected for reading", s.texts.length === 1 && s.texts[0].text.includes("Hindi"));
const csv = toCsv(rows.map((r) => ({ ...r, at: "2026-10-22T10:00:00Z", code: r.kind === "participant" ? "P01" : null })));
ok("the CSV has a header and one row per response", csv.split("\n").length === 5 && csv.split("\n")[0].includes("participant.fear") && csv.includes("ruko_warned|afraid_trouble"));

console.log(`all ${n} survey checks passed`);
