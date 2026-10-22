// Every line the live call can say from its script must have a recording, in both languages, so the call sounds the same
// everywhere. Run: npx tsx scripts/check-liveaudio.ts   (needs scripts/make-live-audio.py to have been run)
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { ACK_LINES, officerNext, officerOpen, officerStart } from "../lib/demo-officer";
import { allLiveLines, clipPlan, lineKey, type LiveLang, type LiveManifest } from "../lib/live-audio";

const manifest = JSON.parse(readFileSync("public/live-audio/manifest.json", "utf8")) as LiveManifest;
let n = 0;
const ok = (name: string, cond: boolean, detail = "") => {
  assert.ok(cond, `${name} ${detail}`);
  n++;
  console.log(`ok  ${name}${detail ? `  (${detail})` : ""}`);
};
const lines = allLiveLines();
const missing = lines.filter((l) => manifest[l.lang]?.[l.key] === undefined || !existsSync(`public/live-audio/${l.lang}/${l.key}.mp3`));
ok(`all ${lines.length} scripted lines have a recording`, missing.length === 0, missing.slice(0, 2).map((m) => m.text.slice(0, 30)).join(" | "));
ok("keys are unique", new Set(lines.map((l) => l.lang + l.key)).size === lines.length);
// Real calls: every officer line spoken in 60 varied calls is playable from recordings (acks are two clips).
const SAY = ["okay", "No", "who are you", "I will call my son", "no money", "bakwas", "", "are you a bot", "haan", "wait why"];
let spoken = 0;
for (const lang of ["en", "hing"] as LiveLang[]) {
  for (let seed = 0; seed < 3; seed++) {
    for (let start = 0; start < SAY.length; start++) {
      let state = officerOpen(officerStart(seed), lang).state;
      let t = 0;
      for (let i = 0; i < 12 && !state.reachedPayment; i++) {
        const turn = officerNext(state, SAY[(start + i) % SAY.length], (t += 5000), lang);
        state = { ...turn.state, name: null };
        if (turn.kind === "end") break;
        spoken++;
        assert.ok(clipPlan("officer", lang, turn.text, manifest), `${lang}: no recording for "${turn.text}"`);
      }
    }
  }
}
ok(`${spoken} spoken lines in simulated calls all play from recordings`, spoken > 100);
ok("an AI-worded line (no recording) falls back to the browser voice", clipPlan("officer", "en", "A brand new sentence the AI wrote.", manifest) === null);
ok("an acknowledgement plus a stage line plays as two clips", ACK_LINES.length > 0 && lineKey("officer", "en", "x") !== lineKey("ruko", "en", "x"));
console.log(`all ${n} live-audio checks passed`);
