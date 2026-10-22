"use client";

import { Check } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Guardian } from "@/components/brand/Guardian";
import { QrCode } from "@/components/survey/QrCode";
import { ruleCard } from "@/lib/rule-card";
import type { SetupStatus } from "@/lib/setup-status";
import { waLink } from "@/lib/utils";

// "Set up Ruko for Mum or Dad": for the family member, on their own phone, in about five minutes. Every tick on the
// checklist comes from something that really happened (a code word saved, an alert that really arrived), never from a
// tick box. Calm, no blame, English or Hinglish.

type Lang = "en" | "hing";
interface Status {
  status: SetupStatus;
  trusted: { name: string; phone: string } | null;
  memberIsTrusted: boolean;
  elderName: string | null;
}

const COPY = {
  en: {
    title: (n: string) => `Set up Ruko for ${n}`,
    sub: "Five small steps. Nobody is in trouble. This just makes sure Ruko works when it matters.",
    steps: ["Put Ruko on their phone", "Choose your family code word", "The Rule Card", "A practice call", "A test alert"],
    s1: (n: string) => `Open this on ${n}'s phone, then tap Share, then Add to Home screen. It becomes an app with the Ruko icon.`,
    s1b: "Show this to their phone, or send the link.",
    send: "Send the link on WhatsApp",
    trustedYes: (n: string) => `✓ You are ${n}'s trusted person. Ruko will tell you first.`,
    trustedNo: "You are not the trusted person yet. Ask them to add you in Ruko Family.",
    s2: "A word only your family knows. If someone calls pretending to be you, Ruko asks for it before any payment is released. Ruko stores it scrambled and never shows it again.",
    word: "Family code word",
    save: "Save the code word",
    saved: "✓ Saved. Tell your family the word, out loud, not by message.",
    s3: "One sentence that becomes the headline on their home screen:",
    print: "Print or save the card",
    s4: (n: string) => `Give ${n} the phone and let them try a harmless, pretend scam call. Watch what happens. Ruko will tell you, here, when it sees a real STOP.`,
    drill: "Start the practice call",
    s5: "Send yourself a test alert and check it arrives. It is marked TEST and changes nothing.",
    test: "Send me a test alert",
    arrived: "✓ It arrived on your phone.",
    waiting: "Waiting for it to arrive…",
    next: "Next",
    back: "Back",
    checklist: "Your checklist",
    items: ["Rule Card is set", "Family code word is set", "Test alert received", "Practice call done"],
    done: "Ruko is set up.",
    doneSub: "If Ruko ever sees a risky call, you will be told, with what to say. You can come back here any time.",
    notyet: "Not yet, and that is fine.",
    home: "Back to the family screen",
  },
  hing: {
    title: (n: string) => `${n} ke liye Ruko set up kijiye`,
    sub: "Paanch chhote kadam. Kisi ko koi pareshani nahi. Bas yeh pakka karna hai ki zaroorat par Ruko kaam kare.",
    steps: ["Unke phone par Ruko lagaiye", "Family code word chuniye", "Rule Card", "Practice call", "Test alert"],
    s1: (n: string) => `Yeh ${n} ke phone par kholiye, phir Share, phir Add to Home screen dabaiye. Ruko ke icon ke saath app ban jayega.`,
    s1b: "Unke phone ko dikhaiye, ya link bhej dijiye.",
    send: "WhatsApp par link bhejiye",
    trustedYes: (n: string) => `✓ Aap ${n} ke trusted person hain. Ruko sabse pehle aapko batayega.`,
    trustedNo: "Aap abhi trusted person nahi hain. Unse Ruko Family mein jodne ko kahiye.",
    s2: "Ek shabd jo sirf aapke parivar ko pata ho. Agar koi aapki tarah bankar call kare, to payment se pehle Ruko yeh shabd maangega. Ruko ise chhupakar rakhta hai aur dobara nahi dikhata.",
    word: "Family code word",
    save: "Code word save kijiye",
    saved: "✓ Save ho gaya. Shabd parivar ko bolkar batayiye, message se nahi.",
    s3: "Ek vaakya jo unki home screen ka headline banega:",
    print: "Card print ya save kijiye",
    s4: (n: string) => `${n} ko phone dijiye aur ek nakli, bekaar scam call try karne dijiye. Dekhiye kya hota hai. Asli STOP dikhne par Ruko yahin aapko bata dega.`,
    drill: "Practice call shuru kijiye",
    s5: "Khud ko ek test alert bhejiye aur dekhiye pahunchta hai ya nahi. Us par TEST likha hoga aur kuch nahi badlega.",
    test: "Mujhe test alert bhejiye",
    arrived: "✓ Aapke phone par pahunch gaya.",
    waiting: "Pahunchne ka intezaar…",
    next: "Aage",
    back: "Peeche",
    checklist: "Aapki checklist",
    items: ["Rule Card set hai", "Family code word set hai", "Test alert mil gaya", "Practice call ho gayi"],
    done: "Ruko set up ho gaya.",
    doneSub: "Agar Ruko ko koi khatarnak call dikhi, to aapko bataya jayega, kya kehna hai uske saath. Aap kabhi bhi yahan wapas aa sakte hain.",
    notyet: "Abhi nahi, aur koi baat nahi.",
    home: "Family screen par wapas",
  },
} as const;

export function SetupApp({ elderId, memberId, elderFirst }: { elderId: string; memberId: string; elderFirst: string }) {
  const [lang, setLang] = useState<Lang>("en");
  const t = COPY[lang];
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Status | null>(null);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [testSentAt, setTestSentAt] = useState<number | null>(null);
  const [arrivedIn, setArrivedIn] = useState<number | null>(null);
  const [origin, setOrigin] = useState("");
  const sent = useRef<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/setup/status?elderId=${elderId}&memberId=${memberId}`, { cache: "no-store" });
      if (r.ok) setData(await r.json());
    } catch {
      // Keep what we had; the next poll will try again.
    }
  }, [elderId, memberId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const id = setInterval(load, 2500);
    return () => clearInterval(id);
  }, [load]);

  // The test alert counts as arrived only when the status really shows it.
  useEffect(() => {
    if (sent.current && data?.status.testAlertReceived && arrivedIn === null) setArrivedIn(Math.max(1, Math.round((Date.now() - sent.current) / 1000)));
  }, [data, arrivedIn]);

  const post = async (url: string, body: object) => {
    setBusy(true);
    setErr("");
    try {
      const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ elderId, memberId, ...body }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Something went wrong. Please try again.");
      return true;
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const trustedFirst = data?.trusted?.name.split(" ")[0] ?? null;
  const card = ruleCard(trustedFirst, lang);
  const link = origin ? `${origin}/app` : "";
  const st = data?.status;
  const complete = Boolean(st?.complete);
  const btn = "min-h-[64px] rounded-[18px] px-6 text-[20px] font-semibold";

  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-5 pb-10 text-ink">
      <div className="flex items-center justify-between">
        <Link href="/family" className="min-h-12 content-center text-[16px] text-ink-soft underline underline-offset-4">
          {t.home}
        </Link>
        <button onClick={() => setLang(lang === "en" ? "hing" : "en")} className="min-h-12 rounded-full border border-hair px-4 text-[15px] font-semibold">
          {lang === "en" ? "English" : "Hinglish"}
        </button>
      </div>

      <div className="mt-5 flex items-start justify-between gap-3">
        <h1 className="display text-[40px] leading-[1.04]">{t.title(elderFirst)}</h1>
        <Guardian mood={complete ? "after" : "safe"} className="size-14" />
      </div>
      <p className="mt-2 text-[19px] text-ink-soft">{t.sub}</p>

      {step < 5 && (
        <>
          <ol className="mt-5 flex gap-1.5" aria-label="Progress">
            {t.steps.map((s, i) => (
              <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-ink" : "bg-hair"}`} aria-current={i === step ? "step" : undefined} />
            ))}
          </ol>
          <h2 className="mt-4 text-[15px] font-semibold tracking-[0.12em] text-ink-soft uppercase">
            {step + 1} / 5 · {t.steps[step]}
          </h2>
        </>
      )}

      {step === 0 && (
        <section className="mt-3 flex flex-col gap-4">
          <p className="text-[20px] leading-snug">{t.s1(elderFirst)}</p>
          {link && <QrCode payload={link} label="QR code for Ruko" />}
          <p className="text-center text-[16px] text-ink-soft">{t.s1b}</p>
          {link && (
            <a href={waLink("", `Ruko: ${link}`)} target="_blank" rel="noreferrer" className={`${btn} flex items-center justify-center border border-hair`}>
              {t.send}
            </a>
          )}
          <p className={`rounded-[18px] p-4 text-[19px] leading-snug ${data?.memberIsTrusted ? "bg-safe-soft text-safe" : "bg-paper-2"}`}>
            {data ? (data.memberIsTrusted && trustedFirst ? t.trustedYes(elderFirst) : t.trustedNo) : "…"}
          </p>
        </section>
      )}

      {step === 1 && (
        <section className="mt-3 flex flex-col gap-4">
          <p className="text-[20px] leading-snug">{t.s2}</p>
          <label className="flex flex-col gap-2">
            <span className="text-[17px] font-semibold">{t.word}</span>
            <input value={word} onChange={(e) => setWord(e.target.value)} autoComplete="off" className="min-h-16 rounded-[18px] border border-hair px-4 text-[22px]" />
          </label>
          <button
            disabled={busy || word.trim().length < 3}
            onClick={async () => {
              if (await post("/api/setup/code-word", { codeWord: word })) {
                setWord("");
                setSaved(true);
                void load();
              }
            }}
            className={`${btn} bg-ink text-white disabled:opacity-30`}
          >
            {t.save}
          </button>
          {(saved || st?.codeWordSet) && <p className="rounded-[18px] bg-safe-soft p-4 text-[19px] text-safe">{saved ? t.saved : "✓ " + t.items[1]}</p>}
        </section>
      )}

      {step === 2 && (
        <section className="mt-3 flex flex-col gap-4">
          <p className="text-[19px] text-ink-soft">{t.s3}</p>
          <p className="display rounded-[18px] border border-ink p-5 text-[34px] leading-[1.1]">{card.rule}</p>
          <Link href="/setup/card" target="_blank" className={`${btn} flex items-center justify-center bg-ink text-white`}>
            {t.print}
          </Link>
        </section>
      )}

      {step === 3 && (
        <section className="mt-3 flex flex-col gap-4">
          <p className="text-[20px] leading-snug">{t.s4(elderFirst)}</p>
          <Link href="/demo/live" target="_blank" className={`${btn} flex items-center justify-center bg-ink text-white`}>
            {t.drill}
          </Link>
          <p className={`rounded-[18px] p-4 text-[19px] ${st?.drillDone ? "bg-safe-soft text-safe" : "bg-paper-2 text-ink-soft"}`}>{st?.drillDone ? "✓ " + t.items[3] : t.notyet}</p>
        </section>
      )}

      {step === 4 && (
        <section className="mt-3 flex flex-col gap-4">
          <p className="text-[20px] leading-snug">{t.s5}</p>
          <button
            disabled={busy}
            onClick={async () => {
              sent.current = Date.now();
              setArrivedIn(null);
              setTestSentAt(Date.now());
              if (await post("/api/setup/test-alert", {})) void load();
            }}
            className={`${btn} bg-ink text-white disabled:opacity-30`}
          >
            {t.test}
          </button>
          {testSentAt && <p className={`rounded-[18px] p-4 text-[19px] ${arrivedIn !== null || st?.testAlertReceived ? "bg-safe-soft text-safe" : "bg-paper-2 text-ink-soft"}`}>{arrivedIn !== null || st?.testAlertReceived ? `${t.arrived}${arrivedIn ? ` (${arrivedIn} s)` : ""}` : t.waiting}</p>}
        </section>
      )}

      {err && (
        <p className="mt-3 rounded-[18px] bg-alarm-soft p-4 text-[18px] text-alarm" role="alert">
          {err}
        </p>
      )}

      {step < 5 && (
        <div className="mt-auto flex gap-3 pt-8">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className={`${btn} border border-hair`}>
              {t.back}
            </button>
          )}
          <button onClick={() => setStep(step + 1)} className={`${btn} flex-1 bg-ink text-white`}>
            {step === 4 ? t.checklist : t.next}
          </button>
        </div>
      )}

      {step === 5 && (
        <section className="m-rise mt-4 flex flex-col gap-4">
          <h2 className="display text-[34px] leading-tight">{complete ? t.done : t.checklist}</h2>
          {complete && <p className="text-[19px] text-ink-soft">{t.doneSub}</p>}
          <ul className="flex flex-col gap-2">
            {[st?.ruleCardSet, st?.codeWordSet, st?.testAlertReceived, st?.drillDone].map((ok, i) => (
              <li key={i} className={`flex min-h-16 items-center gap-3 rounded-[18px] px-4 text-[20px] ${ok ? "bg-safe-soft text-safe" : "border border-hair"}`}>
                <span className={`grid size-8 shrink-0 place-items-center rounded-full ${ok ? "bg-safe text-white" : "border border-hair"}`}>{ok && <Check className="size-5" />}</span>
                <span>
                  {t.items[i]}
                  {!ok && <span className="block text-[15px] text-ink-soft">{t.notyet}</span>}
                </span>
              </li>
            ))}
          </ul>
          <button onClick={() => setStep(0)} className={`${btn} border border-hair`}>
            {t.back}
          </button>
        </section>
      )}
    </main>
  );
}
