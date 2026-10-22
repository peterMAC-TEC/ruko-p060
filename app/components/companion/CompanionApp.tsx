"use client";

import { Check, MessageCircleHeart, Mic, Phone, Send, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ACTION_LABEL,
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

  const mic = useVoiceCapture(lang === "en" ? "en" : "hi", (o) => {
    if (o.engine === "browser") void ask(o.transcript);
  });
  const listening = mic.state === "listening";

  if (!started) {
    return (
      <Shell lang={lang} onLang={pickLang} voice={voice} onVoice={() => setVoice((v) => !v)} speaking={false}>
        <p className="text-[30px] leading-tight font-bold">{lang === "en" ? "Ruko is here to help." : "Ruko madad ke liye yahan hai."}</p>
        <div className="mt-auto pt-8">
          <button
            onClick={() => setStarted(true)}
            className="flex min-h-20 w-full items-center justify-center gap-3 rounded-[28px] bg-white text-[24px] font-bold text-calm shadow-lift"
          >
            <MessageCircleHeart className="size-8" strokeWidth={2.2} />
            {lang === "en" ? "Talk to Ruko" : "Ruko se baat karein"}
          </button>
        </div>
      </Shell>
    );
  }

  const actions = (step === "free" ? extra : []) as Action[];
  return (
    <Shell lang={lang} onLang={pickLang} voice={voice} onVoice={() => { setVoice((v) => !v); hush(); }} speaking={speaking}>
      <p className="text-[29px] leading-snug font-bold" aria-live="polite">
        {thinking ? (lang === "en" ? "One moment…" : "Ek minute…") : line}
      </p>
      {voice && (
        <button onClick={() => speak(line)} className="mt-3 flex min-h-12 items-center gap-2 self-start rounded-full bg-white/15 px-4 text-[17px] font-bold">
          <Volume2 className="size-5" />
          {lang === "en" ? "Say it again" : "Phir se boliye"}
        </button>
      )}

      {step === "free" && log.length > 1 && (
        <ul className="mt-5 flex flex-col gap-2 text-[18px]">
          {log.slice(-5, -1).map((m, i) => (
            <li key={i} className={`rounded-2xl px-4 py-3 ${m.from === "me" ? "self-end bg-white/20" : "self-start bg-white/10"}`}>
              {m.text}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-col gap-3 pt-8">
        {step !== "free" &&
          current.options.map((o) => <OptionButton key={o.id} o={o} lang={lang} trusted={trusted} onChoose={choose} onClose={onClose} />)}

        {step === "free" && (
          <>
            {actions.map((a) => (
              <OptionButton key={a} o={{ id: a, label: ACTION_LABEL[a], action: a }} lang={lang} trusted={trusted} onChoose={choose} onClose={onClose} />
            ))}
            {mic.supported && (
              <button
                onClick={() => (listening ? mic.stop() : void mic.start())}
                aria-pressed={listening}
                className={`flex min-h-20 items-center justify-center gap-3 rounded-[28px] text-[22px] font-bold shadow-lift transition ${
                  listening ? "scale-[1.02] bg-white text-calm" : "bg-white/15 text-white"
                }`}
              >
                <Mic className={`size-7 ${listening ? "animate-pulse" : ""}`} />
                {listening ? mic.interim || (lang === "en" ? "Listening… tap when done" : "Sun raha hoon… ho jaye to dabaiye") : lang === "en" ? "Tap and speak" : "Dabaiye aur boliye"}
              </button>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void ask(text);
              }}
              className="flex gap-2"
            >
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={lang === "en" ? "Or type here" : "Ya yahan likhiye"}
                className="min-h-16 min-w-0 flex-1 rounded-2xl bg-white px-4 text-[20px] text-ink outline-none"
              />
              <button type="submit" disabled={!text.trim() || thinking} aria-label="Send" className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white text-calm disabled:opacity-40">
                <Send className="size-6" />
              </button>
            </form>
            <OptionButton o={{ id: "report", label: ACTION_LABEL.report, action: "report" }} lang={lang} trusted={trusted} onChoose={choose} onClose={onClose} />
            {mic.error && <p className="text-[16px] font-bold text-white/90">{lang === "en" ? "I didn't catch that. Try again or type." : "Samajh nahi aaya. Phir se bolein ya likhein."}</p>}
          </>
        )}
      </div>
    </Shell>
  );
}

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
  const cls =
    "flex min-h-[68px] w-full items-center justify-center gap-3 rounded-[24px] px-5 text-center text-[22px] leading-tight font-bold shadow-lift active:scale-[0.99]";
  const primary = `${cls} bg-white text-calm`;
  const label = o.label[lang];
  if (o.action === "call_family") {
    const first = trusted?.name.split(" ")[0];
    return (
      <a href={trusted ? call(trusted.phone) : "tel:1930"} className={primary} onClick={() => onChoose(o)}>
        <Phone className="size-6" strokeWidth={2.4} />
        {first ? (lang === "en" ? `Call ${first}` : `${first} ko phone karo`) : label}
      </a>
    );
  }
  if (o.action === "call_1930")
    return (
      <a href="tel:1930" className={primary} onClick={() => onChoose(o)}>
        <Phone className="size-6" strokeWidth={2.4} />
        {label}
      </a>
    );
  if (o.action === "help")
    return (
      <Link href="/help" className={primary}>
        {label}
      </Link>
    );
  if (o.action === "report")
    return (
      <Link href={`/survey/incident?lang=${lang}`} className={`${cls} border-2 border-white/40 bg-transparent text-white`}>
        {label}
      </Link>
    );
  if (o.action === "close")
    return (
      <button onClick={onClose} className={`${cls} border-2 border-white/40 bg-transparent text-white`}>
        <Check className="size-6" strokeWidth={2.6} />
        {label}
      </button>
    );
  return (
    <button onClick={() => onChoose(o)} className={primary}>
      {label}
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
    <div
      className="fixed inset-0 z-[60] overflow-y-auto text-white animate-in fade-in duration-300"
      style={{ background: "linear-gradient(170deg, #0f4c43 0%, #0b6b5b 55%, #0e7c66 100%)" }}
      role="dialog"
      aria-label="Ruko"
    >
      <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex rounded-full bg-white/15 p-1 text-[15px] font-bold">
            {(["en", "hing"] as const).map((l) => (
              <button key={l} onClick={() => onLang(l)} aria-pressed={lang === l} className={`min-h-10 rounded-full px-4 ${lang === l ? "bg-white text-calm" : "text-white/80"}`}>
                {TOKEN[l]}
              </button>
            ))}
          </div>
          <button
            onClick={onVoice}
            aria-pressed={voice}
            aria-label={voice ? "Turn the voice off" : "Turn the voice on"}
            className="grid size-12 place-items-center rounded-full bg-white/15"
          >
            {voice ? <Volume2 className="size-6" /> : <VolumeX className="size-6" />}
          </button>
        </div>

        <div className="mt-8 mb-6 flex items-center gap-4">
          <span className="relative grid size-20 shrink-0 place-items-center rounded-full bg-white text-[34px] font-bold text-calm">
            {speaking && <span className="absolute -inset-2 animate-ping rounded-full bg-white/30" />}
            <span className="relative">R</span>
          </span>
          <span>
            <span className="block text-[26px] leading-none font-bold">Ruko</span>
            <span className="mt-1 block text-[16px] text-white/80">{lang === "en" ? "With you" : "Aapke saath"}</span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
