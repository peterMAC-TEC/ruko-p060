"use client";

import { useEffect } from "react";
import { useMotionOk } from "@/components/motion/motion";
import { BOXES, type TurnTrace } from "@/lib/xray";

// X-Ray: the call screen's blueprint. Each turn travels through the judges' five boxes; every row is a real value
// measured in this call (codes and timings, never words). Blue = AI, white = code, marigold = a decision.

const AI = "#5b9dff";
const DECIDE = "#FFB000";

const ms = (n: number) => (n < 1 ? "<1 ms" : `${Math.round(n)} ms`);
const pct = (p: number) => `${(p * 100).toFixed(p > 0.99 ? 1 : 0)}%`;

const AI_MODE: Record<string, string> = {
  classified: "AI classified the reply",
  low_confidence: "AI unsure (below 0.6): ignored, rules stand",
  skipped_rules_knew: "Not needed: the rules already knew",
  skipped_short: "Not needed: too short to be unclear",
  off: "AI reading switched off",
  offline: "Offline: rule-only mode",
  timeout: "AI too slow (3.2 s): rules stand",
  failed: "AI failed: rules stand",
};

function Row({ label, value, tone = "code", t }: { label: string; value: React.ReactNode; tone?: "code" | "ai" | "decide"; t?: number }) {
  const c = tone === "ai" ? AI : tone === "decide" ? DECIDE : "#e8eefc";
  return (
    <div className="border-l-2 pl-3" style={{ borderColor: c }}>
      <p className="font-mono text-[11px] tracking-[0.12em] uppercase" style={{ color: c }}>
        {label}
        {t !== undefined && <span className="ml-2 text-white/40 normal-case">{ms(t)}</span>}
      </p>
      <div className="text-[15px] leading-snug text-white/90">{value}</div>
    </div>
  );
}

export function XRayView({ trace, history, sample = false }: { trace: TurnTrace | null; history: TurnTrace[]; sample?: boolean }) {
  const ok = useMotionOk();
  if (!trace) {
    return <p className="text-[17px] text-white/70">No turn yet. Answer the call and say something, then open X-Ray again.</p>;
  }
  const t = trace;
  const cols: React.ReactNode[] = [
    <>
      <Row label="Presenter's turn" value={t.input.via === "silence" ? "Silence" : `${t.input.via === "voice" ? "Spoken" : "Typed"}, ${t.input.words} words`} />
      <Row label="Speech to text" value="In the browser. The words stay in memory for this call only." />
    </>,
    <>
      <Row label="Rules read it" value={`${t.rules.intent}${t.rules.objection ? ` · objection: ${t.rules.objection}` : ""}`} t={t.rules.ms} />
      <Row label="State machine decides" tone="decide" value={`${t.decision.kind}${t.decision.stage ? ` · stage: ${t.decision.stage}` : ""}${t.decision.objectionUsed ? ` · answers: ${t.decision.objectionUsed}` : ""}`} t={t.decision.ms} />
      <Row
        label="Threat engine (log-odds)"
        tone="decide"
        value={
          <>
            {pct(t.threat.probability)} risk · {t.threat.level} · log-odds {t.threat.logOdds.toFixed(2)}
            <span className="mt-1 block text-[13px] text-white/60">{t.threat.tactics.map((x) => `${x.id} ${x.name} (×${x.lr})`).join(" · ") || "no tactics yet"}</span>
          </>
        }
        t={t.threat.ms}
      />
    </>,
    <>
      <Row
        label="AI · classify (optional)"
        tone="ai"
        value={
          <>
            {AI_MODE[t.ai.mode] ?? t.ai.mode}
            {t.ai.objection !== null || t.ai.state ? <span className="block text-[13px] text-white/60">objection: {t.ai.objection ?? "none"} · state: {t.ai.state ?? "?"}{t.ai.confidence !== null ? ` · confidence ${t.ai.confidence.toFixed(2)}` : ""}</span> : null}
          </>
        }
        t={t.ai.mode === "classified" || t.ai.mode === "low_confidence" || t.ai.mode === "timeout" || t.ai.mode === "failed" ? t.ai.ms : undefined}
      />
      <Row label="Database" value="Signal codes only (tactics, stage, objection class). No audio, no words." />
      <Row label="Tools" value={t.guard.recorded ? "Recorded natural voice clip" : "Browser voice (no recording)"} />
    </>,
    <>
      <Row label="Guard checks the line" tone="decide" value={t.guard.ok ? "Passed: no real names, secrets, violence or long numbers" : `Blocked: ${t.guard.why}`} t={t.guard.ms} />
      <Row label="Validation" value={t.ai.mode === "classified" || t.ai.mode === "low_confidence" ? "AI output matched the zod schema; confidence threshold 0.6" : "No AI output to validate"} />
      <Row label="Fallback" value={t.ai.mode === "classified" ? "Not needed" : "Rule-only path (always available)"} />
    </>,
    <>
      <Row label="Shown and spoken" value="Caption (word by word), recorded voice, the caller's face" />
      <Row label="Tactic chips" value={`${t.output.tacticsShown} shown`} />
      <Row label="STOP" tone="decide" value={t.output.stopNow ? "Yes: Ruko steps in now" : "Not yet"} />
    </>,
  ];
  return (
    <div>
      {sample && <p className="mb-3 inline-block rounded-full border border-white/30 px-3 py-1 font-mono text-[12px] tracking-wide text-white/80 uppercase">Sample turn (synthetic): take the live call to see your own</p>}
      <div className="relative grid gap-3 lg:grid-cols-5">
        {/* the packet: one dot travelling through the five boxes for this turn */}
        {ok && (
          <span key={t.n} aria-hidden className="pointer-events-none absolute -top-2 left-0 hidden size-3 rounded-full lg:block" style={{ background: DECIDE, boxShadow: `0 0 16px ${DECIDE}`, animation: "xray-packet 1.6s cubic-bezier(.4,0,.2,1) both" }} />
        )}
        {BOXES.map((b, i) => (
          <section key={b.id} className="rounded-[16px] border border-[#5b9dff]/40 bg-[#0b2a52]/60 p-4" style={{ animation: ok ? `ruko-fade 0.4s ${i * 0.18}s both` : undefined }}>
            <p className="font-mono text-[12px] text-[#5b9dff]">{b.id}</p>
            <h3 className="text-[19px] leading-tight font-bold text-white">{b.title}</h3>
            <p className="mb-3 text-[13px] text-white/55">{b.sub}</p>
            <div className="flex flex-col gap-3">{cols[i]}</div>
          </section>
        ))}
      </div>
      <p className="mt-3 font-mono text-[13px] text-white/60">
        Turn {t.n} · end of your turn to his reply: {ms(t.totalMs)}
      </p>
      {history.length > 1 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left font-mono text-[12px] text-white/75">
            <thead className="text-white/45">
              <tr>
                <th className="py-1 pr-3">Turn</th>
                <th className="pr-3">Rules</th>
                <th className="pr-3">AI</th>
                <th className="pr-3">Decision</th>
                <th className="pr-3">Risk</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.n} className="border-t border-white/10">
                  <td className="py-1 pr-3">{h.n}</td>
                  <td className="pr-3">{h.rules.objection ?? h.rules.intent}</td>
                  <td className="pr-3" style={{ color: AI }}>{h.ai.mode}{h.ai.confidence !== null ? ` ${h.ai.confidence.toFixed(2)}` : ""}</td>
                  <td className="pr-3">{h.decision.kind} {h.decision.stage ?? ""}</td>
                  <td className="pr-3">{pct(h.threat.probability)}</td>
                  <td>{ms(h.totalMs)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <style>{`@keyframes xray-packet { 0% { transform: translateX(0); opacity: 0 } 8% { opacity: 1 } 92% { opacity: 1 } 100% { transform: translateX(calc(100cqw - 12px)); opacity: 0 } }`}</style>
    </div>
  );
}

/** The overlay on the call screen: flips in like a card, X or Escape closes it. The call carries on underneath. */
export function XRayPanel({ traces, onClose }: { traces: TurnTrace[]; onClose: () => void }) {
  const ok = useMotionOk();
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-[#061529] text-white" style={{ perspective: "1600px" }} role="dialog" aria-label="X-Ray: how Ruko handled this turn">
      <div
        className="min-h-full px-4 py-5 sm:px-8"
        style={{
          backgroundImage: "linear-gradient(rgba(91,157,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(91,157,255,0.10) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          transformOrigin: "center",
          animation: ok ? "xray-flip 0.45s cubic-bezier(.22,1,.36,1) both" : undefined,
          containerType: "inline-size",
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-[12px] tracking-[0.16em] text-[#5b9dff] uppercase">X-Ray · the architecture, live</p>
              <h2 className="text-[26px] font-bold">AI reads. Code decides.</h2>
            </div>
            <button onClick={onClose} className="min-h-12 rounded-full border border-white/40 px-5 text-[16px] font-semibold">
              Back to the call (X)
            </button>
          </div>
          <div className="mt-5">
            <XRayView trace={traces[traces.length - 1] ?? null} history={traces} />
          </div>
          <p className="mt-4 text-[13px] text-white/50">Blue: AI (optional, can be off). White: code. Marigold: a decision. Times are measured on this device in this call.</p>
        </div>
      </div>
      <style>{`@keyframes xray-flip { from { transform: rotateY(-80deg); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
    </div>
  );
}
