// Writes docs/deck/SPEAKER-NOTES.md from the deck's own notes (lib/deck-content.ts). Run: npx tsx scripts/deck-notes.ts
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { SLIDES, SOURCES, totalSeconds } from "../lib/deck-content";

const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
let live = 0;
let loom = 0;
const rows = SLIDES.map((s, i) => {
  const a = mmss(live);
  const b = mmss(loom);
  live += s.live;
  loom += s.loom;
  return `## ${i + 1}. ${s.title}

- **3-minute pitch:** ${s.live ? `${s.live} s (from ${a})` : "skip"}${s.live ? `\n  > ${s.notes}` : ""}
- **Loom:** ${s.loom ? `${s.loom} s (from ${b})` : "skip (appendix, for questions)"}${s.loom ? `\n  > ${s.loomNotes ?? s.notes}` : ""}
`;
});
const md = `# Ruko pitch deck: speaker notes

Open https://ruko-seven.vercel.app/deck in Chrome or Edge. F = fullscreen, P = presenter view (notes, timer, next slide), → / space = next, ← = back, M = motion level, R = restart. A slide can be opened directly: /deck#9.

Totals: 3-minute live pitch ${mmss(totalSeconds("live"))} · Loom walkthrough ${mmss(totalSeconds("loom"))} (includes a live demo on slide 7).

${rows.join("\n")}
## Sources used on the slides

${Object.values(SOURCES)
  .map((s) => `- ${s}`)
  .join("\n")}
`;
const out = path.join(process.cwd(), "..", "docs", "deck");
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, "SPEAKER-NOTES.md"), md, "utf8");
console.log("wrote docs/deck/SPEAKER-NOTES.md");
