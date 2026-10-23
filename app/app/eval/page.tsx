import type { Metadata } from "next";
import Link from "next/link";
import results from "@/data/eval-results.json";

export const metadata: Metadata = { title: "Eval" };

// /eval: the measured numbers from `npm run eval` (scripts/eval.ts), on synthetic data. Bars grow in once (CSS only).

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;
const ms = (x: number) => (x < 1 ? `${Math.round(x * 1000)} µs` : `${Math.round(x)} ms`);

function Bar({ label, value, tone, note }: { label: string; value: number; tone: string; note?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[16px] text-white/85">{label}</span>
        <span className="font-mono text-[20px] font-bold" style={{ color: tone }}>
          {pct(value)}
        </span>
      </div>
      <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="m-reveal h-full origin-left rounded-full" style={{ width: `${value * 100}%`, background: tone, animation: "ruko-line 1s cubic-bezier(.22,1,.36,1) both" }} />
      </div>
      {note && <p className="mt-1 text-[13px] text-white/50">{note}</p>}
    </div>
  );
}

export default function EvalPage() {
  const r = results;
  const d = r.data;
  return (
    <div className="min-h-[100dvh] bg-[#061529] text-white">
      <main className="mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6">
        <p className="font-mono text-[13px] tracking-[0.16em] text-[#5b9dff] uppercase">Evaluation · measured, on synthetic data</p>
        <h1 className="mt-3 text-[40px] leading-[1.04] font-bold tracking-tight sm:text-[64px]">The numbers behind &ldquo;code decides&rdquo;</h1>
        <p className="mt-4 max-w-3xl text-[18px] leading-relaxed text-white/75">
          {d.presenter} labelled presenter replies (English and Hinglish), {d.caller} caller lines, {d.adversarial} adversarial AI outputs. All written by us and marked synthetic: these are not field results. Run with <span className="font-mono">npm run eval</span>; generated {new Date(r.generatedAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-4">
          {[
            [`${r.guard.rejected}/${r.guard.total}`, "unsafe AI outputs blocked by the guard"],
            [`${r.simulatedCalls.unsafe}`, `unsafe lines in ${r.simulatedCalls.calls} simulated calls`],
            [pct(r.scamCheck.stop.falseAlarm), "false STOPs on genuine calls"],
            [pct(r.reading.accuracy.hybrid), "replies read correctly (hybrid)"],
          ].map(([big, small]) => (
            <div key={small} className="rounded-[18px] border border-white/10 bg-white/[0.04] p-5">
              <p className="font-mono text-[40px] leading-none font-bold text-[#FFB000]">{big}</p>
              <p className="mt-2 text-[15px] leading-snug text-white/75">{small}</p>
            </div>
          ))}
        </div>

        <section className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-[24px] font-bold">Reading what the person meant</h2>
            <p className="mt-1 text-[14px] text-white/55">11 classes: doubt, which department, family, no money, angry, scared, refuse, leave, &ldquo;are you a bot&rdquo;, in writing, none.</p>
            <div className="mt-5 flex flex-col gap-5">
              <Bar label="Rules only" value={r.reading.accuracy.rules} tone="#e8eefc" note="Instant and offline, but misses phrasings nobody wrote a rule for." />
              <Bar label="AI only" value={r.reading.accuracy.ai} tone="#5b9dff" note={`Reads unusual phrasings, but takes about ${ms(r.latencyMs.ai.median)} and can be unavailable.`} />
              <Bar label="Hybrid (what Ruko uses)" value={r.reading.accuracy.hybrid} tone="#FFB000" note={`Rules first; AI only when unclear, fast and confident. Fell back to rules on ${pct(r.reading.fallbackRate)} of unclear replies.`} />
            </div>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-6">
            <h2 className="text-[24px] font-bold">The scam check, one caller line at a time</h2>
            <p className="mt-1 text-[14px] text-white/55">The hardest setting: in the app the check reads the whole call so far.</p>
            <div className="mt-5 flex flex-col gap-5">
              <Bar label="STOP: precision" value={r.scamCheck.stop.precision} tone="#00A86B" />
              <Bar label="STOP: recall on a single line" value={r.scamCheck.stop.recall} tone="#FF7A00" note="STOP needs two signs, so one line rarely triggers it on its own." />
              <Bar label="Any warning: recall" value={r.scamCheck.anyWarning.recall} tone="#FFB000" />
              <Bar label="False alarms on genuine calls" value={r.scamCheck.stop.falseAlarm} tone="#00A86B" />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[20px] border border-white/10 bg-white/[0.035] p-6">
          <h2 className="text-[24px] font-bold">How long each step takes</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-[16px]">
              <thead className="font-mono text-[13px] text-white/50">
                <tr>
                  <th className="py-2">Step</th>
                  <th>Median</th>
                  <th>95th percentile</th>
                  <th>Kind</th>
                </tr>
              </thead>
              <tbody>
                {(
                  [
                    ["Rules read the reply", r.latencyMs.rules, "code"],
                    ["State machine decides", r.latencyMs.decision, "code"],
                    ["Threat engine (log-odds)", r.latencyMs.threat, "code"],
                    ["Guard check", r.latencyMs.guard, "code"],
                    ["Scam check (radar)", r.latencyMs.radar, "code"],
                    ["AI classify (network)", r.latencyMs.ai, "AI"],
                  ] as const
                ).map(([n, v, k]) => (
                  <tr key={n} className="border-t border-white/10">
                    <td className="py-2">{n}</td>
                    <td className="font-mono">{ms(v.median)}</td>
                    <td className="font-mono">{ms(v.p95)}</td>
                    <td className="font-mono" style={{ color: k === "AI" ? "#5b9dff" : "#e8eefc" }}>
                      {k}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[14px] text-white/55">
            The code steps take microseconds, so the STOP decision is instant and never waits for the AI. Simulated calls: the payment ask was reached in time in {r.simulatedCalls.inTime} of {r.simulatedCalls.calls}.
          </p>
        </section>

        <p className="mt-8 text-[15px] text-white/60">
          Full report with the confusion table and every miss: <span className="font-mono">docs/EVAL.md</span>.{" "}
          <Link href="/architecture" className="underline underline-offset-4">
            See the architecture
          </Link>
          .
        </p>
      </main>
    </div>
  );
}
