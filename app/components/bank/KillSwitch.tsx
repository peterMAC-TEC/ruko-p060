"use client";

import { useCallback, useEffect, useState } from "react";

// The kill switch: pause every digital payment at once. The elder or the family can pause; resuming needs the family code
// word, so a scammer on the phone cannot talk someone into turning payments back on. Calm, plain, and honest:
// it only says "paused" or "resumed" after the server has confirmed it.

type Lang = "en" | "hing";
const T = {
  en: {
    pause: "Pause all payments",
    pauseSub: "Stops every payment in this bank until the family code word turns them back on.",
    sure: "Pause everything now?",
    yes: "Yes, pause all payments",
    no: "No, keep payments on",
    paused: "All payments are paused.",
    pausedSub: "Nothing can be sent. To turn payments back on, ask your family for the code word.",
    word: "Family code word",
    resume: "Resume payments",
    resumed: "Payments are on again.",
    wrong: "That is not the family code word. Payments are still paused.",
    needed: "Please type the family code word. Payments are still paused.",
    family: "A family member needs to resume this.",
    failed: "That did not work. Payments are unchanged. Please try again.",
  },
  hing: {
    pause: "Saare payments roakiye",
    pauseSub: "Is bank mein har payment rukega, jab tak family code word se wapas chalu na kiya jaye.",
    sure: "Abhi sab kuch rok dein?",
    yes: "Haan, saare payments roakiye",
    no: "Nahi, payments chalu rakhiye",
    paused: "Saare payments ruke hue hain.",
    pausedSub: "Kuch bhi bheja nahi ja sakta. Wapas chalu karne ke liye parivar se code word maangiye.",
    word: "Family code word",
    resume: "Payments chalu kijiye",
    resumed: "Payments phir se chalu hain.",
    wrong: "Yeh family code word nahi hai. Payments abhi bhi ruke hain.",
    needed: "Kripya family code word likhiye. Payments abhi bhi ruke hain.",
    family: "Parivar ke kisi sadasya ko ise chalu karna hoga.",
    failed: "Yeh nahi hua. Payments jaise the waise hain. Phir koshish kijiye.",
  },
} as const;

export function KillSwitch({ elderId, by, lang = "en", onChange }: { elderId: string; by: "elder" | "family"; lang?: Lang; onChange?: (paused: boolean) => void }) {
  const t = T[lang];
  const [paused, setPaused] = useState<boolean | null>(null);
  const [asking, setAsking] = useState(false);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/protection?elderId=${elderId}&view=staff`, { cache: "no-store" });
      if (r.ok) setPaused(Boolean((await r.json()).payments_paused));
    } catch {
      // Keep the last known state.
    }
  }, [elderId]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [load]);

  const send = async (action: "pause" | "resume") => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fetch("/api/guard/kill-switch", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ elderId, action, by, codeWord: word || undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(d.error === "code_word_wrong" ? t.wrong : d.error === "code_word_needed" ? t.needed : d.error === "family_must_resume" ? t.family : t.failed);
        return;
      }
      setPaused(Boolean(d.paused));
      onChange?.(Boolean(d.paused));
      setAsking(false);
      setWord("");
      if (!d.paused) setMsg(t.resumed);
    } catch {
      setMsg(t.failed);
    } finally {
      setBusy(false);
    }
  };

  if (paused === null) return null;
  const btn = "min-h-[64px] w-full rounded-[18px] text-[20px] font-semibold";

  if (paused) {
    return (
      <section className="rounded-[18px] border-2 border-ink p-5" aria-live="polite">
        <h2 className="display text-[28px] leading-tight">{t.paused}</h2>
        <p className="mt-1 text-[18px] text-ink-soft">{t.pausedSub}</p>
        <label className="mt-4 flex flex-col gap-2">
          <span className="text-[17px] font-semibold">{t.word}</span>
          <input value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" className="min-h-16 rounded-[18px] border border-hair px-4 text-[20px]" />
        </label>
        <button disabled={busy} onClick={() => void send("resume")} className={`${btn} mt-3 bg-ink text-white disabled:opacity-30`}>
          {t.resume}
        </button>
        {msg && (
          <p className="mt-3 text-[18px] font-semibold text-alarm" role="alert">
            {msg}
          </p>
        )}
      </section>
    );
  }

  return (
    <section>
      {msg && (
        <p className="mb-3 rounded-[18px] bg-safe-soft p-4 text-[19px] font-semibold text-safe" role="status">
          {msg}
        </p>
      )}
      {!asking ? (
        <button onClick={() => setAsking(true)} className="flex min-h-[72px] w-full flex-col justify-center rounded-[18px] border border-hair px-5 text-left">
          <span className="text-[20px] font-semibold">{t.pause}</span>
          <span className="text-[15px] text-ink-soft">{t.pauseSub}</span>
        </button>
      ) : (
        <div className="rounded-[18px] border-2 border-ink p-5">
          <p className="text-[22px] font-semibold">{t.sure}</p>
          <div className="mt-3 flex flex-col gap-3">
            <button disabled={busy} onClick={() => void send("pause")} className={`${btn} bg-ink text-white disabled:opacity-30`}>
              {t.yes}
            </button>
            <button onClick={() => setAsking(false)} className={`${btn} border border-hair`}>
              {t.no}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
