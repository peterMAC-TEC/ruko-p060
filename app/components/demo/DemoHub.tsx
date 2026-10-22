"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Guardian } from "@/components/brand/Guardian";
import { OFFLINE_KEY } from "@/lib/demo-mode";

// The presenter's hub: one big button per scene, and one switch that makes every scene run on scripts and recorded
// lines only (no AI, no network lookups), for a venue with bad Wi-Fi. Judges can start from here without help.

const SCENES = [
  { href: "/demo/live", n: "1", title: "Live call", body: "You are the older person. A fictional officer calls. Resist him, by voice. Ruko steps in at the payment ask, and you choose how it ends." },
  { href: "/demo/call", n: "2", title: "Watch it play", body: "The same scam as a short audio role-play, with and without Ruko. Safe to play to a room." },
  { href: "/line", n: "3", title: "Ruko Line", body: "An unknown caller is graded, screened, and put through, taken as a message, or blocked." },
  { href: "/check", n: "4", title: "Is this a scam?", body: "The guided check a real person would use. Try the 'I don't know' case too." },
  { href: "/demo/guided", n: "5", title: "Guided three-phone demo", body: "The elder's phone, the family's phone and the bank's fraud desk, side by side." },
];

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
    <main className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-6 pt-6 pb-12 text-ink">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-[16px] text-ink-soft underline underline-offset-4">
          Home
        </Link>
        <Guardian mood="safe" className="size-14" />
      </div>
      <h1 className="display mt-6 text-[56px] leading-[1.02] sm:text-[80px]">Ruko demo</h1>
      <p className="mt-3 max-w-xl text-[21px] text-ink-soft">Pick a scene. Everything here is a role-play with a practice bank: no real call is made and no real money moves.</p>

      <div className="mt-8 flex flex-col">
        {SCENES.map((s) => (
          <Link key={s.href} href={s.href} className="group flex min-h-[96px] items-center justify-between gap-4 border-b border-hair py-5">
            <span className="flex items-start gap-5">
              <span className="display text-[44px] leading-none text-ink-soft">{s.n}</span>
              <span>
                <span className="display block text-[32px] leading-tight sm:text-[40px]">{s.title}</span>
                <span className="mt-1 block max-w-xl text-[19px] text-ink-soft">{s.body}</span>
              </span>
            </span>
            <ArrowRight className="size-7 shrink-0 transition group-hover:translate-x-1" strokeWidth={1.6} />
          </Link>
        ))}
      </div>

      <section className="mt-10 rounded-[18px] border border-hair p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[22px] font-semibold">Offline mode</p>
            <p className="text-[18px] text-ink-soft">
              {offline
                ? "On: scenes use scripts and recorded lines only. No AI, no lookups. Use this if the Wi-Fi is bad."
                : "Off: scenes may use AI to word replies, and fall back to scripts if it is slow."}
            </p>
          </div>
          <button
            onClick={toggle}
            role="switch"
            aria-checked={offline}
            aria-label="Offline mode"
            className={`relative h-12 w-24 shrink-0 rounded-full border border-hair transition ${offline ? "bg-ink" : "bg-paper-2"}`}
          >
            <span className={`absolute top-1 size-10 rounded-full bg-white shadow-soft transition-all ${offline ? "left-[3.2rem]" : "left-1"}`} />
            <span className="sr-only">{offline ? "On" : "Off"}</span>
          </button>
        </div>
        <p className="mt-3 text-[16px] text-ink-soft">Running the laptop version (npm run demo:offline) is also fully offline, including the family phone and the bank.</p>
      </section>

      <section className="mt-4 flex items-center justify-between gap-4 rounded-[18px] border border-hair p-5">
        <div>
          <p className="text-[22px] font-semibold">Reset the demo</p>
          <p className="text-[18px] text-ink-soft">Clears held payments, alerts and the lock, so the next run starts clean.</p>
        </div>
        <button onClick={resetDemo} disabled={reset === "busy"} className="min-h-[64px] shrink-0 rounded-[18px] border border-ink px-6 text-[19px] font-semibold disabled:opacity-40">
          {reset === "busy" ? "Resetting…" : reset === "done" ? "Reset ✓" : reset === "fail" ? "Could not reset" : "Reset"}
        </button>
      </section>

      <p className="mt-8 text-[15px] text-ink-soft">Demo data is labelled. No field-trial results exist yet; nothing on these screens is a measured outcome.</p>
    </main>
  );
}
