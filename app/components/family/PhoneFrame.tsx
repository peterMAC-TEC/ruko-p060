"use client";

import { useEffect, useState } from "react";
import { Chip, TechBackdrop } from "@/components/tech/TechBackdrop";

// The family phone, shown as a phone on the control-room stage (only on /family itself; inside the live call and the
// guided demo the app is shown bare). The frame is decoration; everything inside is the real app.

export function PhoneFrame({ children, owner = "Priya" }: { children: React.ReactNode; owner?: string }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }));
    tick();
    const id = setInterval(tick, 15_000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#060a10] text-white">
      <TechBackdrop />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto]">
        <div className="max-w-xl">
          <div className="flex flex-wrap gap-2">
            <Chip tone="cyan">Family phone</Chip>
            <Chip tone="grey">Demo: {owner}&rsquo;s phone</Chip>
          </div>
          <h1 className="mt-5 text-[40px] leading-[1.04] font-bold tracking-tight sm:text-[60px]">
            The family hears <span className="text-[#38e1ff]">first.</span>
          </h1>
          <p className="mt-4 text-[19px] leading-relaxed text-white/70">
            When Ruko thinks Mum or Dad may be on a scam call, {owner}&rsquo;s phone gets one clear alert with a button to call them, and what to say. A held payment waits here, and approving it needs the family code word.
          </p>
          <ul className="mt-6 grid gap-2 text-[16px] text-white/75">
            {["Alert in plain words, with sound and vibration", "Call or WhatsApp in one tap, and a calm script", "Approve or refuse a held payment (code word needed)", "Pause all payments in one switch"].map((t) => (
              <li key={t} className="flex gap-2">
                <span className="text-[#38e1ff]" aria-hidden>
                  ›
                </span>
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[14px] text-white/45">Tip: start the live call (press 2) and choose &ldquo;I still want to pay&rdquo;. The request arrives here.</p>
        </div>

        <div className="mx-auto w-full max-w-[400px]">
          <div className="rounded-[52px] border border-white/15 bg-[#11161d] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.6),0_0_60px_rgba(56,225,255,0.10)]">
            <div className="relative overflow-hidden rounded-[42px] bg-[#f4f6f8]">
              {/* status bar */}
              <div className="flex items-center justify-between px-7 pt-3 pb-1 font-mono text-[13px] font-semibold text-[#14122B]">
                <span className="tabular">{time}</span>
                <span className="mx-auto h-6 w-24 rounded-full bg-[#11161d]" aria-hidden />
                <span aria-hidden>5G ▮▮▮</span>
              </div>
              <div className="max-h-[720px] min-h-[640px] overflow-y-auto">{children}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
