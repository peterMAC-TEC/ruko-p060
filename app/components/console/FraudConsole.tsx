"use client";

import { Ban, Check, Inbox } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { inr } from "@/lib/i18n";
import type { Transfer } from "@/lib/types";
import { MuleWatch, ThreatPanel } from "./ThreatPanel";

// Bank fraud desk. Polls every 1.5s in demo mode; Supabase Realtime replaces
// the poll once the project is connected.

type Row = Transfer & { elder_name?: string };

const POLL_MS = 1500;

export function FraudConsole() {
  const [rows, setRows] = useState<Row[]>([]);
  // 0 until the first poll; reading the clock during prerender would freeze it.
  const [now, setNow] = useState(0);
  const [live, setLive] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/transfers", { cache: "no-store" });
      setRows(await r.json());
      setLive(true);
    } catch {
      setLive(false);
    }
    setNow(Date.now());
  }, []);

  useEffect(() => {
    // Polling an external API; the first fetch runs straight away.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const decide = async (id: string, action: "release" | "block") => {
    await fetch(`/api/transfers/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action }),
    });
    load();
  };

  // Duress first: someone may be standing over the customer right now.
  const held = rows.filter((r) => r.status === "held").sort((a, b) => Number(Boolean(b.duress)) - Number(Boolean(a.duress)));
  // Everyone with a live case: held payments, plus anyone flagged in the last day.
  const dayAgo = now - 86_400_000;
  const atRisk = [
    ...new Map(
      rows
        .filter((r) => !r.seeded && (r.status === "held" || (r.flagged && now && Date.parse(r.created_at) >= dayAgo)))
        .map((r) => [r.elder_id, r.elder_name ?? "Customer"] as const),
    ),
  ];
  const decided = rows.filter((r) => r.flagged && r.status !== "held");
  const stopped = rows.filter((r) => r.status === "blocked" || r.status === "cancelled");
  const savedAmount = stopped.reduce((n, r) => n + r.amount, 0);

  return (
    <div className="min-h-[100dvh] bg-night text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-baseline gap-3">
          <RukoWordmark tone="light" />
          <span className="font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">Fraud desk · Sahyog Bank</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.18em]">
          <span className={`size-2 rounded-full ${live ? "animate-pulse bg-mint" : "bg-signal"}`} />
          <span className={live ? "text-mint" : "text-signal"}>{live ? "Live" : "Offline"}</span>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
        <Stat label="Held now" value={String(held.length)} accent={held.length > 0} />
        <Stat label="Flagged total" value={String(rows.filter((r) => r.flagged).length)} />
        <Stat label="Stopped" value={String(stopped.length)} />
        <Stat label="Money kept safe" value={inr(savedAmount)} />
      </section>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <h2 className="font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">Queue</h2>
        {held.length === 0 && (
          <div className="mt-4 flex flex-col items-center rounded-2xl border border-dashed border-white/12 px-6 py-12 text-center text-white/40">
            <Inbox className="size-8" strokeWidth={1.6} />
            <p className="mt-3">No held transfers. Flagged payments appear here the moment they&apos;re attempted.</p>
          </div>
        )}
        <div className="mt-4 space-y-4">
          {held.map((r) => (
            <HeldCard key={r.id} row={r} now={now} onDecide={decide} />
          ))}
        </div>

        {atRisk.length > 0 && (
          <>
            <h2 className="mt-12 font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">Threat engine · customers at risk</h2>
            <div className="mt-4 space-y-4">
              {atRisk.map(([id, name]) => (
                <ThreatPanel key={id} elderId={id} name={name} />
              ))}
            </div>
          </>
        )}

        <div className="mt-12">
          <MuleWatch />
        </div>

        <GuardLog rows={rows} />

        {decided.length > 0 && (
          <>
            <h2 className="mt-12 font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">Decided</h2>
            <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
              {decided.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[15px]">
                  <span>
                    <span className="font-mono">{inr(r.amount)}</span> → {r.payee}
                    <span className="ml-2 text-white/40">{r.elder_name}</span>
                  </span>
                  <StatusPill status={r.status} />
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="mt-12 font-mono text-[11px] leading-relaxed text-white/35">
          Call-signal reasons appear only for customers who shared those signals with consent. Rows marked SEEDED are demo data.
        </p>
      </main>
    </div>
  );
}

function HeldCard({ row, now, onDecide }: { row: Row; now: number; onDecide: (id: string, a: "release" | "block") => void }) {
  const left = row.hold_until && now ? Math.max(0, Date.parse(row.hold_until) - now) : 0;
  const mm = String(Math.floor(left / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, "0");

  return (
    <article className={`overflow-hidden rounded-2xl border bg-night-2 ${row.duress ? "border-2 border-signal" : "border-signal/40"}`}>
      <div className="flex flex-wrap items-start justify-between gap-6 p-6">
        <div>
          <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.18em] text-signal">
            <span className="size-2 animate-pulse rounded-full bg-signal" />
            {row.duress ? "Held · duress PIN · customer sees 'processing'" : `Held · cooling off ${mm}:${ss}`}
            {row.seeded && <span className="rounded bg-white/10 px-1.5 text-white/60">Seeded</span>}
          </div>
          <div className="mt-3 font-mono text-[44px] leading-none tracking-tight">{inr(row.amount)}</div>
          <div className="mt-3 text-[17px]">
            {row.elder_name} → <span className="font-bold">{row.payee}</span>
          </div>
          <div className="font-mono text-[13px] text-white/50">{row.payee_account}</div>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider">
            <span className="rounded border border-white/20 px-1.5 py-0.5 text-white/70">{row.channel.replace("_", " ")}</span>
            {row.needs_approval && (
              <span className="rounded border border-mint/50 px-1.5 py-0.5 text-mint">Waiting for trusted person</span>
            )}
          </div>
        </div>
        <ScoreDial score={row.score} />
      </div>

      <ul className="space-y-2 border-t border-white/10 px-6 py-4">
        {row.reasons.map((reason) => (
          <li key={reason.code} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[15px]">
            <span className="w-10 shrink-0 font-mono text-[13px] text-signal">+{reason.points}</span>
            <span className="flex-1">{reason.label}</span>
            {reason.hard && <Tag tone="signal">Hard rule</Tag>}
            {reason.consent && <Tag tone="mint">Shared with consent</Tag>}
          </li>
        ))}
      </ul>

      <div className="flex gap-3 border-t border-white/10 bg-night-3/50 px-6 py-4">
        <button
          onClick={() => onDecide(row.id, "block")}
          className="flex items-center gap-2 rounded-lg bg-signal px-5 py-2.5 font-bold text-night hover:brightness-110"
        >
          <Ban className="size-4" strokeWidth={2.6} />
          Block
        </button>
        <button
          onClick={() => onDecide(row.id, "release")}
          className="flex items-center gap-2 rounded-lg border border-white/20 px-5 py-2.5 hover:border-white/50"
        >
          <Check className="size-4" strokeWidth={2.6} />
          Release
        </button>
      </div>
    </article>
  );
}

function ScoreDial({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative size-24">
      <svg viewBox="0 0 80 80" className="size-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="var(--color-signal)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[24px] leading-none">{score}</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/50">risk</span>
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-night px-6 py-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">{label}</div>
      <div className={`mt-1 font-mono text-[28px] ${accent ? "text-signal" : ""}`}>{value}</div>
    </div>
  );
}

function Tag({ tone, children }: { tone: "signal" | "mint"; children: React.ReactNode }) {
  const look = tone === "signal" ? "border-signal/50 text-signal" : "border-mint/50 text-mint";
  return <span className={`rounded border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wider ${look}`}>{children}</span>;
}

function StatusPill({ status }: { status: Transfer["status"] }) {
  const look =
    status === "blocked" || status === "cancelled"
      ? "bg-mint/15 text-mint"
      : status === "released"
        ? "bg-white/10 text-white/70"
        : "bg-signal/15 text-signal";
  const label = status === "cancelled" ? "cancelled by customer" : status;
  return <span className={`rounded px-2 py-0.5 font-mono text-[12px] uppercase tracking-wider ${look}`}>{label}</span>;
}

/** What Ruko Guard decided for each payment: the same answer a real bank gets from POST /api/guard/assess. Demo data. */
function GuardLog({ rows }: { rows: Row[] }) {
  const guarded = rows.filter((r) => r.reasons.some((x) => x.code.startsWith("guard_decision_"))).slice(0, 10);
  return (
    <section className="mt-12" aria-labelledby="guard-log">
      <h2 id="guard-log" className="font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">
        Ruko Guard · decisions the bank asked for <span className="ml-2 rounded bg-white/10 px-1.5 text-white/60">Demo data, practice bank</span>
      </h2>
      {guarded.length === 0 ? (
        <p className="mt-3 text-[15px] text-white/50">No payments yet. Every payment the practice bank takes is checked by Ruko Guard first.</p>
      ) : (
        <ul className="mt-3 divide-y divide-white/10 rounded-2xl border border-white/10">
          {guarded.map((r) => {
            const decision = r.reasons.find((x) => x.code.startsWith("guard_decision_"))!.code.replace("guard_decision_", "");
            const codes = r.reasons.filter((x) => x.code.startsWith("guard_") && !x.code.startsWith("guard_decision_")).map((x) => x.code.replace("guard_", ""));
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[15px]">
                <span>
                  <span className="font-mono">{inr(r.amount)}</span> → {r.payee}
                  <span className="ml-2 text-white/40">{r.elder_name}</span>
                </span>
                <span className="flex flex-wrap items-center gap-2 font-mono text-[12px]">
                  <span className={`rounded border px-1.5 py-0.5 uppercase ${decision === "allow" ? "border-white/20 text-white/70" : decision === "block" ? "border-signal text-signal" : "border-mint/50 text-mint"}`}>{decision.replace(/_/g, " ")}</span>
                  {codes.map((c) => (
                    <span key={c} className="rounded bg-white/10 px-1.5 py-0.5 text-white/60">
                      {c}
                    </span>
                  ))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
