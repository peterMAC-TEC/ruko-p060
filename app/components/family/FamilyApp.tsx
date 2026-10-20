"use client";

import { Bell, BellRing, Check, MessageSquareQuote, Phone, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { Avatar } from "@/components/elder/ui";
import type { AlertStatus } from "@/lib/types";

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

  const decide = async (approvalId: string, decision: "approved" | "declined") => {
    const r = await fetch(`/api/approvals/${approvalId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    const d = await r.json().catch(() => ({}));
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
    <div className={`flex min-h-[100dvh] flex-col text-[18px] text-ink transition-colors ${open ? "bg-alarm-2" : "bg-paper"}`}>
      <header className="flex items-center justify-between px-5 pt-4 pb-3">
        <RukoWordmark tone={open ? "light" : "dark"} />
        <button
          onClick={arm}
          className={`flex min-h-10 items-center gap-1.5 rounded-full px-4 text-[14px] font-bold ${
            armed ? (open ? "bg-white/15 text-white" : "bg-calm-soft text-calm") : "bg-ink text-white"
          }`}
        >
          {armed ? <Check className="size-4" strokeWidth={3} /> : <Bell className="size-4" strokeWidth={2.4} />}
          {armed ? "Sound on" : "Turn on sound"}
        </button>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-5 pt-2 pb-8">
        {rows === null && <div className="h-48 animate-pulse rounded-[28px] bg-white/60" />}

        {open && (
          <section className="flex flex-1 flex-col text-white animate-in fade-in zoom-in-95 duration-300" role="alert">
            <div className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.16em] text-white/80">
              <BellRing className="size-4" strokeWidth={2.6} />
              Scam alert · {ago(open.ts, now)}
            </div>

            <div className="mt-8 flex flex-col items-center text-center">
              <span className="relative">
                <span className="absolute -inset-3 animate-ping rounded-full bg-white/20" />
                <span className="relative block rounded-full ring-4 ring-white/30">
                  <Avatar name={open.elder_name ?? "?"} size="size-24" />
                </span>
              </span>
              <p className="mt-7 text-[27px] font-bold leading-snug">{open.message}</p>
            </div>

            {open.reasons.length > 0 && (
              <ul className="mt-6 space-y-2 rounded-2xl bg-white/10 p-4 text-[16px] text-white/90">
                {open.reasons.map((r) => (
                  <li key={r} className="flex gap-2">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-white/70" />
                    {r}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-auto flex flex-col gap-3 pt-8">
              <a
                href={!embed && open.elder_phone ? `tel:${open.elder_phone.replace(/\s/g, "")}` : undefined}
                onClick={() => ack(open.id, "ack_calling")}
                className="flex min-h-16 cursor-pointer items-center justify-center gap-3 rounded-2xl bg-white text-[21px] font-bold text-alarm shadow-lift"
              >
                <Phone className="size-6" strokeWidth={2.4} />
                Call {open.elder_name?.split(" ")[0] ?? "them"} now
              </a>
              <button
                onClick={() => ack(open.id, "ack_fine")}
                className="min-h-14 rounded-2xl border-2 border-white/30 text-[18px] font-bold"
              >
                It&apos;s fine, I&apos;ve checked
              </button>
            </div>

            <section className="mt-6 rounded-2xl bg-white/10 p-4">
              <h2 className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.14em] text-white/80">
                <MessageSquareQuote className="size-4" />
                What to say
              </h2>
              <ol className="mt-3 space-y-2 text-[17px]">
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
              <p className="self-start rounded-full bg-gold-soft px-3 py-1 text-[14px] font-bold text-warn">Demo: Priya&apos;s phone</p>
            )}
            {approvals
              .filter((a) => (a.status === "pending" && a.transfer?.status === "held") || decided[a.id])
              .map((a) => (
                <ApprovalCard key={a.id} a={a} result={decided[a.id]} onDecide={decide} embed={embed} />
              ))}
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
            <section className="rounded-[28px] bg-white p-6 shadow-soft animate-in fade-in duration-300">
              <span className="flex size-14 items-center justify-center rounded-full bg-calm-soft text-calm">
                <ShieldCheck className="size-7" strokeWidth={2.2} />
              </span>
              <h1 className="mt-4 text-[26px] font-bold tracking-tight">All quiet{memberFirst ? `, ${memberFirst}` : ""}</h1>
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
  onDecide,
  embed,
}: {
  a: ApprovalRow;
  result?: string;
  onDecide: (id: string, d: "approved" | "declined") => void;
  embed: boolean;
}) {
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
      <div className="mt-3 grid grid-cols-2 gap-3">
        <button
          onClick={() => onDecide(a.id, "declined")}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-ink/15 bg-white text-[18px] font-bold"
        >
          <X className="size-5" />
          Say no
        </button>
        <button
          onClick={() => onDecide(a.id, "approved")}
          className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-calm/30 bg-white text-[18px] font-bold text-calm"
        >
          <Check className="size-5" />
          Approve
        </button>
      </div>
    </section>
  );
}
