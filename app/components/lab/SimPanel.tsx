"use client";

import { useEffect, useState } from "react";
import type { Summary } from "@/lib/bots/harness";

// The simulator's results: Ruko's rules against the scammer bot. Always labelled as simulated.

interface Sim {
  goesAlong: Summary;
  defender: Summary;
  relentless: Summary;
  scripts: Array<{ id: string; title: string; isScam: boolean; lang: string; lines: number; flag: number | null; stop: number | null; money: number | null; falseAlarm: boolean | null }>;
}

export function SimPanel() {
  const [sim, setSim] = useState<Sim | null>(null);
  useEffect(() => {
    fetch("/api/lab/sim", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setSim)
      .catch(() => null);
  }, []);
  if (!sim) return null;
  const { goesAlong: a, defender: d, relentless: h } = sim;
  return (
    <section className="mt-6 rounded-[24px] border-2 border-dashed border-gold/60 bg-white p-5 shadow-soft">
      <p className="text-[12px] font-bold tracking-widest text-warn uppercase">Simulated · tests Ruko&apos;s rules · not people</p>
      <h2 className="mt-1 text-[19px] font-bold">Scammer bot vs Ruko (simulator)</h2>
      <p className="text-[14px] text-ink-soft">
        The scammer bot plays every drill script in English and Hindi, clean and with speech-to-text noise. Run it yourself any time with <span className="font-mono">npm run sim</span>. It shows where Ruko&apos;s rules are strong or weak;
        it does not say whether a real older person would stop. That is the trial&apos;s job.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat big={`${a.stoppedBeforeMoney} / ${a.scamRuns}`} title="STOP before the money request" note={`A warning or STOP before it: ${a.warnedBeforeMoney} / ${a.scamRuns}`} />
        <Stat big={`${a.rukoFalseAlarms} / ${a.controlRuns}`} title="False alarms on genuine calls" note="Lower is better" />
        <Stat big={`${h.defenderExits} / ${h.scamRuns}`} title="Defender leaves a relentless scammer's call" note={`Times it agreed to pay or share anything: ${h.leaks + d.leaks}`} />
      </div>

      <table className="mt-4 w-full text-left text-[13px]">
        <thead>
          <tr className="text-ink-soft">
            <th className="py-1 pr-2 font-bold">Script (English, clean)</th>
            <th className="px-2 font-bold">Warned on line</th>
            <th className="px-2 font-bold">STOP on line</th>
            <th className="px-2 font-bold">Money asked on line</th>
          </tr>
        </thead>
        <tbody>
          {sim.scripts
            .filter((s) => s.lang === "en")
            .map((s) => (
              <tr key={s.id} className="border-t border-ink/8">
                <td className="py-1.5 pr-2">{s.title}{!s.isScam && <span className="text-ink-soft"> (genuine)</span>}</td>
                <td className="px-2 tabular">{s.flag ?? "—"}</td>
                <td className="px-2 tabular">{s.stop ?? "—"}</td>
                <td className="px-2 tabular">{s.money ?? "—"}{s.falseAlarm ? " ⚠ false alarm" : ""}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </section>
  );
}

function Stat({ big, title, note }: { big: string; title: string; note: string }) {
  return (
    <div className="rounded-2xl bg-paper p-3">
      <p className="text-[28px] font-bold tabular">{big}</p>
      <p className="text-[13px] font-bold">{title}</p>
      <p className="text-[12px] text-ink-soft">{note}</p>
    </div>
  );
}
