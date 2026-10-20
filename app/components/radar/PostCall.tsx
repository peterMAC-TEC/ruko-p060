"use client";

import { Check, HelpCircle, X } from "lucide-react";
import { useState } from "react";
import { deviceId } from "@/lib/client";
import type { Strings } from "@/lib/i18n";

// Post-call "Was this a scam?" (v2 §3.7). Trains the community database and,
// when Ruko had warned, measures false positives.

export function PostCall({ t, patternId, warned }: { t: Strings; patternId?: string | null; warned: boolean }) {
  const [number, setNumber] = useState("");
  const [done, setDone] = useState(false);

  const send = async (verdict: "scam" | "not_scam" | "unsure") => {
    setDone(true);
    await fetch("/api/number/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        number: number.trim() || undefined,
        verdict,
        patternId: patternId ?? undefined,
        warned,
        device: deviceId(),
      }),
    }).catch(() => {});
  };

  if (done) {
    return (
      <p className="flex items-center gap-3 rounded-3xl bg-calm-soft p-5 text-[19px] font-bold text-calm">
        <Check className="size-6 shrink-0" strokeWidth={2.6} />
        {t.thanksReport}
      </p>
    );
  }

  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft">
      <h2 className="text-[22px] font-bold">{t.wasScam}</h2>
      <p className="mt-1 text-[16px] text-ink-soft">{t.wasScamSub}</p>
      <label className="mt-4 block">
        <span className="text-[16px] font-bold text-ink-soft">{t.theirNumber}</span>
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          inputMode="tel"
          placeholder="+91 …"
          className="mt-1 min-h-14 w-full rounded-2xl border-2 border-ink/10 bg-paper px-4 text-[20px] outline-none focus:border-calm"
        />
      </label>
      <div className="mt-4 grid gap-2">
        <button onClick={() => send("scam")} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-ink text-[19px] font-bold text-white">
          <Check className="size-5" strokeWidth={2.6} />
          {t.scamYes}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => send("not_scam")} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-ink/12 text-[17px] font-bold">
            <X className="size-5" />
            {t.scamNo}
          </button>
          <button onClick={() => send("unsure")} className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-ink/12 text-[17px] font-bold">
            <HelpCircle className="size-5" />
            {t.scamUnsure}
          </button>
        </div>
      </div>
    </section>
  );
}
