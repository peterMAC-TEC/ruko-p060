"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useMotionOk } from "./motion";

// Motion for the live call: the circular waveform, the word-by-word caption, the "pressure rising" meter, tactic chips
// and the results timeline. Decorative motion is hidden from screen readers; the information it carries is always
// also in text (caption, labels, numbers).

type Mode = "speaking" | "listening" | "thinking" | "idle";

/**
 * A ring of bars that moves with a voice. `getLevel` returns 0..1 from a real analyser (the caller's recorded voice, or your
 * microphone). When it returns a negative number there is no analyser (the browser's own voice cannot be analysed), and a
 * gentle simulated wave plays instead. With reduced motion it is a still ring.
 */
export function Waveform({ getLevel, mode, size = 132, className = "" }: { getLevel: () => number; mode: Mode; size?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const ok = useMotionOk();
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const getRef = useRef(getLevel);
  getRef.current = getLevel;
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = size * dpr;
    cv.height = size * dpr;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const bars = 56;
    const cx = size / 2;
    const base = size * 0.3;
    let raf = 0;
    let smooth = 0;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, size, size);
      const m = modeRef.current;
      let target = 0;
      if (ok) {
        const raw = getRef.current();
        if (m === "speaking" || m === "listening") target = raw >= 0 ? raw : m === "speaking" ? 0.35 + 0.25 * Math.sin(t / 130) * Math.sin(t / 310) : 0.08;
        else if (m === "thinking") target = 0.12 + 0.08 * Math.sin(t / 240);
        else target = 0.04;
      }
      smooth += (target - smooth) * 0.25;
      const hue = m === "listening" ? "74,222,128" : "56,225,255";
      for (let i = 0; i < bars; i++) {
        const a = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const wob = ok ? 0.55 + 0.45 * Math.sin(i * 1.7 + t / (m === "thinking" ? 260 : 120)) : 0.6;
        const len = 3 + (ok ? smooth : 0.08) * size * 0.2 * wob;
        ctx.strokeStyle = `rgba(${hue},${m === "idle" ? 0.35 : 0.85})`;
        ctx.lineWidth = 2.2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * base, cx + Math.sin(a) * base);
        ctx.lineTo(cx + Math.cos(a) * (base + len), cx + Math.sin(a) * (base + len));
        ctx.stroke();
      }
      if (ok) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [ok, size]);
  return <canvas ref={ref} aria-hidden className={className} style={{ width: size, height: size }} />;
}

/** The caller's line, lit word by word as he says it. The previous line stays above, faded. Text is always fully readable. */
export function KaraokeCaption({ text, prev, speaking, progress }: { text: string; prev: string; speaking: boolean; progress: () => number }) {
  const ok = useMotionOk();
  const words = text.split(/\s+/).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  useEffect(() => {
    if (!speaking || !ok) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdx(speaking ? 0 : words.length);
      return;
    }
    let raf = 0;
    let last = -1;
    const tick = () => {
      const i = Math.min(words.length, Math.floor(progressRef.current() * words.length * 1.02));
      if (i !== last) {
        last = i;
        setIdx(i);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speaking, ok, words.length, text]);
  const live = speaking && ok;
  return (
    <div aria-live="polite">
      {prev && <p className="mb-2 text-[17px] leading-snug text-white/35">&ldquo;{prev}&rdquo;</p>}
      <p className="display text-[26px] leading-snug">
        &ldquo;
        {words.map((w, i) => (
          <span key={i} className="transition-colors duration-150" style={{ color: live ? (i < idx - 1 ? "rgba(255,255,255,0.95)" : i === idx - 1 ? "#38e1ff" : "rgba(255,255,255,0.45)") : undefined }}>
            {w}{" "}
          </span>
        ))}
        &rdquo;
      </p>
    </div>
  );
}

/** "Pressure rising": seven steps that fill as the caller climbs the scam. Stage view only; words say it too. */
export function TensionMeter({ level }: { level: number }) {
  const label = level <= 1 ? "Calm start" : level <= 3 ? "Pressure rising" : level <= 5 ? "High pressure" : "Maximum pressure";
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[12px] tracking-[0.12em] text-white/60 uppercase">
        <span>{label}</span>
        <span>{Math.min(7, level)}/7</span>
      </div>
      <div className="mt-1.5 flex gap-1" role="meter" aria-label="Pressure from the caller" aria-valuemin={0} aria-valuemax={7} aria-valuenow={Math.min(7, level)}>
        {Array.from({ length: 7 }, (_, i) => (
          <span
            key={i}
            className="h-1.5 flex-1 origin-left rounded-full transition-all duration-500"
            style={{ background: i < level ? (i >= 5 ? "#ff4d3d" : i >= 3 ? "#fbbf24" : "#38e1ff") : "rgba(255,255,255,0.1)", transform: i < level ? "scaleY(1)" : "scaleY(0.6)" }}
          />
        ))}
      </div>
    </div>
  );
}

/** A tactic the engine spotted. It slides in; tap it for a one-line plain explanation. */
export function TacticChip({ label, why, fresh }: { label: string; why: string; fresh: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen((o) => !o)}
      aria-expanded={open}
      className={`${fresh ? "m-word" : ""} min-h-10 rounded-[14px] border border-white/15 px-3 py-1.5 text-left text-[14px] text-white/80 transition hover:border-[#38e1ff]/60`}
      style={{ "--i": 0 } as CSSProperties}
    >
      {label}
      {open && <span className="mt-1 block text-[13px] leading-snug text-white/55">{why}</span>}
    </button>
  );
}

/** The call as a line that draws itself, step 0 to 7, with the furthest step lit. */
export function CallTimeline({ furthest, labels }: { furthest: number; labels: string[] }) {
  const ok = useMotionOk();
  return (
    <div className="mt-5 rounded-[22px] bg-[#060a10] p-5 text-white">
      <p className="font-mono text-[12px] tracking-[0.14em] text-[#38e1ff] uppercase">How far the call got</p>
      <div className="relative mt-5 px-2">
        <div className="absolute top-[7px] right-2 left-2 h-[2px] bg-white/15" />
        <div className="absolute top-[7px] left-2 h-[2px] origin-left bg-[#38e1ff]" style={{ width: `calc((100% - 1rem) * ${furthest / 7})`, animation: ok ? "ruko-line 1.1s var(--m-ease) both" : undefined }} />
        <ol className="relative flex justify-between">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="flex w-0 flex-col items-center">
              <span
                className={`block size-4 rounded-full border-2 ${i < furthest ? "border-[#38e1ff] bg-[#38e1ff]" : i === furthest ? "border-[#38e1ff] bg-[#060a10] ring-4 ring-[#38e1ff]/25" : "border-white/25 bg-[#060a10]"}`}
                style={{ animation: ok ? `ruko-pop 0.4s var(--m-ease) ${0.12 * i}s both` : undefined }}
              />
              <span className={`mt-2 font-mono text-[12px] ${i === furthest ? "text-[#38e1ff]" : "text-white/40"}`}>{i}</span>
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-4 text-[17px] leading-snug text-white/80">
        Furthest step: <span className="font-semibold text-white">{furthest} of 7</span> · {labels[furthest]}
      </p>
    </div>
  );
}
