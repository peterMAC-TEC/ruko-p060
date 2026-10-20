// Live AI checks: real calls to Gemini (needs GEMINI_* in .env.local; uses free-tier quota).
// Run: npm run check:ai   (or: npx tsx --conditions=react-server --env-file=.env.local scripts/check-ai-live.ts [image.png])
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { readScamSigns } from "../lib/ai/scam";
import { BUNDLED_LIBRARY as lib } from "../lib/patterns";
import { runRadar } from "../lib/radar";
import { signsToAnswers, withSigns } from "../lib/signs";

const CASES: Array<{ name: string; transcript: string; expect: "stop" | "caution" | "clear"; mustHave?: string[] }> = [
  {
    name: "English retelling of a digital arrest",
    transcript:
      "A man on video call said he is from CBI and I am under digital arrest because a parcel in my name had drugs. He said don't tell my son and transfer my FD money to an RBI safe account for verification.",
    expect: "stop",
    mustHave: ["arrest_on_call", "keep_secret", "safe_account"],
  },
  {
    name: "Hindi (Devanagari) retelling",
    transcript:
      "उन्होंने कहा कि वो पुलिस से हैं, आपके आधार से मनी लॉन्ड्रिंग हुई है, किसी को मत बताना और कैमरा बंद मत करना, वरना अभी गिरफ्तार कर लेंगे।",
    expect: "stop",
    mustHave: ["keep_secret"],
  },
  {
    name: "Hinglish, garbled speech-to-text",
    transcript: "bola customs se hai parcel mein drugs mila hai, any desk download karo aur otp batao, kisi ko mat batana",
    expect: "stop",
  },
  {
    name: "Ordinary family call",
    transcript: "My grandson called to say his train is late and he will reach by nine. He asked me to keep dinner warm.",
    expect: "clear",
  },
  {
    name: "Real courier update, asks for nothing",
    transcript: "The delivery boy called and said my Amazon parcel will come tomorrow between 10 and 12.",
    expect: "clear",
  },
];

async function main() {
  let n = 0;
  for (const c of CASES) {
    const t0 = Date.now();
    const r = await readScamSigns(lib, { transcript: c.transcript });
    const level = withSigns(
      runRadar(lib, { identity: r.identity, answers: signsToAnswers(r.signs), said: r.heard }),
      r.signs,
      lib,
      r.patternId,
    ).level;
    const ids = r.signs.map((s) => s.id);
    console.log(`${level === c.expect ? "ok " : "BAD"} ${c.name}: ${level} in ${((Date.now() - t0) / 1000).toFixed(1)}s  [${ids.join(", ")}]`);
    for (const s of r.signs) console.log(`      ${s.id}: "${s.evidence}"`);
    assert.equal(level, c.expect, c.name);
    for (const id of c.mustHave ?? []) assert.ok(ids.includes(id as never), `${c.name}: missing ${id}`);
    n++;
  }

  const imagePath = process.argv[2];
  if (imagePath) {
    const base64 = readFileSync(imagePath).toString("base64");
    const mimeType = imagePath.endsWith(".png") ? "image/png" : "image/jpeg";
    const t0 = Date.now();
    const r = await readScamSigns(lib, { image: { mimeType, base64 } });
    const level = withSigns(
      runRadar(lib, { identity: r.identity, answers: signsToAnswers(r.signs), said: r.heard }),
      r.signs,
      lib,
      r.patternId,
    ).level;
    console.log(`image ${imagePath}: ${level} in ${((Date.now() - t0) / 1000).toFixed(1)}s, heard: ${r.heard}`);
    for (const s of r.signs) console.log(`      ${s.id}: "${s.evidence}"`);
    n++;
  }

  console.log(`all ${n} live AI checks passed`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
