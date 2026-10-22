"use client";

import {
  Banknote,
  Building2,
  Camera,
  Check,
  HelpCircle,
  Landmark,
  MessageCircle,
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
import { Guardian } from "@/components/brand/Guardian";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { BackLink, BigButton, ElderShell, StepDots, Title } from "@/components/elder/ui";
import { CompanionApp } from "@/components/companion/CompanionApp";
import { PostCall } from "@/components/radar/PostCall";
import { StopScreen } from "@/components/radar/StopScreen";
import { useVerifiedCalls } from "@/components/radar/VerifiedCall";
import { practiceEvent, usePatternLibrary } from "@/lib/client";
import { compressImage } from "@/lib/image";
import { SIGN_TEXT, signsToAnswers, withSigns, type Sign } from "@/lib/signs";
import { waLink } from "@/lib/utils";
import { useVoiceCapture } from "@/lib/voice-capture";
import { useLang, type UiLang } from "@/lib/i18n";
import type { Identity } from "@/lib/patterns";
import { hasEnoughToJudge, RADAR_QUESTIONS, runRadar, STOP_THRESHOLD, type Answer, type RadarQuestion, type RadarResult, type Sensitivity } from "@/lib/radar";

// Scam Radar's guided check (v2): who they claim to be, then five yes/no
// questions. The check runs on the device against the cached pattern library,
// so the STOP screen appears the moment the second "yes" is given, even offline.
// Or: tell Ruko what they said (voice or typing), or show a photo. The AI
// (/api/check/read) finds warning signs with evidence; code decides the verdict
// (lib/signs.ts). Without the AI, the phone's own phrase check answers.

type Step = { kind: "who" } | { kind: "q"; i: number } | { kind: "say" } | { kind: "photo" } | { kind: "result"; r: RadarResult };
type ReadReply =
  | { ok: true; heard: string; identity: Identity; patternId: string | null; signs: Sign[] }
  | { ok: false; reason?: string };
type FinishExtra = { identity: Identity; signs?: Sign[]; patternId?: string | null };

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
  elderName,
  sensitivity = "normal",
  sharedText,
}: {
  elderId: string;
  demo: boolean;
  trusted?: { name: string; phone: string };
  elderName?: string;
  sensitivity?: Sensitivity;
  /** Text shared to Ruko from another app: shown in the "tell me what they said" box for the person to check. */
  sharedText?: string;
}) {
  const { t, toggle, lang } = useLang();
  const lib = usePatternLibrary();
  const bankCalls = useVerifiedCalls(elderId);
  const [step, setStep] = useState<Step>(sharedText ? { kind: "say" } : { kind: "who" });
  const [identity, setIdentity] = useState<Identity>("unknown");
  const [answers, setAnswers] = useState<Partial<Record<RadarQuestion, Answer>>>({});
  const [said, setSaid] = useState(sharedText ?? "");
  // The shared text was only kept for two minutes; clear it now that the person has it.
  useEffect(() => {
    if (sharedText) document.cookie = "ruko_shared=; path=/check; max-age=0";
  }, [sharedText]);
  const [listening, setListening] = useState(false);
  const [micMissing, setMicMissing] = useState(false);
  const [stopOpen, setStopOpen] = useState(false);
  /** After "Hang up" on the STOP screen, Ruko stays with the person. */
  const [companion, setCompanion] = useState(false);
  const [familyAlerted, setFamilyAlerted] = useState(false);
  const [signs, setSigns] = useState<Sign[] | null>(null);
  /** Who answered: the AI, the phone's own phrase check, or nobody (couldn't check). */
  const [engine, setEngine] = useState<"ai" | "local" | "none" | null>(null);
  // A "clear" with almost nothing told is not an all-clear: say so and ask for more.
  const needMore = step.kind === "result" && step.r.level === "clear" && engine !== "none" && !hasEnoughToJudge(answers, said);
  const [busy, setBusy] = useState(false);
  /** The free AI tier can take 20 s or more: after a few seconds, say what to do meanwhile. */
  const [slow, setSlow] = useState(false);
  /** STOP is on screen and the AI is still adding its evidence. */
  const [aiPending, setAiPending] = useState(false);
  /** Each check gets a number, so a late AI answer never lands on a newer check. */
  const runId = useRef(0);
  const [clip, setClip] = useState<Blob | null>(null);
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const rec = useRef<Recognition | null>(null);
  const triggeredAt = useRef(0);
  const voice = useVoiceCapture(lang, (o) => {
    if (o.engine === "browser") {
      setSaid((prev) => (prev.trim() ? `${prev.trim()} ${o.transcript}` : o.transcript));
      setClip(null);
    } else setClip(o.audio);
  });
  const recording = voice.state === "listening";

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
    async (r: RadarResult, finalAnswers: Partial<Record<RadarQuestion, Answer>>, finalSaid: string, extra: FinishExtra) => {
      const msToWarning = triggeredAt.current ? Math.round(performance.now() - triggeredAt.current) : undefined;
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            elderId,
            identity: extra.identity,
            answers: finalAnswers,
            said: finalSaid || undefined,
            msToWarning,
            // Sent whenever the AI ran, even empty: "the AI read it and found nothing" matters to the verdict.
            signs: extra.signs,
            patternId: extra.patternId ?? undefined,
          }),
        });
        const d = await res.json();
        if (res.ok && d.familyAlerted) setFamilyAlerted(true);
      } catch {
        // Offline: the warning has already been shown on the device, which is what matters.
      }
      if (r.level === "stop") speak(`${t.stopWord}. ${r.pattern?.rule[lang] ?? t.factLine}`, lang);
    },
    [elderId, lang, t],
  );

  const finish = (finalAnswers: Partial<Record<RadarQuestion, Answer>>, finalSaid: string, extra: FinishExtra = { identity }) => {
    triggeredAt.current = performance.now();
    const radar = runRadar(lib, { identity: extra.identity, answers: finalAnswers, said: finalSaid, sensitivity });
    const r = extra.signs ? withSigns(radar, extra.signs, lib, extra.patternId) : radar;
    setStep({ kind: "result", r });
    if (r.level === "stop") {
      setStopOpen(true);
      practiceEvent(elderId, "stop_screen_shown");
    }
    // After paint, so the timing measures what the person actually saw.
    requestAnimationFrame(() => report(r, finalAnswers, finalSaid, extra));
  };

  // "Check this": the AI reads the words, the voice clip or the photo into signs.
  // Free-tier AI can take 20-30 s, so the phone never makes a frightened person wait for it:
  // when the words already match a known scam, STOP shows at once from the phone's own check
  // and the AI's evidence arrives after; otherwise words wait at most 10 s for the AI.
  const askAi = async (form: FormData, timeoutMs: number): Promise<ReadReply> => {
    try {
      const res = await fetch("/api/check/read", { method: "POST", body: form, signal: AbortSignal.timeout(timeoutMs) });
      return await res.json();
    } catch {
      return { ok: false, reason: "offline" };
    }
  };

  const runCheck = async (source: "say" | "photo") => {
    if (busy) return;
    const form = new FormData();
    form.append("elderId", elderId);
    const words = source === "say" ? said.trim() : "";
    if (source === "photo") {
      if (!photo) return;
      form.append("image", photo.blob, "photo.jpg");
    } else if (words) form.append("transcript", words);
    else if (clip) form.append("audio", clip, `voice.${clip.type.includes("mp4") ? "mp4" : clip.type.includes("ogg") ? "ogg" : "webm"}`);
    else return;
    const run = ++runId.current;

    if (words && runRadar(lib, { identity, answers, said: words, sensitivity }).level === "stop") {
      setSigns(null);
      setEngine("local");
      finish(answers, words);
      setAiPending(true);
      const reply = await askAi(form, 35_000);
      if (run !== runId.current) return;
      setAiPending(false);
      // The family was already alerted by the STOP; the AI only adds what it noticed, with the words.
      if (reply.ok) {
        setSigns(reply.signs);
        setEngine("ai");
      }
      return;
    }

    setBusy(true);
    const slowTimer = setTimeout(() => setSlow(true), 4000);
    const reply = await askAi(form, words ? 10_000 : 35_000);
    clearTimeout(slowTimer);
    if (run !== runId.current) return;
    setSlow(false);
    setBusy(false);
    if (reply.ok) {
      const who = identity !== "unknown" ? identity : reply.identity;
      setIdentity(who);
      setSigns(reply.signs);
      setEngine("ai");
      finish(signsToAnswers(reply.signs, answers), reply.heard, { identity: who, signs: reply.signs, patternId: reply.patternId });
      return;
    }
    setSigns(null);
    // The AI is busy or off: the phone's own phrase check, when there are words to check.
    if (words) {
      setEngine("local");
      finish(answers, words);
      return;
    }
    // Nothing could be checked (a photo or a clip without the AI). Never say "fine": send them to family.
    setEngine("none");
    setStep({ kind: "result", r: { level: "caution", yes: 0, pattern: null, signals: ["check_unavailable"] } });
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    const blob = await compressImage(file);
    setPhoto((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return { blob, url: URL.createObjectURL(blob) };
    });
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

  const listen = () => {
    const R = getRecognition();
    if (!R) {
      setMicMissing(true);
      return;
    }
    const r = new R();
    r.lang = speechLang(lang);
    r.interimResults = false;
    r.continuous = false;
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((res) => res[0]?.transcript ?? "")
        .join(" ");
      if (YES.test(text)) answer("yes");
      else if (NO.test(text)) answer("no");
    };
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    rec.current = r;
    setListening(true);
    r.start();
  };

  const restart = () => {
    runId.current++;
    setBusy(false);
    setSlow(false);
    setAiPending(false);
    voice.stop();
    setAnswers({});
    setSaid("");
    setClip(null);
    setPhoto((old) => {
      if (old) URL.revokeObjectURL(old.url);
      return null;
    });
    setSigns(null);
    setEngine(null);
    setIdentity("unknown");
    setStopOpen(false);
    setFamilyAlerted(false);
    setStep({ kind: "who" });
  };

  const slowNote = slow && (
    <p className="mb-3 rounded-2xl bg-warn-soft p-4 text-[19px] font-bold text-warn" role="status">
      {t.stillChecking}
    </p>
  );
  const action =
    step.kind === "say" ? (
      <>
        {slowNote}
        <BigButton variant="brand" disabled={busy || recording || (!said.trim() && !clip)} onClick={() => void runCheck("say")}>
          {busy ? t.checking : t.checkThis}
        </BigButton>
      </>
    ) : step.kind === "photo" ? (
      <>
        {slowNote}
        <BigButton variant="brand" disabled={busy || !photo} onClick={() => void runCheck("photo")}>
          {busy ? t.checking : t.checkThis}
        </BigButton>
      </>
    ) : step.kind === "result" ? (
      <BigButton variant="secondary" onClick={restart}>
        {t.checkAgain}
      </BigButton>
    ) : undefined;

  return (
    <ElderShell t={t} brand={<RukoWordmark />} onToggleLang={toggle} action={action}>
      {demo && <p className="mb-3 self-start rounded-full bg-paper-2 px-3 py-1 text-[14px] font-semibold text-ink-soft">{t.demoBadge}</p>}

      {step.kind === "who" && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Title sub={t.checkIntroTitle}>{t.whoCalled}</Title>
            </div>
            <Guardian mood="safe" className="size-16" />
          </div>
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
          <button
            onClick={() => setStep({ kind: "photo" })}
            className="-mt-2 flex min-h-14 items-center gap-3 rounded-2xl border-2 border-dashed border-calm/35 px-4 py-3 text-left leading-snug font-bold text-calm"
          >
            <Camera className="size-6" strokeWidth={2.2} />
            {t.checkShow}
          </button>
        </div>
      )}

      {step.kind === "q" && (
        <div className="flex flex-1 flex-col gap-6" key={step.i}>
          <BackLink t={t} onBack={() => setStep(step.i === 0 ? { kind: "who" } : { kind: "q", i: step.i - 1 })} />
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[20px] font-semibold tabular">{t.qCount(step.i + 1, RADAR_QUESTIONS.length)}</span>
              <StepDots step={step.i + 1} of={RADAR_QUESTIONS.length} />
            </div>
            <Guardian mood="checking" className="size-14" />
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
          <h1 className="display text-[40px] leading-[1.06] m-slide">
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
              onClick={() => (listening ? stopListening() : listen())}
              className={`flex min-h-12 items-center gap-2 rounded-full px-4 text-[16px] font-bold shadow-soft ${listening ? "bg-calm text-white" : "bg-white"}`}
            >
              <Mic className={`size-5 ${listening ? "animate-pulse" : "text-calm"}`} />
              {listening ? t.listening : t.listen}
            </button>
          </div>
          {micMissing && <p className="text-[16px] text-ink-soft">{t.noMic}</p>}
          <div className="mt-auto grid grid-cols-2 gap-3">
            <button onClick={() => answer("yes")} className="press flex min-h-[112px] flex-col items-center justify-center gap-1 rounded-2xl bg-ink text-[30px] font-bold text-white">
              <Check className="size-7" strokeWidth={2.6} />
              {t.yes}
            </button>
            <button onClick={() => answer("no")} className="press flex min-h-[112px] flex-col items-center justify-center gap-1 rounded-2xl bg-white text-[30px] font-bold shadow-soft">
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
          <BackLink
            t={t}
            onBack={() => {
              voice.stop();
              setStep({ kind: "who" });
            }}
          />
          <Title sub={t.saySub}>{t.sayTitle}</Title>
          {sharedText && said === sharedText && (
            <p className="rounded-2xl bg-safe-soft p-4 text-[18px] leading-snug text-safe" role="status">
              {lang === "en" ? "This came from another app. Read it, change it if you like, then tap Check this." : "Yeh doosre app se aaya hai. Padhiye, chahein to badlein, phir Check this dabaiye."}
            </p>
          )}
          {voice.supported ? (
            <button
              onClick={() => (recording ? voice.stop() : void voice.start())}
              aria-pressed={recording}
              className={`flex min-h-24 items-center justify-center gap-3 rounded-[28px] text-[23px] font-bold shadow-soft transition ${
                recording ? "scale-[1.02] bg-calm text-white" : "bg-white"
              }`}
            >
              <Mic className={`size-8 ${recording ? "animate-pulse" : "text-calm"}`} strokeWidth={2.2} />
              {recording ? t.tapToFinish : t.tapToTalk}
            </button>
          ) : (
            <p className="text-[17px] text-ink-soft">{t.noMic}</p>
          )}
          {recording && (
            <p className="rounded-2xl bg-white p-4 text-[20px] leading-snug shadow-soft" aria-live="polite">
              {voice.engine === "audio" ? t.recordingNote : voice.interim || t.listening}
            </p>
          )}
          {clip && !said.trim() && !recording && <p className="text-[18px] font-bold text-calm">✓ {t.recorded}</p>}
          {voice.error && <p className="text-[17px] font-bold text-warn">{t.voiceErrors[voice.error]}</p>}
          <label className="flex flex-col gap-2">
            <span className="text-[16px] font-bold text-ink-soft">{t.orType}</span>
            <textarea
              value={said}
              onChange={(e) => setSaid(e.target.value)}
              placeholder={t.typeHere}
              rows={4}
              className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-[20px] shadow-soft outline-none focus:border-calm"
            />
          </label>
        </div>
      )}

      {step.kind === "photo" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => setStep({ kind: "who" })} />
          <Title sub={t.photoSub}>{t.photoTitle}</Title>
          {photo && (
            // eslint-disable-next-line @next/next/no-img-element -- a local blob preview, nothing to optimise
            <img src={photo.url} alt="" className="max-h-[40dvh] w-full rounded-2xl bg-white object-contain shadow-soft" />
          )}
          <label className="flex min-h-20 cursor-pointer items-center justify-center gap-3 rounded-[28px] bg-white text-[21px] font-bold shadow-soft active:scale-[0.98]">
            <Camera className="size-7 text-calm" strokeWidth={2.2} />
            {photo ? t.retakePhoto : t.takePhoto}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                void pickPhoto(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {step.kind === "result" && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-300">
          {step.r.level !== "stop" && (
            <section className={`rounded-[28px] p-6 ${step.r.level === "clear" && !needMore ? "bg-calm-soft" : "bg-warn-soft"}`}>
              <h1 className="display text-[38px] leading-[1.06]">
                {needMore ? t.needMoreTitle : step.r.level === "caution" ? t.cautionTitle : t.clearTitle}
              </h1>
              <p className="mt-2 text-[19px]">
                {engine === "none" ? t.couldNotCheck : needMore ? t.needMoreBody : step.r.level === "caution" ? t.cautionBody : t.clearBody}
              </p>
              {step.r.level === "caution" && step.r.pattern && (
                <p className="mt-3 text-[18px] font-bold">{step.r.pattern.rule[lang]}</p>
              )}
            </section>
          )}
          {step.r.level === "stop" && !stopOpen && (
            <section className="rounded-[28px] bg-alarm-soft p-6">
              <p className="text-[15px] font-bold tracking-wide text-alarm uppercase">{t.stopIntro}</p>
              <h1 className="display mt-1 text-[34px] leading-[1.05]">{step.r.pattern?.name[lang] ?? t.verdictHigh}</h1>
              <p className="mt-2 text-[18px]">{step.r.pattern?.rule[lang] ?? t.factLine}</p>
              {familyAlerted && <p className="mt-3 font-bold text-calm">✓ {t.familyTold}</p>}
            </section>
          )}
          {signs && signs.length > 0 && (
            <section className="rounded-[28px] bg-white p-5 shadow-soft" aria-live="polite">
              <h2 className="text-[20px] font-bold">{t.noticed}</h2>
              <ul className="mt-3 flex flex-col gap-4">
                {signs.map((sg) => (
                  <li key={sg.id}>
                    <p className="text-[19px] leading-snug font-bold">{SIGN_TEXT[sg.id][lang]}</p>
                    <p className="mt-1 text-[17px] leading-snug text-ink-soft">&ldquo;{sg.evidence}&rdquo;</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {needMore && (
            <BigButton variant="brand" onClick={() => setStep({ kind: "say" })}>
              {t.needMoreAsk}
            </BigButton>
          )}
          {engine === "ai" && signs?.length === 0 && <p className="text-[18px] text-ink-soft">{t.noticedNone}</p>}
          {aiPending && (
            <p className="text-[16px] text-ink-soft" role="status">
              {t.aiDoubleChecking}
            </p>
          )}
          {engine === "local" && !aiPending && <p className="text-[16px] text-ink-soft">{t.checkedOnPhone}</p>}
          {trusted && (
            <a
              href={`tel:${trusted.phone.replace(/\s/g, "")}`}
              className="flex min-h-16 items-center justify-center gap-3 rounded-2xl bg-calm text-[20px] font-bold text-white"
            >
              <PhoneCall className="size-6" />
              {t.callTrusted(trusted.name.split(" ")[0])}
            </a>
          )}
          {trusted && step.r.level !== "clear" && (
            <a
              href={waLink(trusted.phone, t.whatsappText(elderName?.split(" ")[0] ?? ""))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-16 items-center justify-center gap-3 rounded-2xl border-2 border-calm/40 bg-white text-[19px] font-bold text-calm"
            >
              <MessageCircle className="size-6" />
              {t.whatsappFamily(trusted.name.split(" ")[0])}
            </a>
          )}
          {!needMore && <PostCall t={t} patternId={step.r.pattern?.id} warned={step.r.level !== "clear"} />}
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
          elderName={elderName}
          onHungUp={() => {
            setStopOpen(false);
            setCompanion(true);
          }}
        />
      )}

      {companion && <CompanionApp elderId={elderId} trusted={trusted} onClose={() => setCompanion(false)} />}
    </ElderShell>
  );
}
