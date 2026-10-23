// Exports the pitch deck: one PNG per slide (its final state) and a PDF, from the running app.
// Uses the Chrome or Edge already installed on this computer through puppeteer-core (no browser download).
// Run: npm run deck:pdf                      (app at http://localhost:3200)
//      DECK_BASE=https://ruko-seven.vercel.app npm run deck:pdf
//      npm run deck:pdf -- --review 2         (also start-state shots at 1920x1080 and 1280x720 into docs/deck/review/round-2)
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.DECK_BASE ?? "http://localhost:3200";
const OUT = path.join(process.cwd(), "..", "docs", "deck");
const BROWSERS = ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"];
const exe = process.env.CHROME_PATH ?? BROWSERS.find((b) => existsSync(b));
if (!exe) throw new Error("No Chrome or Edge found. Set CHROME_PATH.");
const review = process.argv.includes("--review") ? process.argv[process.argv.indexOf("--review") + 1] : null;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(path.join(OUT, "png"), { recursive: true });
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox", "--hide-scrollbars"] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto(`${BASE}/deck?print=1`, { waitUntil: "networkidle0", timeout: 120000 });
await page.addStyleTag({ content: "nextjs-portal{display:none!important}" }).catch(() => {});
await page.evaluate(() => document.fonts.ready);
await wait(800);
const ids = await page.$$eval(".print-page", (els) => els.map((e) => e.getAttribute("data-slide")));
for (let k = 0; k < ids.length; k++) {
  const el = (await page.$$(".print-page"))[k];
  await el.screenshot({ path: path.join(OUT, "png", `slide-${String(k + 1).padStart(2, "0")}-${ids[k]}.png`) });
}
await page.pdf({ path: path.join(OUT, "Ruko-Pitch-Deck.pdf"), width: "1920px", height: "1080px", printBackground: true, pageRanges: "" });
console.log(`${ids.length} slides → docs/deck/png and docs/deck/Ruko-Pitch-Deck.pdf`);

if (review) {
  const dir = path.join(OUT, "review", `round-${review}`);
  mkdirSync(dir, { recursive: true });
  for (const [w, h] of [[1920, 1080], [1280, 720]]) {
    const p = await browser.newPage();
    await p.setViewport({ width: w, height: h });
    for (let k = 1; k <= ids.length; k++) {
      await p.goto(`${BASE}/deck?fx=max#${k}`, { waitUntil: "networkidle0" });
      await p.evaluate(() => document.fonts.ready);
      await wait(250);
      await p.screenshot({ path: path.join(dir, `${w}-${String(k).padStart(2, "0")}-start.png`) });
      // play every build, then let the animations finish
      for (let b = 0; b < 6; b++) {
        await p.keyboard.press("ArrowRight");
        await wait(120);
        if ((await p.evaluate(() => location.hash)) !== `#${k}`) {
          await p.keyboard.press("ArrowLeft");
          break;
        }
      }
      await wait(2600);
      await p.screenshot({ path: path.join(dir, `${w}-${String(k).padStart(2, "0")}-final.png`) });
    }
    await p.close();
  }
  console.log(`review shots → docs/deck/review/round-${review}`);
}
await browser.close();
