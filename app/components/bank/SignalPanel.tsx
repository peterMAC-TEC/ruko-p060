"use client";

import { useEffect, useState } from "react";
import type { CallSignals } from "@/lib/types";

// Demo-only stand-in for the phone's call-state signals (MOCK_SIGNALS). The
// elder never sees this in a real trial; it's how we play the scammer's call
// on stage. Clearly marked so nobody mistakes it for product UI.

export function SignalPanel({ elderId }: { elderId: string }) {
  const [s, setS] = useState<CallSignals | null>(null);
  // Collapsed by default so it never covers the bank's own buttons.
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/signals?elderId=${elderId}`).then((r) => r.json()).then(setS).catch(() => {});
  }, [elderId]);

  // On a phone the panel would cover the elder's screen, so it starts folded.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.innerWidth < 768) setOpen(false);
  }, []);

  const update = async (patch: Partial<CallSignals>) => {
    const r = await fetch("/api/signals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ elderId, ...patch }),
    });
    if (r.ok) setS(await r.json());
  };

  const startCall = (minutes: number) =>
    update({ on_call: true, unknown_number: true, call_minutes: minutes, call_ended_at: null });
  const endCall = () => update({ on_call: false, call_ended_at: new Date().toISOString() });
  const clear = () => update({ on_call: false, unknown_number: false, call_minutes: 0, call_ended_at: null });

  const status = !s
    ? "…"
    : s.on_call
      ? `On a call · unknown number · ${s.call_minutes} min`
      : s.call_ended_at && s.unknown_number
        ? `Call ended · ${s.call_minutes} min, unknown number`
        : "No call";

  return (
    <div className="font-mono text-[12px] text-white">
      <div className="rounded-xl border border-dashed border-signal/60 bg-night/95 p-3 shadow-2xl backdrop-blur">
        <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="uppercase tracking-[0.18em] text-signal">Demo signal panel</span>
          <span className="text-white/50">{open ? "hide" : "show"}</span>
        </button>
        {open && (
          <div className="mt-3 space-y-3">
            <p className="text-white/50">Simulates the phone&apos;s call signals (shared with consent). Not seen by the elder.</p>
            <div className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${s?.on_call ? "animate-pulse bg-signal" : "bg-white/30"}`} />
              <span>{status}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 25, 95].map((m) => (
                <button
                  key={m}
                  onClick={() => startCall(m)}
                  className="rounded-md border border-white/15 px-2 py-1 hover:border-signal hover:text-signal"
                >
                  Unknown call {m}m
                </button>
              ))}
              <button onClick={endCall} className="rounded-md border border-white/15 px-2 py-1 hover:border-white/40">
                End call
              </button>
              <button onClick={clear} className="rounded-md border border-white/15 px-2 py-1 text-white/60 hover:border-white/40">
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
