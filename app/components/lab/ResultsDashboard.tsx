"use client";

import { ArrowLeft, Download, FlaskConical } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { CONTROL_LABEL, SCALE, STOPPED_BY_LABEL, type Rate, type StoppedBy, type TrialSummary } from "@/lib/trial";

// The pilot's results (method: docs/research/06 §4.3). The primary outcome is
// "stopped before pay": the same act with and without Ruko. Estimates come with
// exact intervals; tests are exploratory. Seeded data is labelled on every view.

interface Feasibility {
  enrolled: number;
  withdrawn: number;
  completedAll: number;
  callsDelivered: number;
  callsPlanned: number;
  aborted: number;
  deviations: number;
  completeness: number | null;
  teachbackFirstTime: number;
  deceptionAcceptable: number;
  deceptionAsked: number;
}
interface Results {
  data: "real" | "seeded";
  summary: TrialSummary;
  feasibility: Feasibility;
  participants: Array<{ id: string; code: string; row: number | null; order: string | null }>;
  protocol: { version: string; sha256: string };
}

const pct = (x: number | null | undefined, d = 0) => (x === null || x === undefined ? "—" : `${(x * 100).toFixed(d)}%`);
const ci = (c: [number, number]) => `${pct(c[0])}–${pct(c[1])}`;
const p3 = (p: number) => (p < 0.001 ? "<.001" : p.toFixed(3).replace(/^0/, ""));
const LEVEL_COLORS = ["#0b4a45", "#1d6b62", "#4d8f80", "#93b8a4", "#d9b45f", "#d98a3d", "#c2491f", "#8f1a12"];

export function ResultsDashboard({ initial }: { initial: "real" | "seeded" }) {
  const [view, setView] = useState(initial);
  const [r, setR] = useState<Results | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const res = await fetch(`/api/lab/results?data=${view}`, { cache: "no-store" }).catch(() => null);
      if (stop) return;
      if (!res?.ok) return setError("Couldn't load the results.");
      setError("");
      setR(await res.json());
    };
    load();
    const id = setInterval(load, 10_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [view]);

  const s = r?.summary;
  const seeded = view === "seeded";
  const codeOf = (pid: string) => r?.participants.find((p) => p.id === pid)?.code ?? "?";

  return (
    <div className="min-h-[100dvh] bg-paper-2 text-ink">
      <div className="mx-auto max-w-6xl px-5 py-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <RukoWordmark />
            <Link href="/lab" className="flex items-center gap-1 text-[15px] font-bold text-calm">
              <ArrowLeft className="size-4" /> Trial lab
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-full bg-white p-1 shadow-soft text-[14px]">
              <button onClick={() => setView("real")} className={`rounded-full px-4 py-1.5 font-bold ${!seeded ? "bg-ink text-white" : "text-ink-soft"}`}>
                Real trial data
              </button>
              <button onClick={() => setView("seeded")} className={`rounded-full px-4 py-1.5 font-bold ${seeded ? "bg-gold text-white" : "text-ink-soft"}`}>
                Illustrative (seeded)
              </button>
            </div>
            <a href={`/api/lab/results?data=${view}&format=csv`} className="flex min-h-10 items-center gap-2 rounded-full bg-white px-4 text-[14px] font-bold shadow-soft">
              <Download className="size-4" /> CSV
            </a>
          </div>
        </header>

        <p
          className={`mt-5 rounded-2xl px-5 py-3 text-center text-[15px] font-bold tracking-wide uppercase ${seeded ? "bg-gold text-white" : "bg-ink text-white"}`}
        >
          {seeded
            ? "Illustrative seeded data · fictional participants D01–D10 · not real results"
            : `Feasibility pilot · real trial data · n = ${s?.paired.n ?? 0} paired participant${s?.paired.n === 1 ? "" : "s"}`}
        </p>
        {error && <p className="mt-3 text-alarm">{error}</p>}

        {s && s.completedCalls === 0 ? (
          <section className="mt-6 rounded-[24px] bg-white p-8 text-center shadow-soft">
            <FlaskConical className="mx-auto size-10 text-calm" />
            <h1 className="mt-3 text-[24px] font-bold">No finished trial calls yet</h1>
            <p className="mt-1 text-[16px] text-ink-soft">
              Run the first call in the <Link href="/lab" className="font-bold text-calm underline">trial lab</Link>. Results appear here as calls end.
            </p>
          </section>
        ) : s ? (
          <>
            <section className="mt-6">
              <h1 className="text-[28px] leading-tight font-bold tracking-tight">Did people stop before paying?</h1>
              <p className="mt-1 text-[16px] text-ink-soft">
                Primary outcome: stopped before pressing Pay (level 5 or lower). This is the same act with and without Ruko.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Headline title="Without Ruko" rate={s.baseline.stopped} tone="ink" />
                <Headline title="With Ruko" rate={s.ruko.stopped} tone="calm" />
              </div>
            </section>

            <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
              <section className="rounded-[24px] bg-white p-5 shadow-soft">
                <h2 className="text-[18px] font-bold">Each person, without → with Ruko</h2>
                <p className="text-[14px] text-ink-soft">Furthest step reached (lower is safer). Green: Ruko kept them earlier.</p>
                <Slope people={s.paired.people} codeOf={codeOf} />
              </section>
              <section className="rounded-[24px] bg-white p-5 shadow-soft">
                <h2 className="text-[18px] font-bold">Paired comparison (n = {s.paired.n})</h2>
                <table className="mt-3 w-full text-center text-[15px]">
                  <thead>
                    <tr className="text-[13px] text-ink-soft">
                      <th />
                      <th className="pb-1">With Ruko: stopped</th>
                      <th className="pb-1">With Ruko: paid</th>
                    </tr>
                  </thead>
                  <tbody className="tabular">
                    <tr>
                      <th className="py-2 text-left text-[13px] text-ink-soft">Without: stopped</th>
                      <td className="rounded-lg bg-paper py-2 font-bold">{s.paired.a}</td>
                      <td className="rounded-lg bg-alarm-soft py-2 font-bold">{s.paired.c}</td>
                    </tr>
                    <tr>
                      <th className="py-2 text-left text-[13px] text-ink-soft">Without: paid</th>
                      <td className="rounded-lg bg-calm-soft py-2 font-bold">{s.paired.b}</td>
                      <td className="rounded-lg bg-paper py-2 font-bold">{s.paired.d}</td>
                    </tr>
                  </tbody>
                </table>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[15px]">
                  <dt className="text-ink-soft">Difference (with − without)</dt>
                  <dd className="font-bold tabular">
                    {pct(s.paired.difference.diff)} <span className="font-normal text-ink-soft">(95% CI {ci(s.paired.difference.ci)})</span>
                  </dd>
                  <dt className="text-ink-soft">Exact McNemar p</dt>
                  <dd className="font-bold tabular">
                    {p3(s.paired.mcnemarExact)} <span className="font-normal text-ink-soft">(mid-p {p3(s.paired.mcnemarMidP)})</span>
                  </dd>
                  <dt className="text-ink-soft">Wilcoxon on steps</dt>
                  <dd className="font-bold tabular">
                    p {p3(s.paired.wilcoxon.p)} <span className="font-normal text-ink-soft">(r = {s.paired.wilcoxon.r.toFixed(2)})</span>
                  </dd>
                </dl>
                <p className="mt-3 text-[13px] text-ink-soft">
                  Exploratory. With 10 pairs, p &lt; .05 needs at least 6 people to change, all towards Ruko. The estimate and its interval matter more than the p-value.
                </p>
              </section>
            </div>

            <section className="mt-4 rounded-[24px] bg-white p-5 shadow-soft">
              <h2 className="text-[18px] font-bold">How far people got</h2>
              <div className="mt-3 flex flex-col gap-3">
                <Stack label="Without Ruko" steps={s.baseline.steps} />
                <Stack label="With Ruko" steps={s.ruko.steps} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-soft">
                {SCALE.map((l) => (
                  <span key={l.level} className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm" style={{ background: LEVEL_COLORS[l.level] }} />
                    {l.level} {l.short}
                  </span>
                ))}
              </div>
            </section>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Card title="Money moved (system outcome)">
                <Row label="Without Ruko" value={`${s.baseline.moneyMoved.k}/${s.baseline.moneyMoved.n}`} />
                <Row label="With Ruko" value={`${s.ruko.moneyMoved.k}/${s.ruko.moneyMoved.n}`} />
                <p className="mt-2 text-[13px] text-ink-soft">Credits the bank hold, which can&apos;t be lifted during a call, so it favours Ruko by design. Always read it next to the primary.</p>
              </Card>
              <Card title="False alarms on genuine calls">
                <Row
                  label="Ruko alarm (C3), with Ruko"
                  value={`${s.controls.rukoArm.falseAlarms.k}/${s.controls.rukoArm.falseAlarms.n} · ${pct(s.controls.rukoArm.falseAlarms.rate)}`}
                />
                <p className="text-[13px] text-ink-soft">95% CI {ci(s.controls.rukoArm.falseAlarms.exact)} (exact)</p>
                <Row label={`Refused (C2), without Ruko`} value={`${s.controls.overSuspicion.baseline.k}/${s.controls.overSuspicion.baseline.n}`} />
                <Row label={`Refused (C2), with Ruko`} value={`${s.controls.overSuspicion.ruko.k}/${s.controls.overSuspicion.ruko.n}`} />
                <p className="mt-1 text-[12px] text-ink-soft">{(["C0", "C1", "C2", "C3"] as const).map((c) => `${c} ${CONTROL_LABEL[c]}`).join(" · ")}</p>
              </Card>
              <Card title="What stopped them (with Ruko)">
                {(Object.keys(STOPPED_BY_LABEL) as StoppedBy[]).map((k) => (
                  <Row key={k} label={STOPPED_BY_LABEL[k]} value={String(s.whatStopped[k])} />
                ))}
                <Row
                  label="Median time to stop"
                  value={s.ruko.timeToStop.median === null ? "—" : `${Math.round(s.ruko.timeToStop.median)}s (without: ${s.baseline.timeToStop.median === null ? "—" : `${Math.round(s.baseline.timeToStop.median)}s`})`}
                />
              </Card>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Card title="Carryover checks">
                <p className="text-[13px] text-ink-soft">If the two orders disagree a lot, learning from the first block is distorting the result.</p>
                <Row label={`Without Ruko first (n=${s.byOrder.AB.n})`} value={`with ${pct(s.byOrder.AB.pRuko)} · without ${pct(s.byOrder.AB.pBaseline)}`} />
                <Row label={`With Ruko first (n=${s.byOrder.BA.n})`} value={`with ${pct(s.byOrder.BA.pRuko)} · without ${pct(s.byOrder.BA.pBaseline)}`} />
                <Row
                  label="First block only (between people)"
                  value={`with ${s.firstPeriod.ruko.k}/${s.firstPeriod.ruko.n} · without ${s.firstPeriod.baseline.k}/${s.firstPeriod.baseline.n}`}
                />
              </Card>
              <Card title="Feasibility (CONSORT pilot)">
                {r && (
                  <>
                    <Row label="Enrolled / withdrew" value={`${r.feasibility.enrolled} / ${r.feasibility.withdrawn}`} />
                    <Row label="Completed all 4 calls" value={`${r.feasibility.completedAll}`} />
                    <Row label="Calls delivered / planned" value={`${r.feasibility.callsDelivered} / ${r.feasibility.callsPlanned}`} />
                    <Row label="Teach-back passed first time" value={`${r.feasibility.teachbackFirstTime}`} />
                    <Row label="Found the deception acceptable" value={`${r.feasibility.deceptionAcceptable} of ${r.feasibility.deceptionAsked} asked`} />
                    <Row label="Distress events (any / severe)" value={`${s.safety.adverseEvents} / ${s.safety.serious}`} />
                    <Row label="Deviations · aborted" value={`${r.feasibility.deviations} · ${r.feasibility.aborted}`} />
                    <Row label="Data complete" value={pct(r.feasibility.completeness)} />
                  </>
                )}
              </Card>
            </div>

            <p className="mt-6 text-[13px] text-ink-soft">
              Protocol {r?.protocol.version} · pre-registration fingerprint <span className="font-mono">{r?.protocol.sha256.slice(0, 16)}</span> (SHA-256 over the scale,
              outcomes, allocation table and seed; it changes if any of them change). Feasibility pilot, reported under the CONSORT pilot extension. Role-played calls with consenting older adults in Bengaluru; the facilitator was not
              blind to the arm (levels 4–7 are logged automatically). Intervals are exact (Clopper–Pearson) unless noted; Wilson in brackets on the headline.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Headline({ title, rate, tone }: { title: string; rate: Rate; tone: "ink" | "calm" }) {
  return (
    <section className={`rounded-[24px] p-6 shadow-soft ${tone === "calm" ? "emerald-card text-white" : "bg-white"}`}>
      <p className={`text-[15px] font-bold ${tone === "calm" ? "text-white/80" : "text-ink-soft"}`}>{title}</p>
      <p className="mt-1 text-[52px] leading-none font-bold tabular">{pct(rate.rate)}</p>
      <p className={`mt-1 text-[16px] ${tone === "calm" ? "text-white/85" : "text-ink-soft"}`}>
        {rate.k} of {rate.n} stopped before paying
      </p>
      <div className={`relative mt-4 h-3 rounded-full ${tone === "calm" ? "bg-white/20" : "bg-paper-2"}`}>
        <span
          className={`absolute top-0 h-3 rounded-full ${tone === "calm" ? "bg-white/50" : "bg-ink/25"}`}
          style={{ left: `${rate.exact[0] * 100}%`, width: `${(rate.exact[1] - rate.exact[0]) * 100}%` }}
        />
        {rate.rate !== null && <span className={`absolute -top-1 size-5 -translate-x-1/2 rounded-full ${tone === "calm" ? "bg-white" : "bg-ink"}`} style={{ left: `${rate.rate * 100}%` }} />}
      </div>
      <p className={`mt-2 text-[13px] ${tone === "calm" ? "text-white/75" : "text-ink-soft"}`}>
        95% CI {ci(rate.exact)} exact (Wilson {ci(rate.wilson)})
      </p>
    </section>
  );
}

function Slope({ people, codeOf }: { people: TrialSummary["paired"]["people"]; codeOf: (id: string) => string }) {
  const W = 420;
  const H = 260;
  const top = 16;
  const bottom = H - 24;
  const y = (lvl: number) => top + (lvl / 7) * (bottom - top);
  const xL = 110;
  const xR = W - 110;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Each person's furthest step without and with Ruko">
      {SCALE.map((l) => (
        <g key={l.level}>
          <line x1={xL} x2={xR} y1={y(l.level)} y2={y(l.level)} stroke="#13201f" strokeOpacity={0.06} />
          <text x={xL - 10} y={y(l.level) + 4} textAnchor="end" fontSize="11" fill="#56635f">
            {l.level} {l.short}
          </text>
        </g>
      ))}
      <line x1={xL} x2={xR} y1={(y(5) + y(6)) / 2} y2={(y(5) + y(6)) / 2} stroke="#b42318" strokeDasharray="4 4" strokeOpacity={0.6} />
      <text x={xR + 6} y={(y(5) + y(6)) / 2 + 4} fontSize="11" fill="#b42318">
        Pay
      </text>
      <text x={xL} y={H - 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#13201f">
        Without
      </text>
      <text x={xR} y={H - 4} textAnchor="middle" fontSize="12" fontWeight="700" fill="#13201f">
        With Ruko
      </text>
      {people.map((p, i) => {
        const jitter = (i - people.length / 2) * 2.2;
        const color = p.ruko < p.baseline ? "#0b4a45" : p.ruko > p.baseline ? "#b42318" : "#8a948f";
        return (
          <g key={p.participant_id}>
            <line x1={xL} x2={xR} y1={y(p.baseline) + jitter} y2={y(p.ruko) + jitter} stroke={color} strokeWidth={2.2} strokeOpacity={0.85} />
            <circle cx={xL} cy={y(p.baseline) + jitter} r={4} fill={color} />
            <circle cx={xR} cy={y(p.ruko) + jitter} r={4} fill={color} />
            <text x={xR + 8} y={y(p.ruko) + jitter + 4} fontSize="10" fill={color}>
              {codeOf(p.participant_id)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Stack({ label, steps }: { label: string; steps: number[] }) {
  const total = steps.reduce((a, b) => a + b, 0);
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-3">
      <span className="text-[14px] font-bold">{label}</span>
      <div className="flex h-8 overflow-hidden rounded-lg bg-paper-2">
        {total > 0 &&
          steps.map((n, i) =>
            n ? (
              <span
                key={i}
                title={`${i} ${SCALE[i].short}: ${n}`}
                className="flex items-center justify-center text-[12px] font-bold text-white"
                style={{ width: `${(n / total) * 100}%`, background: LEVEL_COLORS[i] }}
              >
                {n}
              </span>
            ) : null,
          )}
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[24px] bg-white p-5 shadow-soft">
      <h2 className="text-[17px] font-bold">{title}</h2>
      <div className="mt-2 flex flex-col gap-1.5">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[14px]">
      <span className="text-ink-soft">{label}</span>
      <span className="text-right font-bold tabular">{value}</span>
    </div>
  );
}
