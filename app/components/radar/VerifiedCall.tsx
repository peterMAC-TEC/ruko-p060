"use client";

import { BadgeCheck, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import type { Strings, UiLang } from "@/lib/i18n";
import { verifyIntent, type SignedIntent, type Verdict } from "@/lib/verifyIntent";

// "Sahyog Bank is calling you now", verified on this phone: the bank's
// Ed25519 signature, this customer, not expired, not replayed. The code is the
// customer's check on the caller: the real agent says it, a scammer can't.

const WHY: Record<SignedIntent["payload"]["purpose"], { en: string; hi: string }> = {
  payment_check: { en: "calling to check a payment you made", hi: "आपके किए भुगतान की जाँच के लिए कॉल कर रहे हैं" },
  fraud_alert: { en: "calling about a possible scam on your account", hi: "आपके खाते पर संभावित ठगी के बारे में कॉल कर रहे हैं" },
  kyc_reminder: { en: "calling with a KYC reminder (they will not ask for an OTP)", hi: "KYC याद दिलाने के लिए कॉल कर रहे हैं (OTP नहीं माँगेंगे)" },
};

/** Live verified bank calls for this person, re-checked every few seconds. */
export function useVerifiedCalls(elderId: string) {
  const [verdicts, setVerdicts] = useState<Verdict[]>([]);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      const r = await fetch(`/api/callintent?elderId=${elderId}`, { cache: "no-store" }).catch(() => null);
      if (!r?.ok || stop) return;
      const intents: SignedIntent[] = await r.json();
      const checked = await Promise.all(intents.map((i) => verifyIntent(i, elderId)));
      if (!stop) setVerdicts(checked);
    };
    load();
    const id = setInterval(load, 5000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [elderId]);
  return {
    verified: verdicts.filter((v): v is Extract<Verdict, { ok: true }> => v.ok).map((v) => v.intent),
    failed: verdicts.some((v) => !v.ok && v.reason !== "expired"),
  };
}

export function VerifiedCallBanner({ elderId, t, lang }: { elderId: string; t: Strings; lang: UiLang }) {
  const { verified, failed } = useVerifiedCalls(elderId);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  // The code only proves anything once the person checks the caller said it (security review M2).
  const confirm = async (id: string, match: boolean) => {
    setAnswers((a) => ({ ...a, [id]: match }));
    await fetch(`/api/callintent/${id}/confirm`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ match }),
    }).catch(() => {});
  };
  if (failed && !verified.length) {
    return (
      <p className="flex gap-3 rounded-2xl bg-alarm-soft p-4 text-[17px] font-bold text-alarm" role="alert">
        <ShieldAlert className="mt-0.5 size-5 shrink-0" strokeWidth={2.4} />
        {t.verifiedBad}
      </p>
    );
  }
  return (
    <>
      {verified.map((i) => (
        <section key={i.id} className="rounded-[24px] border-2 border-calm bg-calm-soft p-5 animate-in fade-in duration-300" role="status">
          <p className="flex items-center gap-2 text-[14px] font-bold tracking-wide text-calm uppercase">
            <BadgeCheck className="size-5" strokeWidth={2.4} /> {t.verifiedTag}
          </p>
          <h2 className="mt-1 text-[22px] leading-tight font-bold">{t.verifiedTitle(i.payload.iss_name)}</h2>
          <p className="mt-1 text-[17px]">{t.verifiedBody(i.payload.agent, WHY[i.payload.purpose][lang])}</p>
          <p className="mt-3 text-[16px] text-ink-soft">{t.verifiedCode}</p>
          <p className="mt-1 text-[40px] leading-none font-bold tracking-[0.3em] text-calm tabular">{i.payload.code}</p>
          {(() => {
            const answer = answers[i.id] ?? i.codeMatch;
            if (answer === true) return <p className="mt-3 text-[17px] font-bold text-calm">✓ {t.codeOk}</p>;
            if (answer === false) return <p className="mt-3 rounded-2xl bg-alarm p-3 text-[17px] font-bold text-white">{t.codeBad}</p>;
            return (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button onClick={() => confirm(i.id, true)} className="min-h-14 rounded-2xl bg-calm text-[16px] font-bold text-white">
                  {t.codeSaid}
                </button>
                <button onClick={() => confirm(i.id, false)} className="min-h-14 rounded-2xl border-2 border-alarm/40 bg-white text-[16px] font-bold text-alarm">
                  {t.codeWrong}
                </button>
              </div>
            );
          })()}
        </section>
      ))}
    </>
  );
}
