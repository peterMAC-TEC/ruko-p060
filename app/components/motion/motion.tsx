"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Ruko's small motion kit: plain CSS plus a few tiny components. No animation library. Every piece shows its final
// state straight away when motion is reduced (the system setting, or the in-app "Reduce motion" switch).

const KEY = "ruko-motion";

/** True when animation is allowed: not reduced by the system and not switched off in the app. */
export function useMotionOk(): boolean {
  const [ok, setOk] = useState(true);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setOk(!mq.matches && document.documentElement.dataset.motion !== "reduce");
    read();
    mq.addEventListener("change", read);
    window.addEventListener("ruko-motion", read);
    return () => {
      mq.removeEventListener("change", read);
      window.removeEventListener("ruko-motion", read);
    };
  }, []);
  return ok;
}

/** The "Reduce motion" switch. The choice is remembered on this device. */
export function MotionToggle({ tone = "light" }: { tone?: "light" | "dark" }) {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(KEY) === "reduce";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReduced(stored);
      if (stored) document.documentElement.dataset.motion = "reduce";
    } catch {
      // Storage blocked: the system setting still applies.
    }
  }, []);
  const flip = () => {
    const next = !reduced;
    setReduced(next);
    if (next) document.documentElement.dataset.motion = "reduce";
    else delete document.documentElement.dataset.motion;
    try {
      localStorage.setItem(KEY, next ? "reduce" : "full");
    } catch {
      // Fine: the choice just does not stick.
    }
    window.dispatchEvent(new Event("ruko-motion"));
  };
  return (
    <button
      onClick={flip}
      role="switch"
      aria-checked={reduced}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-[13px] font-semibold whitespace-nowrap ${tone === "dark" ? "border-white/25 text-white/80" : "border-hair text-ink-soft"}`}
    >
      <span aria-hidden className={`inline-block h-4 w-7 rounded-full p-0.5 ${reduced ? (tone === "dark" ? "bg-[#38e1ff]" : "bg-ink") : "bg-current opacity-30"}`}>
        <span className={`block size-3 rounded-full bg-white transition-transform ${reduced ? "translate-x-3" : ""}`} />
      </span>
      Reduce motion
    </button>
  );
}

/** Words rise in one after another. `accent` letters of the key word then settle one by one. Static text is read once by screen readers. */
export function WordByWord({ text, accent, accentClass = "", className = "" }: { text: string; accent?: string; accentClass?: string; className?: string }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((w, i) => {
          const style = { "--i": i } as CSSProperties;
          const isAccent = accent && w.replace(/[^\p{L}]/gu, "").toLowerCase() === accent.toLowerCase();
          return (
            <span key={i}>
              <span className={`m-word ${isAccent ? accentClass : ""}`} style={style}>
                {isAccent
                  ? Array.from(w).map((ch, k) => (
                      <span key={k} className="m-word" style={{ "--i": i + k * 0.35 } as CSSProperties}>
                        {ch}
                      </span>
                    ))
                  : w}
              </span>{" "}
            </span>
          );
        })}
      </span>
    </span>
  );
}

/** A short phrase that cycles. Screen readers get one still sentence; the cycling is for the eyes only. */
export function RotatingWords({ prefix, words, staticSentence, className = "" }: { prefix: ReactNode; words: string[]; staticSentence: string; className?: string }) {
  const ok = useMotionOk();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!ok) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2600);
    return () => clearInterval(t);
  }, [ok, words.length]);
  return (
    <p className={className}>
      <span className="sr-only">{staticSentence}</span>
      <span aria-hidden>
        {prefix}{" "}
        <span key={ok ? i : 0} className="m-word text-[#38e1ff]" style={{ "--i": 0 } as CSSProperties}>
          {words[ok ? i : 0]}
        </span>
      </span>
    </p>
  );
}

/** Fades and rises into view once, the first time it scrolls into sight. Visible at once when motion is reduced. */
export function Reveal({ children, className = "", delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const ok = useMotionOk();
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !ok || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (e) => {
        if (e.some((x) => x.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ok]);
  const hidden = ok && !seen;
  return (
    <div ref={ref} className={`m-reveal ${className}`} style={{ opacity: hidden ? 0 : 1, transform: hidden ? "translateY(16px)" : "none", transition: ok ? `opacity 600ms var(--m-ease) ${delay}ms, transform 600ms var(--m-ease) ${delay}ms` : undefined }}>
      {children}
    </div>
  );
}

/** A number that counts up when it scrolls into view. The real value is in the page text from the start. */
export function CountUp({ to, format = (n: number) => Math.round(n).toLocaleString("en-IN"), prefix = "", suffix = "", className = "" }: { to: number; format?: (n: number) => string; prefix?: string; suffix?: string; className?: string }) {
  const ok = useMotionOk();
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(to);
  useEffect(() => {
    const el = ref.current;
    if (!el || !ok || typeof IntersectionObserver === "undefined") return;
    let raf = 0;
    const io = new IntersectionObserver((e) => {
      if (!e.some((x) => x.isIntersecting)) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (t: number) => {
        const p = Math.min(1, (t - t0) / 1100);
        setV(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      setV(0);
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [ok, to]);
  return (
    <span ref={ref} className={`tabular ${className}`}>
      {prefix}
      {format(v)}
      {suffix}
    </span>
  );
}

/** A strip of facts that scrolls slowly. Pause button; with reduced motion it is a still, wrapped list. */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const ok = useMotionOk();
  const [paused, setPaused] = useState(false);
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden || undefined}>
      {items.map((t) => (
        <li key={t} className="flex items-center gap-10 whitespace-nowrap">
          {t}
          <span className="size-1.5 rounded-full bg-[#38e1ff]" aria-hidden />
        </li>
      ))}
    </ul>
  );
  if (!ok) {
    return (
      <ul className={`flex flex-wrap gap-x-8 gap-y-2 ${className}`}>
        {items.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    );
  }
  return (
    <div className={`relative flex items-center gap-3 ${className}`}>
      <div className="relative min-w-0 flex-1 overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent)" }}>
        <div className="flex w-max" style={{ animation: "ruko-marquee 60s linear infinite", animationPlayState: paused ? "paused" : "running" }}>
          {row(false)}
          {row(true)}
        </div>
      </div>
      <button onClick={() => setPaused((p) => !p)} aria-pressed={paused} className="min-h-11 shrink-0 rounded-full border border-white/20 px-4 text-[14px] font-semibold text-white/80">
        {paused ? "Play" : "Pause"}
      </button>
    </div>
  );
}

/** A badge that pops in, slightly tilted. Words only. */
export function Sticker({ children, tilt = -3, delay = 0, className = "" }: { children: ReactNode; tilt?: number; delay?: number; className?: string }) {
  const ok = useMotionOk();
  return (
    <span className={`inline-block rounded-full border-2 border-current px-3 py-1 font-mono text-[12px] font-bold tracking-wide uppercase ${className}`} style={{ transform: `rotate(${tilt}deg)`, animation: ok ? `ruko-pop 0.5s ${delay}ms var(--m-ease) both` : undefined }}>
      {children}
    </span>
  );
}

/** A short burst of paper confetti for the safe outcome. Once, no flashing, skipped when motion is reduced. */
export function Confetti() {
  const ok = useMotionOk();
  if (!ok) return null;
  const colors = ["#38e1ff", "#ffffff", "#4ade80", "#fbbf24"];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-0 overflow-visible">
      {Array.from({ length: 26 }, (_, i) => {
        const x = ((i * 37) % 100) - 50;
        return (
          <span
            key={i}
            className="absolute left-1/2 block h-2.5 w-1.5 rounded-[1px]"
            style={{ background: colors[i % colors.length], ["--x" as string]: `${x * 3}px`, ["--r" as string]: `${(i * 53) % 360}deg`, animation: `ruko-confetti ${1.3 + (i % 5) * 0.12}s ${(i % 7) * 40}ms cubic-bezier(.2,.7,.3,1) both` }}
          />
        );
      })}
    </div>
  );
}
