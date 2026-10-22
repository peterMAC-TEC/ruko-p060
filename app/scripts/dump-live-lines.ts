// Writes data/live-lines.json: every line the live call can say from its script, for scripts/make-live-audio.py.
// Run: npx tsx scripts/dump-live-lines.ts
import { writeFileSync } from "node:fs";
import { allLiveLines } from "../lib/live-audio";
const lines = allLiveLines();
writeFileSync("data/live-lines.json", JSON.stringify(lines, null, 1), "utf8");
console.log(`wrote ${lines.length} lines`);
