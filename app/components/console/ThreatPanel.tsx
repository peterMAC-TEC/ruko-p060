"use client";

import { BadgeCheck, Fingerprint, Network, PhoneOutgoing, ShieldAlert, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { inr } from "@/lib/i18n";
import { PLAYBOOK_LABEL, STAGES, type PlaybookAction, type StageId, type ThreatLevel } from "@/lib/threat";

// The fraud desk's view of Ruko's threat engine for one customer: how likely a
// scam is right now, how far along the attack is, the evidence behind it, what
// Ruko already did, and whether the evidence log is intact.

interface Threat {
  level: ThreatLevel;
  probability: number;
  stage: StageId | null;
  stagesActive: StageId[];
  duress: boolean;
  verifiedCall: boolean;
  playbook: PlaybookAction[];
  tactics: Array<{ id: string; name: string; stage: StageId | null; lr: number; weight: number; at: string; sources: string[]; evidence: string[] }>;
  timeline: Array<{ at: string; kind: "observation" | "action"; source: string; tactic: string | null; action: string | null; evidence: string | null; hash: string }>;
  integrity: { ok: boolean; count: number; brokenAt: number | null; head: string };
}

const LEVEL_LOOK: Record<ThreatLevel, string> = {
  none: "bg-white/10 text-white/70",
  watch: "bg-[#d9b45f]/20 text-[#e9c97a]",
  elevated: "bg-[#d98a3d]/25 text-[#f0a35a]",
  high: "bg-signal/25 text-signal",
  critical: "bg-signal text-night",
};

const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export function ThreatPanel({ elderId, name }: { elderId: string; name: string }) {
  const [t, setT] = useState<Threat | null>(null);
  const [call, setCall] = useState<{ id: string; code: string; expiresAt: string } | null>(null);
  const [now, setNow] = useState(0);

  const load = useCallback(async () => {
    const r = await fetch(`/api/threat?elderId=${elderId}&view=staff`, { cache: "no-store" }).catch(() => null);
    if (r?.ok) setT(await r.json());
    setNow(Date.now());
  }, [elderId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [load]);

  const startCall = async () => {
    const r = await fetch("/api/callintent", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderId, agent: "Meena, Sahyog Bank fraud team", purpose: t?.duress ? "fraud_alert" : "payment_check" }),
    });
    if (r.ok) setCall(await r.json());
  };
  const endCall = async () => {
    if (call) await fetch(`/api/callintent/${call.id}`, { method: "DELETE" });
    setCall(null);
  };

  if (!t) return null;
  const first = name.split(" ")[0];
  const left = call && now ? Math.max(0, Date.parse(call.expiresAt) - now) : 0;

  return (
    <article className={`overflow-hidden rounded-2xl border bg-night-2 ${t.duress ? "border-signal" : "border-white/12"}`}>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="size-5 text-signal" />
          <span className="text-[17px] font-bold">{name}</span>
          <span className={`rounded px-2 py-0.5 font-mono text-[12px] uppercase tracking-wider ${LEVEL_LOOK[t.level]}`}>{t.level}</span>
          <span className="font-mono text-[14px] text-white/70">{(Math.min(t.probability, 0.9999) * 100).toFixed(t.probability > 0.99 ? 2 : 1)}%</span>
          {t.duress && <span className="rounded bg-signal px-2 py-0.5 font-mono text-[12px] font-bold uppercase tracking-wider text-night">Duress PIN</span>}
          {t.verifiedCall && (
            <span className="flex items-center gap-1 rounded border border-mint/50 px-1.5 py-0.5 font-mono text-[11px] uppercase text-mint">
              <BadgeCheck className="size-3.5" /> verified bank call
            </span>
          )}
        </div>
        <Integrity i={t.integrity} />
      </header>

      {/* The attack, stage by stage. */}
      <div className="grid grid-cols-7 gap-1 px-6 pt-5">
        {STAGES.map((s) => {
          const on = t.stagesActive.includes(s.id);
          return (
            <div key={s.id} title={s.hint} className="min-w-0">
              <div className={`h-2 rounded-full ${on ? "bg-signal" : "bg-white/10"}`} />
              <p className={`mt-1.5 truncate font-mono text-[10px] uppercase tracking-wider ${on ? "text-signal" : "text-white/35"}`}>{s.name}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 px-6 py-5 lg:grid-cols-2">
        <section>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Evidence (likelihood ratio, decayed weight)</h3>
          {t.tactics.length === 0 ? (
            <p className="mt-2 text-[14px] text-white/40">No live signals.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {t.tactics.map((x) => (
                <li key={x.id} className="text-[14px]">
                  <div className="flex items-baseline gap-2">
                    <span className="w-11 shrink-0 font-mono text-[12px] text-signal">{x.id}</span>
                    <span className="flex-1">{x.name}</span>
                    <span className={`font-mono text-[12px] ${x.weight < 0 ? "text-mint" : "text-white/60"}`}>
                      ×{x.lr} · {x.weight > 0 ? "+" : ""}
                      {x.weight.toFixed(2)}
                    </span>
                  </div>
                  <p className="ml-13 pl-[52px] font-mono text-[11px] text-white/40">
                    {x.sources.join(", ")} · {clock(x.at)}
                    {x.evidence.length ? ` · ${x.evidence.join("; ")}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Response playbook</h3>
          <ul className="mt-2 space-y-1.5 text-[14px]">
            {t.playbook.length === 0 && <li className="text-white/40">Nothing needed.</li>}
            {t.playbook.map((p) => {
              const done = t.timeline.some((e) => e.kind === "action" && e.action === p);
              return (
                <li key={p} className="flex items-center gap-2">
                  <span className={`size-2 rounded-full ${done ? "bg-mint" : "bg-white/25"}`} />
                  <span className={done ? "" : "text-white/60"}>{PLAYBOOK_LABEL[p]}</span>
                  {done && <span className="font-mono text-[11px] text-mint">done</span>}
                </li>
              );
            })}
          </ul>

          <div className="mt-4">
            {call ? (
              <div className="rounded-xl border border-mint/40 bg-mint/10 p-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-mint">Signed call notice live · {Math.ceil(left / 60_000)} min</p>
                <p className="mt-1 text-[15px]">
                  Call {first} now. {first}&apos;s Ruko shows this call as verified. Say this code:
                </p>
                <p className="mt-1 font-mono text-[40px] leading-none tracking-[0.3em] text-mint">{call.code}</p>
                <button onClick={endCall} className="mt-3 flex items-center gap-1.5 rounded-lg border border-white/20 px-3 py-1.5 text-[13px] hover:border-white/50">
                  <X className="size-4" /> End call
                </button>
              </div>
            ) : (
              <button onClick={startCall} className="flex items-center gap-2 rounded-lg bg-mint px-4 py-2.5 font-bold text-night hover:brightness-110">
                <PhoneOutgoing className="size-4" /> Call {first} (verified)
              </button>
            )}
          </div>
        </section>
      </div>

      <details className="border-t border-white/10 px-6 py-3">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-[0.2em] text-white/45">Evidence log ({t.timeline.length})</summary>
        <ol className="mt-2 space-y-1 font-mono text-[12px] text-white/60">
          {t.timeline
            .slice()
            .reverse()
            .map((e) => (
              <li key={e.hash} className="flex gap-3">
                <span className="text-white/35">{clock(e.at)}</span>
                <span className={e.kind === "action" ? "text-mint" : "text-signal"}>{e.kind === "action" ? `⟶ ${e.action}` : e.tactic}</span>
                <span className="truncate">{e.source}{e.evidence ? ` · ${e.evidence}` : ""}</span>
                <span className="ml-auto text-white/25">{e.hash}</span>
              </li>
            ))}
        </ol>
      </details>
    </article>
  );
}

function Integrity({ i }: { i: Threat["integrity"] }) {
  return i.ok ? (
    <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-mint" title={`Hash chain head ${i.head}`}>
      <Fingerprint className="size-4" /> Evidence chain intact · {i.count} · {i.head.slice(0, 8)}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 rounded bg-signal px-2 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-night">
      <Fingerprint className="size-4" /> Tampered at entry #{(i.brokenAt ?? 0) + 1}
    </span>
  );
}

interface Cluster {
  hash: string;
  account: string;
  victims: number;
  attempted: number;
  reports: number;
  last: string;
}

/** Destination accounts several customers were stopped paying, or that were reported. */
export function MuleWatch() {
  const [data, setData] = useState<{ clusters: Cluster[]; reportedOnly: number } | null>(null);
  useEffect(() => {
    const load = () =>
      fetch("/api/mules", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then(setData)
        .catch(() => {});
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);
  if (!data) return null;
  return (
    <section className="rounded-2xl border border-white/12 bg-night-2 p-6">
      <h2 className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.2em] text-white/50">
        <Network className="size-4" /> Mule watch · destination accounts
      </h2>
      {data.clusters.length === 0 ? (
        <p className="mt-3 text-[14px] text-white/40">No flagged destinations in the last 30 days.</p>
      ) : (
        <table className="mt-3 w-full text-left text-[14px]">
          <thead className="font-mono text-[11px] uppercase tracking-wider text-white/40">
            <tr>
              <th className="py-1 font-normal">Account (masked)</th>
              <th className="font-normal">Customers stopped</th>
              <th className="font-normal">Reports</th>
              <th className="font-normal">Attempted</th>
            </tr>
          </thead>
          <tbody>
            {data.clusters.map((c) => (
              <tr key={c.hash} className="border-t border-white/8">
                <td className="py-2 font-mono">{c.account}</td>
                <td className={c.victims >= 2 ? "font-bold text-signal" : ""}>{c.victims}</td>
                <td className={c.reports >= 3 ? "font-bold text-signal" : ""}>{c.reports}</td>
                <td className="font-mono">{inr(c.attempted)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="mt-3 font-mono text-[11px] text-white/35">
        Matched by salted hash across customers; {data.reportedOnly} more reported account{data.reportedOnly === 1 ? "" : "s"} not yet paid by anyone here.
      </p>
    </section>
  );
}
