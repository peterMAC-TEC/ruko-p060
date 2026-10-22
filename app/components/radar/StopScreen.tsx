"use client";

import { ChevronDown, MessageCircle, Phone, PhoneOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Guardian } from "@/components/brand/Guardian";
import type { Strings, UiLang } from "@/lib/i18n";
import type { ScamPattern } from "@/lib/patterns";
import { waLink } from "@/lib/utils";

// The STOP screen. White paper and one huge red word: the loudest thing Ruko ever does. It names the scam, states the
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
  const row = "flex min-h-[64px] items-center justify-between gap-3 border-b border-hair text-[21px] font-semibold";

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto border-t-[10px] border-alarm bg-white text-ink m-fade" role="alertdialog" aria-labelledby="stop-title">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-6 pb-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[15px] font-semibold tracking-[0.16em] text-alarm uppercase">{t.stopIntro}</p>
          <Guardian mood="danger" className="size-14" />
        </div>
        <h1 id="stop-title" className="display mt-6 text-[150px] leading-[0.86] text-alarm">
          {t.stopWord === "STOP" ? "Stop." : `${t.stopWord}.`}
        </h1>
        <div className="my-5 h-[3px] bg-alarm" />
        <p className="display text-[26px] leading-tight text-ink-soft">{pattern?.name[lang] ?? t.verdictHigh}</p>
        <p className="display mt-3 text-[36px] leading-[1.12]">{rule}</p>
        <p className="mt-5 border-l-4 border-alarm pl-4 text-[24px] leading-snug font-semibold">{t.stopInstruction}</p>
        <p className="mt-4 text-[17px] text-ink-soft">{t.notYourFault}</p>
        {familyAlerted && <p className="mt-2 text-[17px] font-semibold">✓ {t.familyTold}</p>}

        <div className="mt-auto flex flex-col pt-8">
          <button
            onClick={() => {
              setHangUpShown(true);
              onHungUp();
            }}
            className="flex min-h-[72px] items-center justify-center gap-3 rounded-[18px] bg-ink text-[23px] font-semibold text-white"
          >
            <PhoneOff className="size-6" strokeWidth={2} />
            {t.iHaveHungUp}
          </button>
          {hangUpShown && <p className="mt-3 rounded-[16px] bg-paper-2 p-4 text-[18px]">{t.hangUpHow}</p>}

          <a href={trusted?.phone ? `tel:${trusted.phone.replace(/\s/g, "")}` : "tel:1930"} className={`${row} mt-3 border-t`}>
            <span>{trusted ? t.callTrusted(trusted.name.split(" ")[0]) : t.call1930}</span>
            <Phone className="size-6" strokeWidth={1.8} />
          </a>
          {trusted?.phone && (
            // The fallback that always reaches family: no SMS registration, no app of ours on their phone.
            <a href={waLink(trusted.phone, t.whatsappText(elderName?.split(" ")[0] ?? ""))} target="_blank" rel="noopener noreferrer" className={row}>
              <span>{t.whatsappFamily(trusted.name.split(" ")[0])}</span>
              <MessageCircle className="size-6" strokeWidth={1.8} />
            </a>
          )}

          <button onClick={() => setExplainOpen((v) => !v)} className={`${row} text-ink-soft`} aria-expanded={explainOpen}>
            <span>{t.notSure}</span>
            <ChevronDown className={`size-5 transition ${explainOpen ? "rotate-180" : ""}`} />
          </button>
          {explainOpen && (
            <ul className="space-y-2 border-b border-hair py-4 text-[18px]">
              {(pattern?.explain[lang] ?? t.reality).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          )}

          <Link href="/help" className="mt-5 text-center text-[16px] text-ink-soft underline underline-offset-4">
            {t.alreadyPaid}
          </Link>
          <p className="mt-6 flex items-center justify-between gap-3 border-t border-hair pt-3 text-[16px] text-ink-soft">
            <a href="tel:1930" className="flex min-h-12 items-center gap-2 text-ink">
              <span className="text-[22px] font-semibold tabular">1930</span> helpline
            </a>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="flex min-h-12 items-center underline underline-offset-4">
              cybercrime.gov.in
            </a>
            </p>

        </div>
      </div>
    </div>
  );
}
