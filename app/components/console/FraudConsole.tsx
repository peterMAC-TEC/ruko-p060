"use client";

import { Ban, Check, Inbox } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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

  const guardCount = rows.filter((r) => r.reasons.some((x) => x.code.startsWith("guard_decision_"))).length;
  const clock = now ? new Date(now).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }) : "--:--:--";

  return (
    <div
      className="relative min-h-[100dvh] bg-[#060a10] text-white"
      style={{ backgroundImage: "linear-gradient(rgba(120,200,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(120,200,255,0.05) 1px, transparent 1px)", backgroundSize: "40px 40px" }}
    >
      {/* the operations bar */}
      <header className="border-b border-white/10 bg-[#060a10]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[22px] font-bold tracking-tight">Fraud desk</h1>
            <span className="font-mono text-[12px] tracking-[0.16em] text-white/45 uppercase">Sahyog Bank · practice</span>
            <span className="rounded-full border border-[#fbbf24]/40 bg-[#fbbf24]/10 px-2.5 py-0.5 font-mono text-[11px] tracking-wide text-[#fbbf24] uppercase">Demo data</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[12px] tracking-[0.14em] uppercase">
            <span className="text-white/45 tabular">{clock} IST</span>
            <span className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${live ? "bg-[#4ade80] motion-safe:animate-pulse" : "bg-[#ff4d3d]"}`} />
              <span className={live ? "text-[#4ade80]" : "text-[#ff8a7d]"}>{live ? "Live · polling 1.5 s" : "Offline"}</span>
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* key numbers */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Key numbers">
          <Stat label="Held now" value={String(held.length)} tone={held.length > 0 ? "red" : "plain"} sub={held.length > 0 ? "needs a decision" : "queue clear"} />
          <Stat label="Flagged" value={String(rows.filter((r) => r.flagged).length)} sub="all time" />
          <Stat label="Stopped" value={String(stopped.length)} tone={stopped.length > 0 ? "green" : "plain"} sub="blocked or cancelled" />
          <Stat label="Money kept safe" value={inr(savedAmount)} tone={savedAmount > 0 ? "green" : "plain"} sub="practice bank" />
          <Stat label="Ruko Guard checks" value={String(guardCount)} tone="cyan" sub="decisions asked for" />
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          {/* left: the queue and what was decided */}
          <div className="min-w-0">
            <SectionTitle>Payment queue</SectionTitle>
            {held.length === 0 && (
              <div className="relative mt-3 overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.03] px-6 py-12 text-center">
                <span aria-hidden className="m-scan pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#38e1ff] to-transparent" />
                <Inbox className="mx-auto size-8 text-white/35" strokeWidth={1.6} />
                <p className="mt-3 text-[16px] text-white/55">Monitoring payments. Flagged payments appear here the moment they are attempted.</p>
              </div>
            )}
            <div className="mt-3 space-y-4">
              {held.map((r) => (
                <HeldCard key={r.id} row={r} now={now} onDecide={decide} />
              ))}
            </div>

            {decided.length > 0 && (
              <>
                <SectionTitle className="mt-8">Decided</SectionTitle>
                <ul className="mt-3 divide-y divide-white/10 overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.02]">
                  {decided.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-[15px]">
                      <span className="min-w-0">
                        <span className="font-mono">{inr(r.amount)}</span> → {r.payee}
                        <span className="ml-2 text-white/40">{r.elder_name}</span>
                      </span>
                      <StatusPill status={r.status} />
                    </li>
                  ))}
                </ul>
              </>
            )}

            {atRisk.length > 0 && (
              <>
                <SectionTitle className="mt-8">Threat engine · customers at risk</SectionTitle>
                <div className="mt-3 space-y-4">
                  {atRisk.map(([id, name]) => (
                    <ThreatPanel key={id} elderId={id} name={name} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* right: intelligence */}
          <aside className="min-w-0 space-y-6">
            <MuleWatch />
            <GuardLog rows={rows} />
          </aside>
        </div>

        <p className="mt-10 font-mono text-[11px] leading-relaxed text-white/35">
          Call-signal reasons appear only for customers who shared those signals with consent. Rows marked SEEDED are demo data. No real bank is connected.
        </p>
      </div>
    </div>
  );
}

function SectionTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-mono text-[12px] tracking-[0.18em] text-[#38e1ff] uppercase ${className}`}>{children}</h2>;
}

function HeldCard({ row, now, onDecide }: { row: Row; now: number; onDecide: (id: string, a: "release" | "block") => void }) {
  const left = row.hold_until && now ? Math.max(0, Date.parse(row.hold_until) - now) : 0;
  const mm = String(Math.floor(left / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((left % 60_000) / 1000)).padStart(2, "0");

  return (
    <article className={`overflow-hidden rounded-[20px] border bg-[#0a1118] shadow-[0_0_40px_rgba(255,77,61,0.08)] ${row.duress ? "border-2 border-signal" : "border-signal/40"}`}>
      <div className="flex flex-wrap items-start justify-between gap-6 p-5 sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] uppercase tracking-[0.14em] text-signal">
            <span className="size-2 animate-pulse rounded-full bg-signal" />
            {row.duress ? "Held · duress PIN · customer sees 'processing'" : `Held · cooling off ${mm}:${ss}`}
            {row.seeded && <span className="rounded bg-white/10 px-1.5 text-white/60">Seeded</span>}
          </div>
          <div className="mt-3 font-mono text-[36px] leading-none tracking-tight sm:text-[44px]">{inr(row.amount)}</div>
          <div className="mt-3 text-[17px]">
            {row.elder_name} → <span className="font-bold">{row.payee}</span>
          </div>
          <div className="font-mono text-[13px] break-all text-white/50">{row.payee_account}</div>
          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[11px] uppercase tracking-wider">
            <span className="rounded border border-white/20 px-1.5 py-0.5 text-white/70">{row.channel.replace("_", " ")}</span>
            {row.needs_approval && (
              <span className="rounded border border-mint/50 px-1.5 py-0.5 text-mint">Waiting for trusted person</span>
            )}
          </div>
        </div>
        <ScoreDial score={row.score} />
      </div>

      {row.hold_until && !row.duress && (
        <div className="h-1 bg-white/10" aria-hidden>
          <div className="h-full bg-signal transition-[width] duration-1000" style={{ width: `${Math.min(100, (left / Math.max(1, Date.parse(row.hold_until) - Date.parse(row.created_at))) * 100)}%` }} />
        </div>
      )}
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

      <div className="flex gap-3 border-t border-white/10 bg-white/[0.03] px-6 py-4">
        <button
          onClick={() => onDecide(row.id, "block")}
          className="m-tap flex min-h-11 items-center gap-2 rounded-[12px] bg-signal px-5 font-bold text-night hover:brightness-110"
        >
          <Ban className="size-4" strokeWidth={2.6} />
          Block
        </button>
        <button
          onClick={() => onDecide(row.id, "release")}
          className="m-tap flex min-h-11 items-center gap-2 rounded-[12px] border border-white/20 px-5 hover:border-white/50"
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

function Stat({ label, value, sub, tone = "plain" }: { label: string; value: string; sub?: string; tone?: "plain" | "red" | "green" | "cyan" }) {
  const c = tone === "red" ? "#ff6b5c" : tone === "green" ? "#4ade80" : tone === "cyan" ? "#38e1ff" : "#ffffff";
  return (
    <div className="relative overflow-hidden rounded-[16px] border border-white/10 bg-white/[0.035] px-5 py-4">
      <span aria-hidden className="absolute inset-x-0 top-0 h-0.5" style={{ background: c, opacity: tone === "plain" ? 0.15 : 0.8 }} />
      <div className="font-mono text-[11px] tracking-[0.18em] text-white/50 uppercase">{label}</div>
      <div className="mt-1 font-mono text-[30px] leading-tight font-bold tabular" style={{ color: c }}>
        {value}
      </div>
      {sub && <div className="text-[13px] text-white/45">{sub}</div>}
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
    <section className="rounded-[18px] border border-white/10 bg-white/[0.03] p-5" aria-labelledby="guard-log">
      <h2 id="guard-log" className="font-mono text-[12px] uppercase tracking-[0.18em] text-[#38e1ff]">
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
