// The scripted call demo: Ruko must step in because its own check says STOP, before the scammer asks for money.
// Run: npx tsx scripts/check-demo.ts
import assert from "node:assert/strict";
import { checkCallerLine } from "../lib/bots/guard";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import script from "../data/demo-call-script.json";
import { plan, readingMs, SCENE_TEXT, type DemoLang } from "../lib/demo-call";

let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};

for (const lang of ["en", "hing"] as DemoLang[]) {
  const withRuko = plan(lang, true);
  const moneyIndex = withRuko.beats.findIndex((b) => /fifty thousand|pachas hazaar/i.test(b.text));
  const rukoIndex = withRuko.beats.findIndex((b) => b.who === "ruko");
  ok(`${lang}: Ruko steps in because its own check says STOP`, withRuko.rukoAfterScammerLine !== null && !withRuko.moneyAskedBeforeStop);
  ok(`${lang}: the scammer never gets to ask for money`, moneyIndex === -1, `Ruko speaks at beat ${rukoIndex + 1}`);
  ok(`${lang}: the call ends with the family told`, withRuko.beats[withRuko.beats.length - 1].scene === "family");
  ok(`${lang}: the person hangs up before anything else`, withRuko.beats[rukoIndex + 1].who === "kamala" && /hanging up|call kaat/i.test(withRuko.beats[rukoIndex + 1].text));

  const scammerBefore = withRuko.beats.slice(0, rukoIndex).filter((b) => b.who === "scammer").length;
  ok(`${lang}: the scammer builds the call over ${scammerBefore} turns before Ruko steps in (not a one-liner)`, scammerBefore >= 4);
  ok(`${lang}: Kamala resists and asks for her son before Ruko steps in`, withRuko.beats.slice(0, rukoIndex).some((b) => b.who === "kamala" && /son|bete/i.test(b.text)));
  ok(`${lang}: the scammer uses a made-up badge and case number (the fictional ones)`, withRuko.beats.some((b) => /D-0417/.test(b.text)) && withRuko.beats.some((b) => /C-2291/.test(b.text)));

  const without = plan(lang, false);
  ok(`${lang}: without Ruko the scammer asks for money and the call ends in loss`, without.beats.some((b) => /fifty thousand|pachas hazaar/i.test(b.text)) && without.beats[without.beats.length - 1].scene === "lost");
  ok(`${lang}: Ruko never speaks in the without-Ruko version`, !without.beats.some((b) => b.who === "ruko"));

  const all = [...withRuko.beats, ...without.beats];
  ok(`${lang}: Ruko never tells anyone to pay or share anything`, all.filter((b) => b.who === "ruko").every((b) => !/\b(send|transfer|pay) (the )?money (to|now)|share (your |the )?(otp|pin)/i.test(b.text)));
  ok(`${lang}: no real names or real numbers`, all.every((b) => b.who !== "scammer" || checkCallerLine(b.text.split(" ").slice(0, 28).join(" ")).ok));
  ok(`${lang}: the scammer asks for no real OTP, card or Aadhaar number`, all.filter((b) => b.who === "scammer").every((b) => !/\b(otp|cvv|aadhaar number|card number|password)\b/i.test(b.text)));
}
ok("every scene caption exists in both languages", Object.values(SCENE_TEXT.en).every(Boolean) && Object.values(SCENE_TEXT.hing).every(Boolean));
ok("reading time is sensible", readingMs("Hello") >= 1200 && readingMs("x".repeat(500)) <= 9000);

// The recorded voices: every line has a clip in both languages, and the Hindi text is Devanagari.
const audio = path.join(process.cwd(), "public", "demo-audio");
const manifest = JSON.parse(readFileSync(path.join(audio, "manifest.json"), "utf8")) as Record<string, Record<string, number>>;
const lines = script.lines as Array<{ id: string; en: string; hing: string; hi: string }>;
ok("every line has a recorded clip in English and Hindi", lines.every((l) => existsSync(path.join(audio, "en", `${l.id}.mp3`)) && existsSync(path.join(audio, "hi", `${l.id}.mp3`))));
ok("the manifest knows how long each clip is", lines.every((l) => manifest.en[l.id] > 0.5 && manifest.hi[l.id] > 0.5));
ok("the Hindi lines are in Devanagari, the captions in Roman letters", lines.every((l) => /[ऀ-ॿ]/.test(l.hi) && !/[ऀ-ॿ]/.test(l.hing)));
ok("the chime exists", existsSync(path.join(audio, "chime.mp3")));
ok("every beat the demo can play has a clip", (["en", "hing"] as DemoLang[]).every((lg) => [true, false].every((r) => plan(lg, r).beats.every((b) => manifest[lg === "en" ? "en" : "hi"][b.id] > 0))));

console.log(`all ${n} demo-call checks passed`);
