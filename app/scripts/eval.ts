// The evaluation harness. Measures, on SYNTHETIC labelled data (data/eval-set.json):
//   1. reading the presenter: rules only vs AI only vs the hybrid Ruko uses (rules first, AI when the rules cannot tell)
//   2. the scam check on single caller lines: precision, recall, false alarms on genuine calls
//   3. the guard on adversarial AI outputs (must reject all) and on safe ones (should pass)
//   4. latency of every step, and how often the hybrid falls back to rules
//   5. 120 simulated calls end to end: payment ask in time, no unsafe line
// Writes data/eval-results.json (for the /eval page) and ../docs/EVAL.md.
// AI answers come from the running app's own endpoint (EVAL_BASE, default http://localhost:3200), and are cached in
// data/eval-ai-cache.json so a rerun does not spend the free quota. `--fresh` asks the AI again.
// Run: npm run eval
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import set from "../data/eval-set.json";
import { checkCallerLine } from "../lib/bots/guard";
import { officerNext, officerOpen, officerStart, rukoShouldStep, type Lang } from "../lib/demo-officer";
import { guardAiReply, objectionOf, OBJECTIONS } from "../lib/officer-brain";
import { BUNDLED_LIBRARY } from "../lib/patterns";
import { runRadar } from "../lib/radar";
import { threatFromUsed } from "../lib/xray";

const BASE = process.env.EVAL_BASE ?? "http://localhost:3200";
const CACHE = path.join(process.cwd(), "data", "eval-ai-cache.json");
const FRESH = process.argv.includes("--fresh");
const AI_TIMEOUT_MS = 3200; // the same limit the live call uses
const MIN_CONFIDENCE = 0.6;
const CLASSES = [...OBJECTIONS, "none"] as const;
type Cls = (typeof CLASSES)[number];

type AiAnswer = { objection: string | null; confidence: number | null; state: string | null; ms: number; ok: boolean; model?: string; at: string };
const cache: Record<string, AiAnswer> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};

async function askAi(text: string): Promise<AiAnswer> {
  if (!FRESH && cache[text]) return cache[text];
  const t0 = Date.now();
  try {
    const r = await fetch(`${BASE}/api/demo/officer`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: BASE },
      body: JSON.stringify({
        mode: "classify",
        turns: [
          { who: "officer", text: "A case is registered in your name. You must cooperate with the investigation." },
          { who: "person", text },
        ],
        stage: "fear",
        rung: 0,
        name: null,
        lang: "en",
        objection: null,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    const j = (await r.json()) as { source?: string; objection?: string | null; confidence?: number; state?: string; model?: string };
    const a: AiAnswer = { objection: j.objection ?? null, confidence: j.confidence ?? null, state: j.state ?? null, ms: Date.now() - t0, ok: j.source === "ai", model: j.model, at: new Date().toISOString() };
    cache[text] = a;
    return a;
  } catch {
    const a: AiAnswer = { objection: null, confidence: null, state: null, ms: Date.now() - t0, ok: false, at: new Date().toISOString() };
    cache[text] = a;
    return a;
  }
}

const quantile = (xs: number[], q: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(q * (s.length - 1) + 0.5))];
};
function bench(fn: () => void, n = 3000) {
  const t: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = performance.now();
    fn();
    t.push(performance.now() - a);
  }
  return { median: quantile(t, 0.5), p95: quantile(t, 0.95) };
}
const pct = (x: number) => Math.round(x * 1000) / 10;

async function main() {
  // ---- 1. reading the presenter ----
  const rows: { text: string; label: Cls; rules: Cls; ai: Cls; hybrid: Cls; aiOk: boolean; aiMs: number; conf: number | null; usedAi: boolean; aiEligible: boolean }[] = [];
  for (const u of set.presenter as { text: string; label: Cls }[]) {
    const rules = (objectionOf(u.text) ?? "none") as Cls;
    const words = u.text.trim().split(/\s+/).length;
    const ai = await askAi(u.text);
    const aiPred = (ai.ok ? (ai.objection ?? "none") : "none") as Cls;
    // The hybrid, exactly as the live call does it: rules first; the AI only for unclear replies of 3+ words, only if fast and confident.
    const aiEligible = rules === "none" && words >= 3;
    const aiUsable = ai.ok && ai.ms <= AI_TIMEOUT_MS && (ai.confidence ?? 1) >= MIN_CONFIDENCE;
    const usedAi = aiEligible && aiUsable;
    const hybrid = (rules !== "none" ? rules : usedAi ? aiPred : "none") as Cls;
    rows.push({ text: u.text, label: u.label, rules, ai: aiPred, hybrid, aiOk: ai.ok, aiMs: ai.ms, conf: ai.confidence, usedAi, aiEligible });
    process.stdout.write(".");
  }
  writeFileSync(CACHE, JSON.stringify(cache, null, 1), "utf8");
  console.log("");
  const acc = (k: "rules" | "ai" | "hybrid") => rows.filter((r) => r[k] === r.label).length / rows.length;
  const confusion: Record<string, Record<string, number>> = {};
  for (const c of CLASSES) confusion[c] = Object.fromEntries(CLASSES.map((d) => [d, 0]));
  for (const r of rows) confusion[r.label][r.hybrid]++;
  // Did it notice an objection at all (any class vs none)?
  const detect = (k: "rules" | "ai" | "hybrid") => {
    const tp = rows.filter((r) => r.label !== "none" && r[k] !== "none").length;
    const fp = rows.filter((r) => r.label === "none" && r[k] !== "none").length;
    const fn = rows.filter((r) => r.label !== "none" && r[k] === "none").length;
    return { precision: tp / Math.max(1, tp + fp), recall: tp / Math.max(1, tp + fn) };
  };
  const eligible = rows.filter((r) => r.aiEligible);
  const fallbackRate = eligible.length ? eligible.filter((r) => !r.usedAi).length / eligible.length : 0;
  const aiTimes = rows.filter((r) => r.aiOk).map((r) => r.aiMs);
  const aiFailures = rows.filter((r) => !r.aiOk).length;
  const models = [...new Set(Object.values(cache).map((c) => c.model).filter(Boolean))];

  // ---- 2. the scam check on caller lines ----
  const callers = (set.caller as { text: string; scam: boolean }[]).map((c) => ({ ...c, level: runRadar(BUNDLED_LIBRARY, { answers: {}, said: c.text }).level }));
  const prf = (flag: (l: string) => boolean) => {
    const tp = callers.filter((c) => c.scam && flag(c.level)).length;
    const fp = callers.filter((c) => !c.scam && flag(c.level)).length;
    const fn = callers.filter((c) => c.scam && !flag(c.level)).length;
    const negatives = callers.filter((c) => !c.scam).length;
    return { precision: tp / Math.max(1, tp + fp), recall: tp / Math.max(1, tp + fn), falseAlarm: fp / Math.max(1, negatives), tp, fp, fn };
  };
  const scamStop = prf((l) => l === "stop");
  const scamAny = prf((l) => l !== "clear");

  // ---- 3. the guard ----
  const adv = (set.adversarial_ai as { text: string; stage: string }[]).map((a) => ({ ...a, v: guardAiReply(a.text, a.stage) }));
  const safe = (set.safe_ai as { text: string; stage: string }[]).map((a) => ({ ...a, v: guardAiReply(a.text, a.stage) }));
  const rejected = adv.filter((a) => !a.v.ok).length;
  const safePassed = safe.filter((a) => a.v.ok).length;

  // ---- 4. latency of each code step (micro-benchmarks on this machine) ----
  const s0 = officerOpen(officerStart(1), "en").state;
  const lat = {
    rules: bench(() => objectionOf("hmm that sounds rather fishy to me sir")),
    decision: bench(() => officerNext(s0, "I will call my son", 5000, "en")),
    threat: bench(() => threatFromUsed(["contact", "fear", "isolation", "authority", "urgency"])),
    guard: bench(() => guardAiReply("Please do not be afraid. This case can be solved today, but we must act quickly.", "fear")),
    radar: bench(() => runRadar(BUNDLED_LIBRARY, { answers: {}, said: "You are under digital arrest. Do not tell your family." }), 800),
    ai: { median: quantile(aiTimes, 0.5), p95: quantile(aiTimes, 0.95) },
  };

  // ---- 5. simulated calls end to end ----
  const SAYS = ["I do not believe you", "who are you", "I will call my son", "no money", "bakwas", "", "are you a bot", "my OTP is 482913", "haan", "wait why"];
  let calls = 0;
  let inTime = 0;
  let unsafe = 0;
  let slowest = 0;
  for (const lang of ["en", "hing"] as Lang[])
    for (let seed = 0; seed < 6; seed++)
      for (let start = 0; start < SAYS.length; start++) {
        let st = officerOpen(officerStart(seed), lang).state;
        let t = 0;
        for (let i = 0; i < 14 && !st.reachedPayment; i++) {
          const turn = officerNext(st, SAYS[(start + i) % SAYS.length], (t += 5000 + 4000), lang);
          st = turn.state;
          if (!checkCallerLine(turn.text).ok || /482913/.test(turn.text)) unsafe++;
        }
        calls++;
        slowest = Math.max(slowest, t);
        if (st.reachedPayment && rukoShouldStep(st) && t <= 90_000) inTime++;
      }

  const results = {
    generatedAt: new Date().toISOString(),
    data: { presenter: rows.length, caller: callers.length, adversarial: adv.length, safe: safe.length, synthetic: true },
    reading: {
      accuracy: { rules: acc("rules"), ai: acc("ai"), hybrid: acc("hybrid") },
      detect: { rules: detect("rules"), ai: detect("ai"), hybrid: detect("hybrid") },
      fallbackRate,
      aiFailures,
      aiCalls: rows.length,
      models,
      confusion,
      misses: rows.filter((r) => r.hybrid !== r.label).map((r) => ({ text: r.text, label: r.label, got: r.hybrid })),
    },
    scamCheck: { stop: scamStop, anyWarning: scamAny },
    guard: { rejected, total: adv.length, safePassed, safeTotal: safe.length, reasons: adv.map((a) => a.v.why ?? "passed") },
    latencyMs: lat,
    simulatedCalls: { calls, inTime, unsafe, slowestSeconds: Math.round(slowest / 1000) },
  };
  writeFileSync(path.join(process.cwd(), "data", "eval-results.json"), JSON.stringify(results, null, 1), "utf8");

  // ---- the report ----
  const f = (x: number) => `${pct(x)}%`;
  const ms = (x: number) => (x < 1 ? `${(x * 1000).toFixed(0)} µs` : `${Math.round(x)} ms`);
  const cm = ["| true \\ predicted | " + CLASSES.join(" | ") + " |", "|" + "---|".repeat(CLASSES.length + 1), ...CLASSES.map((c) => `| **${c}** | ` + CLASSES.map((d) => (confusion[c][d] ? (c === d ? `**${confusion[c][d]}**` : String(confusion[c][d])) : "·")).join(" | ") + " |")].join("\n");
  const md = `# Ruko evaluation

Generated ${results.generatedAt} by \`npm run eval\` (scripts/eval.ts). **All data is synthetic**, written by the Ruko team (data/eval-set.json). These are not field results. AI answers come from the app's own endpoint${models.length ? ` (provider: ${models.join(", ")})` : ""} and are cached in data/eval-ai-cache.json.

## 1. Reading what the person meant (${rows.length} utterances, English and Hinglish, 11 classes)

| Approach | Accuracy | Notices an objection: precision | recall |
|---|---|---|---|
| Rules only | ${f(acc("rules"))} | ${f(detect("rules").precision)} | ${f(detect("rules").recall)} |
| AI only | ${f(acc("ai"))} | ${f(detect("ai").precision)} | ${f(detect("ai").recall)} |
| **Hybrid (what Ruko uses)** | **${f(acc("hybrid"))}** | ${f(detect("hybrid").precision)} | ${f(detect("hybrid").recall)} |

Hybrid = rules first; the AI is asked only when the rules find nothing and the reply has 3+ words; its answer is used only if it arrives within ${AI_TIMEOUT_MS / 1000} s with confidence ≥ ${MIN_CONFIDENCE}. Fallback to rules on AI-eligible replies: **${f(fallbackRate)}**. AI calls that failed: ${aiFailures} of ${rows.length}.

Confusion table (hybrid):

${cm}

Misses: ${results.reading.misses.map((m) => `"${m.text}" (${m.label} → ${m.got})`).join("; ") || "none"}.

## 2. The scam check on single caller lines (${callers.length} lines: ${callers.filter((c) => c.scam).length} scam, ${callers.filter((c) => !c.scam).length} genuine)

| Threshold | Precision | Recall | False alarms on genuine calls |
|---|---|---|---|
| STOP | ${f(scamStop.precision)} | ${f(scamStop.recall)} | ${f(scamStop.falseAlarm)} |
| Any warning (caution or STOP) | ${f(scamAny.precision)} | ${f(scamAny.recall)} | ${f(scamAny.falseAlarm)} |

One line at a time is harder than a whole call: in the app the check reads everything the caller has said so far.

## 3. The guard

- Adversarial AI outputs rejected: **${rejected} of ${adv.length}** (OTP, card, Aadhaar, PIN, password, real agencies and officers, other badges, phone and account numbers, too long, abuse, violence, claiming to be human, leaving the stage, empty).
- Safe replies allowed: ${safePassed} of ${safe.length}.

## 4. Latency (this machine)

| Step | Median | 95th percentile |
|---|---|---|
| Rules read the reply | ${ms(lat.rules.median)} | ${ms(lat.rules.p95)} |
| State machine decides | ${ms(lat.decision.median)} | ${ms(lat.decision.p95)} |
| Threat engine (log-odds) | ${ms(lat.threat.median)} | ${ms(lat.threat.p95)} |
| Guard check | ${ms(lat.guard.median)} | ${ms(lat.guard.p95)} |
| Scam check (radar) | ${ms(lat.radar.median)} | ${ms(lat.radar.p95)} |
| AI classify (network round trip) | ${ms(lat.ai.median)} | ${ms(lat.ai.p95)} |

## 5. Simulated calls

${calls} scripted calls (English and Hinglish, presenters who resist, doubt, go silent, ask "are you a bot?", read out an OTP): payment ask reached in time in **${inTime} of ${calls}** (slowest ${results.simulatedCalls.slowestSeconds} s), unsafe lines spoken: **${unsafe}**.

## Trade-offs, honestly

- Rules are instant, offline and predictable, but miss phrasings nobody wrote a rule for.
- The AI reads unusual phrasings, but takes seconds and can be unavailable, so it is never in charge.
- The hybrid keeps the rules' speed and safety and lets the AI fill the gaps. The STOP decision itself never depends on the AI.
- The data is small and synthetic. A field test with real older adults is the next step.
`;
  writeFileSync(path.join(process.cwd(), "..", "docs", "EVAL.md"), md, "utf8");
  console.log(`reading: rules ${f(acc("rules"))}, ai ${f(acc("ai"))}, hybrid ${f(acc("hybrid"))} | fallback ${f(fallbackRate)} | scam STOP p ${f(scamStop.precision)} r ${f(scamStop.recall)} fa ${f(scamStop.falseAlarm)} | guard ${rejected}/${adv.length} | calls ${inTime}/${calls}, unsafe ${unsafe} | ai median ${ms(lat.ai.median)}`);
}

void main();
