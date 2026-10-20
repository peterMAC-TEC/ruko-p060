"use client";

// Browser speech for the drill caller: picks an Indian English or Hindi voice
// when the device has one, and reports when speaking starts and stops.

export function pickVoice(lang: "en" | "hi"): SpeechSynthesisVoice | undefined {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  const want = lang === "hi" ? ["hi-IN", "hi"] : ["en-IN", "en-GB", "en-US", "en"];
  for (const w of want) {
    const v = voices.find((x) => x.lang.replace("_", "-").toLowerCase().startsWith(w.toLowerCase()));
    if (v) return v;
  }
  return undefined;
}

export function say(text: string, lang: "en" | "hi", on: { start?: () => void; end?: () => void } = {}) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    on.end?.();
    return;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang === "hi" ? "hi-IN" : "en-IN";
  const v = pickVoice(lang);
  if (v) u.voice = v;
  u.rate = lang === "hi" ? 0.95 : 0.98;
  u.onstart = () => on.start?.();
  u.onend = () => on.end?.();
  u.onerror = () => on.end?.();
  window.speechSynthesis.speak(u);
}

export function hush() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** A soft phone ring made with Web Audio (no audio file). Returns a stop function. */
export function ring(): () => void {
  const AC = typeof window !== "undefined" ? (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) : undefined;
  if (!AC) return () => {};
  const ctx = new AC();
  let stopped = false;
  const burst = (t: number) => {
    for (const f of [440, 480]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.06, t + 0.05);
      g.gain.setValueAtTime(0.06, t + 1.6);
      g.gain.linearRampToValueAtTime(0, t + 1.7);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 1.8);
    }
  };
  const loop = () => {
    if (stopped) return;
    burst(ctx.currentTime);
    setTimeout(loop, 3800);
  };
  loop();
  return () => {
    stopped = true;
    ctx.close().catch(() => {});
  };
}
