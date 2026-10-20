"use client";

import { AlertTriangle, Search, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useState } from "react";
import type { Strings, UiLang } from "@/lib/i18n";
import type { NumberRisk } from "@/lib/numberRisk";
import { findPattern, type PatternLibrary } from "@/lib/patterns";

// Scam Radar's pre-call check, on the web: type the number that called. On
// Android the same check runs automatically before the phone rings.

export function NumberCheck({ t, lang, lib, initial = "", elderId }: { t: Strings; lang: UiLang; lib: PatternLibrary; initial?: string; elderId?: string }) {
  const [number, setNumber] = useState(initial);
  const [risk, setRisk] = useState<NumberRisk | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const check = async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/number?n=${encodeURIComponent(number)}${elderId ? `&elderId=${elderId}` : ""}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setRisk(d);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : "Couldn't check right now.");
    } finally {
      setBusy(false);
    }
  };

  const scamName = risk?.topPattern ? findPattern(lib, risk.topPattern)?.name[lang] : undefined;
  const lines = risk
    ? [
        ...(risk.reports >= 1 && risk.reasons.some((r) => r.startsWith("reported_") && r !== "reported_safe")
          ? [scamName ? t.reportedAs(risk.reports, scamName) : t.reportedScam(risk.reports)]
          : []),
        ...risk.reasons.filter((r) => t.numberReasons[r]).map((r) => t.numberReasons[r]),
      ]
    : [];
  const tone = risk?.level === "high" ? "bg-alarm text-white" : risk?.level === "medium" ? "bg-warn-soft text-ink" : "bg-calm-soft text-ink";
  const Icon = risk?.level === "high" ? AlertTriangle : risk?.level === "medium" ? ShieldQuestion : ShieldCheck;

  return (
    <section className="flex flex-col gap-3">
      <label className="text-[17px] font-bold text-ink-soft" htmlFor="number-check">
        {t.checkNumber}
      </label>
      <div className="flex gap-2">
        <input
          id="number-check"
          value={number}
          onChange={(e) => {
            setNumber(e.target.value);
            setRisk(null);
          }}
          inputMode="tel"
          placeholder="+91 98765 43210"
          aria-describedby="number-check-hint"
          className="min-h-14 min-w-0 flex-1 rounded-2xl border-2 border-transparent bg-white px-4 text-[20px] shadow-soft outline-none focus:border-calm"
        />
        <button
          onClick={check}
          disabled={busy || number.trim().length < 3}
          className="flex min-h-14 items-center gap-2 rounded-2xl bg-ink px-5 text-[18px] font-bold text-white disabled:bg-ink/25"
        >
          <Search className="size-5" />
          {t.checkNumberGo}
        </button>
      </div>
      <p id="number-check-hint" className="text-[15px] text-ink-soft">
        {t.checkNumberHint}
      </p>
      {error && <p className="text-alarm">{error}</p>}
      {risk && (
        <div className={`rounded-2xl p-4 ${tone} animate-in fade-in duration-200`} role="status">
          <p className="flex items-center gap-2 text-[20px] font-bold">
            <Icon className="size-6" strokeWidth={2.4} />
            {t.riskLevel[risk.level]}
          </p>
          <ul className="mt-2 space-y-1 text-[17px]">
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
