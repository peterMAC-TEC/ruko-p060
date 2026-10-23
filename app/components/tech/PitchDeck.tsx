"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import results from "@/data/eval-results.json";

// /pitch: seven full-screen slides for the projector. Arrow keys, space, or the buttons. Every number is sourced or measured.

const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;

function Slide({ kicker, children }: { kicker: string; children: React.ReactNode }) {
  return (
    <div className="m-route flex h-full flex-col justify-center">
      <p className="font-mono text-[16px] tracking-[0.18em] text-[#38e1ff] uppercase">{kicker}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

const SLIDES: React.ReactNode[] = [
  <Slide key="1" kicker="Cyber fraud in India">
    <p className="text-[clamp(64px,13vw,190px)] leading-[0.9] font-bold tracking-tight">
      ₹7,200 <span className="text-white/60">every second</span>
    </p>
    <p className="mt-6 max-w-4xl text-[clamp(20px,2.4vw,30px)] text-white/80">
      ₹22,845 crore lost in 2024. Digital-arrest cases doubled in a year: 60,676 → 1,23,672.
    </p>
    <p className="mt-4 text-[16px] text-white/45">Average per second from the 2024 reported total (MHA, via Scroll). Case numbers: government reply in Parliament (via Outlook Money, Inc42).</p>
  </Slide>,
  <Slide key="2" kicker="Why it is hard">
    <p className="text-[clamp(44px,7vw,100px)] leading-[1] font-bold tracking-tight">Authority. Secrecy. A deadline.</p>
    <p className="mt-8 max-w-4xl text-[clamp(24px,3vw,40px)] leading-snug text-white/85">
      They are not foolish. They are scared. And <span className="text-[#FFB000]">a perfect voice is no proof of identity.</span>
    </p>
    <p className="mt-6 text-[clamp(20px,2.2vw,28px)] text-white/70">So Ruko does not try to win the argument. It protects the moment the money moves.</p>
  </Slide>,
  <Slide key="3" kicker="Three layers">
    <div className="grid gap-5 sm:grid-cols-3">
      {[
        ["Before the call", "The family sets Ruko up: code word, trusted people, a Rule Card."],
        ["During the call", "Pressure, secrecy, a made-up case: a big STOP, and the family is told."],
        ["At the money", "The payment waits. Approving it needs the family's code word."],
      ].map(([t, d]) => (
        <div key={t} className="rounded-[24px] border border-white/15 bg-white/[0.05] p-7">
          <h3 className="text-[clamp(26px,2.6vw,38px)] font-bold">{t}</h3>
          <p className="mt-3 text-[clamp(18px,1.8vw,24px)] leading-snug text-white/75">{d}</p>
        </div>
      ))}
    </div>
  </Slide>,
  <Slide key="4" kicker="Live demo">
    <p className="text-[clamp(52px,9vw,130px)] leading-[0.95] font-bold tracking-tight">Take the call.</p>
    <p className="mt-6 text-[clamp(22px,2.6vw,34px)] text-white/80">You are 72. A fake officer rings. Resist him.</p>
    <Link href="/demo/live" className="mt-10 inline-flex min-h-[84px] items-center rounded-[20px] bg-[#38e1ff] px-10 text-[30px] font-semibold text-[#041016]">
      Take a live scam call →
    </Link>
    <p className="mt-4 font-mono text-[16px] text-white/45">or press 2 · press X during the call for X-Ray</p>
  </Slide>,
  <Slide key="5" kicker="AI logic and architecture">
    <p className="text-[clamp(44px,7vw,100px)] leading-[1] font-bold tracking-tight">
      AI reads and words. <span className="text-[#FFB000]">Code decides.</span>
    </p>
    <div className="mt-10 grid gap-3 sm:grid-cols-5">
      {[
        ["Frontend", "voice, typing"],
        ["Backend", "state machine, threat engine, rules"],
        ["Services", "AI classify (with confidence), database, voices"],
        ["Backend", "zod, guard, fallbacks"],
        ["Frontend", "STOP, captions, family, payment pause"],
      ].map(([t, d], i) => (
        <div key={i} className="rounded-[18px] border border-[#5b9dff]/50 bg-[#0b2a52]/60 p-4">
          <p className="font-mono text-[14px] text-[#5b9dff]">{i + 1}</p>
          <p className="text-[22px] font-bold">{t}</p>
          <p className="mt-1 text-[16px] leading-snug text-white/70">{d}</p>
        </div>
      ))}
    </div>
    <p className="mt-6 text-[clamp(18px,2vw,26px)] text-white/70">Predictable. Testable. Explainable. Works offline.</p>
  </Slide>,
  <Slide key="6" kicker="Measured (synthetic data, npm run eval)">
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {[
        [`${results.guard.rejected}/${results.guard.total}`, "unsafe AI outputs blocked"],
        [pct(results.scamCheck.stop.falseAlarm), "false STOPs on genuine calls"],
        [pct(results.reading.accuracy.hybrid), "replies read correctly (hybrid)"],
        [`${results.simulatedCalls.unsafe}`, `unsafe lines in ${results.simulatedCalls.calls} simulated calls`],
      ].map(([b, s]) => (
        <div key={s} className="rounded-[22px] border border-white/15 bg-white/[0.05] p-6">
          <p className="font-mono text-[clamp(44px,5vw,72px)] leading-none font-bold text-[#FFB000]">{b}</p>
          <p className="mt-3 text-[clamp(17px,1.6vw,22px)] leading-snug text-white/80">{s}</p>
        </div>
      ))}
    </div>
    <p className="mt-6 text-[18px] text-white/55">Code steps take microseconds; the AI about 2 seconds, so the STOP never waits for it. Synthetic data, written by us: not field results.</p>
  </Slide>,
  <Slide key="7" kicker="Next">
    <ul className="flex flex-col gap-4 text-[clamp(24px,2.8vw,38px)] leading-snug">
      <li>1. Field test with 10 older adults (protocol ready).</li>
      <li>2. A pilot bank calling the Ruko Guard API.</li>
      <li>3. Android call screening on real phones.</li>
    </ul>
    <p className="mt-12 max-w-5xl text-[clamp(24px,3vw,40px)] leading-snug font-semibold">
      Either way, the money didn&rsquo;t move. Ruko doesn&rsquo;t try to win the argument with a scammer. <span className="text-[#38e1ff]">It protects the moment that matters.</span>
    </p>
  </Slide>,
];

export function PitchDeck() {
  const [i, setI] = useState(0);
  const go = useCallback((d: number) => setI((n) => Math.max(0, Math.min(SLIDES.length - 1, n + d))), []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") go(-1);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [go]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#060a10] px-[6vw] py-[5vh] text-white">
      <div key={i} className="min-h-0 flex-1">
        {SLIDES[i]}
      </div>
      <div className="flex items-center justify-between gap-4">
        <button onClick={() => go(-1)} disabled={i === 0} className="min-h-12 rounded-full border border-white/25 px-5 text-[16px] disabled:opacity-30">
          ← Back
        </button>
        <div className="flex gap-2" aria-label={`Slide ${i + 1} of ${SLIDES.length}`}>
          {SLIDES.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Slide ${k + 1}`} className={`h-2.5 rounded-full transition-all ${k === i ? "w-8 bg-[#38e1ff]" : "w-2.5 bg-white/30"}`} />
          ))}
        </div>
        <button onClick={() => go(1)} disabled={i === SLIDES.length - 1} className="min-h-12 rounded-full border border-white/25 px-5 text-[16px] disabled:opacity-30">
          Next →
        </button>
      </div>
    </div>
  );
}
