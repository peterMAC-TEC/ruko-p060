"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CallerFace } from "@/components/character/CallerFace";
import { CountUp, Marquee, Reveal, Sticker, useMotionOk } from "@/components/motion/motion";
import { FACTS } from "@/components/ProblemFacts";
import type { CallerExpression } from "@/lib/caller-expression";

// Sections of the home page that move: the animated fake officer, the facts strip, "how Ruko saves you" and the proof points.

const LINES: { text: string; face: CallerExpression }[] = [
  { text: "Good afternoon. A parcel in your name has drugs in it.", face: "friendly" },
  { text: "I believe you. That is why I am calling you myself.", face: "sympathetic" },
  { text: "Do not tell your family. This is confidential.", face: "stern" },
  { text: "You have ten minutes. Transfer the money now.", face: "urgent" },
];

/** The scam caller, as a small teaching character: it talks, changes face with each tactic, and is labelled as role-play. */
export function HeroCaller() {
  const ok = useMotionOk();
  const [i, setI] = useState(0);
  const [talking, setTalking] = useState(false);
  useEffect(() => {
    if (!ok) return;
    let alive = true;
    const loop = async () => {
      while (alive) {
        setTalking(true);
        await new Promise((r) => setTimeout(r, 2600));
        setTalking(false);
        await new Promise((r) => setTimeout(r, 900));
        if (!alive) return;
        setI((n) => (n + 1) % LINES.length);
      }
    };
    void loop();
    return () => {
      alive = false;
    };
  }, [ok]);
  const cur = LINES[ok ? i : 2];
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      <div className="absolute -top-3 -left-3 z-10">
        <Sticker tilt={-6} className="bg-[#060a10] text-[#38e1ff]">
          Role-play
        </Sticker>
      </div>
      <div className="absolute -top-3 -right-3 z-10">
        <Sticker tilt={4} delay={250} className="bg-[#060a10] text-[#ff8a7d]">
          Scam caller
        </Sticker>
      </div>
      <div className="overflow-hidden rounded-[28px] border border-white/15 shadow-[0_0_60px_rgba(56,225,255,0.15)]">
        <CallerFace phase="face" expression={cur.face} speaking={talking} size={300} className="block w-full" />
      </div>
      <p className="mt-3 min-h-[3.2rem] rounded-[16px] bg-white/[0.06] px-4 py-2.5 text-[16px] leading-snug text-white/85" aria-hidden>
        &ldquo;{cur.text}&rdquo;
      </p>
      <p className="sr-only">An animated cartoon of a fake police-style officer, labelled as a role-play scam caller.</p>
      <p className="mt-2 text-center font-mono text-[12px] tracking-[0.12em] text-white/50 uppercase">Scam caller (role-play)</p>
    </div>
  );
}

export function FactsStrip() {
  const items = FACTS.map((f) => `${f.big} ${f.text.replace(/\.$/, "")}`);
  return (
    <div className="mt-10 rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-3 text-[17px] text-white/80" aria-label="Published facts about these scams">
      <Marquee items={items} />
    </div>
  );
}

const SAVES = [
  { when: "Before", title: "Family sets it up", body: "A code word, trusted people and a test alert, in about five minutes.", href: "/setup", tag: "Setup" },
  { when: "During the call", title: "Ruko warns", body: "Pressure, secrecy and a made-up case are spotted and a big STOP appears.", href: "/demo/live", tag: "Call warnings" },
  { when: "Straight after", title: "Family hears first", body: "Someone you trust is told in plain words, with what to say.", href: "/family", tag: "Family alert" },
  { when: "At the money", title: "The payment waits", body: "A risky payment pauses and needs the family's code word before it moves.", href: "/bank", tag: "Money Lock" },
];

export function HowSaves() {
  return (
    <section aria-labelledby="saves-h">
      <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">How Ruko saves you</p>
      <h2 id="saves-h" className="mt-1 text-[30px] font-bold tracking-tight sm:text-[40px]">Four layers, before the money moves</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SAVES.map((s, i) => (
          <Reveal key={s.title} delay={i * 80}>
            <div className="h-full">
              <Link href={s.href} className="m-tap group flex h-full flex-col rounded-[20px] border border-white/10 bg-white/[0.035] p-5 transition hover:border-[#38e1ff]/50">
                <span className="font-mono text-[12px] tracking-[0.12em] text-white/50 uppercase">{s.when}</span>
                <span className="mt-1 text-[22px] leading-tight font-semibold text-white">{s.title}</span>
                <span className="mt-2 text-[16px] leading-snug text-white/65">{s.body}</span>
                <span className="mt-auto pt-4 font-mono text-[12px] tracking-wide text-[#38e1ff] uppercase">{s.tag} →</span>
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const COUNTS: Record<string, { prefix?: string; to: number; suffix?: string }> = {
  "1,03,488 complaints": { to: 103488, suffix: " complaints" },
  "47%": { to: 47, suffix: "%" },
};

export function ProofPoints() {
  const shown = FACTS.filter((f) => f.big !== "60,676 → 1,23,672");
  return (
    <section aria-labelledby="proof-h">
      <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">Why it matters</p>
      <h2 id="proof-h" className="mt-1 text-[30px] font-bold tracking-tight sm:text-[40px]">Published figures, with their sources</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {shown.slice(0, 3).map((f) => (
          <Reveal key={f.big}>
            <dl className="h-full rounded-[20px] border border-white/10 bg-white/[0.035] p-5">
              <dt className="text-[34px] leading-none font-bold tracking-tight text-white">{COUNTS[f.big] ? <CountUp to={COUNTS[f.big].to} prefix={COUNTS[f.big].prefix} suffix={COUNTS[f.big].suffix} /> : f.big}</dt>
              <dd className="mt-3 text-[16px] leading-snug text-white/75">{f.text}</dd>
              <dd className="mt-2 text-[13px] text-white/50">
                Source:{" "}
                <a href={f.href} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                  {f.source}
                </a>
              </dd>
            </dl>
          </Reveal>
        ))}
      </div>
      <p className="mt-3 text-[14px] text-white/45">Not Ruko&rsquo;s results. No field-trial results exist yet.</p>
    </section>
  );
}

/** ₹ lost since the page opened, at the average rate from the 2025 reported total (₹19,813 crore a year). Not live data. */
const PER_SECOND = 19813e7 / (365 * 24 * 3600);
export function LossTicker() {
  const ok = useMotionOk();
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!ok) return;
    const t0 = performance.now();
    const id = setInterval(() => setSecs((performance.now() - t0) / 1000), 100);
    return () => clearInterval(id);
  }, [ok]);
  return (
    <div className="mt-6 rounded-[18px] border border-white/10 bg-white/[0.03] px-5 py-4">
      {ok ? (
        <p className="text-[17px] text-white/75">
          Since you opened this page, Indians have lost about{" "}
          <span className="font-mono text-[26px] font-bold text-[#FFB000] tabular">₹{Math.round(secs * PER_SECOND).toLocaleString("en-IN")}</span> to cyber fraud.
        </p>
      ) : (
        <p className="text-[17px] text-white/75">
          Indians lose about <span className="font-mono text-[26px] font-bold text-[#FFB000]">₹6,300 every second</span> to cyber fraud.
        </p>
      )}
      <p className="mt-1 text-[13px] text-white/45">An average from the 2025 reported total of ₹19,813 crore (I4C/NCRP data, via The420.in, Jan 2026). Not live data.</p>
    </div>
  );
}
