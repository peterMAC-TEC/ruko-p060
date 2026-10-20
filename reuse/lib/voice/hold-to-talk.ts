"use client";

// Hold to talk: press starts listening, release stops. Uses the browser's own speech recognition
// (en-IN) when it exists; otherwise, or when asked to, records a short clip for the AI to transcribe.
import { useCallback, useEffect, useRef, useState } from "react";

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

export type VoiceEngine = "browser" | "audio";
export type VoiceOutcome = { engine: "browser"; transcript: string } | { engine: "audio"; audio: Blob };
export type VoiceState = "idle" | "listening" | "working";

export function useHoldToTalk(onDone: (outcome: VoiceOutcome) => void) {
  const [state, setState] = useState<VoiceState>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [support, setSupport] = useState<{ browser: boolean; audio: boolean }>({ browser: false, audio: false });
  const [forceAudio, setForceAudio] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const finalText = useRef("");
  const interimRef = useRef("");
  interimRef.current = interim;
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    setSupport({ browser: !!RecognitionCtor(), audio: !!navigator.mediaDevices?.getUserMedia && recordingType() !== null });
  }, []);

  const engine: VoiceEngine | null = support.browser && !forceAudio ? "browser" : support.audio ? "audio" : null;

  const start = useCallback(async () => {
    if (state !== "idle" || !engine) return;
    setError(null);
    setInterim("");
    finalText.current = "";
    try {
      navigator.vibrate?.(15);
    } catch {
      // No vibration on this phone.
    }

    if (engine === "browser") {
      const Ctor = RecognitionCtor()!;
      const r = new Ctor();
      r.lang = "en-IN";
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
        setInterim(`${finalText.current}${live}`.trim());
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") setError("Microphone is blocked. Allow it in the browser, or tap instead.");
        else if (e.error === "network") setError("Voice needs internet. Tap instead, or try again.");
        else if (e.error !== "no-speech" && e.error !== "aborted") setError("Didn't catch that. Try again, closer to the phone.");
      };
      r.onend = () => {
        rec.current = null;
        const text = (finalText.current || "").trim() || interimRef.current.trim();
        setState("idle");
        if (text) done.current({ engine: "browser", transcript: text });
      };
      rec.current = r;
      try {
        r.start();
        setState("listening");
      } catch {
        setError("Couldn't start listening. Try again.");
      }
      return;
    }

    // Audio clip for the AI.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const type = recordingType() || undefined;
      const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        recorder.current = null;
        const blob = new Blob(chunks, { type: mr.mimeType || type || "audio/webm" });
        setState("idle");
        if (blob.size > 2000) done.current({ engine: "audio", audio: blob });
        else setError("That was too short. Hold the button while you talk.");
      };
      recorder.current = mr;
      mr.start();
      setState("listening");
      setInterim("Recording…");
    } catch {
      setError("Microphone is blocked. Allow it in the browser, or tap instead.");
    }
  }, [state, engine]);

  const stop = useCallback(() => {
    if (state !== "listening") return;
    setState("working");
    rec.current?.stop();
    if (recorder.current?.state === "recording") recorder.current.stop();
  }, [state]);

  // Never leave the mic on when the screen goes away.
  useEffect(
    () => () => {
      rec.current?.abort();
      if (recorder.current?.state === "recording") recorder.current.stop();
    },
    [],
  );

  return {
    supported: engine !== null,
    engine,
    canSwitchToAudio: support.browser && support.audio && !forceAudio,
    /** After a garbled browser result: record a clip for the AI instead next time. */
    switchToAudio: () => setForceAudio(true),
    state,
    interim,
    error,
    start,
    stop,
  };
}
