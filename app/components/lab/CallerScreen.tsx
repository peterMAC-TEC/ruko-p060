"use client";

import { Captions, Mic, Phone, PhoneOff, Video } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DrillScript } from "@/lib/drill";
import type { LiveState } from "@/lib/trial";
import { hush, ring, say } from "@/lib/voice";
import { CallerAvatar } from "./CallerAvatar";

// The participant-facing caller (on the laptop facing them, or with its sound
// routed into a real phone call). The facilitator's console drives every line.
// Saying "RUKO" (or "रुको") ends the call at once and plays the debrief.

type Light = { status: "ready" | "live" | "ended" | "aborted"; live: LiveState; lang: "en" | "hi"; script_id: string };

type Rec = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
const STOP_WORD = /\bru+k+h?o+\b|रुको|रूको|\bstop the (drill|call)\b/i;

/** The name shown on the incoming call: the first caller, without the "(drill character)" note. */
const displayName = (s: DrillScript) =>
  s.caller_name
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .split(/,\s*then\s+/i)[0]
    .trim();

export function CallerScreen({ callId, script, seed }: { callId: string; script: DrillScript; seed: number }) {
  const [armed, setArmed] = useState(false);
  const [state, setState] = useState<Light | null>(null);
  const [answered, setAnswered] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [caption, setCaption] = useState("");
  const [captions, setCaptions] = useState(false);
  const [secs, setSecs] = useState(0);
  const [ended, setEnded] = useState(false);
  const lastSeq = useRef(-1);
  const stopRing = useRef<(() => void) | null>(null);
  const rec = useRef<Rec | null>(null);
  const live = useRef(false);
  const speakingRef = useRef(false);
  const relisten = useRef<() => void>(() => {});
  /** The scammer bot plays the caller: the participant's replies are sent (as words, to pick the next line) and the line comes back. */
  const autoRef = useRef(false);
  const silenceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finalRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const post = useCallback(
    (body: Record<string, unknown>) =>
      fetch(`/api/lab/calls/${callId}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(() => null),
    [callId],
  );
  const lang = state?.lang ?? "en";
  const debrief = script.steps.find((s) => s.id === "debrief");

  // Listening for the stop word, paused while the caller itself is speaking.
  const listen = useCallback(() => {
    const w = window as unknown as { SpeechRecognition?: new () => Rec; webkitSpeechRecognition?: new () => Rec };
    const R = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!R || rec.current) return;
    const r = new R();
    r.lang = lang === "hi" ? "hi-IN" : "en-IN";
    r.continuous = true;
    r.interimResults = true;
    r.onresult = (e) => {
      const text = Array.from(e.results)
        .map((x) => x[0]?.transcript ?? "")
        .join(" ");
      if (!speakingRef.current && STOP_WORD.test(text)) {
        post({ action: "end", by: "stop_word", text: debrief ? (lang === "hi" ? debrief.line_hi : debrief.line_en) : undefined });
      } else if (autoRef.current && !speakingRef.current) {
        const last = e.results[e.results.length - 1];
        // They are talking: no need to say "are you there?".
        clearTimeout(silenceRef.current);
        if (last?.isFinal) {
          const said = (last[0]?.transcript ?? "").trim();
          clearTimeout(finalRef.current);
          finalRef.current = setTimeout(() => {
            if (!speakingRef.current && live.current) post({ action: "heard", text: said });
          }, 700);
        }
      }
    };
    r.onend = () => {
      rec.current = null;
      if (live.current && !speakingRef.current) setTimeout(() => relisten.current(), 300);
    };
    r.onerror = () => {};
    rec.current = r;
    try {
      r.start();
    } catch {
      rec.current = null;
    }
  }, [lang, post, debrief]);
  useEffect(() => {
    relisten.current = listen;
  }, [listen]);

  const speak = useCallback(
    (text: string, done?: () => void) => {
      speakingRef.current = true;
      rec.current?.abort();
      setCaption(text);
      say(text, lang, {
        start: () => setSpeaking(true),
        end: () => {
          speakingRef.current = false;
          setSpeaking(false);
          if (live.current) listen();
          // If they say nothing for a while, the bot carries on (silence counts as going along).
          if (autoRef.current && live.current) {
            clearTimeout(silenceRef.current);
            silenceRef.current = setTimeout(() => post({ action: "heard", text: "" }), 9000);
          }
          done?.();
        },
      });
    },
    [lang, listen, post],
  );

  // Poll the call: new lines to say, the start (ring) and the end.
  useEffect(() => {
    if (!armed) return;
    let stop = false;
    const tick = async () => {
      const r = await fetch(`/api/lab/calls/${callId}?light=1`, { cache: "no-store" }).catch(() => null);
      if (stop || !r?.ok) return;
      const s: Light = await r.json();
      setState(s);
    };
    tick();
    const id = setInterval(tick, 600);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [armed, callId]);

  // React to the call state.
  useEffect(() => {
    if (!state) return;
    const ringing = state.status === "live" && !answered && !state.live.ended;
    if (ringing && !stopRing.current) stopRing.current = ring();
    if (!ringing && stopRing.current) {
      stopRing.current();
      stopRing.current = null;
    }
    const seq = state.live.seq ?? 0;
    if (state.live.ended && !ended) {
      live.current = false;
      rec.current?.abort();
      clearTimeout(silenceRef.current);
      clearTimeout(finalRef.current);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnded(true);
      if (answered && state.live.text) speak(state.live.text);
      else hush();
      lastSeq.current = seq;
      return;
    }
    if (answered && seq !== lastSeq.current && seq > 0 && state.live.text && !state.live.ended) {
      lastSeq.current = seq;
      speak(state.live.text);
    }
  }, [state, answered, ended, speak]);

  useEffect(() => {
    autoRef.current = Boolean(state?.live.auto);
  }, [state?.live.auto]);

  // Call timer.
  useEffect(() => {
    if (!answered || ended) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [answered, ended]);

  useEffect(
    () => () => {
      stopRing.current?.();
      rec.current?.abort();
      clearTimeout(silenceRef.current);
      clearTimeout(finalRef.current);
      hush();
    },
    [],
  );

  const accept = () => {
    setAnswered(true);
    live.current = true;
    lastSeq.current = state?.live.seq ?? 0;
    post({ action: "answered" });
    listen();
  };
  const decline = () => post({ action: "end", by: "self" });
  const hangUp = () => post({ action: "end", by: "self", text: debrief ? (lang === "hi" ? debrief.line_hi : debrief.line_en) : undefined });

  const name = displayName(script);
  const mmss = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;

  if (!armed) {
    return (
      <Shell>
        <div className="m-auto max-w-sm text-center">
          <p className="text-[15px] text-white/60">Caller screen · {script.title_en}</p>
          <button onClick={() => setArmed(true)} className="mt-4 min-h-14 rounded-2xl bg-white px-6 text-[18px] font-bold text-ink">
            Ready (turns on sound)
          </button>
          <p className="mt-3 text-[14px] text-white/50">Facilitator: press once, then turn this screen to the participant. It rings when you start the call.</p>
        </div>
      </Shell>
    );
  }

  if (ended || state?.status === "ended" || state?.status === "aborted") {
    return (
      <Shell>
        <div className="m-auto flex max-w-md flex-col items-center gap-4 px-6 text-center">
          <PhoneOff className="size-10 text-white/70" />
          <p className="text-[26px] font-bold">Call ended</p>
          <p className="rounded-2xl bg-white/10 p-4 text-[19px] leading-snug">
            {state?.live.text ?? (lang === "hi" ? "यह Ruko की अभ्यास कॉल थी। कोई असली पैसा नहीं गया।" : "This was a Ruko practice call. No real money moved.")}
          </p>
        </div>
      </Shell>
    );
  }

  if (!state || state.status === "ready") {
    return (
      <Shell>
        <div className="m-auto text-center text-white/40">
          <p className="text-[56px] font-light tabular">
            {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </Shell>
    );
  }

  if (!answered) {
    return (
      <Shell>
        <div className="flex flex-1 flex-col items-center justify-between px-6 pt-16 pb-14">
          <div className="text-center">
            <p className="flex items-center justify-center gap-2 text-[16px] text-white/70">
              <Video className="size-4" /> {lang === "hi" ? "इनकमिंग कॉल" : "Incoming call"}
            </p>
            <p className="mt-3 text-[34px] font-bold">{name}</p>
            <p className="mt-1 text-[16px] text-white/60">{lang === "hi" ? "अनजान नंबर" : "Unknown number"}</p>
          </div>
          <div className="animate-pulse rounded-full ring-8 ring-white/10">
            <div className="overflow-hidden rounded-full">
              <CallerAvatar speaking={false} seed={seed} size={200} />
            </div>
          </div>
          <div className="flex w-full max-w-xs justify-between">
            <button onClick={decline} aria-label="Decline" className="flex size-20 items-center justify-center rounded-full bg-[#e5484d]">
              <PhoneOff className="size-9" />
            </button>
            <button onClick={accept} aria-label="Accept" className="flex size-20 animate-bounce items-center justify-center rounded-full bg-[#30a46c]">
              <Phone className="size-9" />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="relative flex flex-1 flex-col items-center justify-center">
        <div className="overflow-hidden rounded-[28px] shadow-2xl ring-1 ring-white/10">
          <CallerAvatar speaking={speaking} seed={seed} size={Math.min(440, typeof window !== "undefined" ? window.innerWidth - 48 : 440)} />
        </div>
        <div className="absolute top-6 left-6 rounded-xl bg-black/40 px-3 py-2 backdrop-blur">
          <p className="text-[17px] font-bold">{name}</p>
          <p className="text-[14px] text-white/70 tabular">{mmss}</p>
        </div>
        {captions && caption && (
          <p className="absolute bottom-32 mx-6 max-w-2xl rounded-xl bg-black/60 px-4 py-2 text-center text-[20px] leading-snug">{caption}</p>
        )}
        <div className="absolute bottom-10 flex items-center gap-5">
          <button
            onClick={() => setCaptions((c) => !c)}
            aria-label="Captions"
            className={`flex size-14 items-center justify-center rounded-full ${captions ? "bg-white text-ink" : "bg-white/15"}`}
          >
            <Captions className="size-6" />
          </button>
          <span className="flex size-14 items-center justify-center rounded-full bg-white/15">
            <Mic className="size-6" />
          </span>
          <button onClick={hangUp} aria-label="Hang up" className="flex size-16 items-center justify-center rounded-full bg-[#e5484d]">
            <PhoneOff className="size-7" />
          </button>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-[#14181c] to-[#0b0d0e] text-white">{children}</div>;
}
