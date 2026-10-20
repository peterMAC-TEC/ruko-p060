"use client";

import {
  Banknote,
  Building2,
  Check,
  HelpCircle,
  Landmark,
  MessageCircleWarning,
  Mic,
  Package,
  PhoneCall,
  Shield,
  Smartphone,
  TrendingUp,
  Users,
  Video,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { BackLink, BigButton, ElderShell, StepDots, Title } from "@/components/elder/ui";
import { PostCall } from "@/components/radar/PostCall";
import { StopScreen } from "@/components/radar/StopScreen";
import { useVerifiedCalls } from "@/components/radar/VerifiedCall";
import { practiceEvent, usePatternLibrary } from "@/lib/client";
import { useLang, type UiLang } from "@/lib/i18n";
import type { Identity } from "@/lib/patterns";
import { RADAR_QUESTIONS, runRadar, STOP_THRESHOLD, type Answer, type RadarQuestion, type RadarResult, type Sensitivity } from "@/lib/radar";

// Scam Radar's guided check (v2): who they claim to be, then five yes/no
// questions. The check runs on the device against the cached pattern library,
// so the STOP screen appears the moment the second "yes" is given, even offline.

type Step = { kind: "who" } | { kind: "q"; i: number } | { kind: "say" } | { kind: "result"; r: RadarResult };

const IDENTITY_ICONS: Record<Identity, typeof Shield> = {
  police: Shield,
  courier: Package,
  bank: Landmark,
  electricity: Zap,
  customer_care: MessageCircleWarning,
  family: Users,
  investment: TrendingUp,
  video_stranger: Video,
  loan: Banknote,
  tech_support: Smartphone,
  unknown: HelpCircle,
};
const IDENTITIES = Object.keys(IDENTITY_ICONS) as Identity[];

type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
const speechLang = (lang: UiLang) => (lang === "hi" ? "hi-IN" : "en-IN");
function getRecognition(): (new () => Recognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
function speak(text: string, lang: UiLang) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = speechLang(lang);
  u.rate = 0.9;
  window.speechSynthesis.speak(u);
}
const YES = /\b(yes|yeah|haan|han|ha|ji|sahi)\b|हाँ|हां|जी/i;
const NO = /\b(no|nahi|nahin|nope)\b|नहीं|ना\b/i;

export function CheckApp({
  elderId,
  demo,
  trusted,
  sensitivity = "normal",
}: {
  elderId: string;
  demo: boolean;
  trusted?: { name: string; phone: string };
  sensitivity?: Sensitivity;
}) {
  const { t, toggle, lang } = useLang();
  const lib = usePatternLibrary();
  const bankCalls = useVerifiedCalls(elderId);
  const [step, setStep] = useState<Step>({ kind: "who" });
  const [identity, setIdentity] = useState<Identity>("unknown");
  const [answers, setAnswers] = useState<Partial<Record<RadarQuestion, Answer>>>({});
  const [said, setSaid] = useState("");
  const [listening, setListening] = useState(false);
  const [micMissing, setMicMissing] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  const [familyAlerted, setFamilyAlerted] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const triggeredAt = useRef(0);

  // Trial practice phones: note that the person opened Ruko's check.
  useEffect(() => practiceEvent(elderId, "ruko_check_opened"), [elderId]);

  const stopListening = useCallback(() => {
    rec.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => {
    if (step.kind === "q") speak(t.radarQuestions[RADAR_QUESTIONS[step.i]], lang);
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, [step, lang, t]);

  // Report the result once the STOP screen is actually on screen, with how long it took.
  const report = useCallback(
    async (r: RadarResult, finalAnswers: Partial<Record<RadarQuestion, Answer>>, finalSaid: string) => {
      const msToWarning = triggeredAt.current ? Math.round(performance.now() - triggeredAt.current) : undefined;
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ elderId, identity, answers: finalAnswers, said: finalSaid || undefined, msToWarning }),
        });
        const d = await res.json();
        if (res.ok && d.familyAlerted) setFamilyAlerted(true);
      } catch {
        // Offline: the warning has already been shown on the device, which is what matters.
      }
      if (r.level === "stop") speak(`${t.stopWord}. ${r.pattern?.rule[lang] ?? t.factLine}`, lang);
    },
    [elderId, identity, lang, t],
  );

  const finish = (finalAnswers: Partial<Record<RadarQuestion, Answer>>, finalSaid: string) => {
    triggeredAt.current = performance.now();
    const r = runRadar(lib, { identity, answers: finalAnswers, said: finalSaid, sensitivity });
    setStep({ kind: "result", r });
    if (r.level === "stop") {
      setStopOpen(true);
      practiceEvent(elderId, "stop_screen_shown");
    }
    // After paint, so the timing measures what the person actually saw.
    requestAnimationFrame(() => report(r, finalAnswers, finalSaid));
  };

  const answer = (a: Answer) => {
    if (step.kind !== "q") return;
    stopListening();
    const next = { ...answers, [RADAR_QUESTIONS[step.i]]: a };
    setAnswers(next);
    const yes = Object.values(next).filter((v) => v === "yes").length;
    // v2: two "yes" answers (or the person's chosen sensitivity) is enough. Don't make a frightened person keep going.
    if (yes >= STOP_THRESHOLD[sensitivity] || step.i === RADAR_QUESTIONS.length - 1) finish(next, said);
    else setStep({ kind: "q", i: step.i + 1 });
  };

  const listen = (mode: "answer" | "say") => {
    const R = getRecognition();
    if (!R) {
      setMicMissing(true);
      return;
    }
    const r = new R();
    r.lang = speechLang(lang);
    r.interimResults = mode === "say";
    r.continuous = mode === "say";
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((res) => res[0]?.transcript ?? "")
        .join(" ");
      if (mode === "say") setSaid(text);
      else if (YES.test(text)) answer("yes");
      else if (NO.test(text)) answer("no");
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const restart = () => {
    setAnswers({});
    setSaid("");
    setIdentity("unknown");
    setStopOpen(false);
    setFamilyAlerted(false);
    setStep({ kind: "who" });
  };

  const action =
    step.kind === "say" ? (
      <BigButton variant="brand" onClick={() => finish(answers, said)}>
        {t.next}
      </BigButton>
    ) : step.kind === "result" ? (
      <BigButton variant="secondary" onClick={restart}>
        {t.checkAgain}
      </BigButton>
    ) : undefined;

  return (
    <ElderShell t={t} brand={<RukoWordmark />} onToggleLang={toggle} action={action}>
      {demo && <p className="mb-3 self-start rounded-full bg-gold-soft px-3 py-1 text-[14px] font-bold text-warn">{t.demoBadge}</p>}

      {step.kind === "who" && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-300">
          <Title sub={t.checkIntroTitle}>{t.whoCalled}</Title>
          <div className="grid grid-cols-2 gap-3">
            {IDENTITIES.map((id) => {
              const I = IDENTITY_ICONS[id];
              return (
                <button
                  key={id}
                  onClick={() => {
                    setIdentity(id);
                    setStep({ kind: "q", i: 0 });
                  }}
                  className={`flex min-h-[96px] flex-col items-start justify-between gap-2 rounded-2xl bg-white p-4 text-left shadow-soft active:scale-[0.98] ${
                    id === "unknown" ? "col-span-2 min-h-[64px] flex-row items-center" : ""
                  }`}
                >
                  <I className="size-6 shrink-0 text-calm" strokeWidth={2.2} />
                  <span className="text-[17px] leading-snug font-bold">{t.identities[id]}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep({ kind: "say" })}
            className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-dashed border-calm/35 px-4 text-left font-bold text-calm"
          >
            <Mic className="size-6" strokeWidth={2.2} />
            {t.checkSay}
          </button>
        </div>
      )}

      {step.kind === "q" && (
        <div className="flex flex-1 flex-col gap-6" key={step.i}>
          <BackLink t={t} onBack={() => setStep(step.i === 0 ? { kind: "who" } : { kind: "q", i: step.i - 1 })} />
          <div className="flex items-center justify-between gap-3">
            <StepDots step={step.i + 1} of={RADAR_QUESTIONS.length} />
            <span className="text-[15px] text-ink-soft tabular">{t.qCount(step.i + 1, RADAR_QUESTIONS.length)}</span>
          </div>
          {identity === "bank" &&
            (bankCalls.verified.length ? (
              <p className="rounded-2xl bg-calm-soft p-4 text-[17px] font-bold text-calm" role="status">
                ✓ {t.realBankCall} {bankCalls.verified[0].payload.agent} · {bankCalls.verified[0].payload.code}
              </p>
            ) : (
              <p className="rounded-2xl bg-warn-soft p-4 text-[17px] font-bold text-warn" role="status">
                {t.noBankCall}
              </p>
            ))}
          <h1 className="text-[28px] leading-[1.2] font-bold tracking-tight animate-in fade-in slide-in-from-bottom-1 duration-300">
            {t.radarQuestions[RADAR_QUESTIONS[step.i]]}
          </h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => speak(t.radarQuestions[RADAR_QUESTIONS[step.i]], lang)}
              className="flex min-h-12 items-center gap-2 rounded-full bg-white px-4 text-[16px] font-bold shadow-soft"
            >
              <Volume2 className="size-5 text-calm" />
              {t.readAloud}
            </button>
            <button
              onClick={() => (listening ? stopListening() : listen("answer"))}
              className={`flex min-h-12 items-center gap-2 rounded-full px-4 text-[16px] font-bold shadow-soft ${listening ? "bg-calm text-white" : "bg-white"}`}
            >
              <Mic className={`size-5 ${listening ? "animate-pulse" : "text-calm"}`} />
              {listening ? t.listening : t.listen}
            </button>
          </div>
          {micMissing && <p className="text-[16px] text-ink-soft">{t.noMic}</p>}
          <div className="mt-auto grid grid-cols-2 gap-3">
            <button onClick={() => answer("yes")} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-ink text-[22px] font-bold text-white active:scale-[0.98]">
              <Check className="size-7" strokeWidth={2.6} />
              {t.yes}
            </button>
            <button onClick={() => answer("no")} className="flex min-h-20 flex-col items-center justify-center gap-1 rounded-2xl bg-white text-[22px] font-bold shadow-soft active:scale-[0.98]">
              <X className="size-7" strokeWidth={2.6} />
              {t.no}
            </button>
            <button
              onClick={() => answer("unsure")}
              className="col-span-2 flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-ink/12 bg-white text-[19px] font-bold"
            >
              <HelpCircle className="size-5" />
              {t.unsure}
            </button>
          </div>
        </div>
      )}

      {step.kind === "say" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => setStep({ kind: "who" })} />
          <Title>{t.checkSay}</Title>
          <button
            onClick={() => (listening ? stopListening() : listen("say"))}
            className={`flex min-h-20 items-center justify-center gap-3 rounded-2xl text-[21px] font-bold shadow-soft ${listening ? "bg-calm text-white" : "bg-white"}`}
          >
            <Mic className={`size-7 ${listening ? "animate-pulse" : "text-calm"}`} strokeWidth={2.2} />
            {listening ? t.stopListening : t.listen}
          </button>
          {micMissing && <p className="text-[16px] text-ink-soft">{t.noMic}</p>}
          <textarea
            value={said}
            onChange={(e) => setSaid(e.target.value)}
            placeholder={t.typeHere}
            rows={4}
            className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-[20px] shadow-soft outline-none focus:border-calm"
          />
        </div>
      )}

      {step.kind === "result" && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-300">
          {step.r.level !== "stop" && (
            <section className={`rounded-[28px] p-6 ${step.r.level === "caution" ? "bg-warn-soft" : "bg-calm-soft"}`}>
              <h1 className="text-[28px] leading-tight font-bold tracking-tight">
                {step.r.level === "caution" ? t.cautionTitle : t.clearTitle}
              </h1>
              <p className="mt-2 text-[19px]">{step.r.level === "caution" ? t.cautionBody : t.clearBody}</p>
              {step.r.level === "caution" && step.r.pattern && (
                <p className="mt-3 text-[18px] font-bold">{step.r.pattern.rule[lang]}</p>
              )}
            </section>
          )}
          {step.r.level === "stop" && !stopOpen && (
            <section className="rounded-[28px] bg-alarm-soft p-6">
              <p className="text-[15px] font-bold tracking-wide text-alarm uppercase">{t.stopIntro}</p>
              <h1 className="mt-1 text-[26px] leading-tight font-bold">{step.r.pattern?.name[lang] ?? t.verdictHigh}</h1>
              <p className="mt-2 text-[18px]">{step.r.pattern?.rule[lang] ?? t.factLine}</p>
              {familyAlerted && <p className="mt-3 font-bold text-calm">✓ {t.familyTold}</p>}
            </section>
          )}
          {trusted && (
            <a
              href={`tel:${trusted.phone.replace(/\s/g, "")}`}
              className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-calm text-[20px] font-bold text-white"
            >
              <PhoneCall className="size-6" />
              {t.callTrusted(trusted.name.split(" ")[0])}
            </a>
          )}
          <PostCall t={t} patternId={step.r.pattern?.id} warned={step.r.level !== "clear"} />
          <Link href="/help" className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border-2 border-alarm/30 text-[18px] font-bold text-alarm">
            <Building2 className="size-5" />
            {t.alreadyPaid}
          </Link>
        </div>
      )}

      {step.kind === "result" && step.r.level === "stop" && stopOpen && (
        <StopScreen
          t={t}
          lang={lang}
          pattern={step.r.pattern}
          trusted={trusted}
          familyAlerted={familyAlerted}
          onHungUp={() => setTimeout(() => setStopOpen(false), 2500)}
        />
      )}
    </ElderShell>
  );
}
