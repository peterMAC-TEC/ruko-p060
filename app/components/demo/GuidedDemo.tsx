"use client";

import { ArrowLeft, ArrowRight, Check, PhoneIncoming, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { inr } from "@/lib/i18n";
import type { CallSignals, Transfer } from "@/lib/types";

// One screen that tells the whole story: Kamala's phone, Priya's phone and the
// bank's fraud desk side by side, with a five-step guide. Each step has one
// button or one tap, and ticks itself off by watching the real data.

type Alert = { id: string; status: string };

const ELDER = "/bank?embed=1";
const SCAM_PAYMENT = "/bank?embed=1&prefill=scam";

export function GuidedDemo({ elderId, familyId }: { elderId: string; familyId: string }) {
  const [signals, setSignals] = useState<CallSignals | null>(null);
  const [latest, setLatest] = useState<Transfer | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [elderSrc, setElderSrc] = useState(ELDER);
  const [frameKey, setFrameKey] = useState(0);
  const [busy, setBusy] = useState(false);

  const poll = useCallback(async () => {
    try {
      const [s, tr, al] = await Promise.all([
        fetch(`/api/signals?elderId=${elderId}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/transfers?elderId=${elderId}&view=staff`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/alerts?memberId=${familyId}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setSignals(s);
      setLatest((tr as Transfer[]).find((x) => !x.seeded) ?? null);
      setAlerts(al);
    } catch {}
  }, [elderId, familyId]);

  useEffect(() => {
    // Polling the demo's own API; the first read runs straight away.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    poll();
    const id = setInterval(poll, 1200);
    return () => clearInterval(id);
  }, [poll]);

  const startCall = async () => {
    setBusy(true);
    await fetch("/api/signals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderId, on_call: true, unknown_number: true, call_minutes: 95, call_ended_at: null }),
    });
    await poll();
    setBusy(false);
  };

  const reset = async () => {
    setBusy(true);
    await fetch("/api/demo/reset", { method: "POST" });
    setElderSrc(ELDER);
    setFrameKey((k) => k + 1);
    await poll();
    setBusy(false);
  };

  const callOn = Boolean(signals?.on_call && signals.unknown_number);
  const held = latest && latest.flagged;
  const familyAlerted = alerts.length > 0;
  const priyaCalling = alerts.some((a) => a.status === "ack_calling");
  const stopped = latest?.status === "blocked" || latest?.status === "cancelled";

  const steps: Array<{ title: string; body: string; done: boolean; action?: React.ReactNode; hint?: string }> = [
    {
      title: "A scammer calls Kamala",
      body: "A fake “CBI officer” says she is under digital arrest and must move her savings to a “safe account”. Kamala, 72, shared her call signals with Ruko, with consent.",
      done: callOn,
      action: (
        <StepButton onClick={startCall} disabled={busy} icon={PhoneIncoming}>
          Start the scam call
        </StepButton>
      ),
    },
    {
      title: "She tries to send ₹4,80,000",
      body: "Frightened, Kamala opens her bank app to pay the “RBI Safe Account”.",
      done: Boolean(held),
      action:
        elderSrc === SCAM_PAYMENT ? undefined : (
          <StepButton onClick={() => setElderSrc(SCAM_PAYMENT)} icon={ArrowRight}>
            Open the payment
          </StepButton>
        ),
      hint: elderSrc === SCAM_PAYMENT ? "Now tap Send on Kamala’s phone, then type the practice PIN 1234" : undefined,
    },
    {
      title: "Ruko steps in",
      body: "The bank pauses the payment for an hour and explains why, Priya’s phone rings, and the fraud desk sees every reason.",
      done: Boolean(held && familyAlerted),
    },
    {
      title: "Her daughter calls",
      body: "The social interrupt is the intervention: a familiar voice breaks the scammer’s spell.",
      done: priyaCalling,
      hint: "Tap “Call Kamala now” on Priya’s phone",
    },
    {
      title: "The bank stops the money",
      body: "The fraud desk sees the hold, the reasons and the consented call signal, and blocks the transfer.",
      done: stopped,
      hint: "Tap Block on the fraud desk below",
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <div className="min-h-[100dvh] bg-night text-white">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 text-[14px] text-white/50 hover:text-white">
            <ArrowLeft className="size-4" />
          </Link>
          <RukoWordmark tone="light" />
          <span className="rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.2em] text-white/60">
            Live demo
          </span>
        </div>
        <button
          onClick={reset}
          disabled={busy}
          className="flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-[14px] text-white/70 hover:border-white/40 hover:text-white"
        >
          <RotateCcw className="size-4" />
          Start over
        </button>
      </header>

      <div className="mx-auto grid max-w-[1400px] gap-8 px-6 py-8 xl:grid-cols-[340px_1fr]">
        <aside>
          <h1 className="font-display text-[40px] leading-[1.05]">See Ruko stop a digital-arrest scam.</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-white/60">
            Three real screens, live. Follow the steps; each one takes a single tap.
          </p>

          <ol className="mt-8 space-y-3">
            {steps.map((s, i) => {
              const state = s.done ? "done" : i === current ? "now" : "later";
              return (
                <li
                  key={s.title}
                  className={`rounded-2xl border p-4 transition ${
                    state === "now" ? "border-signal/60 bg-night-2" : "border-white/8 bg-transparent"
                  } ${state === "later" ? "opacity-45" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-[13px] ${
                        state === "done" ? "bg-mint text-night" : state === "now" ? "bg-signal text-night" : "bg-white/10"
                      }`}
                    >
                      {state === "done" ? <Check className="size-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[17px] font-bold">{s.title}</h2>
                      {state !== "later" && <p className="mt-1 text-[14px] leading-relaxed text-white/60">{s.body}</p>}
                      {state === "now" && s.action && <div className="mt-3">{s.action}</div>}
                      {state === "now" && s.hint && (
                        <p className="mt-3 flex items-center gap-2 text-[14px] font-bold text-signal">
                          <span className="size-2 animate-pulse rounded-full bg-signal" />
                          {s.hint}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          {current === -1 && latest && (
            <div className="mt-6 rounded-2xl bg-mint/10 p-5 ring-1 ring-mint/30 animate-in fade-in duration-500">
              <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-mint">Outcome</div>
              <p className="mt-2 text-[22px] font-bold leading-snug">{inr(latest.amount)} stopped before it moved.</p>
              <p className="mt-1 text-[14px] text-white/60">
                This is the north star: the share of scam calls where the person stops before transferring.
              </p>
            </div>
          )}
        </aside>

        <section className="min-w-0">
          <div className="flex flex-wrap justify-center gap-8">
            <Phone label="Kamala’s phone" sub="Elder · practice bank" src={elderSrc} frameKey={frameKey} live={callOn} />
            <Phone
              label="Priya’s phone"
              sub="Daughter · Ruko family alerts"
              src={`/family?embed=1&member=${familyId}`}
              frameKey={frameKey}
              ringing={familyAlerted && !priyaCalling && !stopped}
            />
          </div>

          <div className="mt-10">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[15px] font-bold">Bank fraud desk</span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-white/40">Sahyog Bank · internal</span>
            </div>
            <iframe
              key={`desk-${frameKey}`}
              src="/console"
              title="Bank fraud desk"
              className="h-[560px] w-full rounded-2xl border border-white/10 bg-night"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Phone({
  label,
  sub,
  src,
  frameKey,
  live,
  ringing,
}: {
  label: string;
  sub: string;
  src: string;
  frameKey: number;
  live?: boolean;
  ringing?: boolean;
}) {
  return (
    <figure className="flex flex-col items-center">
      <figcaption className="mb-3 text-center">
        <div className="flex items-center justify-center gap-2 text-[15px] font-bold">
          {label}
          {live && (
            <span className="flex items-center gap-1.5 rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-signal">
              <span className="size-1.5 animate-pulse rounded-full bg-signal" />
              On a call · unknown number
            </span>
          )}
          {ringing && (
            <span className="flex items-center gap-1.5 rounded-full bg-signal/15 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-signal">
              <span className="size-1.5 animate-pulse rounded-full bg-signal" />
              Alert
            </span>
          )}
        </div>
        <div className="text-[13px] text-white/45">{sub}</div>
      </figcaption>
      <div className={`rounded-[46px] bg-[#1c1f21] p-3 shadow-2xl ring-1 ring-white/10 transition ${ringing ? "ring-2 ring-signal/70" : ""}`}>
        <iframe key={`${src}-${frameKey}`} src={src} title={label} className="h-[740px] w-[360px] rounded-[36px] bg-paper" />
      </div>
    </figure>
  );
}

function StepButton({
  children,
  onClick,
  disabled,
  icon: I,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-[15px] font-bold text-night transition hover:brightness-95 disabled:opacity-50"
    >
      <I className="size-4" />
      {children}
    </button>
  );
}
