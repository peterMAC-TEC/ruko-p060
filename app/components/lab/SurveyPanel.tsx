"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { QUESTIONS, type SurveyKind, type SurveySummary, type Tally } from "@/lib/survey";

// What participants, families and outside respondents told the survey bot (lib/survey.ts).
// Counts only: the answers hold no names or numbers.

const TITLE: Record<SurveyKind, string> = {
  participant: "Older adults, after a drill call",
  family: "Family members, after a drill call",
  open: "Open survey (shared link or QR code)",
  incident: "Scam calls reported through Ruko Companion",
};

const label = (kind: SurveyKind, qid: string, optionId: string) => QUESTIONS[kind].find((q) => q.id === qid)?.options?.find((o) => o.id === optionId)?.label.en ?? optionId;

function Bars({ kind, qid, tally }: { kind: SurveyKind; qid: string; tally: Tally }) {
  const q = QUESTIONS[kind].find((x) => x.id === qid);
  if (!q) return null;
  const ids = q.type === "scale" ? ["1", "2", "3", "4", "5"] : (q.options ?? []).map((o) => o.id);
  const max = Math.max(1, ...ids.map((id) => tally.counts[id] ?? 0));
  return (
    <div className="mt-3">
      <p className="text-[14px] font-bold">
        {q.ask.en} <span className="font-normal text-ink-soft">(n = {tally.n}{tally.mean !== undefined ? `, average ${tally.mean.toFixed(1)} of 5` : ""})</span>
      </p>
      <div className="mt-1 flex flex-col gap-1">
        {ids.map((id) => {
          const n = tally.counts[id] ?? 0;
          return (
            <div key={id} className="grid grid-cols-[minmax(0,1fr)_140px_28px] items-center gap-2 text-[13px]">
              <span className="truncate">{q.type === "scale" ? id : label(kind, qid, id)}</span>
              <span className="h-3 rounded bg-paper-2">
                <span className="block h-3 rounded bg-calm" style={{ width: `${(n / max) * 100}%` }} />
              </span>
              <span className="text-right font-bold tabular">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SurveyPanel() {
  const [data, setData] = useState<{ summary: SurveySummary; total: number } | null>(null);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      const r = await fetch("/api/lab/surveys", { cache: "no-store" }).catch(() => null);
      if (!stop && r?.ok) setData(await r.json());
    };
    load();
    const id = setInterval(load, 15_000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);
  const s = data?.summary;

  return (
    <section className="mt-6 rounded-[24px] bg-white p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-[19px] font-bold">What people told the survey bot</h2>
          <p className="text-[14px] text-ink-soft">
            {data ? `${data.total} answer${data.total === 1 ? "" : "s"} so far. ` : "Loading… "}Share the open survey with the QR poster (Lab → Survey QR) or the link /survey. No names or numbers are kept.
          </p>
        </div>
        <a href="/api/lab/surveys?csv=1" className="flex min-h-11 items-center gap-2 rounded-full bg-paper px-4 text-[14px] font-bold">
          <Download className="size-4" /> Survey CSV
        </a>
      </div>

      {s && data!.total === 0 && <p className="mt-4 text-[15px] text-ink-soft">No survey answers yet. After a drill call, open the survey from the call screen.</p>}

      {s &&
        (["participant", "family", "open", "incident"] as const).map((kind) =>
          s.n[kind] === 0 ? null : (
            <div key={kind} className="mt-5 border-t border-ink/8 pt-4">
              <h3 className="text-[16px] font-bold">
                {TITLE[kind]} <span className="font-normal text-ink-soft">· {s.n[kind]} answer{s.n[kind] === 1 ? "" : "s"}</span>
              </h3>
              {kind === "participant" && (
                <p className="mt-1 text-[13px] text-ink-soft">
                  Fear (1–5) with Ruko: {s.byArm["ruko/fear"]?.mean?.toFixed(1) ?? "—"} (n = {s.byArm["ruko/fear"]?.n ?? 0}) · without Ruko: {s.byArm["baseline/fear"]?.mean?.toFixed(1) ?? "—"} (n = {s.byArm["baseline/fear"]?.n ?? 0}).
                  Small numbers: read them as a story, not a test.
                </p>
              )}
              {QUESTIONS[kind]
                .filter((q) => q.type !== "text" && s.tallies[kind][q.id])
                .map((q) => (
                  <Bars key={q.id} kind={kind} qid={q.id} tally={s.tallies[kind][q.id]} />
                ))}
            </div>
          ),
        )}

      {s && s.texts.length > 0 && (
        <div className="mt-5 border-t border-ink/8 pt-4">
          <h3 className="text-[16px] font-bold">In their own words</h3>
          <ul className="mt-2 flex flex-col gap-2 text-[14px]">
            {s.texts.slice(0, 40).map((x, i) => (
              <li key={i} className="rounded-xl bg-paper px-3 py-2">
                <span className="text-[12px] font-bold tracking-wide text-ink-soft uppercase">{x.kind}</span> “{x.text}”
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
