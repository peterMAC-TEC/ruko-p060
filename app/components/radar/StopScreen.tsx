"use client";

import { ChevronDown, HelpCircle, MessageCircle, Phone, PhoneOff, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Strings, UiLang } from "@/lib/i18n";
import type { ScamPattern } from "@/lib/patterns";
import { waLink } from "@/lib/utils";

// The STOP screen (v2 §3.5): full-screen red-amber, names the scam, states the
// one rule being broken, and offers exactly three actions. Calm wording, no blame.

export function StopScreen({
  t,
  lang,
  pattern,
  trusted,
  familyAlerted,
  elderName,
  onHungUp,
}: {
  t: Strings;
  lang: UiLang;
  pattern: ScamPattern | null;
  trusted?: { name: string; phone: string };
  familyAlerted: boolean;
  /** For the WhatsApp message to the trusted person. */
  elderName?: string;
  onHungUp: () => void;
}) {
  const [hangUpShown, setHangUpShown] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const rule = pattern?.rule[lang] ?? t.factLine;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto text-white animate-in fade-in duration-200"
      style={{ background: "linear-gradient(170deg, #b42318 0%, #a3321a 45%, #b45309 100%)" }}
      role="alertdialog"
      aria-labelledby="stop-title"
    >
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-10 pb-8">
        <div className="flex items-center gap-3">
          <span className="flex size-14 items-center justify-center rounded-full bg-white text-alarm">
            <ShieldAlert className="size-8" strokeWidth={2.4} />
          </span>
          <span id="stop-title" className="text-[52px] leading-none font-bold tracking-tight">
            {t.stopWord}
          </span>
        </div>

        <p className="mt-6 text-[18px] font-bold tracking-wide text-white/85 uppercase">{t.stopIntro}</p>
        <h1 className="mt-1 text-[30px] leading-[1.15] font-bold">{pattern?.name[lang] ?? t.verdictHigh}</h1>
        <p className="mt-5 rounded-2xl bg-white/12 p-4 text-[22px] leading-snug font-bold">{rule}</p>
        <p className="mt-4 text-[18px] text-white/90">{t.notYourFault}</p>
        {familyAlerted && <p className="mt-3 text-[17px] font-bold text-white">✓ {t.familyTold}</p>}

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <button
            onClick={() => {
              setHangUpShown(true);
              onHungUp();
            }}
            className="flex min-h-[64px] items-center justify-center gap-3 rounded-2xl bg-white text-[22px] font-bold text-alarm"
          >
            <PhoneOff className="size-7" strokeWidth={2.4} />
            {t.hangUp}
          </button>
          {hangUpShown && <p className="rounded-2xl bg-white/12 p-4 text-[18px]">{t.hangUpHow}</p>}

          <a
            href={trusted?.phone ? `tel:${trusted.phone.replace(/\s/g, "")}` : "tel:1930"}
            className="flex min-h-[64px] items-center justify-center gap-3 rounded-2xl border-2 border-white/60 text-[21px] font-bold"
          >
            <Phone className="size-6" strokeWidth={2.4} />
            {trusted ? t.callTrusted(trusted.name.split(" ")[0]) : t.call1930}
          </a>

          {trusted?.phone && (
            // The fallback that always reaches family: no SMS registration, no app of ours on their phone.
            <a
              href={waLink(trusted.phone, t.whatsappText(elderName?.split(" ")[0] ?? ""))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[64px] items-center justify-center gap-3 rounded-2xl border-2 border-white/60 text-[20px] font-bold"
            >
              <MessageCircle className="size-6" strokeWidth={2.4} />
              {t.whatsappFamily(trusted.name.split(" ")[0])}
            </a>
          )}

          <button
            onClick={() => setExplainOpen((v) => !v)}
            className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl text-[19px] font-bold text-white/90"
            aria-expanded={explainOpen}
          >
            <HelpCircle className="size-5" />
            {t.notSure}
            <ChevronDown className={`size-5 transition ${explainOpen ? "rotate-180" : ""}`} />
          </button>
          {explainOpen && (
            <ul className="space-y-2 rounded-2xl bg-white/12 p-4 text-[18px]">
              {(pattern?.explain[lang] ?? t.reality).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}

          <Link href="/help" className="mt-2 text-center text-[16px] text-white/85 underline underline-offset-4">
            {t.alreadyPaid}
          </Link>
        </div>
      </div>
    </div>
  );
}
