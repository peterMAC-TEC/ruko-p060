"use client";

import { Bell, BellRing, Check, MessageSquareQuote, Phone, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { KillSwitch } from "@/components/bank/KillSwitch";
import { FAMILY_LINE, type ElderStatus } from "@/lib/companion";
import type { AlertStatus } from "@/lib/types";
import { waLink } from "@/lib/utils";

// The family member's phone. When an alert lands it should be impossible to
// miss: red screen, alarm tone, vibration, and one obvious thing to do.

type Row = {
  id: string;
  status: AlertStatus;
  message: string;
  ts: string;
  member_name?: string;
  elder_name?: string;
  elder_phone?: string;
  reasons: string[];
  /** What the elder told Ruko Companion (a code). */
  elder_status?: ElderStatus | null;
};

const POLL_MS = 2000;

// What to say, from bank staff who stopped real digital arrests (research/03):
// calm first, one action, one fact, no blame.
const SCRIPT = [
  "Are you safe? I'm here with you.",
  "Please hang up now. I'll call you back in two minutes.",
  "No police, CBI or bank ever arrests anyone or asks for money on a video call.",
  "You haven't done anything wrong. We'll report it on 1930 together.",
];

type ApprovalRow = {
  id: string;
  needs_code_word?: boolean;
  status: "pending" | "approved" | "declined";
  elder_name?: string;
  elder_phone?: string;
  transfer?: {
    amount: number;
    payee: string;
    payee_account: string;
    channel: string;
    status: string;
    scam: boolean;
    reasons: string[];
  };
};

type ProtectionState = { active: boolean; since: string | null; reason: string | null };

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/** embed: inside the guided demo, "Call" only records the tap (no phone dialler). */
export function FamilyApp({
  memberId,
  elderIds = [],
  embed = false,
  demo = false,
}: {
  memberId: string;
  elderIds?: string[];
  embed?: boolean;
  demo?: boolean;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRow[]>([]);
  const [protection, setProtection] = useState<ProtectionState | null>(null);
  const [decided, setDecided] = useState<Record<string, string>>({});
  const elderId = elderIds[0];
  const [armed, setArmed] = useState(false);
  const [now, setNow] = useState(0);
  const seen = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);

  const ring = useCallback(() => {
    navigator.vibrate?.([600, 200, 600, 200, 600]);
    const ctx = audio.current;
    if (!ctx) return;
    // Two-tone alarm, three bursts.
    for (let i = 0; i < 6; i++) {
      const o = ctx.createOscillator();
      const gain = ctx.createGain();
      o.frequency.value = i % 2 ? 660 : 880;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.35);
      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.35 + 0.3);
      o.connect(gain).connect(ctx.destination);
      o.start(ctx.currentTime + i * 0.35);
      o.stop(ctx.currentTime + i * 0.35 + 0.3);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [r, ap, pr] = await Promise.all([
        fetch(`/api/alerts?memberId=${memberId}`, { cache: "no-store" }),
        fetch(`/api/approvals?memberId=${memberId}`, { cache: "no-store" }),
        elderId ? fetch(`/api/protection?elderId=${elderId}&view=staff`, { cache: "no-store" }) : null,
      ]);
      if (!r.ok) return;
      const data: Row[] = await r.json();
      const approvalRows: ApprovalRow[] = ap.ok ? await ap.json() : [];
      setRows(data);
      setApprovals(approvalRows);
      if (pr?.ok) setProtection(await pr.json());
      setNow(Date.now());
      // Ring only for alerts and approval requests that arrive while the page is open.
      if (seen.current) {
        const fresh = [
          ...data.filter((a) => !seen.current!.has(a.id) && a.status === "sent"),
          ...approvalRows
            .filter((a) => !seen.current!.has(a.id) && a.status === "pending")
            .map((a) => ({ message: `${a.elder_name ?? "Your family member"} needs your OK for a payment` })),
        ];
        if (fresh.length) {
          ring();
          if (document.hidden && "Notification" in window && Notification.permission === "granted") {
            new Notification("Ruko alert", { body: fresh[0].message, requireInteraction: true });
          }
        }
      }
      seen.current = new Set([...data.map((a) => a.id), ...approvalRows.map((a) => a.id)]);
    } catch {}
  }, [memberId, elderId, ring]);

  const decide = async (approvalId: string, decision: "approved" | "declined", codeWord?: string) => {
    const r = await fetch(`/api/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision, codeWord }),
    });
    const d = await r.json().catch(() => ({}));
    if (r.status === 403 && (d.error === "code_word_needed" || d.error === "code_word_wrong")) {
      setDecided((x) => ({ ...x, [`${approvalId}:err`]: d.error === "code_word_wrong" ? "That is not the family code word. The payment is still on hold." : "Ask for the family code word first. The payment is still on hold." }));
      return;
    }
    setDecided((x) => {
      const { [`${approvalId}:err`]: _gone, ...rest } = x;
      return rest;
    });
    setDecided((x) => ({
      ...x,
      [approvalId]:
        decision === "declined"
          ? "You said no. The payment is cancelled."
          : d.outcome === "bank_check"
            ? "You said yes. The bank is still checking it, because Ruko also saw scam signs."
            : "You said yes. The payment has gone through.",
    }));
    load();
  };

  const clearProtection = async () => {
    if (!elderId) return;
    await fetch("/api/protection", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderId, memberId }),
    });
    load();
  };

  useEffect(() => {
    // Polling an external API; the first fetch runs straight away.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const arm = async () => {
    audio.current ??= new AudioContext();
    await audio.current.resume();
    if ("Notification" in window && Notification.permission === "default") await Notification.requestPermission();
    setArmed(true);
    ring();
  };

  const ack = async (id: string, status: AlertStatus) => {
    await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  };

  const open = rows?.find((a) => a.status === "sent");
  const memberFirst = rows?.[0]?.member_name?.split(" ")[0];
  const earlier = rows?.filter((a) => a.status !== "sent") ?? [];

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper text-[18px] text-ink">
      <header className="flex items-center justify-between px-6 pt-4 pb-3">
        <RukoWordmark />
        <button
          onClick={arm}
          className={`flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-semibold ${armed ? "text-ink-soft shadow-soft" : "bg-ink text-white"}`}
        >
          {armed ? <Check className="size-4" strokeWidth={3} /> : <Bell className="size-4" strokeWidth={2.4} />}
          {armed ? "Sound on" : "Turn on sound"}
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-6 pt-2 pb-8">
        {rows === null && <div className="h-48 animate-pulse rounded-[20px] bg-paper-2" />}

        {open && (
          <section className="flex flex-1 flex-col animate-in fade-in duration-300" role="alert">
            <p className="flex items-center gap-2 text-[14px] font-semibold tracking-[0.16em] text-alarm uppercase">
              <BellRing className="size-4" strokeWidth={2.2} />
              Scam alert · {ago(open.ts, now)}
            </p>
            <span className="mt-8 block size-4 animate-pulse rounded-full bg-alarm ring-[8px] ring-alarm/15" />

            <h1 className="display mt-6 text-[40px] leading-[1.05]">{open.message}</h1>
            {open.elder_status && FAMILY_LINE[open.elder_status] && (
              <p className={`mt-5 text-[22px] leading-snug ${open.elder_status === "needs_help" || open.elder_status === "paid" ? "font-semibold text-alarm" : "text-ink-soft"}`} role="status">
                {open.elder_name?.split(" ")[0] ?? "They"} {FAMILY_LINE[open.elder_status]}
              </p>
            )}

            <div className="mt-auto flex flex-col pt-8">
              <a
                href={!embed && open.elder_phone ? `tel:${open.elder_phone.replace(/\s/g, "")}` : undefined}
                onClick={() => ack(open.id, "ack_calling")}
                className="flex min-h-[76px] cursor-pointer items-center justify-center gap-3 rounded-[18px] bg-alarm text-[23px] font-semibold text-white"
              >
                <Phone className="size-6" strokeWidth={2} />
                Call {open.elder_name?.split(" ")[0] ?? "them"} now
              </a>
              {!embed && open.elder_phone && (
                <a
                  href={waLink(open.elder_phone, "Hi, are you on a call with someone asking for money? Please hang up. I am calling you now.")}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 flex min-h-[64px] items-center justify-between border-b border-hair text-left text-[21px] font-semibold"
                >
                  Message {open.elder_name?.split(" ")[0] ?? "them"} on WhatsApp
                </a>
              )}
              <button onClick={() => ack(open.id, "ack_fine")} className="mt-3 flex min-h-[64px] flex-col justify-center border-b border-hair text-left text-[21px] font-semibold">
                It&apos;s fine, I&apos;ve checked
                <span className="text-[15px] font-normal text-ink-soft">A false alarm. This helps Ruko get it right.</span>
              </button>
            </div>

            {approvals
              .filter((x) => (x.status === "pending" && x.transfer?.status === "held") || decided[x.id])
              .map((x) => (
                <div key={x.id} className="mt-5">
                  <ApprovalCard a={x} result={decided[x.id]} error={decided[`${x.id}:err`]} onDecide={decide} embed={embed} />
                </div>
              ))}

            {open.reasons.length > 0 && (
              <details className="group border-b border-hair">
                <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between text-[19px] text-ink-soft">
                  Why Ruko thinks so ({open.reasons.length})
                  <span className="text-[22px] transition group-open:rotate-90">›</span>
                </summary>
                <ul className="space-y-2 pb-4 text-[17px]">
                  {open.reasons.map((r) => (
                    <li key={r} className="flex gap-3">
                      <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-ink" />
                      {r}
                    </li>
                  ))}
                </ul>
              </details>
            )}

            <section className="mt-6">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold tracking-[0.14em] text-ink-soft uppercase">
                <MessageSquareQuote className="size-4" />
                What to say
              </h2>
              <ol className="display mt-3 space-y-3 text-[24px] leading-[1.2]">
                {SCRIPT.map((line) => (
                  <li key={line}>&ldquo;{line}&rdquo;</li>
                ))}
              </ol>
            </section>
          </section>
        )}

        {rows && !open && (
          <>
            {demo && (
              <p className="self-start rounded-full bg-paper-2 px-3 py-1 text-[14px] font-semibold text-ink-soft">Demo: Priya&apos;s phone</p>
            )}
            {approvals
              .filter((a) => (a.status === "pending" && a.transfer?.status === "held") || decided[a.id])
              .map((a) => (
                <ApprovalCard key={a.id} a={a} result={decided[a.id]} error={decided[`${a.id}:err`]} onDecide={decide} embed={embed} />
              ))}
            {elderId && <KillSwitch elderId={elderId} by="family" />}
            {protection?.active && (
              <section className="rounded-[28px] bg-warn-soft p-6">
                <h2 className="flex items-center gap-2 text-[20px] font-bold text-warn">
                  <ShieldAlert className="size-6" strokeWidth={2.4} />
                  Protection is on
                </h2>
                <p className="mt-2">
                  Large payments are waiting until someone checks. {protection.reason ? `Why: ${protection.reason}.` : ""}
                </p>
                <p className="mt-2 text-[15px] text-ink-soft">Clear it only after you&apos;ve spoken to them and they&apos;re safe.</p>
                <button onClick={clearProtection} className="mt-4 min-h-14 w-full rounded-2xl bg-ink text-[18px] font-bold text-white">
                  I&apos;ve spoken to them. They&apos;re safe
                </button>
              </section>
            )}
            <section className="animate-in fade-in duration-300">
              <span className="flex size-14 items-center justify-center rounded-full shadow-soft">
                <ShieldCheck className="size-7" strokeWidth={1.8} />
              </span>
              <h1 className="display mt-5 text-[46px] leading-none">All quiet{memberFirst ? `, ${memberFirst}` : ""}</h1>
              <p className="mt-1 text-ink-soft">
                If Ruko thinks your family member may be on a scam call, you&apos;ll get an alert here with one button to call
                them.
              </p>
              {!armed && (
                <button
                  onClick={arm}
                  className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[18px] font-bold text-white"
                >
                  <Bell className="size-5" strokeWidth={2.4} />
                  Turn on alert sound
                </button>
              )}
            </section>

            {!embed && (
              <a href="/setup" className="flex min-h-16 items-center justify-between rounded-[18px] border border-hair px-5 text-[19px] font-semibold">
                Set up Ruko for Mum or Dad
                <span aria-hidden>→</span>
              </a>
            )}

            {earlier.length > 0 && (
              <section>
                <h2 className="text-[15px] font-bold text-ink-soft">Earlier</h2>
                <ul className="mt-3 divide-y divide-ink/6 rounded-3xl bg-white px-5 shadow-soft">
                  {earlier.map((a) => (
                    <li key={a.id} className="py-4">
                      <div className="text-[16px]">{a.message}</div>
                      <div className="mt-1 flex items-center gap-2 text-[14px] text-ink-soft">
                        <span
                          className={`rounded-full px-2 py-0.5 font-bold ${
                            a.status === "ack_calling" ? "bg-calm-soft text-calm" : "bg-paper text-ink-soft"
                          }`}
                        >
                          {a.status === "ack_calling" ? "You called" : "Marked fine"}
                        </span>
                        {ago(a.ts, now)}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function ago(ts: string, now: number) {
  if (!now) return "just now";
  const s = Math.max(0, Math.round((now - Date.parse(ts)) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
}

function ApprovalCard({
  a,
  result,
  error,
  onDecide,
  embed,
}: {
  a: ApprovalRow;
  result?: string;
  error?: string;
  onDecide: (id: string, d: "approved" | "declined", codeWord?: string) => void;
  embed: boolean;
}) {
  const [word, setWord] = useState("");
  const t = a.transfer;
  const first = a.elder_name?.split(" ")[0] ?? "They";
  if (result) return <p className="rounded-[28px] bg-calm-soft p-6 font-bold text-calm">{result}</p>;
  if (!t) return null;
  const risky = t.scam;
  return (
    <section className={`rounded-[28px] p-6 shadow-soft ${risky ? "bg-alarm-soft" : "bg-white"}`}>
      <div className="text-[13px] font-bold uppercase tracking-[0.14em] text-ink-soft">Needs your OK</div>
      <p className="mt-2 text-[22px] font-bold leading-snug">
        {first} wants to send {inr(t.amount)} to {t.payee}
      </p>
      <p className="text-[15px] text-ink-soft">
        {t.channel.toUpperCase()} · {t.payee_account}
      </p>
      {t.reasons.length > 0 && (
        <div className="mt-4 rounded-2xl bg-white/70 p-4">
          <p className={`font-bold ${risky ? "text-alarm" : "text-ink"}`}>
            {risky ? `Ruko also sees scam signs. Call ${first} before you decide.` : "Worth knowing"}
          </p>
          <ul className="mt-2 space-y-1 text-[15px]">
            {t.reasons.map((r) => (
              <li key={r}>• {r}</li>
            ))}
          </ul>
        </div>
      )}
      <a
        href={!embed && a.elder_phone ? `tel:${a.elder_phone.replace(/\s/g, "")}` : undefined}
        className="mt-5 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink text-[18px] font-bold text-white"
      >
        <Phone className="size-5" />
        Call {first} first
      </a>
      {a.needs_code_word && (
        <label className="mt-4 block">
          <span className="text-[17px] font-bold">Ruko flagged a scam call. To approve, ask {first} for the family code word.</span>
          <input
            value={word}
            onChange={(e) => setWord(e.target.value)}
            autoComplete="off"
            placeholder="Family code word"
            className="mt-2 min-h-14 w-full rounded-2xl border-2 border-ink/15 bg-white px-4 text-[19px] outline-none focus:border-ink"
          />
        </label>
      )}
      {error && (
        <p className="mt-3 rounded-2xl bg-white p-3 text-[16px] font-bold text-alarm" role="alert">
          {error}
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          onClick={() => onDecide(a.id, "declined")}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-ink/15 bg-white text-[18px] font-bold"
        >
          <X className="size-5" />
          Say no
        </button>
        <button
          onClick={() => onDecide(a.id, "approved", word)}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-calm/30 bg-white text-[18px] font-bold text-calm"
        >
          <Check className="size-5" />
          Approve
        </button>
      </div>
    </section>
  );
}
