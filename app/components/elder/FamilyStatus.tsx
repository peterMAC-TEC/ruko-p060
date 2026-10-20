"use client";

import { Check, PhoneCall, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { Strings } from "@/lib/i18n";
import type { AlertStatus } from "@/lib/types";

// "Priya has been alerted" → "Priya is calling you now". Seeing that help is
// on the way is part of the intervention, so it updates live.

type Row = { id: string; member_name?: string; status: AlertStatus };

export function FamilyStatus({ riskEventId, t }: { riskEventId: string; t: Strings }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/alerts?riskEventId=${riskEventId}`, { cache: "no-store" });
        if (!stop && r.ok) setRows(await r.json());
      } catch {}
    };
    load();
    const id = setInterval(load, 2000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [riskEventId]);

  if (rows.length === 0) return null;
  const someoneCalling = rows.some((a) => a.status === "ack_calling");

  return (
    <section
      className={`rounded-3xl p-5 transition-colors ${someoneCalling ? "emerald-card text-white shadow-lift" : "bg-white shadow-soft"}`}
      aria-live="polite"
    >
      <ul className="space-y-3">
        {rows.map((a) => {
          const name = a.member_name?.split(" ")[0] ?? "";
          const calling = a.status === "ack_calling";
          return (
            <li key={a.id} className="flex items-center gap-3">
              <span
                className={`relative flex size-11 shrink-0 items-center justify-center rounded-full ${
                  calling ? "bg-white text-calm" : someoneCalling ? "bg-white/15 text-white" : "bg-calm-soft text-calm"
                }`}
                aria-hidden
              >
                {calling && <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />}
                {calling ? <PhoneCall className="relative size-5" strokeWidth={2.4} /> : <Check className="size-5" strokeWidth={2.6} />}
              </span>
              <span className={calling ? "text-[22px] font-bold" : "text-[19px]"}>
                {calling ? t.familyCalling(name) : a.status === "ack_fine" ? t.familyFine(name) : t.familyAlerted(name)}
              </span>
            </li>
          );
        })}
      </ul>
      <p
        className={`mt-4 flex items-start gap-2 border-t pt-4 text-[17px] font-bold ${
          someoneCalling ? "border-white/15 text-white" : "border-ink/8 text-calm"
        }`}
      >
        <ShieldAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2.4} />
        {t.holdTight}
      </p>
    </section>
  );
}
