"use client";

import { useEffect, useState } from "react";
import { Chip, TechBackdrop } from "@/components/tech/TechBackdrop";
import { FeatureGrid, LiveCallCard } from "@/components/tech/FeatureGrid";
import { OFFLINE_KEY } from "@/lib/demo-mode";

// The control room: the live call first, then every other part of Ruko in any order, then the presenter's two switches
// (offline mode, reset). Judges can start from here without help.

export function DemoHub() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOffline(localStorage.getItem(OFFLINE_KEY) === "1");
    } catch {
      // Storage blocked: stays on.
    }
  }, []);
  const [reset, setReset] = useState<"" | "busy" | "done" | "fail">("");
  const resetDemo = async () => {
    setReset("busy");
    try {
      const r = await fetch("/api/demo/reset", { method: "POST" });
      setReset(r.ok ? "done" : "fail");
    } catch {
      setReset("fail");
    }
    setTimeout(() => setReset(""), 2500);
  };
  const toggle = () => {
    const next = !offline;
    setOffline(next);
    try {
      localStorage.setItem(OFFLINE_KEY, next ? "1" : "0");
    } catch {
      // Fine: the choice just does not stick.
    }
  };

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#060a10] text-white">
      <TechBackdrop />
      <main className="relative mx-auto max-w-6xl px-4 pt-10 pb-20 sm:px-6 sm:pt-14">
        <Chip tone="green">
          <span className="size-2 rounded-full bg-[#4ade80] motion-safe:animate-pulse" /> Control room
        </Chip>
        <h1 className="mt-5 text-[40px] leading-[1.04] font-bold tracking-tight sm:text-[68px]">Ruko demo</h1>
        <p className="mt-3 max-w-2xl text-[20px] leading-relaxed text-white/70">Everything here is a role-play with a practice bank: no real call is made and no real money moves. Start with the live call, then open anything.</p>

        <div className="mt-8">
          <LiveCallCard />
        </div>
        <div className="mt-10">
          <FeatureGrid />
        </div>

        <div className="mt-12 grid gap-3 lg:grid-cols-2">
          <section className="rounded-[20px] border border-white/10 bg-white/[0.035] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[21px] font-semibold">Offline mode</p>
                <p className="mt-1 text-[16px] leading-snug text-white/65">{offline ? "On: scripts and recorded voices only. No AI, no lookups. Use this if the Wi-Fi is bad." : "Off: scenes may use AI to word replies, and fall back to scripts if it is slow."}</p>
              </div>
              <button
                onClick={toggle}
                role="switch"
                aria-checked={offline}
                aria-label="Offline mode"
                className={`relative h-12 w-24 shrink-0 rounded-full border transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38e1ff] ${offline ? "border-[#38e1ff] bg-[#38e1ff]/25" : "border-white/20 bg-white/10"}`}
              >
                <span className={`absolute top-1 size-10 rounded-full bg-white transition-all ${offline ? "left-[3.2rem]" : "left-1"}`} />
                <span className="sr-only">{offline ? "On" : "Off"}</span>
              </button>
            </div>
            <p className="mt-3 text-[14px] text-white/45">The laptop version (npm run demo:offline) is fully offline, including the family phone and the bank.</p>
          </section>
          <section className="flex items-center justify-between gap-4 rounded-[20px] border border-white/10 bg-white/[0.035] p-5">
            <div>
              <p className="text-[21px] font-semibold">Reset the demo</p>
              <p className="mt-1 text-[16px] leading-snug text-white/65">Clears held payments, alerts and the lock, so the next run starts clean.</p>
            </div>
            <button onClick={resetDemo} disabled={reset === "busy"} className="min-h-[64px] shrink-0 rounded-[16px] border border-white/40 px-6 text-[18px] font-semibold transition hover:border-[#38e1ff] hover:text-[#38e1ff] disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38e1ff]">
              {reset === "busy" ? "Resetting…" : reset === "done" ? "Reset ✓" : reset === "fail" ? "Could not reset" : "Reset"}
            </button>
          </section>
        </div>
        <p className="mt-8 text-[15px] text-white/45">Demo data is labelled. No field-trial results exist yet; nothing on these screens is a measured outcome.</p>
      </main>
    </div>
  );
}
