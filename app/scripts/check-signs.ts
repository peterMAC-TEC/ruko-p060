// AI warning-sign checks: the AI reports signs with evidence; code decides.
// These cover the code half (no AI call). Run: npx tsx scripts/check-signs.ts
import assert from "node:assert/strict";
import { BUNDLED_LIBRARY as lib } from "../lib/patterns";
import { runRadar } from "../lib/radar";
import { cleanSigns, reasonLabels, SIGN_IDS, SIGN_TEXT, signsToAnswers, withSigns, type Sign } from "../lib/signs";
import { waLink } from "../lib/utils";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

const s = (id: Sign["id"], evidence = "words") => ({ id, evidence });
const verdict = (signs: Sign[], said = "", patternId?: string) =>
  withSigns(runRadar(lib, { answers: signsToAnswers(signs), said }), signs, lib, patternId);

// Every sign has words for the model and for the person, in both languages.
ok(
  "every sign has model, English and Hindi text",
  SIGN_IDS.every((id) => SIGN_TEXT[id].model && SIGN_TEXT[id].en && SIGN_TEXT[id].hi),
);

// Cleaning: the model's reply is data; drop anything unusable.
const cleaned = cleanSigns([
  { id: "keep_secret", evidence: "  kisi ko   mat batana " },
  { id: "keep_secret", evidence: "repeat" },
  { id: "made_up_sign", evidence: "x" },
  { id: "authority", evidence: "" },
  { id: "safe_account", evidence: "a".repeat(500) },
]);
ok("cleaning keeps known signs with evidence, once each", cleaned.map((c) => c.id).join() === "keep_secret,safe_account");
ok("cleaning tidies spaces", cleaned[0].evidence === "kisi ko mat batana");
ok("cleaning caps evidence at 160 characters", cleaned[1].evidence.length === 160);

// Signs → the radar's own answers.
const answers = signsToAnswers([s("arrest_on_call"), s("safe_account"), s("authority")], { install_app: "no" });
ok(
  "signs answer the radar's questions, keeping earlier answers",
  answers.stay_on_call === "yes" && answers.pay_avoid_arrest === "yes" && answers.install_app === "no" && !("share_otp" in answers),
);

// The verdict.
const classic = verdict(
  [s("authority", "this is CBI"), s("arrest_on_call", "you are under digital arrest"), s("keep_secret", "don't tell anyone")],
  "",
  "digital_arrest",
);
ok("classic digital arrest → STOP, named", classic.level === "stop" && classic.pattern?.id === "digital_arrest", classic.level);
ok("signs are recorded as codes, never words", classic.signals.includes("sign_keep_secret") && !classic.signals.join().includes("anyone"));

const warrant = verdict([s("official_document", "ARREST WARRANT"), s("authority", "Central Bureau"), s("threat_urgency", "within 2 hours")]);
ok("a photo of a 'warrant' with a threat → STOP even without answers", warrant.level === "stop", warrant.level);

const oneStrong = verdict([s("safe_account", "move it to the RBI safe account")]);
ok("one strong sign alone → at least 'check first'", oneStrong.level !== "clear", oneStrong.level);

const strongPlus = verdict([s("safe_account"), s("parcel_or_case")]);
ok("a strong sign plus any other → STOP", strongPlus.level === "stop", strongPlus.level);

const authorityOnly = verdict([s("authority", "courier company")]);
ok("only a claimed identity → 'check first', not STOP (fewer false alarms)", authorityOnly.level === "caution", authorityOnly.level);

const nothing = verdict([], "Beta, I'll reach home by 7. Keep the dal ready.");
ok("an ordinary call with no signs → clear (worded as 'nothing found', never 'safe')", nothing.level === "clear", nothing.level);

// Fewer false alarms: a lone keyword the AI read in context and found nothing in is not a warning.
const delivery = verdict([], "The delivery boy said my Amazon parcel will come tomorrow.");
ok("real delivery update: the word 'parcel' alone, AI found nothing → clear", delivery.level === "clear", delivery.level);
ok("…but without the AI, the phone's own phrase check still says 'check first'", runRadar(lib, { answers: {}, said: "my Amazon parcel will come tomorrow" }).level === "caution");
const phraseStop = verdict([], "digital arrest, CBI warrant, stay on the video");
ok("a phrase STOP is never lowered, even if the AI found nothing", phraseStop.level === "stop", phraseStop.level);

// The radar's own STOP is never lowered by an AI that found nothing.
const radarStop = withSigns(runRadar(lib, { identity: "police", answers: { stay_on_call: "yes", keep_secret: "yes" } }), [], lib);
ok("signs never lower the radar's verdict", radarStop.level === "stop");

// The AI's pattern guess only fills a gap; it never replaces the radar's own match.
const named = withSigns(runRadar(lib, { identity: "police", answers: {} }), [s("authority")], lib, "kyc_block");
ok("the radar's pattern wins over the AI's guess", named.pattern?.id === "digital_arrest", named.pattern?.id);
const unknownGuess = verdict([s("authority")], "", "no_such_pattern");
ok("an unknown pattern guess is ignored", unknownGuess.pattern === null);

// The family alert reads in plain words, not codes.
const labels = reasonLabels(["pattern_digital_arrest", "q_keep_secret", "said_digital_arrest", "sign_keep_secret", "sign_safe_account", "made_up"], lib);
ok("family reasons: the scam's name first", labels[0].label === "Looks like: Digital arrest (fake police, CBI or customs)", labels[0].label);
ok("family reasons: no raw codes for known signs", labels.some((l) => l.label === "Told to keep it secret") && !labels.some((l) => l.label.startsWith("sign ")));
ok("family reasons: answers derived from signs aren't repeated", !labels.some((l) => l.code.startsWith("q_")));
ok("family reasons: an unknown code still shows, tidied", labels.some((l) => l.label === "made up"));
ok("family reasons without AI signs keep the answers", reasonLabels(["q_keep_secret"], lib)[0].label === "Told to keep it secret (answered yes)");
ok("every sign has family wording", SIGN_IDS.every((id) => SIGN_TEXT[id].family));

// WhatsApp fallback links.
ok("WhatsApp: 10-digit Indian number gets 91", waLink("98450 12345", "hi") === "https://wa.me/919845012345?text=hi");
ok("WhatsApp: +91 kept, text encoded", waLink("+91 98450-12345", "Call me now?") === "https://wa.me/919845012345?text=Call%20me%20now%3F");
ok("WhatsApp: leading 0 replaced", waLink("09845012345", "x").startsWith("https://wa.me/919845012345"));

console.log(`all ${n} warning-sign checks passed`);
