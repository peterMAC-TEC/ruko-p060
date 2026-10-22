"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { assessGuard, RBI_DRAFT, RUKO_OWN, type AgeBand, type GuardDecision } from "@/lib/guard-assess";
import { Chip } from "./TechBackdrop";

// "Under the hood": what happens behind the screens, for a judge who asks how it really works. The Guard box at the
// bottom runs the real decision function (the same one the bank API and the mock bank call), live in the page.

const FLOW = [
  { t: "Input", d: "Your voice (browser speech) or typing. Digits are stripped before anything leaves the page.", k: "code", f: "LiveCall.tsx" },
  { t: "Read", d: "Rules read what you meant: doubt, 'I'll call my son', no money, anger, fear, 'are you a bot?'.", k: "code", f: "officer-brain.ts" },
  { t: "Decide", d: "A 7-stage state machine picks the next move and always reaches the payment ask in about 90 s.", k: "code", f: "demo-officer.ts" },
  { t: "Word", d: "A recorded voice line plays. Optionally an AI rewords it, and a guard throws out anything unsafe.", k: "ai", f: "api/demo/officer" },
  { t: "Judge", d: "Ruko's own scam check says STOP when the payment ask lands. Not the AI.", k: "code", f: "radar.ts · threat.ts" },
  { t: "Act", d: "Family alert with signal codes only. Money Lock holds a payment. Code word needed to approve.", k: "code", f: "payments.ts · code-word.ts" },
  { t: "Report", d: "Bank asks Ruko Guard before moving money: allow, delay, trusted person, or block.", k: "code", f: "guard-assess.ts" },
];

const RAILS = [
  ["Consent first", "A screen before every call. Nothing is recorded; the words live in memory during the call only."],
  ["Say RUKO to stop", "The stop word or the red button ends the call at once, at any point."],
  ["Nothing real", "No real OTP, card, Aadhaar, PIN, officer, agency or phone number is ever asked for or spoken."],
  ["Signals, not words", "Only codes are kept: tactics used, objections, furthest step, stopped or not."],
  ["Works offline", "Scripts and recorded voices need no AI and no Wi-Fi. AI is an optional extra."],
  ["Honest labels", "Demo data is labelled. No field-trial results exist yet."],
];

const DECISION_STYLE: Record<GuardDecision, { label: string; cls: string }> = {
  allow: { label: "ALLOW", cls: "text-[#4ade80] border-[#4ade80]/40 bg-[#4ade80]/10" },
  delay: { label: "DELAY", cls: "text-[#fbbf24] border-[#fbbf24]/40 bg-[#fbbf24]/10" },
  require_trusted_person: { label: "ASK TRUSTED PERSON", cls: "text-[#38e1ff] border-[#38e1ff]/40 bg-[#38e1ff]/10" },
  block: { label: "BLOCK", cls: "text-[#ff6b5c] border-[#ff4d3d]/50 bg-[#ff4d3d]/10" },
};

export function UnderTheHood() {
  const [age, setAge] = useState<AgeBand>("70_plus");
  const [amount, setAmount] = useState(50000);
  const [newPayee, setNewPayee] = useState(true);
  const [flag, setFlag] = useState(true);
  const [trusted, setTrusted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reports, setReports] = useState(0);
  const result = useMemo(
    () => assessGuard({ customerAgeBand: age, amountInr: amount, newPayee, rukoFlag: flag, hasTrustedPerson: trusted, paymentsPaused: paused, payeeRisk: { reports } }),
    [age, amount, newPayee, flag, trusted, paused, reports],
  );
  const d = DECISION_STYLE[result.decision];
  const toggle = "min-h-12 rounded-full border px-4 text-[16px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38e1ff]";
  const on = "border-[#38e1ff] bg-[#38e1ff]/15 text-[#38e1ff]";
  const off = "border-white/15 text-white/70 hover:border-white/40";
  return (
    <div className="flex flex-col gap-14">
      <section>
        <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">1 · The path of one live call</p>
        <h2 className="mt-1 text-[30px] font-bold tracking-tight sm:text-[40px]">Code decides. AI only words.</h2>
        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FLOW.map((s, i) => (
            <li key={s.t} className="relative rounded-[18px] border border-white/10 bg-white/[0.035] p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[13px] text-white/45">{String(i + 1).padStart(2, "0")}</span>
                <Chip tone={s.k === "ai" ? "cyan" : "green"}>{s.k === "ai" ? "AI (optional)" : "Code"}</Chip>
              </div>
              <h3 className="mt-2 text-[22px] font-semibold">{s.t}</h3>
              <p className="mt-1 text-[16px] leading-snug text-white/65">{s.d}</p>
              <p className="mt-3 font-mono text-[12px] text-[#38e1ff]/80">{s.f}</p>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">2 · Ruko Guard: the bank-side stop</p>
        <h2 className="mt-1 text-[30px] font-bold tracking-tight sm:text-[40px]">Change the payment. Watch the decision.</h2>
        <p className="mt-2 max-w-2xl text-[18px] text-white/65">
          This is the real decision function a bank would call before it moves money (<span className="font-mono text-[15px]">POST /api/guard/assess</span>), running here in your browser. No names, no accounts: just these facts.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-[20px] border border-white/10 bg-white/[0.035] p-5">
            <label className="block text-[16px] text-white/70" htmlFor="amt">
              Amount: <span className="font-mono text-[20px] font-semibold text-white">₹{amount.toLocaleString("en-IN")}</span>
            </label>
            <input id="amt" type="range" min={1000} max={200000} step={1000} value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-2 h-10 w-full accent-[#38e1ff]" />
            <p className="mt-4 text-[16px] text-white/70">Customer age</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {([["under_60", "Under 60"], ["60_69", "60 to 69"], ["70_plus", "70 and over"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => setAge(v)} aria-pressed={age === v} className={`${toggle} ${age === v ? on : off}`}>
                  {l}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                ["New payee", newPayee, setNewPayee],
                ["Ruko flagged a scam call", flag, setFlag],
                ["Trusted person set up", trusted, setTrusted],
                ["Kill switch on", paused, setPaused],
              ].map(([l, v, set]) => (
                <button key={l as string} onClick={() => (set as (b: boolean) => void)(!v)} aria-pressed={v as boolean} className={`${toggle} ${v ? on : off}`}>
                  {l as string}
                </button>
              ))}
            </div>
            <p className="mt-4 text-[16px] text-white/70">Destination reported by other customers</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {[0, 1, 3].map((n) => (
                <button key={n} onClick={() => setReports(n)} aria-pressed={reports === n} className={`${toggle} ${reports === n ? on : off}`}>
                  {n === 0 ? "No reports" : `${n} report${n > 1 ? "s" : ""}`}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-[#0a1118] p-5" aria-live="polite">
            <p className="font-mono text-[12px] tracking-[0.14em] text-white/45 uppercase">Decision</p>
            <p className={`mt-2 inline-block rounded-[12px] border px-4 py-2 font-mono text-[22px] font-bold tracking-wide ${d.cls}`}>{d.label}</p>
            {result.delaySeconds ? <p className="mt-2 font-mono text-[14px] text-white/60">cooling-off: {Math.round(result.delaySeconds / 60)} min, cancellable</p> : null}
            <ul className="mt-4 flex flex-col gap-3">
              {result.reasons.length === 0 && <li className="text-[16px] text-white/60">No rule fired.</li>}
              {result.reasons.map((r) => (
                <li key={r.code} className="border-l-2 border-[#38e1ff]/50 pl-3">
                  <p className="font-mono text-[12px] text-[#38e1ff]/80">
                    {r.code} · {r.basis === "rbi_draft" ? "RBI draft (not final)" : r.basis === "ruko_own" ? "Ruko's own rule" : "customer's choice"}
                  </p>
                  <p className="text-[16px] leading-snug text-white/80">{r.label}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-[14px] text-white/45">
          Thresholds come from the RBI discussion paper (reported Apr 2026), which is a draft; each is a constant a bank can change (delay above ₹{RBI_DRAFT.delayAboveInr.toLocaleString("en-IN")}; flagged call from ₹{RUKO_OWN.flagMinInr.toLocaleString("en-IN")}). No real bank is connected.
        </p>
      </section>

      <section>
        <p className="font-mono text-[13px] tracking-[0.14em] text-[#38e1ff] uppercase">3 · Safety rails</p>
        <h2 className="mt-1 text-[30px] font-bold tracking-tight sm:text-[40px]">What can never happen</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RAILS.map(([t, b]) => (
            <li key={t} className="rounded-[18px] border border-white/10 bg-white/[0.035] p-4">
              <h3 className="text-[19px] font-semibold">{t}</h3>
              <p className="mt-1 text-[16px] leading-snug text-white/65">{b}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-[20px] border border-white/10 bg-white/[0.035] p-6">
        <p className="font-mono text-[13px] tracking-[0.14em] text-[#fbbf24] uppercase">Honest limits</p>
        <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[17px] leading-snug text-white/75">
          <li>The call is simulated in the page. A web app cannot ring a real phone or hear real calls.</li>
          <li>The bank is a practice bank. Stopping a real payment needs a bank to call Ruko Guard.</li>
          <li>The recorded voices are very good but not a human. The browser's speech recogniser may mishear accents.</li>
          <li>No field trial has been run yet, so there are no measured outcomes.</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/demo/live" className="flex min-h-[64px] items-center gap-3 rounded-[16px] bg-[#38e1ff] px-7 text-[20px] font-semibold text-[#041016]">
          Take the live call <ArrowRight className="size-5" />
        </Link>
        <Link href="/console" className="flex min-h-[64px] items-center rounded-[16px] border border-white/20 px-7 text-[20px] font-semibold">
          Open the fraud desk
        </Link>
      </div>
    </div>
  );
}
