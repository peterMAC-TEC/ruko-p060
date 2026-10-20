"use client";

// Tap to talk, tap again to finish (holding a button down is hard for many
// older hands). Uses the browser's own speech recognition in Hindi (hi-IN) or
// Indian English (en-IN) and shows the words live. When the browser can't
// transcribe, or the transcript came out garbled, it records a short clip for
// the AI instead. Adapted from the Last Call reuse kit (reuse/lib/voice/hold-to-talk.ts).
// Nothing is kept: the words or the clip go to the check and are dropped.
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
};

const RecognitionCtor = (): (new () => Recognition) | null => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/** Audio formats the AI accepts, in order of preference, that this browser can record. */
function recordingType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  return ["audio/ogg;codecs=opus", "audio/mp4", "audio/webm;codecs=opus", "audio/webm"].find((t) => MediaRecorder.isTypeSupported(t)) ?? "";
}

/** What this browser can do, as a string so it is stable between renders ("" on the server). */
function detect(): string {
  const browser = RecognitionCtor() ? "b" : "";
  const audio = typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && recordingType() !== null ? "a" : "";
  return browser + audio;
}
const noSubscribe = () => () => {};

export type VoiceOutcome = { engine: "browser"; transcript: string } | { engine: "audio"; audio: Blob };
export type VoiceState = "idle" | "listening";
/** Codes, so the screen can say them in the person's language. */
export type VoiceError = "blocked" | "network" | "unclear" | "short";

/** Recordings stop by themselves after this long. */
const MAX_RECORDING_MS = 60_000;

export function useVoiceCapture(lang: "en" | "hi", onDone: (outcome: VoiceOutcome) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<VoiceError | null>(null);
  const caps = useSyncExternalStore(noSubscribe, detect, () => "");
  const support = { browser: caps.includes("b"), audio: caps.includes("a") };
  const [forceAudio, setForceAudio] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const cap = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const finalText = useRef("");
  const interimRef = useRef("");
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });

  const engine: "browser" | "audio" | null = support.browser && !forceAudio ? "browser" : support.audio ? "audio" : null;

  const start = useCallback(async () => {
    if (state !== "idle" || !engine) return;
    setError(null);
    setInterim("");
    interimRef.current = "";
    finalText.current = "";
    try {
      navigator.vibrate?.(15);
    } catch {
      // No vibration on this phone.
    }

    if (engine === "browser") {
      const r = new (RecognitionCtor()!)();
      r.lang = lang === "hi" ? "hi-IN" : "en-IN";
      r.continuous = true;
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.onresult = (e) => {
        let live = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const text = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalText.current += `${text} `;
          else live += text;
        }
        interimRef.current = `${finalText.current}${live}`.trim();
        setInterim(interimRef.current);
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("blocked");
        else if (e.error === "network") {
          setError("network");
          // Speech-to-text needs the internet on most phones; a recorded clip may still get through later.
          if (support.audio) setForceAudio(true);
        } else if (e.error !== "no-speech" && e.error !== "aborted") setError("unclear");
      };
      r.onend = () => {
        rec.current = null;
        clearTimeout(cap.current);
        const text = finalText.current.trim() || interimRef.current.trim();
        setState("idle");
        if (text) done.current({ engine: "browser", transcript: text });
      };
      rec.current = r;
      try {
        r.start();
        setState("listening");
        cap.current = setTimeout(() => r.stop(), MAX_RECORDING_MS);
      } catch {
        setError("unclear");
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = recordingType() || undefined;
      const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      mr.onstop = () => {
        clearTimeout(cap.current);
        stream.getTracks().forEach((t) => t.stop());
        recorder.current = null;
        const blob = new Blob(chunks, { type: mr.mimeType || type || "audio/webm" });
        setState("idle");
        if (blob.size > 2000) done.current({ engine: "audio", audio: blob });
        else setError("short");
      };
      recorder.current = mr;
      mr.start();
      setState("listening");
      cap.current = setTimeout(() => mr.state === "recording" && mr.stop(), MAX_RECORDING_MS);
    } catch {
      setError("blocked");
    }
  }, [state, engine, lang, support.audio]);

  const stop = useCallback(() => {
    if (state !== "listening") return;
    rec.current?.stop();
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, [state]);

  // Never leave the microphone on when the screen goes away.
  useEffect(
    () => () => {
      clearTimeout(cap.current);
      rec.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );

  return {
    supported: engine !== null,
    engine,
    canSwitchToAudio: support.browser && support.audio && !forceAudio,
    /** After a garbled transcript: record a clip for the AI next time. */
    switchToAudio: () => setForceAudio(true),
    state,
    interim,
    error,
    start,
    stop,
  };
}
