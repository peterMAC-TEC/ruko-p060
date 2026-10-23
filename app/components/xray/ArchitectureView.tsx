"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SAMPLE_TRACE, XRAY_KEY, type TurnTrace } from "@/lib/xray";
import { XRayView } from "./XRayPanel";

// /architecture: the judges' five boxes filled with Ruko's real parts, then the live trace of the last call on this device.

const AI = "#5b9dff";

const BOX_PARTS: { title: string; sub: string; parts: { t: string; d: string; ai?: boolean; file: string }[] }[] = [
  {
    title: "Frontend",
    sub: "user input",
    parts: [
      { t: "PWA screens", d: "Live call, check, family phone, bank, fraud desk. Installable, works offline.", file: "app/*, components/*" },
      { t: "Speech in", d: "Browser speech recognition, mic level, typed fallback.", file: "components/demo/LiveCall.tsx" },
      { t: "Share target", d: "Share a message or screenshot into Ruko from any app.", file: "app/share" },
    ],
  },
  {
    title: "Backend",
    sub: "application logic",
    parts: [
      { t: "Call state machine", d: "7 stages, persuasion ladder, always reaches the money ask in about 90 s.", file: "lib/demo-officer.ts" },
      { t: "Objection reader", d: "Rules for doubt, family, no money, anger, fear, leave, bot, writing.", file: "lib/officer-brain.ts" },
      { t: "Threat engine", d: "17 tactics, log-odds fusion with decay and stage bonus.", file: "lib/threat.ts" },
      { t: "Scam check (radar)", d: "Pattern library, says STOP. The same code behind the STOP screen.", file: "lib/radar.ts" },
      { t: "Money Lock and rules", d: "Payment rules, cooling-off, trusted-person approval, code word.", file: "lib/rules.ts, lib/payments.ts" },
      { t: "Ruko Guard API", d: "allow / delay / trusted person / block, for banks.", file: "lib/guard-assess.ts" },
    ],
  },
  {
    title: "Services",
    sub: "AI · database · tools",
    parts: [
      { t: "AI: classify", d: "Reads what an unusual reply means, with a confidence score.", ai: true, file: "api/demo/officer (mode classify)" },
      { t: "AI: extract", d: "Warning signs from a photo or 'what they said', with evidence.", ai: true, file: "lib/ai/scam.ts" },
      { t: "AI: generate", d: "The Companion's calm words; optional caller wording.", ai: true, file: "lib/ai/companion.ts" },
      { t: "Model chain", d: "Free model first, one cheap fallback; any provider via one env var.", ai: true, file: "lib/ai/openrouter.ts" },
      { t: "Database", d: "Supabase (Mumbai), row-level security, signal codes and salted hashes, hash-chained evidence log.", file: "supabase/migrations, lib/integrity.ts" },
      { t: "Tools", d: "Recorded voices, number risk, WhatsApp link, family alerts.", file: "public/live-audio, lib/numberRisk.ts" },
    ],
  },
  {
    title: "Backend",
    sub: "prepares the result",
    parts: [
      { t: "zod validation", d: "AI output must match a strict schema, or it is retried once, then dropped.", file: "lib/ai/index.ts" },
      { t: "Confidence threshold", d: "Below 0.6 the AI reading is ignored and the rules stand.", file: "components/demo/LiveCall.tsx" },
      { t: "Guard filter", d: "No OTP, PIN, card, Aadhaar, real agency, long numbers, violence or abuse.", file: "lib/bots/guard.ts, lib/officer-brain.ts" },
      { t: "Fallbacks", d: "Timeout, failure or offline: the rule-only path, with no glitch.", file: "lib/officer-brain.ts" },
      { t: "Plain words", d: "Codes turned into short sentences for elders and families.", file: "lib/signs.ts, lib/tactic-explain.ts" },
    ],
  },
  {
    title: "Frontend",
    sub: "displays the output",
    parts: [
      { t: "STOP", d: "Full red takeover, 1930 and cybercrime.gov.in, two choices.", file: "LiveCall.tsx" },
      { t: "Captions and chips", d: "Word by word, tactics spotted, pressure meter, the caller's face.", file: "components/motion/*" },
      { t: "Family alert", d: "Who, what, what to say. Approve needs the code word.", file: "components/family" },
      { t: "Payment pause", d: "The mock bank holds the money until the family decides.", file: "components/bank" },
    ],
  },
];

export function ArchitectureView() {
  const [traces, setTraces] = useState<TurnTrace[] | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(XRAY_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTraces(raw ? (JSON.parse(raw) as TurnTrace[]) : null);
    } catch {
      setTraces(null);
    }
  }, []);
  const own = traces && traces.length > 0;
  const shown = own ? traces : SAMPLE_TRACE;
  return (
    <div className="flex flex-col gap-14">
      <section>
        <div className="grid gap-3 lg:grid-cols-5">
          {BOX_PARTS.map((b, i) => (
            <div key={i} className="relative rounded-[18px] border border-[#5b9dff]/40 bg-[#0b2a52]/50 p-4">
              <p className="font-mono text-[12px] text-[#5b9dff]">{i + 1}</p>
              <h2 className="text-[21px] leading-tight font-bold text-white">{b.title}</h2>
              <p className="text-[13px] text-white/55">{b.sub}</p>
              <ul className="mt-3 flex flex-col gap-3">
                {b.parts.map((p) => (
                  <li key={p.t} className="border-l-2 pl-3" style={{ borderColor: p.ai ? AI : "rgba(232,238,252,0.6)" }}>
                    <p className="text-[15px] font-semibold" style={{ color: p.ai ? "#9cc2ff" : "#ffffff" }}>
                      {p.t}
                      {p.ai && <span className="ml-2 rounded-full border border-[#5b9dff]/60 px-1.5 font-mono text-[10px] tracking-wide text-[#9cc2ff] uppercase">AI</span>}
                    </p>
                    <p className="text-[14px] leading-snug text-white/70">{p.d}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-white/40">{p.file}</p>
                  </li>
                ))}
              </ul>
              {i < 4 && (
                <span aria-hidden className="absolute top-1/2 -right-3 z-10 hidden size-5 -translate-y-1/2 place-items-center rounded-full bg-[#FFB000] text-[12px] font-bold text-[#061529] lg:grid">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-4">
        {[
          ["Predictable", "The same input always gives the same decision. A scammer cannot talk the code out of its rules."],
          ["Testable", "Every rule has checks (19 test suites, 30+ simulated calls each run), and the eval measures them."],
          ["Explainable", "Every STOP names the tactics behind it. A bank or regulator can audit why."],
          ["Works offline", "With no Wi-Fi or no AI, the rule-only path runs the whole demo."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
            <h3 className="text-[19px] font-bold text-[#FFB000]">{t}</h3>
            <p className="mt-1 text-[15px] leading-snug text-white/75">{d}</p>
          </div>
        ))}
      </section>

      <section style={{ containerType: "inline-size" }}>
        <p className="font-mono text-[13px] tracking-[0.14em] text-[#5b9dff] uppercase">Live trace</p>
        <h2 className="mt-1 text-[30px] font-bold sm:text-[40px]">{own ? "Your last call, turn by turn" : "One turn, step by step"}</h2>
        <p className="mt-2 max-w-2xl text-[17px] text-white/70">Codes and timings only. The words are never stored. During a call, press X (or tap X-Ray) to flip the call screen into this view.</p>
        <div className="mt-5">
          <XRayView trace={shown[shown.length - 1]} history={shown} sample={!own} />
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/demo/live" className="flex min-h-[64px] items-center rounded-[16px] bg-[#38e1ff] px-7 text-[19px] font-semibold text-[#041016]">
          Take the live call, then press X
        </Link>
        <Link href="/eval" className="flex min-h-[64px] items-center rounded-[16px] border border-white/30 px-7 text-[19px] font-semibold">
          See the measured numbers
        </Link>
      </div>
    </div>
  );
}
