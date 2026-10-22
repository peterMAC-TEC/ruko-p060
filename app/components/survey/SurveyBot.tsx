"use client";

import { Check, ChevronLeft, Mic, Share2, Volume2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { hush, say } from "@/lib/voice";
import { useVoiceCapture } from "@/lib/voice-capture";
import { incidentSummary, nextQuestion, visible, type Answers, type Ctx, type Question, type SurveyKind } from "@/lib/survey";

// The survey bot: Ruko asks one question at a time, in English or Hinglish, answered with big buttons
// (or the voice, for the free-text questions). It never asks for names or numbers, and says so.

type Lang = "en" | "hing";
type Saved = "no" | "saving" | "yes" | "failed";

const T = {
  intro: {
    open: {
      en: "Hi, I'm Ruko. I'm a student project that helps older people stop phone scams. Can I ask a few quick questions? It takes about 3 minutes.",
      hing: "Namaste, main Ruko hoon. Yeh ek student project hai jo buzurgon ko phone scams se bachata hai. Kya main kuch chhote sawaal pooch sakta hoon? Lagbhag 3 minute lagenge.",
    },
    participant: {
      en: "Thank you for taking part. A few quick questions about the call you just had. There are no right or wrong answers.",
      hing: "Hissa lene ke liye shukriya. Abhi jo call aayi uske baare mein kuch chhote sawaal. Koi jawab sahi ya galat nahi hai.",
    },
    family: {
      en: "Thank you for helping. A few quick questions about what you saw on your phone during the practice call.",
      hing: "Madad ke liye shukriya. Practice call ke dauraan aapke phone par jo dikha, uske baare mein kuch chhote sawaal.",
    },
    incident: {
      en: "I'm sorry that happened. You did the right thing. Can I ask a few quick questions? They help warn other families, and I'll write a report you can send to 1930.",
      hing: "Mujhe afsos hai ki aisa hua. Aapne sahi kiya. Kya main kuch chhote sawaal pooch sakta hoon? Isse doosre parivaron ko chetane mein madad milegi, aur main ek report likh dunga jo aap 1930 ko bhej sakte hain.",
    },
  },
  privacy: {
    en: "It is anonymous. Please don't write names, phone numbers or account numbers. You can stop any time.",
    hing: "Yeh anonymous hai. Kripya naam, phone number ya account number na likhein. Aap kabhi bhi rok sakte hain.",
  },
  agree: { en: "I agree, let's start", hing: "Main sahmat hoon, shuru karein" },
  start: { en: "Start", hing: "Shuru karein" },
  next: { en: "Next", hing: "Aage" },
  skip: { en: "Skip", hing: "Chhodiye" },
  back: { en: "Back", hing: "Peeche" },
  of: (i: number, n: number, l: Lang) => (l === "en" ? `Question ${i} of ${n}` : `Sawaal ${i} / ${n}`),
  typeHere: { en: "Type here, or tap the microphone", hing: "Yahan likhiye, ya microphone dabaiye" },
  tapToSpeak: { en: "Tap and speak", hing: "Dabaiye aur boliye" },
  thanks: { en: "Thank you. That helps protect other families.", hing: "Shukriya. Isse doosre parivaron ko bachane mein madad milti hai." },
  saving: { en: "Saving…", hing: "Save ho raha hai…" },
  saved: { en: "Saved", hing: "Save ho gaya" },
  failed: { en: "Couldn't save just now.", hing: "Abhi save nahi ho paya." },
  retry: { en: "Try again", hing: "Phir koshish karein" },
  reportTitle: { en: "Your report, ready to use", hing: "Aapki report, istemaal ke liye taiyaar" },
  copy: { en: "Copy the report", hing: "Report copy karein" },
  copied: { en: "Copied", hing: "Copy ho gaya" },
  whatsappReport: { en: "Send it by WhatsApp", hing: "WhatsApp se bhejein" },
  call1930: { en: "Call 1930", hing: "1930 par phone karein" },
  nextSteps: { en: "What to do next", hing: "Ab kya karein" },
  shareTitle: { en: "Know another family who could answer? Share this with them.", hing: "Kya koi aur parivar jawab de sakta hai? Unhe yeh bhejiye." },
  share: { en: "Share on WhatsApp", hing: "WhatsApp par bhejein" },
  shareText: {
    en: "Ruko is a student project to stop phone scams on older people. A 3-minute anonymous survey: ",
    hing: "Ruko ek student project hai jo buzurgon ko phone scams se bachata hai. 3 minute ka anonymous survey: ",
  },
} as const;
const t = (x: { en: string; hing: string }, l: Lang) => x[l];
const FACES = ["😟", "🙁", "😐", "🙂", "😀"];

export function SurveyBot({ kind, callId, ctx = {}, initialLang = "en" }: { kind: SurveyKind; callId?: string; ctx?: Ctx; initialLang?: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [skipped, setSkipped] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [picks, setPicks] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<Saved>("no");
  const [voice, setVoice] = useState(kind === "participant");
  const sentRef = useRef(false);

  const skipSet = useMemo(() => new Set(skipped), [skipped]);
  const q = started ? nextQuestion(kind, ctx, answers, skipSet) : null;
  const total = visible(kind, ctx, answers).length;
  const index = history.length + 1;
  const done = started && q === null;

  const mic = useVoiceCapture(lang === "en" ? "en" : "hi", (o) => {
    if (o.engine === "browser") setText((prev) => (prev ? `${prev} ${o.transcript}` : o.transcript));
  });

  // Read each question aloud when the voice is on.
  useEffect(() => {
    hush();
    if (voice && q) say(`${q.ask[lang]}${q.options && q.type !== "scale" ? ` ${q.options.map((o) => o.label[lang]).join(", ")}.` : ""}`, "en");
    return () => hush();
    // Speak when the question changes, not when the toggle or the language does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.id]);

  const answer = useCallback(
    (question: Question, value: string | number | string[]) => {
      setAnswers((a) => ({ ...a, [question.id]: value }));
      setHistory((h) => [...h, question.id]);
      setPicks([]);
      setText("");
    },
    [],
  );
  const skip = (question: Question) => {
    setSkipped((s) => [...s, question.id]);
    setHistory((h) => [...h, question.id]);
    setPicks([]);
    setText("");
  };
  const back = () => {
    const last = history[history.length - 1];
    if (!last) return setStarted(false);
    setHistory((h) => h.slice(0, -1));
    setSkipped((s) => s.filter((x) => x !== last));
    setAnswers((a) => {
      const { [last]: _gone, ...rest } = a;
      void _gone;
      return rest;
    });
  };

  const save = useCallback(async () => {
    setSaved("saving");
    try {
      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, lang, callId, consent: true, answers }),
      });
      setSaved(res.ok ? "yes" : "failed");
    } catch {
      setSaved("failed");
    }
  }, [kind, lang, callId, answers]);

  useEffect(() => {
    if (done && !sentRef.current) {
      sentRef.current = true;
      // Saving once the last answer is in.
      void save();
    }
  }, [done, save]);

  const url = typeof window !== "undefined" ? `${window.location.origin}/survey` : "/survey";
  const intro = T.intro[kind];
  const report = useMemo(() => (kind === "incident" && done ? incidentSummary(answers) : null), [kind, done, answers]);
  const [copied, setCopied] = useState(false);

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-paper px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] text-ink">
      <header className="flex items-center justify-between gap-3 pb-4">
        <RukoWordmark />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVoice((v) => !v)}
            aria-pressed={voice}
            aria-label="Read the questions aloud"
            className={`grid size-11 place-items-center rounded-full ${voice ? "bg-calm text-white" : "bg-white shadow-soft"}`}
          >
            <Volume2 className="size-5" />
          </button>
          <div className="flex rounded-full bg-white p-1 text-[14px] font-bold shadow-soft">
            {(["en", "hing"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`min-h-9 rounded-full px-3 ${lang === l ? "bg-calm text-white" : "text-ink-soft"}`}>
                {l === "en" ? "English" : "Hinglish"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {!started && (
        <div className="flex flex-1 flex-col">
          <Bubble>{t(intro, lang)}</Bubble>
          <Bubble soft>{t(T.privacy, lang)}</Bubble>
          <div className="mt-auto pt-6">
            <Big onClick={() => setStarted(true)}>{kind === "open" || kind === "incident" ? t(T.agree, lang) : t(T.start, lang)}</Big>
          </div>
        </div>
      )}

      {q && (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between">
            <button onClick={back} className="-ml-2 flex min-h-11 items-center gap-1 pr-3 text-[17px] font-bold text-calm">
              <ChevronLeft className="size-5" />
              {t(T.back, lang)}
            </button>
            <span className="text-[15px] text-ink-soft tabular">{T.of(Math.min(index, total), total, lang)}</span>
          </div>
          <Bubble>{q.ask[lang]}</Bubble>

          <div className="mt-auto flex flex-col gap-3 pt-6">
            {q.type === "choice" && q.options!.map((o) => <Big key={o.id} variant="light" onClick={() => answer(q, o.id)}>{o.label[lang]}</Big>)}

            {q.type === "multi" && (
              <>
                {q.options!.map((o) => {
                  const on = picks.includes(o.id);
                  return (
                    <button
                      key={o.id}
                      aria-pressed={on}
                      onClick={() => setPicks((p) => (on ? p.filter((x) => x !== o.id) : p.length < (q.id === "help_with" ? 3 : 12) ? [...p, o.id] : p))}
                      className={`flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4 text-left text-[18px] font-bold shadow-soft ${on ? "bg-calm text-white" : "bg-white"}`}
                    >
                      {o.label[lang]}
                      {on && <Check className="size-5 shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
                <Big disabled={!picks.length} onClick={() => answer(q, picks)}>{t(T.next, lang)}</Big>
              </>
            )}

            {q.type === "scale" && (
              <>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button key={v} onClick={() => answer(q, v)} aria-label={String(v)} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-white text-[30px] shadow-soft active:scale-95">
                      <span aria-hidden>{FACES[v - 1]}</span>
                      <span className="text-[15px] font-bold text-ink-soft">{v}</span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[15px] text-ink-soft">
                  <span>1 · {q.low![lang]}</span>
                  <span>5 · {q.high![lang]}</span>
                </div>
              </>
            )}

            {q.type === "text" && (
              <>
                {mic.supported && (
                  <button
                    onClick={() => (mic.state === "listening" ? mic.stop() : void mic.start())}
                    aria-pressed={mic.state === "listening"}
                    className={`flex min-h-16 items-center justify-center gap-3 rounded-2xl text-[19px] font-bold shadow-soft ${mic.state === "listening" ? "bg-calm text-white" : "bg-white"}`}
                  >
                    <Mic className={`size-6 ${mic.state === "listening" ? "animate-pulse" : ""}`} />
                    {mic.state === "listening" ? mic.interim || "…" : t(T.tapToSpeak, lang)}
                  </button>
                )}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  placeholder={t(T.typeHere, lang)}
                  className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-[19px] shadow-soft outline-none focus:border-calm"
                />
                <Big disabled={!text.trim()} onClick={() => answer(q, text.trim())}>{t(T.next, lang)}</Big>
              </>
            )}

            {q.optional && (
              <button onClick={() => skip(q)} className="min-h-12 text-[17px] font-bold text-ink-soft underline underline-offset-4">
                {t(T.skip, lang)}
              </button>
            )}
          </div>
        </div>
      )}

      {done && (
        <div className="flex flex-1 flex-col">
          <Bubble>{t(T.thanks, lang)}</Bubble>
          <p className="mt-3 text-[16px] text-ink-soft" role="status">
            {saved === "saving" ? t(T.saving, lang) : saved === "yes" ? `✓ ${t(T.saved, lang)}` : saved === "failed" ? t(T.failed, lang) : ""}
          </p>
          {saved === "failed" && (
            <div className="mt-3">
              <Big onClick={() => void save()}>{t(T.retry, lang)}</Big>
            </div>
          )}
          {report && (
            <section className="mt-5 rounded-[24px] bg-white p-5 shadow-soft">
              <h2 className="text-[20px] font-bold">{t(T.reportTitle, lang)}</h2>
              <p className="mt-2 text-[17px] leading-snug">{report.text}</p>
              <h3 className="mt-4 text-[18px] font-bold">{t(T.nextSteps, lang)}</h3>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-[16px] leading-snug">
                {report.checklist.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <div className="mt-4 flex flex-col gap-3">
                <a href="tel:1930" className="flex min-h-16 items-center justify-center rounded-2xl bg-alarm text-[20px] font-bold text-white">
                  {t(T.call1930, lang)}
                </a>
                <Big
                  variant="light"
                  onClick={() => {
                    void navigator.clipboard?.writeText(report.text).then(() => setCopied(true)).catch(() => {});
                  }}
                >
                  {copied ? `✓ ${t(T.copied, lang)}` : t(T.copy, lang)}
                </Big>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(report.text)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-16 items-center justify-center rounded-2xl bg-calm text-[20px] font-bold text-white"
                >
                  {t(T.whatsappReport, lang)}
                </a>
              </div>
            </section>
          )}
          {kind === "open" && saved === "yes" && (
            <div className="mt-auto flex flex-col gap-3 pt-6">
              <p className="text-[18px] font-bold">{t(T.shareTitle, lang)}</p>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(t(T.shareText, lang) + url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-calm text-[20px] font-bold text-white"
              >
                <Share2 className="size-6" />
                {t(T.share, lang)}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Bubble({ children, soft = false }: { children: React.ReactNode; soft?: boolean }) {
  return (
    <p className={`mt-5 leading-snug ${soft ? "text-ink-soft" : "display"}`} style={{ fontSize: soft ? 18 : 34, lineHeight: soft ? 1.45 : 1.08 }}>
      {children}
    </p>
  );
}

function Big({ children, onClick, disabled, variant = "dark" }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; variant?: "dark" | "light" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-[68px] w-full items-center justify-center rounded-[18px] px-5 text-center text-[20px] font-semibold transition active:scale-[0.99] disabled:opacity-40 ${variant === "dark" ? "bg-ink text-white" : "bg-white text-ink shadow-soft"}`}
    >
      {children}
    </button>
  );
}
