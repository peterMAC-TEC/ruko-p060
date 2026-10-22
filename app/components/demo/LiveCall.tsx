"use client";

import { Mic, Phone, PhoneOff } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Guardian } from "@/components/brand/Guardian";
import { CompanionApp } from "@/components/companion/CompanionApp";
import { VoiceTrust } from "@/components/demo/VoiceTrust";
import { demoOffline } from "@/lib/demo-mode";
import { extractName, FILLERS, objectionOf, type Objection } from "@/lib/officer-brain";
import { officerNext, officerOpen, officerStart, rukoShouldStep, STAGES, tacticsUsed, TACTIC_LABEL, type Lang, type OfficerState } from "@/lib/demo-officer";
import { classify } from "@/lib/bots/intent";
import { BUNDLED_LIBRARY } from "@/lib/patterns";
import { runRadar } from "@/lib/radar";
import { SCALE, stoppedBeforePay } from "@/lib/trial";
import { clipPlan, RUKO_STOP, type LiveManifest } from "@/lib/live-audio";
import { hush as speechHush, ring } from "@/lib/voice";
import { CallTimeline, KaraokeCaption, TacticChip, TensionMeter, Waveform } from "@/components/motion/call-motion";
import { MotionToggle } from "@/components/motion/motion";
import { CallerFace, SilhouetteToShield } from "@/components/character/CallerFace";
import { expressionFor, type CallerExpression } from "@/lib/caller-expression";
import { TACTIC_WHY } from "@/lib/tactic-explain";

// The recorded clip that is playing now (if any), so "hush" can stop it as fast as it stops the browser voice.
let activeClip: HTMLAudioElement | null = null;
function hush() {
  speechHush();
  if (activeClip) {
    activeClip.pause();
    activeClip = null;
  }
}

// The live demo call. YOU are the older person; a fictional officer phones you and runs the seven stages of a "digital
// arrest" call, by voice, and you really can resist him (he has a counter for each objection, and always gets to the
// money within about 90 seconds). When he asks for money, Ruko's own scam check says STOP, and you choose how it ends.
//
// It is a SIMULATION inside this page: nothing rings a real phone, nothing is recorded, nothing you say is stored
// (it lives in memory and is gone when the call ends), and the bank is a practice bank. Only signal codes are kept.

type Phase = "consent" | "incoming" | "call" | "stop" | "endA" | "endB" | "result";
type Ending = "A" | "B";
type Tx = { id: string; status: string; amount: number } | null;

const DEMO_NUMBER = "+91 99999 00417";
const STOP_WORD = /\bru+k+h?o+\b|रुको|रूको/i;
const CODE_WORD = "mango";

const OBJ_LABEL: Record<Objection, [string, string]> = {
  doubt: ["You: doubting who he is", "Aap: uski pehchaan par shak"],
  department: ["You: asked which department", "Aap: kaunsa department poochha"],
  family: ["You: wants to call family", "Aap: parivar ko phone karna chahte hain"],
  no_money: ["You: says no money", "Aap: paise nahi hain"],
  angry: ["You: angry", "Aap: gusse mein"],
  scared: ["You: scared", "Aap: dare hue"],
  refuse: ["You: refusing", "Aap: mana kar rahe hain"],
  leave: ["You: trying to hang up", "Aap: call kaatna chahte hain"],
  ask_bot: ["You: asked if he is a bot", "Aap: poochha kya yeh bot hai"],
  written: ["You: wants it in writing", "Aap: likhit mein maang rahe hain"],
};

// ---- speech out ---------------------------------------------------------------------------------------------------
function chooseVoice(role: "officer" | "ruko"): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const en = window.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang));
  const natural = en.filter((v) => /natural|online/i.test(v.name));
  const indian = (a: SpeechSynthesisVoice[]) => a.filter((v) => /en[-_]IN/i.test(v.lang));
  const pool = indian(natural).length ? indian(natural) : natural.length ? natural : indian(en).length ? indian(en) : en;
  const male = pool.filter((v) => /prabhat|ravi|hemant|male|david|mark|james|guy|george|ryan|daniel/i.test(v.name) && !/female/i.test(v.name));
  const female = pool.filter((v) => /neerja|heera|swara|female|zira|aria|jenny|sonia|libby|samantha|veena|kalpana/i.test(v.name));
  return role === "officer" ? (male[0] ?? pool[0]) : (female[0] ?? pool[1] ?? pool[0]);
}

// ---- speech in ----------------------------------------------------------------------------------------------------
type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
function getRecognition(): (new () => Rec) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const words = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);

export function LiveCall({ elderId, demo, trusted }: { elderId: string; demo: boolean; trusted?: { name: string; phone: string } }) {
  const [lang, setLang] = useState<Lang>("en");
  const [phase, setPhase] = useState<Phase>("consent");
  const [officerLine, setOfficerLine] = useState("");
  const [prevLine, setPrevLine] = useState("");
  const [expression, setExpression] = useState<CallerExpression>("friendly");
  const lineRef = useRef("");
  const levelRef = useRef(0);
  const [pressure, setPressure] = useState(0);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  // The caller's voice, measured while it plays (a Web Audio analyser), so the waveform moves with the real sound.
  const outCtx = useRef<AudioContext | null>(null);
  const outAnalyser = useRef<AnalyserNode | null>(null);
  const capRef = useRef<{ start: number; total: number; base: number; audio: HTMLAudioElement | null } | null>(null);
  const [you, setYou] = useState("");
  const [typed, setTyped] = useState("");
  const [status, setStatus] = useState<"speaking" | "listening" | "thinking" | "">("");
  const [seconds, setSeconds] = useState(0);
  const [micOk, setMicOk] = useState(true);
  // Voice first: the mic is tested before the call, the level is shown during it, and typing is only a fallback.
  const [micTest, setMicTest] = useState<"idle" | "asking" | "ok" | "blocked" | "none">("idle");
  const [level, setLevel] = useState(0);
  const [heardYou, setHeardYou] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showType, setShowType] = useState(false);
  const [canListen, setCanListen] = useState(true);
  const urgencyRef = useRef(0);
  const showLine = (t: string) => {
    setPrevLine(lineRef.current);
    lineRef.current = t;
    setOfficerLine(t);
  };
  const liveManifest = useRef<LiveManifest | null>(null);
  const langRef = useRef(lang);
  langRef.current = lang;
  const [aiWording, setAiWording] = useState(true);
  // What Ruko is "hearing", shown live: its own scam check on what the caller has said, the tactics it spotted, and how you sounded.
  const [hud, setHud] = useState<{ level: "clear" | "caution" | "stop"; tactics: string[]; objection: Objection | null; source: "ai" | "recorded" | null; reading: boolean }>({ level: "clear", tactics: [], objection: null, source: null, reading: false });
  const aiWordingRef = useRef(false);
  aiWordingRef.current = aiWording;
  const [sources, setSources] = useState<string[]>([]);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [ending, setEnding] = useState<Ending | null>(null);
  const [familyAlerted, setFamilyAlerted] = useState<boolean | null>(null);
  const [tactics, setTactics] = useState<string[]>([]);
  const [agreedSecret, setAgreedSecret] = useState(false);
  const [tx, setTx] = useState<Tx>(null);
  const [showFamily, setShowFamily] = useState(false);
  const [companion, setCompanion] = useState(false);
  const [endedBy, setEndedBy] = useState<"stop_word" | "payment" | null>(null);

  const run = useRef(0);
  const stopRing = useRef<(() => void) | null>(null);
  const rec = useRef<Rec | null>(null);
  const heard = useRef({ text: "", final: false, at: 0 });
  const typedResolver = useRef<((t: string) => void) | null>(null);
  const callStart = useRef(0);
  const bankOpenedAt = useRef(0);
  const speaking = useRef("");
  const offline = useRef(false);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const meterTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Continuous recognition keeps every result since it started. Each turn only reads what came AFTER the turn began.
  const lastLen = useRef(0);
  const heardBase = useRef(0);
  const mutedRef = useRef(false);

  // ---- helpers ----
  const stopEverything = useCallback(() => {
    run.current++;
    stopRing.current?.();
    stopRing.current = null;
    hush();
    try {
      rec.current?.abort();
    } catch {
      // Not running.
    }
    rec.current = null;
    typedResolver.current = null;
    if (meterTimer.current) clearInterval(meterTimer.current);
    meterTimer.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
  }, []);
  useEffect(() => stopEverything, [stopEverything]);

  // Can this browser listen at all? (Chrome and Edge can; some others cannot.)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanListen(Boolean(getRecognition()));
  }, []);

  /** Ask for the microphone now (before the call), and show a live level so the person can see it works. */
  const testMic = useCallback(async () => {
    setMicTest("asking");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = s;
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) {
        audioCtx.current?.close().catch(() => {});
        const ctx = new AC();
        audioCtx.current = ctx;
        const an = ctx.createAnalyser();
        an.fftSize = 512;
        ctx.createMediaStreamSource(s).connect(an);
        const buf = new Uint8Array(an.fftSize);
        if (meterTimer.current) clearInterval(meterTimer.current);
        meterTimer.current = setInterval(() => {
          an.getByteTimeDomainData(buf);
          let sum = 0;
          for (const v of buf) {
            const d = (v - 128) / 128;
            sum += d * d;
          }
          const l = Math.min(1, Math.sqrt(sum / buf.length) * 6);
          setLevel(l);
          levelRef.current = l;
          if (l > 0.18) setHeardYou(true);
        }, 100);
      }
      setMicTest("ok");
      setMicOk(true);
    } catch (e) {
      setMicTest((e as DOMException)?.name === "NotFoundError" ? "none" : "blocked");
      setMicOk(false);
    }
  }, []);

  // Clock on the call screen.
  useEffect(() => {
    if (phase !== "call") return;
    const t = setInterval(() => setSeconds(Math.round((Date.now() - callStart.current) / 1000)), 500);
    return () => clearInterval(t);
  }, [phase]);

  const startRecognition = useCallback(() => {
    const R = getRecognition();
    if (!R) {
      setMicOk(false);
      return;
    }
    const r = new R();
    r.lang = "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      const list = Array.from(e.results);
      lastLen.current = list.length;
      // Only what was said since this turn began (the session keeps older results too).
      const text = list.slice(Math.min(heardBase.current, list.length)).map((x) => x[0]?.transcript ?? "").join(" ").trim();
      heard.current = { text, final: Boolean(list[list.length - 1]?.isFinal), at: Date.now() };
      setYou(text);
    };
    r.onend = () => {
      // Chrome ends continuous recognition now and then: start it again for as long as the call runs.
      if (rec.current === r && !mutedRef.current) {
        lastLen.current = 0;
        heardBase.current = 0;
        try {
          r.start();
        } catch {
          // Already starting.
        }
      }
    };
    r.onerror = (ev) => {
      // A moment of silence ("no-speech") or a short break ("aborted", "network") is normal: keep listening. Only a real
      // permission or device problem means the microphone is not available.
      const code = ev?.error;
      if (code === "not-allowed" || code === "service-not-allowed" || code === "audio-capture") {
        setMicOk(false);
        setMicTest(code === "audio-capture" ? "none" : "blocked");
      }
    };
    rec.current = r;
    try {
      r.start();
    } catch {
      setMicOk(false);
    }
  }, []);

  /** The officer speaks. Resolves "done", "stop" (the stop word was heard) or "barged" (the person started talking over him). */
  const say = useCallback((text: string, role: "officer" | "ruko", id: number): Promise<"done" | "stop" | "barged"> => {
    return new Promise((resolve) => {
      speaking.current = text;
      hush();
      heard.current = { text: "", final: false, at: 0 };
      heardBase.current = lastLen.current;
      setStatus("speaking");
      let finished = false;
      const finish = (r: "done" | "stop" | "barged") => {
        if (finished) return;
        finished = true;
        clearInterval(poll);
        clearTimeout(guard);
        speaking.current = "";
        resolve(r);
      };
      const guard = setTimeout(() => {
        hush();
        finish("done");
      }, Math.min(30_000, 2500 + text.split(/\s+/).length * 600));
      const poll = setInterval(() => {
        if (id !== run.current) return finish("done");
        const h = heard.current.text;
        if (STOP_WORD.test(h)) {
          hush();
          return finish("stop");
        }
        // Talking over him: at least two words that are not just his own voice coming back through the speakers.
        if (role === "officer" && h) {
          const mine = new Set(words(text));
          const w = words(h);
          const own = w.filter((x) => mine.has(x)).length / Math.max(1, w.length);
          if (w.length >= 2 && own < 0.4) {
            hush();
            return finish("barged");
          }
        }
      }, 80);
      let spokeInBrowser = false;
      const browserVoice = () => {
        if (spokeInBrowser || finished) return;
        spokeInBrowser = true;
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          setTimeout(() => finish("done"), Math.min(12_000, 1500 + text.split(/\s+/).length * 380));
          return;
        }
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "en-IN";
        const v = chooseVoice(role);
        if (v) u.voice = v;
        u.pitch = role === "officer" ? 0.75 : 1;
        // The officer starts calm and slow and speeds up a little as the call goes on (rising urgency); Ruko stays slow and even.
        u.rate = role === "officer" ? Math.min(1.14, 0.96 + urgencyRef.current * 0.03) : 0.92;
        u.onend = () => finish("done");
        u.onerror = () => finish("done");
        window.speechSynthesis.speak(u);
      };
      // Recorded natural voice first (the same quality as the "Watch Ruko step in" demo); the browser's voice only for lines with no recording.
      const L = langRef.current;
      const plan = clipPlan(role, L, text, liveManifest.current);
      const clipSecs = plan ? plan.reduce((t, k) => t + (liveManifest.current?.[L]?.[k] ?? 0), 0) : 0;
      capRef.current = { start: Date.now(), total: clipSecs || Math.max(1.5, text.split(/\s+/).length / 2.6), base: 0, audio: null };
      if (!plan) return browserVoice();
      let k = 0;
      const next = () => {
        if (finished) return;
        if (k >= plan.length) return finish("done");
        const a = new Audio(`/live-audio/${L}/${plan[k++]}.mp3`);
        if (capRef.current) {
          capRef.current.audio = a;
          capRef.current.base = plan.slice(0, k - 1).reduce((t, key) => t + (liveManifest.current?.[L]?.[key] ?? 0), 0);
        }
        try {
          // Route the clip through an analyser so the waveform can follow it. Same-origin audio, so this is allowed.
          if (!outCtx.current) {
            const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
            outCtx.current = new AC();
            outAnalyser.current = outCtx.current.createAnalyser();
            outAnalyser.current.fftSize = 256;
            outAnalyser.current.connect(outCtx.current.destination);
          }
          outCtx.current.createMediaElementSource(a).connect(outAnalyser.current!);
          void outCtx.current.resume();
        } catch {
          // No analyser: the waveform falls back to a gentle simulated wave.
        }
        a.playbackRate = role === "officer" ? Math.min(1.04, 1 + urgencyRef.current * 0.007) : 1;
        activeClip = a;
        a.onended = next;
        a.onerror = () => {
          if (k === 1) browserVoice();
          else finish("done");
        };
        a.play().catch(() => {
          if (k === 1) browserVoice();
          else finish("done");
        });
      };
      next();
    });
  }, []);

  /** The person's reply: by voice, or typed. "" means silence; the stop word comes back as the stop word. */
  const listen = useCallback((id: number, carry: boolean): Promise<string> => {
    return new Promise((resolve) => {
      if (!carry) {
        heard.current = { text: "", final: false, at: 0 };
        heardBase.current = lastLen.current;
        setYou(""); // your last words stay on screen while he answers, and clear when it is your turn again
      }
      setStatus("listening");
      const t0 = Date.now();
      let done = false;
      const finish = (t: string) => {
        if (done) return;
        done = true;
        clearInterval(poll);
        typedResolver.current = null;
        resolve(t);
      };
      typedResolver.current = (t) => finish(t);
      const poll = setInterval(() => {
        if (id !== run.current) return finish("");
        const h = heard.current;
        if (STOP_WORD.test(h.text)) return finish(h.text);
        // Done talking: a final result, or the words stopped changing for 1.4 s.
        if (h.text && (h.final || Date.now() - h.at > 1100)) return finish(h.text);
        if (!h.text && Date.now() - t0 > 4000) return finish("");
        if (Date.now() - t0 > 16_000) return finish(h.text);
      }, 100);
    });
  }, []);

  // ---- the call ----
  const endCall = useCallback(
    (by: "stop_word" | "payment", state: OfficerState) => {
      hush();
      setStatus("");
      try {
        rec.current?.abort();
      } catch {
        // Not running.
      }
      rec.current = null;
      if (meterTimer.current) clearInterval(meterTimer.current);
      meterTimer.current = null;
      stream.current?.getTracks().forEach((t) => t.stop());
      stream.current = null;
      audioCtx.current?.close().catch(() => {});
      audioCtx.current = null;
      setLevel(0);
      setTactics(tacticsUsed(state));
      setEndedBy(by);
      if (by === "stop_word") {
        setEnding("A");
        setPhase("endA");
      } else setPhase("stop");
    },
    [],
  );

  const ruko = useCallback(
    async (id: number, state: OfficerState) => {
      // The payment ask has landed: Ruko's own scam check decides, in code, using the same engine as the real app.
      const answers = { stay_on_call: "yes", pay_avoid_arrest: "yes", keep_secret: "yes" } as const;
      const t0 = Date.now();
      const local = runRadar(BUNDLED_LIBRARY, { identity: "police", answers });
      endCall("payment", state);
      void say(
        RUKO_STOP[lang],
        "ruko",
        run.current,
      );
      try {
        const res = await fetch("/api/check", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ elderId, identity: "police", answers, msToWarning: Date.now() - t0 }),
        });
        const d = await res.json();
        setFamilyAlerted(Boolean(d.familyAlerted));
      } catch {
        setFamilyAlerted(false);
      }
      return local.level;
    },
    [elderId, endCall, lang, say],
  );

  /** 0..1 loudness of the caller (analysed) or of you (microphone). -1 means "not measurable": the waveform simulates. */
  const getWaveLevel = () => {
    if (status === "listening" && !muted) return Math.min(1, levelRef.current * 1.4);
    const a = outAnalyser.current;
    const c = capRef.current?.audio;
    if (a && c && !c.paused) {
      const buf = new Uint8Array(a.fftSize);
      a.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      return Math.min(1, Math.sqrt(sum / buf.length) * 3);
    }
    return -1;
  };
  const captionProgress = () => {
    const c = capRef.current;
    if (!c) return 1;
    if (c.audio && !c.audio.paused && c.audio.duration) return Math.min(1, (c.base + c.audio.currentTime) / c.total);
    return Math.min(1, (Date.now() - c.start) / (c.total * 1000));
  };

  const runCall = useCallback(async () => {
    const id = ++run.current;
    offline.current = demoOffline();
    let state = officerStart();
    callStart.current = Date.now();
    setSeconds(0);
    setLatencies([]);
    setAgreedSecret(false);
    startRecognition();
    if (!liveManifest.current) {
      try {
        liveManifest.current = (await (await fetch("/live-audio/manifest.json")).json()) as LiveManifest;
      } catch {
        liveManifest.current = null;
      }
    }
    let nameGiven: string | null = null;
    let turn = officerOpen(state, lang);
    state = turn.state;
    lineRef.current = "";
    setPrevLine("");
    showLine(turn.text);
    // The conversation lives in memory for this call only. The last six turns go (without digits) to the wording AI.
    const convo: { who: "officer" | "person"; text: string }[] = [{ who: "officer", text: turn.text }];
    let aiFails = 0;
    urgencyRef.current = 0;
    setSources([]);
    setHud({ level: "clear", tactics: [], objection: null, source: null, reading: false });
    setPressure(0);
    setUsedIds([]);
    setExpression("friendly");
    let carry = false;
    let outcome = await say(turn.text, "officer", id);
    for (let guard = 0; guard < 30 && id === run.current; guard++) {
      if (outcome === "stop") return endCall("stop_word", state);
      if (rukoShouldStep(state)) {
        await ruko(id, state);
        return;
      }
      carry = outcome === "barged";
      const reply = await listen(id, carry);
      if (id !== run.current) return;
      const tReply = Date.now();
      setStatus("thinking");
      setHud((h) => ({ ...h, reading: true, objection: objectionOf(reply) ?? h.objection }));
      const intent = classify(reply);
      if (intent === "agree_secret") setAgreedSecret(true);
      urgencyRef.current = Math.max(0, state.stage);
      if (reply) convo.push({ who: "person", text: reply });
      nameGiven = extractName(reply) ?? nameGiven;
      // Scripted lines are recorded without a name in them; the AI wording (if on) may use it.
      state = { ...state, name: null };
      // The AI only READS what you meant (when the rules cannot tell). The answer is always a recorded line chosen by
      // code, so there is one voice, spoken once, with no overlap and no change of tone.
      let hint: Objection | null = null;
      const rulesRead = objectionOf(reply);
      const wordCount = reply.trim().split(/\s+/).filter(Boolean).length;
      if (aiWordingRef.current && !offline.current && aiFails < 2 && !rulesRead && wordCount >= 3 && intent !== "stop_word" && intent !== "will_pay" && state.stage < 5) {
        let filler: Promise<"done" | "stop" | "barged"> | null = null;
        const fillerTimer = setTimeout(() => {
          const f = FILLERS[(state.seed + convo.length) % FILLERS.length];
          filler = say(f[lang], "officer", id);
        }, 700);
        const ctrl = new AbortController();
        const abortTimer = setTimeout(() => ctrl.abort(), 3200);
        // The stop word (spoken, or the big button) is honoured while the AI is thinking: nothing waits for the AI.
        let stopHit = false;
        const stopWatch = setInterval(() => {
          if (STOP_WORD.test(heard.current.text)) {
            stopHit = true;
            ctrl.abort();
          }
        }, 40);
        try {
          const res = await fetch("/api/demo/officer", {
            method: "POST",
            headers: { "content-type": "application/json" },
            signal: ctrl.signal,
            body: JSON.stringify({ mode: "classify", turns: convo.slice(-6), stage: STAGES[Math.max(0, state.stage)], rung: 0, name: null, lang, objection: null }),
          });
          const j = (await res.json()) as { source?: string; objection?: Objection | null };
          if (j.source === "ai") {
            hint = j.objection ?? null;
            aiFails = 0;
          } else if (!res.ok) aiFails++;
        } catch {
          aiFails++;
        }
        clearTimeout(fillerTimer);
        clearTimeout(abortTimer);
        clearInterval(stopWatch);
        if (stopHit) {
          hush();
          return endCall("stop_word", state);
        }
        if (filler) {
          const f = await (filler as Promise<"done" | "stop" | "barged">);
          if (f === "stop") return endCall("stop_word", state);
        }
        if (id !== run.current) return;
      }
      turn = officerNext(state, reply, Date.now() - callStart.current, lang, hint);
      state = turn.state;
      if (turn.kind === "end") return endCall("stop_word", state);
      const text = turn.text;
      setExpression(expressionFor(STAGES[Math.max(0, state.stage)], turn.objection, turn.kind));
      const source = hint ? "ai" : "recorded";
      convo.push({ who: "officer", text });
      {
        // Ruko's own scam check on everything the caller has said so far (code, the same one behind the STOP screen).
        const callerWords = convo.filter((c) => c.who === "officer").map((c) => c.text).join(" ");
        const read = runRadar(BUNDLED_LIBRARY, { answers: {}, said: callerWords });
        setPressure(Math.min(7, state.stage + 1 + state.objections.length));
        setUsedIds(state.used);
        setHud({ level: read.level, tactics: tacticsUsed(state), objection: turn.objection ?? objectionOf(reply), source: source === "ai" ? "ai" : "recorded", reading: false });
      }
      showLine(text);
      setLatencies((l) => [...l.slice(-7), Date.now() - tReply]);
      setSources((l) => [...l.slice(-7), source]);
      outcome = await say(text, "officer", id);
    }
  }, [endCall, lang, listen, ruko, say, startRecognition]);

  // ---- screens ----
  const consent = () => {
    // The demo family circle gets a code word (only in the demo sandbox), so the approval step has something to check.
    if (demo) {
      fetch("/api/circle/codeword", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ elderId, codeWord: CODE_WORD }) }).catch(() => {});
    }
    setPhase("incoming");
    if (typeof window !== "undefined") window.speechSynthesis?.getVoices();
    stopRing.current = ring();
  };
  const answer = () => {
    stopRing.current?.();
    stopRing.current = null;
    setPhase("call");
    void runCall();
  };
  const decline = () => {
    stopEverything();
    setMicTest("idle");
    setLevel(0);
    setPhase("consent");
  };
  const endDemo = () => {
    stopEverything();
    setMicTest("idle");
    setLevel(0);
    setMuted(false);
    mutedRef.current = false;
    // A fresh start: clear the held payment, the alerts and the lock from the last run (demo sandbox only).
    if (demo) fetch("/api/demo/reset", { method: "POST" }).catch(() => {});
    setPhase("consent");
    setEnding(null);
    setTx(null);
    setFamilyAlerted(null);
  };
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next) {
      try {
        rec.current?.abort();
      } catch {
        // Not running.
      }
      stream.current?.getAudioTracks().forEach((t) => (t.enabled = false));
      setShowType(true);
    } else {
      stream.current?.getAudioTracks().forEach((t) => (t.enabled = true));
      rec.current = null;
      startRecognition();
    }
  };
  const submitTyped = () => {
    const t = typed.trim();
    if (!t) return;
    setTyped("");
    setYou(t);
    typedResolver.current?.(t);
  };
  const bigStop = () => {
    // The same as saying the stop word.
    hush();
    stopRing.current?.();
    typedResolver.current?.("RUKO");
    heard.current = { text: "RUKO", final: true, at: Date.now() };
  };

  // Poll the practice bank while the bank is open, so this screen can say plainly what happened to the payment.
  useEffect(() => {
    if (phase !== "endB") return;
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/transfers?elderId=${elderId}`, { cache: "no-store" });
        if (!r.ok || stop) return;
        const rows = (await r.json()) as Array<{ id: string; status: string; amount: number; payee: string; created_at: string }>;
        // Only the payment made in this bank screen counts, not the practice account's older ones.
        const mine = rows.find((x) => x.payee === "Government Verification Account" && new Date(x.created_at).getTime() >= bankOpenedAt.current - 2000);
        setTx(mine ? { id: mine.id, status: mine.status, amount: mine.amount } : null);
      } catch {
        // Keep the last answer.
      }
    };
    void load();
    const t = setInterval(load, 1500);
    return () => {
      stop = true;
      clearInterval(t);
    };
  }, [phase, elderId]);

  const en = lang === "en";
  const live = phase === "call";

  // ---- result numbers ----
  const furthest = ending === "B" ? (tx ? 6 : 4) : endedBy === "stop_word" ? 0 : agreedSecret ? 2 : 1;
  const stopped = stoppedBeforePay(furthest);
  const moved = tx ? ["completed", "released"].includes(tx.status) : false;

  return (
    <div className={live || phase === "stop" ? "fixed inset-0 z-30 overflow-y-auto bg-[#0b0b10]" : "contents"}>
    <main className={live ? "mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-4 pb-8 text-white" : "mx-auto flex min-h-[100dvh] max-w-md flex-col px-6 pt-4 pb-8 text-ink"}>
      <div className="flex items-center justify-between gap-2">
        <Link href="/demo" onClick={stopEverything} className={`min-h-12 content-center text-[16px] underline underline-offset-4 ${live ? "text-white/70" : "text-ink-soft"}`}>
          All scenes
        </Link>
        <MotionToggle tone={live ? "dark" : "light"} />
        {phase !== "consent" && (
          <button onClick={endDemo} className={`min-h-12 rounded-full border px-4 text-[16px] font-semibold ${live ? "border-white/30 text-white" : "border-hair"}`}>
            End demo
          </button>
        )}
      </div>

      {phase === "consent" && (
        <section className="flex flex-1 flex-col">
          <h1 className="display mt-6 text-[48px] leading-[1.02]">Live call</h1>
          <p className="mt-4 rounded-[18px] border border-ink p-5 text-[21px] leading-snug">
            {en
              ? "This is a role-played scam call for a demo. Nothing is recorded. Say RUKO at any time to stop. Demo only: do not say real details."
              : "Yeh demo ke liye role-play scam call hai. Kuch record nahi hota. Rokne ke liye kabhi bhi RUKO boliye. Sirf demo: asli jaankari mat boliye."}
          </p>
          <div className="mt-4 flex gap-2">
            {(["en", "hing"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)} aria-pressed={lang === l} className={`min-h-12 rounded-full px-5 text-[17px] font-semibold ${lang === l ? "bg-ink text-white" : "border border-hair"}`}>
                {l === "en" ? "English" : "Hinglish"}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[19px] leading-snug">
            {en ? "You play the older person. You will talk to him, out loud, like a real call. Use Chrome or Edge, with the volume up." : "Aap buzurg ka role karenge. Aap usse zor se baat karenge, bilkul asli call ki tarah. Chrome ya Edge mein, awaaz badhakar."}
          </p>
          <div className="mt-4 rounded-[18px] border border-hair p-4">
            <p className="text-[19px] font-semibold">{en ? "Your microphone" : "Aapka microphone"}</p>
            {!canListen && <p className="mt-1 text-[17px] text-ink-soft">{en ? "This browser cannot listen. Open this page in Chrome or Edge to talk. You can still type your replies." : "Yeh browser sun nahi sakta. Baat karne ke liye Chrome ya Edge mein kholiye. Aap jawab likh bhi sakte hain."}</p>}
            {micTest === "ok" ? (
              <>
                <div className="mt-3 h-4 overflow-hidden rounded-full bg-paper-2" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
                  <div className="h-full rounded-full bg-ink transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
                </div>
                <p className={`mt-3 text-[19px] font-semibold ${heardYou ? "text-safe" : ""}`}>{heardYou ? (en ? "✓ I can hear you." : "✓ Main aapko sun sakta hoon.") : en ? "Say hello. The bar should move." : "Hello boliye. Bar hilna chahiye."}</p>
              </>
            ) : (
              <button onClick={() => void testMic()} disabled={micTest === "asking"} className="mt-3 min-h-[64px] w-full rounded-[18px] border border-ink text-[20px] font-semibold disabled:opacity-40">
                {micTest === "asking" ? (en ? "Waiting for permission…" : "Permission ka intezaar…") : en ? "Test my microphone" : "Mera microphone test kijiye"}
              </button>
            )}
            {micTest === "blocked" && <p className="mt-3 text-[17px] leading-snug text-alarm" role="alert">{en ? "The browser blocked the microphone. Tap the lock icon next to the web address, allow the microphone, and press the test again. Or just type your replies." : "Browser ne microphone roka hai. Web address ke paas lock icon dabaiye, microphone allow kijiye, aur phir test dabaiye. Ya jawab likhiye."}</p>}
            {micTest === "none" && <p className="mt-3 text-[17px] leading-snug text-alarm" role="alert">{en ? "No microphone was found on this computer. You can type your replies." : "Is computer par microphone nahi mila. Aap jawab likh sakte hain."}</p>}
            <p className="mt-3 text-[15px] text-ink-soft">{en ? "Tip: use headphones if you can. Then the voice of the caller does not leak back into your microphone." : "Tip: ho sake to headphones lagaiye. Tab caller ki awaaz aapke microphone mein wapas nahi jaayegi."}</p>
          </div>
          <label className="mt-4 flex min-h-12 items-start gap-3 text-[16px] leading-snug text-ink-soft">
            <input type="checkbox" checked={aiWording} onChange={(e) => setAiWording(e.target.checked)} className="mt-1 size-5 shrink-0" />
            <span>{en ? "AI reads what you mean, so he answers even unusual replies. His voice stays the one recorded voice." : "AI samajhta hai aap kya keh rahe hain, isliye woh anokhe jawab ka bhi uttar deta hai. Awaaz wahi recorded awaaz rehti hai."}</span>
          </label>
          <button onClick={consent} className="press mt-auto min-h-[72px] rounded-[18px] bg-ink text-[22px] font-semibold text-white">
            {en ? "I understand" : "Main samajh gaya"}
          </button>
        </section>
      )}

      {phase === "incoming" && (
        <section className="flex flex-1 flex-col items-center text-center">
          <span className="relative mt-12 grid size-28 place-items-center" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="m-ring absolute inset-0 rounded-full border border-ink/30" style={{ "--i": i } as React.CSSProperties} />
            ))}
            <span className="relative block size-[84px] overflow-hidden rounded-full">
              <CallerFace phase="silhouette" size={84} />
            </span>
          </span>
          <p className="mt-8 text-[18px] text-ink-soft">{en ? "Incoming call" : "Incoming call"}</p>
          <p className="display mt-1 text-[44px] leading-tight">{en ? "Unknown number" : "Anjaan number"}</p>
          <p className="text-[22px] text-ink-soft tabular">{DEMO_NUMBER}</p>
          <p className="mt-2 text-[15px] text-ink-soft">{en ? "A fictional demo number." : "Yeh ek kaalpanik demo number hai."}</p>
          <div className="mt-auto grid w-full grid-cols-2 gap-3 pt-10">
            <button onClick={decline} className="flex min-h-[72px] items-center justify-center gap-2 rounded-[18px] border border-hair text-[20px] font-semibold">
              <PhoneOff className="size-6" />
              {en ? "Decline" : "Decline"}
            </button>
            <button onClick={answer} className="press m-buzz flex min-h-[72px] items-center justify-center gap-2 rounded-[18px] bg-ink text-[20px] font-semibold text-white">
              <Phone className="size-6" />
              {en ? "Answer" : "Answer"}
            </button>
          </div>
        </section>
      )}

      {live && (
        <section className="flex flex-1 flex-col">
          <p className="mt-2 self-start rounded-full border border-white/25 px-3 py-1 text-[13px] font-semibold tracking-[0.12em] text-white/80 uppercase">{en ? "Role-played scam call" : "Role-play scam call"}</p>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <p className="text-[16px] text-white/60">{en ? "On the call" : "Call par"}</p>
              <p className="text-[22px] font-semibold tabular">
                {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
              </p>
            </div>
            
          </div>

          {/* The caller: a circle that glows while he speaks, his name, and what he is saying (captions, always on). */}
          <div className="mt-4 flex items-center gap-5">
            <span className="relative grid size-[160px] shrink-0 place-items-center">
              <Waveform className="absolute inset-0" size={160} getLevel={getWaveLevel} mode={status === "speaking" ? "speaking" : status === "listening" && !muted ? "listening" : status === "thinking" ? "thinking" : "idle"} />
              <span className="relative block size-[96px] overflow-hidden rounded-full ring-2 ring-[#38e1ff]/40">
                <CallerFace phase="face" expression={expression} speaking={status === "speaking"} getLevel={getWaveLevel} size={96} />
              </span>
            </span>
            <div>
              <p className="text-[24px] font-semibold">Officer Sethi</p>
              <p className="mt-0.5 inline-block rounded-full border border-[#ff4d3d]/50 px-2.5 py-0.5 font-mono text-[12px] font-semibold tracking-wide text-[#ff8a7d] uppercase">{en ? "Scam caller (role-play)" : "Scam caller (role-play)"}</p>
              <p className="text-[15px] text-white/60">
                {DEMO_NUMBER} · actor{status === "speaking" ? (en ? " · speaking" : " · bol raha hai") : ""}
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-[18px] bg-white/10 p-5" aria-live="polite">
            <KaraokeCaption text={officerLine} prev={prevLine} speaking={status === "speaking"} progress={captionProgress} />
          </div>

          {/* You: a level bar that moves as you talk, and the words Ruko heard. */}
          <div className="mt-3 rounded-[18px] border border-white/15 p-5">
            <p className="flex items-center gap-2 text-[14px] font-semibold tracking-[0.12em] text-white/60 uppercase">
              <Mic className={`size-4 ${status === "listening" && micOk && !muted ? "text-white" : ""}`} />
              {en ? "You" : "Aap"}
              {muted ? (en ? " · mic muted" : " · mic band") : status === "listening" ? (en ? " · your turn, speak now" : " · aapki baari, boliye") : ""}
            </p>
            {micTest === "ok" && !muted && (
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/10" role="meter" aria-label="Microphone level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}>
                <div className="h-full rounded-full bg-[#38e1ff] transition-[width] duration-100" style={{ width: `${Math.round(level * 100)}%` }} />
              </div>
            )}
            <p className="mt-3 text-[22px] leading-snug">
              {you || <span className="text-white/60">{micOk && !muted ? (en ? "Talk to him, like a real call…" : "Usse baat kijiye, asli call ki tarah…") : en ? "Type your reply below." : "Neeche jawab likhiye."}</span>}
            </p>
          </div>

          <div className="mt-3 rounded-[18px] border border-[#38e1ff]/25 bg-[#38e1ff]/[0.05] p-4" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 font-mono text-[12px] font-semibold tracking-[0.14em] text-[#38e1ff] uppercase">
                <span className={`size-2 rounded-full bg-[#38e1ff] ${hud.reading ? "motion-safe:animate-ping" : "motion-safe:animate-pulse"}`} aria-hidden />
                {hud.reading ? (en ? "Ruko is reading…" : "Ruko padh raha hai…") : en ? "Ruko is listening" : "Ruko sun raha hai"}
              </p>
              <span className={`rounded-full border px-2.5 py-0.5 font-mono text-[12px] font-bold tracking-wide ${hud.level === "stop" ? "border-[#ff4d3d]/60 bg-[#ff4d3d]/15 text-[#ff8a7d]" : hud.level === "caution" ? "border-[#fbbf24]/50 bg-[#fbbf24]/10 text-[#fbbf24]" : "border-[#4ade80]/40 bg-[#4ade80]/10 text-[#4ade80]"}`}>
                {hud.level === "stop" ? "SCAM" : hud.level === "caution" ? (en ? "SUSPICIOUS" : "SHAK") : en ? "WATCHING" : "DEKH RAHA"}
              </span>
            </div>
            <div className="mt-2 flex h-1.5 gap-1" role="meter" aria-label="Scam risk" aria-valuemin={0} aria-valuemax={2} aria-valuenow={hud.level === "stop" ? 2 : hud.level === "caution" ? 1 : 0}>
              {[0, 1, 2].map((i) => {
                const lit = (hud.level === "stop" ? 2 : hud.level === "caution" ? 1 : 0) >= i && (hud.level !== "clear" || i === 0);
                return <span key={i} className={`flex-1 rounded-full transition-colors duration-300 ${lit ? (i === 2 ? "bg-[#ff4d3d]" : i === 1 ? "bg-[#fbbf24]" : "bg-[#4ade80]") : "bg-white/10"}`} />;
              })}
            </div>
            <div className="mt-3">
              <TensionMeter level={pressure} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {hud.objection && <span className="rounded-full border border-[#38e1ff]/40 px-2.5 py-1 text-[14px] text-[#38e1ff]">{OBJ_LABEL[hud.objection][en ? 0 : 1]}</span>}
              {usedIds.slice(-3).map((id, i, arr) => (
                <TacticChip key={id} label={TACTIC_LABEL[id] ?? id} why={TACTIC_WHY[id] ?? ""} fresh={i === arr.length - 1} />
              ))}
              {hud.source && <span className="rounded-full border border-white/15 px-2.5 py-1 font-mono text-[12px] text-white/50 uppercase">{hud.source === "ai" ? (en ? "AI read your meaning" : "AI ne matlab samjha") : en ? "Recorded line" : "Recorded line"}</span>}
              {!hud.objection && hud.tactics.length === 0 && <span className="text-[14px] text-white/50">{en ? "Waiting for the caller's tactics…" : "Caller ki chaalon ka intezaar…"}</span>}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <button onClick={toggleMute} aria-pressed={muted} disabled={micTest !== "ok" && !canListen} className="min-h-[64px] rounded-[18px] border border-white/15 text-[19px] font-semibold disabled:opacity-40">
              {muted ? (en ? "Unmute" : "Mic chalu kijiye") : en ? "Mute mic" : "Mic band kijiye"}
            </button>
            <button onClick={() => setShowType((v) => !v)} aria-expanded={showType || !micOk || muted} className="min-h-[64px] rounded-[18px] border border-white/15 text-[19px] font-semibold">
              {en ? "Type instead" : "Likhkar bhejiye"}
            </button>
          </div>
          {(showType || !micOk || muted) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitTyped();
              }}
              className="mt-3 flex gap-2"
            >
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={en ? "Type your reply" : "Yahan likhiye"}
                aria-label={en ? "Type your reply" : "Jawab likhiye"}
                className="min-h-16 min-w-0 flex-1 rounded-[18px] border border-white/15 px-4 text-[20px]"
              />
              <button type="submit" disabled={!typed.trim()} className="min-h-16 rounded-[18px] bg-ink px-6 text-[20px] font-semibold text-white disabled:opacity-30">
                {en ? "Send" : "Bhejo"}
              </button>
            </form>
          )}
          {!micOk && <p className="mt-2 text-[16px] text-white/60">{en ? "The microphone is not available, so type your replies. Allow the microphone in the browser to talk." : "Microphone available nahi hai, isliye jawab likhiye. Baat karne ke liye browser mein microphone allow kijiye."}</p>}

          <div className="sticky bottom-0 mt-auto bg-[#0b0b10] pt-4 pb-2">
            <button onClick={bigStop} className="flex min-h-[80px] w-full items-center justify-center gap-3 rounded-[18px] bg-alarm text-[26px] font-semibold text-white">
              <PhoneOff className="size-7" />
              {en ? "End call (or say RUKO)" : "Call khatam (ya RUKO boliye)"}
            </button>
          </div>

          <details className="mt-4 text-[14px] text-white/60">
            <summary className="min-h-10 cursor-pointer py-2">Debug: latency</summary>
            <p>
              Wording: {sources.length ? sources.join(", ") : "none yet"}. Reply to officer speech: {latencies.length ? latencies.map((l) => `${l} ms`).join(", ") : "no turns yet"}. Voice out: {typeof window !== "undefined" && "speechSynthesis" in window ? "browser speech" : "none (captions only)"}. Voice in:{" "}
              {canListen ? "browser speech recognition" : "not available here"}. Mode: {offline.current ? "offline (scripts only)" : "scripts, AI wording off"}.
            </p>
          </details>
        </section>
      )}

      {phase === "stop" && (
        <section className="m-fade fixed inset-0 z-50 overflow-y-auto bg-alarm text-white" role="alertdialog" aria-labelledby="live-stop">
          <div className="mx-auto flex min-h-full max-w-md flex-col px-6 pt-6 pb-8">
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-semibold tracking-[0.16em] text-white/85 uppercase">{en ? "This is a scam" : "Yeh scam hai"}</p>
              <span className="relative block size-[104px] overflow-hidden rounded-[20px] ring-2 ring-white/40">
                <CallerFace phase="unmask" size={104} backdrop />
              </span>
              
            </div>
            <h1 id="live-stop" className="m-stop-in display mt-4 text-[150px] leading-[0.86] text-white">
              Stop.
            </h1>
            <div className="my-4 h-[3px] bg-white/70" />
            <p className="border-l-4 border-white pl-4 text-[26px] leading-snug font-semibold">{en ? "Do not transfer money. Hang up and verify independently." : "Paise transfer mat kijiye. Call kaatiye aur khud alag se pata kijiye."}</p>
            <p className="mt-4 text-[19px] text-white/85">
              {familyAlerted === true ? (en ? "✓ Your family has been alerted in Ruko." : "✓ Ruko mein aapke parivar ko soochna bhej di gayi hai.") : familyAlerted === false ? (en ? "Your family could not be reached by Ruko just now. Please call them." : "Ruko abhi parivar tak nahi pahunch paya. Kripya unhe phone kijiye.") : en ? "Telling your family…" : "Parivar ko bata rahe hain…"}
            </p>
            <div className="mt-auto flex flex-col gap-3 pt-8">
              <button
                onClick={() => {
                  hush();
                  setEnding("A");
                  setPhase("endA");
                }}
                className="press min-h-[76px] rounded-[18px] bg-white text-[24px] font-semibold text-alarm shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
              >
                {en ? "Hang up and use Ruko" : "Call kaatiye aur Ruko ka istemaal kijiye"}
              </button>
              <button
                onClick={() => {
                  hush();
                  bankOpenedAt.current = Date.now();
                  setEnding("B");
                  setPhase("endB");
                }}
                className="min-h-[64px] rounded-[18px] border border-white/60 text-[20px] font-semibold"
              >
                {en ? "I still want to pay" : "Main phir bhi paise bhejna chahta hoon"}
              </button>
              <p className="mt-2 flex items-center justify-between gap-3 border-t border-white/30 pt-3 text-[16px] text-white/85">
                <a href="tel:1930" className="flex min-h-12 items-center gap-2 text-white">
                  <span className="text-[22px] font-semibold tabular">1930</span> helpline
                </a>
                <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="flex min-h-12 items-center underline underline-offset-4">
                  cybercrime.gov.in
                </a>
              </p>
            </div>
          </div>
        </section>
      )}

      {phase === "endA" && (
        <section className="m-rise flex flex-1 flex-col">
          <div className="mt-4 self-start">
            <SilhouetteToShield size={88} shield={<Guardian mood="after" className="size-20" />} />
          </div>
          <h1 className="display mt-6 text-[44px] leading-[1.05]">{endedBy === "stop_word" ? (en ? "Call ended. You are safe." : "Call khatam. Aap surakshit hain.") : en ? "Call ended. You paused." : "Call khatam. Aap ruk gaye."}</h1>
          <p className="mt-3 rounded-[18px] bg-safe-soft p-4 text-[21px] leading-snug font-semibold text-safe">{en ? "You have paused. That was a good step." : "Aap ruk gaye. Yeh achha kadam tha."}</p>
          <ol className="mt-5 flex flex-col gap-3 text-[21px] leading-snug">
            <li><b>1.</b> {en ? "Do not call that number back." : "Us number par wapas call mat kijiye."}</li>
            <li><b>2.</b> {en ? "Report it: call 1930 or go to cybercrime.gov.in." : "Report kijiye: 1930 par call karein ya cybercrime.gov.in par jayein."}</li>
            <li><b>3.</b> {familyAlerted ? (en ? `Your family has been alerted${trusted ? ` (${trusted.name.split(" ")[0]})` : ""}. They will call you.` : "Aapke parivar ko soochna mil gayi hai. Woh aapko phone karenge.") : en ? "Call someone you trust now." : "Abhi kisi apne ko phone kijiye."}</li>
          </ol>
          <div className="mt-auto flex flex-col gap-3 pt-8">
            <button onClick={() => setCompanion(true)} className="min-h-[72px] rounded-[18px] bg-ink text-[22px] font-semibold text-white">
              {en ? "Talk to Ruko" : "Ruko se baat kijiye"}
            </button>
            <button onClick={() => setPhase("result")} className="min-h-[64px] rounded-[18px] border border-hair text-[20px] font-semibold">
              {en ? "See the result" : "Result dekhiye"}
            </button>
          </div>
          {companion && <CompanionApp elderId={elderId} trusted={trusted} autoStart onClose={() => setCompanion(false)} />}
        </section>
      )}

      {phase === "endB" && (
        <section className="m-rise flex flex-1 flex-col">
          <p className="mt-4 rounded-[12px] bg-ink px-4 py-3 text-center text-[17px] font-semibold tracking-[0.1em] text-white uppercase">MOCK BANK · {en ? "practice only · no real money" : "sirf practice · asli paise nahi"}</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="block size-[64px] shrink-0 overflow-hidden rounded-full">
              <CallerFace phase={tx && ["held", "pending"].includes(tx.status) ? "frozen" : "face"} expression="urgent" speaking={false} size={64} tag={false} />
            </span>
            <p className="text-[17px] leading-snug text-ink-soft">{tx && ["held", "pending"].includes(tx.status) ? (en ? "The caller is frozen. Payment paused." : "Caller ruka hua hai. Payment ruka hua hai.") : en ? "The caller is waiting on the line…" : "Caller line par intezaar kar raha hai…"}</p>
          </div>
          <div className="mt-3 overflow-hidden rounded-[18px] border border-hair">
            <iframe title="Practice bank" src="/bank?embed=1&prefill=live" className="h-[560px] w-full" />
          </div>
          <div className="mt-3 rounded-[18px] bg-paper-2 p-4 text-[20px] leading-snug" aria-live="polite">
            {!tx && (en ? "Press Confirm in the bank above and follow it. Money Lock will pause you for a few seconds (shortened for the demo). Practice PIN: 1234." : "Upar bank mein Confirm dabaiye aur aage badhiye. Money Lock kuch second rokega (demo ke liye chhota). Practice PIN: 1234.")}
            {tx && ["held", "pending"].includes(tx.status) && (en ? `Payment paused. ${trusted?.name.split(" ")[0] ?? "Your family"} has been asked to approve it.` : "Payment ruka hua hai. Parivar se manzoori maangi gayi hai.")}
            {tx && ["blocked", "cancelled"].includes(tx.status) && <b>{en ? "Payment blocked. Money did not move." : "Payment block ho gaya. Paise nahi gaye."}</b>}
            {tx && ["released", "completed"].includes(tx.status) && (en ? "The family approved it (practice bank). In a real bank this is where Ruko's code word check would have stopped a scammer's voice." : "Parivar ne manzoor kar diya (practice bank).")}
          </div>
          <button onClick={() => setShowFamily((v) => !v)} className="mt-3 min-h-14 rounded-[18px] border border-hair text-[18px] font-semibold">
            {showFamily ? (en ? "Hide the family phone" : "Family phone chhupaiye") : en ? "Show the family phone here (if their phone is not paired)" : "Family phone yahin dikhaiye"}
          </button>
          {showFamily && (
            <div className="mt-3 overflow-hidden rounded-[18px] border border-hair">
              <iframe title="Family phone" src="/family?embed=1" className="h-[560px] w-full" />
            </div>
          )}
          <p className="mt-3 text-[15px] text-ink-soft">
            {en ? `On the family phone, open ${typeof window !== "undefined" ? window.location.origin : ""}/family?embed=1. The code word to approve is "${CODE_WORD}" (demo only).` : `Family phone par /family?embed=1 kholiye. Manzoori ka code word "${CODE_WORD}" hai (sirf demo).`}
          </p>
          <button disabled={!tx} onClick={() => setPhase("result")} className="mt-4 min-h-[72px] rounded-[18px] bg-ink text-[22px] font-semibold text-white disabled:opacity-30">
            {en ? "See the result" : "Result dekhiye"}
          </button>
        </section>
      )}

      {phase === "result" && (
        <section className="m-rise flex flex-1 flex-col">
          <p className="mt-4 inline-block self-start rounded-full bg-paper-2 px-3 py-1 text-[14px] font-semibold text-ink-soft">{en ? "Demo data. Not real trial data." : "Demo data. Asli trial data nahi."}</p>
          <h1 className="display mt-3 text-[46px] leading-[1.04]">{ending === "A" ? (en ? "You stopped before paying." : "Aap paise bhejne se pehle ruk gaye.") : tx && ["blocked", "cancelled"].includes(tx.status) ? (en ? "The payment was held and blocked." : "Payment ruka aur block hua.") : en ? "The payment was held." : "Payment ruka hua hai."}</h1>
          <p className="mt-3 text-[21px] leading-snug">
            {ending === "A"
              ? en ? "You hung up when Ruko said STOP. No money was asked to move on the bank screen." : "Ruko ke STOP kehne par aapne call kaat di. Bank screen par koi paisa nahi gaya."
              : en ? "You chose to pay anyway. Money Lock paused the payment and asked a trusted person. In this practice bank, no money moved." : "Aapne phir bhi pay karna chaha. Money Lock ne payment roka aur parivar se poochha. Is practice bank mein paisa nahi gaya."}
          </p>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 rounded-[22px] border border-hair bg-white p-5 text-[19px] shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
            <dt className="text-ink-soft">{en ? "Furthest step" : "Sabse door ka kadam"}</dt>
            <dd className="font-semibold">{furthest} of 7 · {SCALE[furthest].short}</dd>
            <dt className="text-ink-soft">{en ? "Stopped before pay" : "Pay se pehle ruke"}</dt>
            <dd className={`font-semibold ${stopped ? "m-pop text-safe" : ""}`}>{stopped ? (en ? "✓ Yes" : "✓ Haan") : en ? "No (pressed Pay)" : "Nahi (Pay dabaya)"}</dd>
            <dt className="text-ink-soft">{en ? "Money moved" : "Paise gaye"}</dt>
            <dd className="font-semibold">{moved ? (en ? "Yes, in the practice bank" : "Haan, practice bank mein") : en ? "No" : "Nahi"}</dd>
            <dt className="text-ink-soft">{en ? "Family alerted" : "Parivar ko bataya"}</dt>
            <dd className="font-semibold">{familyAlerted ? (en ? "Yes" : "Haan") : en ? "No" : "Nahi"}</dd>
          </dl>
          <CallTimeline furthest={furthest} labels={SCALE.map((x) => x.short)} />
          <h2 className="mt-6 text-[17px] font-semibold tracking-[0.1em] text-ink-soft uppercase">{en ? "What the caller did" : "Caller ne kya kiya"}</h2>
          <ul className="mt-2 flex flex-col gap-1 text-[19px]">
            {tactics.map((t) => (
              <li key={t}>· {t}</li>
            ))}
          </ul>
          <VoiceTrust lang={lang} />
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => {
                setTx(null);
                setCompanion(false);
                setEnding(null);
                setPhase("stop");
              }}
              className="min-h-[72px] rounded-[18px] bg-ink text-[21px] font-semibold text-white"
            >
              {ending === "A" ? (en ? "Replay as the other ending (pay anyway)" : "Doosra ending dekhiye (phir bhi pay)") : en ? "Replay as the other ending (hang up)" : "Doosra ending dekhiye (call kaatiye)"}
            </button>
            <button onClick={endDemo} className="min-h-[64px] rounded-[18px] border border-hair text-[20px] font-semibold">
              {en ? "Run the call again" : "Call phir se chalaiye"}
            </button>
          </div>
          <nav aria-label="Keep exploring" className="mt-6 rounded-[22px] bg-[#060a10] p-5 text-white">
            <p className="font-mono text-[12px] tracking-[0.14em] text-[#38e1ff] uppercase">{en ? "Keep exploring" : "Aage dekhiye"}</p>
            <div className="mt-3 grid gap-2">
              {[
                ["/family", en ? "See the family phone" : "Parivar ka phone dekhiye"],
                ["/console", en ? "See what the bank's fraud desk saw" : "Bank ke fraud desk ne kya dekha"],
                ["/demo/how", en ? "How it works under the hood" : "Andar se yeh kaise kaam karta hai"],
                ["/demo", en ? "Back to the control room" : "Control room par wapas"],
              ].map(([href, label]) => (
                <Link key={href} href={href} className="flex min-h-14 items-center justify-between rounded-[14px] border border-white/15 px-4 text-[18px] font-semibold transition hover:border-[#38e1ff] hover:text-[#38e1ff]">
                  {label} <span aria-hidden>→</span>
                </Link>
              ))}
            </div>
          </nav>
          <p className="mt-5 display text-[26px] leading-snug">{en ? "Either way, the money didn't move. Ruko doesn't try to win the argument with a scammer. It protects the moment that matters." : "Dono mein se jo bhi ho, paise nahi gaye. Ruko scammer se behes jeetne ki koshish nahi karta. Woh sahi pal ko bachata hai."}</p>
          <p className="mt-4 flex items-center justify-between gap-3 border-t border-hair pt-3 text-[16px] text-ink-soft">
            <a href="tel:1930" className="min-h-12 content-center text-ink"><b className="text-[22px] tabular">1930</b> helpline</a>
            <a href="https://cybercrime.gov.in" target="_blank" rel="noreferrer" className="min-h-12 content-center underline underline-offset-4">cybercrime.gov.in</a>
          </p>
        </section>
      )}
    </main>
    </div>
  );
}
