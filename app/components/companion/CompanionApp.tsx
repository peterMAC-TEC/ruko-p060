"use client";

import { ArrowRight, Check, Mic, Phone, Send, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Guardian } from "@/components/brand/Guardian";
import {
  ACTION_LABEL,
  SCRIPTS,
  SITUATIONS,
  STEPS,
  actionsFor,
  fallbackAnswer,
  type Action,
  type CLang,
  type ElderStatus,
  type Intent,
  type Option,
  type StepId,
} from "@/lib/companion";
import { hush, say } from "@/lib/voice";
import { useVoiceCapture } from "@/lib/voice-capture";

// Ruko Companion: when a scam alert fires, Ruko talks the person through the next
// minute, out loud and on screen, one question at a time. It never joins or listens
// to the call itself; it talks to the person, on their own phone. Voice is optional,
// every answer is a big button, and the family sees (as codes) how it is going.

const TOKEN = { en: "English", hing: "Hinglish" } as const;
type Msg = { from: "me" | "ruko"; text: string };

const call = (phone: string) => `tel:${phone.replace(/\s/g, "")}`;

export function CompanionApp({
  elderId,
  trusted,
  autoStart = true,
  onClose,
}: {
  elderId: string;
  trusted?: { name: string; phone: string };
  /** Speak straight away (the person just tapped something). Otherwise wait for one tap. */
  autoStart?: boolean;
  onClose: () => void;
}) {
  const [lang, setLang] = useState<CLang>("en");
  const [voice, setVoice] = useState(true);
  const [started, setStarted] = useState(autoStart);
  const [step, setStep] = useState<StepId>("hello");
  const [speaking, setSpeaking] = useState(false);
  const [log, setLog] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [thinking, setThinking] = useState(false);
  const [extra, setExtra] = useState<Action[]>([]);
  const [showSay, setShowSay] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const sent = useRef(new Set<ElderStatus>());

  // Remember the language between visits.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ruko:companion-lang");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved === "en" || saved === "hing") setLang(saved);
    } catch {
      // Storage blocked: English.
    }
  }, []);
  const pickLang = (l: CLang) => {
    setLang(l);
    try {
      localStorage.setItem("ruko:companion-lang", l);
    } catch {
      // Fine.
    }
  };

  const tell = useCallback(
    (status: ElderStatus) => {
      if (sent.current.has(status)) return;
      sent.current.add(status);
      fetch("/api/companion/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ elderId, status }),
      }).catch(() => {});
    },
    [elderId],
  );

  // Tell the family Ruko is with them.
  useEffect(() => {
    if (started) tell("talking");
  }, [started, tell]);

  const current = STEPS[step];
  const lastRuko = [...log].reverse().find((m) => m.from === "ruko")?.text;
  const line = step === "free" && lastRuko ? lastRuko : current.say[lang];

  // Speak each new line.
  const speak = useCallback(
    (t: string) => {
      if (!voice) return;
      say(t, "en", { start: () => setSpeaking(true), end: () => setSpeaking(false) });
    },
    [voice],
  );
  useEffect(() => {
    if (!started) return;
    speak(line);
    return () => hush();
    // Speak when the line changes, not when the voice toggle or language does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started, line]);

  useEffect(() => () => hush(), []);

  const choose = (o: Option) => {
    if (o.status) tell(o.status);
    if (o.to) {
      setStep(o.to);
      setExtra([]);
    }
    if (o.action === "close") onClose();
  };

  const ask = useCallback(
    async (question: string) => {
      const q = question.trim();
      if (!q || thinking) return;
      setText("");
      setThinking(true);
      setLog((l) => [...l, { from: "me", text: q }]);
      // Money, OTPs, arrest and fear have fixed, instant answers: too important to improvise.
      // Only other questions go to the AI, and the fixed answer stands if it is slow or off.
      let reply: { reply: string; intent: Intent } = fallbackAnswer(q, lang);
      if (reply.intent === "other") {
        try {
          const res = await fetch("/api/companion/ask", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ elderId, question: q, lang }),
            signal: AbortSignal.timeout(12_000),
          });
          if (res.ok) reply = await res.json();
        } catch {
          // The fixed answer above stands.
        }
      }
      if (reply.intent === "already_paid") tell("paid");
      if (reply.intent === "call_family" && /scared|dar/i.test(q)) tell("needs_help");
      setExtra(actionsFor(reply.intent));
      setThinking(false);
      setLog((l) => [...l, { from: "ruko", text: reply.reply }]);
    },
    [elderId, lang, thinking, tell],
  );

  // A picked situation gets fixed, reviewed guidance, instantly and with no AI.
  const pick = (s: (typeof SITUATIONS)[number]) => {
    setLog((l) => [...l, { from: "me", text: s.label[lang] }, { from: "ruko", text: s.guidance[lang] }]);
    setExtra(s.actions);
    setShowSay(false);
  };
  const copy = async (i: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Some phones refuse; the line is on screen to read aloud instead.
    }
  };

  const mic = useVoiceCapture(lang === "en" ? "en" : "hi", (o) => {
    if (o.engine === "browser") void ask(o.transcript);
  });
  const listening = mic.state === "listening";

  if (!started) {
    return (
      <Shell lang={lang} onLang={pickLang} voice={voice} onVoice={() => setVoice((v) => !v)} speaking={false}>
        <p className="display mt-10 text-[56px] leading-[1.0]">{lang === "en" ? "Ruko is here to help." : "Ruko madad ke liye yahan hai."}</p>
        <div className="mt-auto pt-8">
          <button onClick={() => setStarted(true)} className="flex min-h-[76px] w-full items-center justify-between rounded-[18px] bg-ink px-6 text-white">
            <span className="display text-[32px] italic">{lang === "en" ? "Talk to Ruko" : "Ruko se baat karein"}</span>
            <ArrowRight className="size-7" strokeWidth={1.6} />
          </button>
        </div>
      </Shell>
    );
  }

  const actions = (step === "free" ? extra : []) as Action[];
  return (
    <Shell
      lang={lang}
      onLang={pickLang}
      voice={voice}
      onVoice={() => {
        setVoice((v) => !v);
        hush();
      }}
      speaking={speaking}
    >
      {step === "hello" && autoStart && (
        <p className="mt-6 rounded-[18px] bg-safe-soft p-4 text-[22px] leading-snug font-semibold text-safe m-rise">
          {lang === "en" ? "You have paused. That was a good step." : "Aap ruk gaye. Yeh achha kadam tha."}
        </p>
      )}
      <p className="display mt-6 text-[46px] leading-[1.04]" aria-live="polite">
        {thinking ? (lang === "en" ? "One moment…" : "Ek minute…") : line}
      </p>
      {voice && (
        <button onClick={() => speak(line)} className="mt-4 flex min-h-12 items-center gap-2 self-start text-[17px] font-semibold text-ink-soft">
          <Volume2 className="size-5" strokeWidth={1.8} />
          {lang === "en" ? "Say it again" : "Phir se boliye"}
        </button>
      )}

      {step === "free" && log.length > 1 && (
        <ul className="mt-5 flex flex-col gap-2 text-[18px]">
          {log.slice(-5, -1).map((m, i) => (
            <li key={i} className={m.from === "me" ? "self-end text-right text-ink-soft" : "self-start"}>
              {m.text}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col pt-8">
        {step !== "free" && current.options.map((o) => <OptionButton key={o.id} o={o} lang={lang} trusted={trusted} onChoose={choose} onClose={onClose} />)}

        {step === "free" && (
          <>
            {actions.length === 0 &&
              SITUATIONS.map((s) => (
                <button key={s.id} onClick={() => pick(s)} className={row}>
                  <span>{s.label[lang]}</span>
                  <ArrowRight className="size-6 shrink-0" strokeWidth={1.6} />
                </button>
              ))}
            <button onClick={() => setShowSay((v) => !v)} aria-expanded={showSay} className={row}>
              <span>{lang === "en" ? "What can I say?" : "Main kya keh sakta hoon?"}</span>
              <ArrowRight className={`size-6 shrink-0 transition ${showSay ? "rotate-90" : ""}`} strokeWidth={1.6} />
            </button>
            {showSay && (
              <ul className="m-rise flex flex-col gap-3 border-b border-hair py-4">
                {SCRIPTS.map((sc, i) => (
                  <li key={i} className="rounded-[18px] bg-cream/60 p-4">
                    <p className="display text-[26px] leading-snug">&ldquo;{sc[lang]}&rdquo;</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => say(sc[lang], "en")} className="min-h-12 rounded-full bg-white px-5 text-[17px] font-semibold shadow-soft">
                        {lang === "en" ? "Read it aloud" : "Zor se padhiye"}
                      </button>
                      <button onClick={() => void copy(i, sc[lang])} className="min-h-12 rounded-full bg-white px-5 text-[17px] font-semibold shadow-soft">
                        {copied === i ? (lang === "en" ? "Copied" : "Copy ho gaya") : lang === "en" ? "Copy" : "Copy karein"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {actions.map((a) => (
              <OptionButton key={a} o={{ id: a, label: ACTION_LABEL[a], action: a }} lang={lang} trusted={trusted} onChoose={choose} onClose={onClose} />
            ))}
            {mic.supported && (
              <button
                onClick={() => (listening ? mic.stop() : void mic.start())}
                aria-pressed={listening}
                className={`flex min-h-[68px] items-center justify-between gap-3 border-b border-hair text-left text-[22px] font-semibold ${listening ? "text-alarm" : ""}`}
              >
                <span>{listening ? mic.interim || (lang === "en" ? "Listening… tap when done" : "Sun raha hoon… ho jaye to dabaiye") : lang === "en" ? "Tap and speak" : "Dabaiye aur boliye"}</span>
                <Mic className={`size-6 shrink-0 ${listening ? "animate-pulse" : ""}`} strokeWidth={1.8} />
              </button>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask(text);
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={lang === "en" ? "Or type here" : "Ya yahan likhiye"}
                className="min-h-16 min-w-0 flex-1 rounded-[18px] bg-paper-2 px-4 text-[20px] text-ink outline-none focus:ring-2 focus:ring-ink"
              />
              <button type="submit" disabled={!text.trim() || thinking} aria-label="Send" className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-ink text-white disabled:opacity-30">
                <Send className="size-6" strokeWidth={1.8} />
              </button>
            </form>
            <OptionButton o={{ id: "report", label: ACTION_LABEL.report, action: "report" }} lang={lang} trusted={trusted} onChoose={choose} onClose={onClose} />
            {mic.error && <p className="mt-2 text-[16px] text-ink-soft">{lang === "en" ? "I didn't catch that. Try again or type." : "Samajh nahi aaya. Phir se bolein ya likhein."}</p>}
          </>
        )}
      </div>
    </Shell>
  );
}

const row = "flex min-h-[68px] w-full items-center justify-between gap-3 border-b border-hair text-left text-[22px] font-semibold";
const solid = "mb-2 flex min-h-[72px] w-full items-center justify-center gap-3 rounded-[18px] bg-ink px-5 text-[22px] font-semibold text-white active:scale-[0.99]";

function OptionButton({
  o,
  lang,
  trusted,
  onChoose,
  onClose,
}: {
  o: Option;
  lang: CLang;
  trusted?: { name: string; phone: string };
  onChoose: (o: Option) => void;
  onClose: () => void;
}) {
  const label = o.label[lang];
  if (o.action === "call_family") {
    const first = trusted?.name.split(" ")[0];
    return (
      <a href={trusted ? call(trusted.phone) : "tel:1930"} className={solid} onClick={() => onChoose(o)}>
        <Phone className="size-6" strokeWidth={2} />
        {first ? (lang === "en" ? `Call ${first}` : `${first} ko phone karo`) : label}
      </a>
    );
  }
  if (o.action === "call_1930")
    return (
      <a href="tel:1930" className={solid} onClick={() => onChoose(o)}>
        <Phone className="size-6" strokeWidth={2} />
        {label}
      </a>
    );
  if (o.action === "help")
    return (
      <Link href="/help" className={row}>
        <span>{label}</span>
        <ArrowRight className="size-6 shrink-0" strokeWidth={1.6} />
      </Link>
    );
  if (o.action === "report")
    return (
      <Link href={`/survey/incident?lang=${lang}`} className={`${row} text-ink-soft`}>
        <span>{label}</span>
        <ArrowRight className="size-6 shrink-0" strokeWidth={1.6} />
      </Link>
    );
  if (o.action === "close")
    return (
      <button onClick={onClose} className={`${row} text-ink-soft`}>
        <span>{label}</span>
        <Check className="size-6 shrink-0" strokeWidth={1.8} />
      </button>
    );
  return (
    <button onClick={() => onChoose(o)} className={row}>
      <span>{label}</span>
      <ArrowRight className="size-6 shrink-0" strokeWidth={1.6} />
    </button>
  );
}

function Shell({
  children,
  lang,
  onLang,
  voice,
  onVoice,
  speaking,
}: {
  children: React.ReactNode;
  lang: CLang;
  onLang: (l: CLang) => void;
  voice: boolean;
  onVoice: () => void;
  speaking: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-white text-ink animate-in fade-in duration-300" role="dialog" aria-label="Ruko">
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-full p-1 text-[15px] font-semibold shadow-soft">
            {(["en", "hing"] as const).map((l) => (
              <button key={l} onClick={() => onLang(l)} aria-pressed={lang === l} className={`min-h-10 rounded-full px-4 ${lang === l ? "bg-ink text-white" : "text-ink-soft"}`}>
                {TOKEN[l]}
              </button>
            ))}
          </div>
          <button onClick={onVoice} aria-pressed={voice} aria-label={voice ? "Turn the voice off" : "Turn the voice on"} className="grid size-12 place-items-center rounded-full shadow-soft">
            {voice ? <Volume2 className="size-6" strokeWidth={1.8} /> : <VolumeX className="size-6" strokeWidth={1.8} />}
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 text-[17px] text-ink-soft">
          <Guardian mood="after" className="size-16" />
          <span className="relative grid size-3 place-items-center">
            {speaking && <span className="absolute size-5 animate-ping rounded-full bg-ink/20" />}
            <span className="size-2.5 rounded-full bg-ink" />
          </span>
          {lang === "en" ? "Ruko is with you" : "Ruko aapke saath hai"}
        </div>
        {children}
      </div>
    </div>
  );
}
