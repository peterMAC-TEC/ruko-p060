"use client";

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

// Building blocks for the deck's slides: builds, kinetic words, the octagon, brush strokes, stamps and count-ups.

export type Fx = "max" | "calm" | "off";
export const DeckCtx = createContext<{ fx: Fx; still: boolean }>({ fx: "max", still: false });
export const useDeck = () => useContext(DeckCtx);

const d = (ms: number) => ({ "--d": ms }) as CSSProperties;

/** A part of the slide that appears on build `n` (click or arrow). */
export function B({ n, step, children, className = "", style }: { n: number; step: number; children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`bld ${className}`} data-on={step >= n ? "1" : "0"} style={style}>
      {/* Remounted when it appears, so its animations play then, not while hidden. */}
      <div key={step >= n ? "on" : "off"} aria-hidden={step < n || undefined} style={{ height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

/** Words rise in one by one with a small rotation settle. */
export function Words({ text, delay = 0, gap = 70, className = "", accent, accentClass = "" }: { text: string; delay?: number; gap?: number; className?: string; accent?: string[]; accentClass?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} style={{ display: "inline-block", overflow: "hidden", verticalAlign: "bottom", paddingBottom: "0.04em" }}>
          <span className={`a-rise ${accent?.includes(w.replace(/[^\p{L}\p{N}]/gu, "")) ? accentClass : ""}`} style={d(delay + i * gap)}>
            {w}
          </span>
          {" "}
        </span>
      ))}
    </span>
  );
}

/** Letters slam in one by one. */
export function Letters({ text, delay = 0, gap = 110, className = "" }: { text: string; delay?: number; gap?: number; className?: string }) {
  return (
    <span className={className} aria-label={text}>
      {Array.from(text).map((c, i) => (
        <span key={i} aria-hidden className="a-slam" style={d(delay + i * gap)}>
          {c}
        </span>
      ))}
    </span>
  );
}

/** A hand-painted brush stroke that draws itself. */
export function Brush({ width = 600, delay = 0, color = "var(--marigold)", className = "", style }: { width?: number; delay?: number; color?: string; className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 600 40" width={width} height={(width / 600) * 40} className={className} style={style} aria-hidden>
      <path d="M8 26 C 120 12, 260 30, 380 18 S 560 14, 592 22" fill="none" stroke={color} strokeWidth="16" strokeLinecap="round" className="a-draw" style={{ ["--len" as string]: 700, ...d(delay) }} />
    </svg>
  );
}

/** A hand-drawn arrow that draws itself. */
export function Arrow({ width = 220, delay = 0, color = "var(--ink)", flip = false, style }: { width?: number; delay?: number; color?: string; flip?: boolean; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 220 80" width={width} height={(width / 220) * 80} aria-hidden style={{ transform: flip ? "scaleX(-1)" : undefined, ...style }}>
      <path d="M8 60 C 60 10, 140 6, 196 36" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" className="a-draw" style={{ ["--len" as string]: 260, ...d(delay) }} />
      <path d="M170 18 L 200 38 L 168 56" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="a-draw" style={{ ["--len" as string]: 90, ...d(delay + 500) }} />
    </svg>
  );
}

/** A rubber stamp that lands with a spring. */
export function Stamp({ children, color = "var(--red)", rot = -6, delay = 0, size = 34, style, className = "" }: { children: ReactNode; color?: string; rot?: number; delay?: number; size?: number; style?: CSSProperties; className?: string }) {
  return (
    <span className={`d-stamp a-stamp ${className}`} style={{ color, fontSize: size, ["--rot" as string]: `${rot}deg`, ...d(delay), ...style }}>
      {children}
    </span>
  );
}

const OCT = (cx: number, cy: number, r: number) =>
  Array.from({ length: 8 }, (_, i) => {
    const a = Math.PI / 8 + (i * Math.PI) / 4;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });

/** Ruko's mark: a signal-red octagon holding a calm open hand drawn in ink. Original, drawn here. */
export function RukoMark({ size = 220, draw = true, delay = 0, hand = true, word = false, vt }: { size?: number; draw?: boolean; delay?: number; hand?: boolean; word?: boolean; vt?: string }) {
  const pts = OCT(100, 100, 92);
  const poly = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg viewBox="0 0 200 200" width={size} height={size} aria-label="Ruko mark" role="img" style={{ viewTransitionName: vt } as CSSProperties}>
      <polygon points={poly} fill="var(--red)" className={draw ? "a-fade" : ""} style={d(delay + 300)} />
      <polygon points={poly} fill="none" stroke="var(--ink)" strokeWidth="6" strokeLinejoin="round" className={draw ? "a-draw" : ""} style={{ ["--len" as string]: 620, ...d(delay) }} />
      <polygon points={OCT(100, 100, 80).map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff" strokeWidth="3" className={draw ? "a-draw" : ""} style={{ ["--len" as string]: 520, ...d(delay + 200) }} />
      {hand && !word && (
        <g className={draw ? "a-fade" : ""} style={d(delay + 650)}>
          {/* an open hand: palm and four fingers, thumb out. Paper-coloured, ink outline. */}
          <path
            d="M74 128 C 70 112, 72 98, 76 88 L 76 62 C 76 56, 85 56, 85 62 L 85 86 L 88 86 L 88 54 C 88 48, 97 48, 97 54 L 97 86 L 100 86 L 100 56 C 100 50, 109 50, 109 56 L 109 88 L 112 88 L 112 66 C 112 60, 121 60, 121 66 L 121 104 L 128 94 C 132 88, 141 92, 137 99 L 124 124 C 118 138, 108 144, 96 144 C 86 144, 77 138, 74 128 Z"
            fill="#fbf6ec"
            stroke="var(--ink)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </g>
      )}
      {word && (
        <text x="100" y="118" textAnchor="middle" fill="#fff" style={{ font: "900 54px var(--f-head)", letterSpacing: "1px" }}>
          RUKO
        </text>
      )}
    </svg>
  );
}

/** The giant STOP octagon whose eight edges light up with tactics. */
export function TacticOctagon({ size = 640, lit = [], labels = [], delay = 0 }: { size?: number; lit?: boolean[]; labels?: string[]; delay?: number }) {
  const pts = OCT(300, 300, 270);
  const edges = pts.map((p, i) => [p, pts[(i + 1) % 8]] as const);
  return (
    <svg viewBox="-260 -120 1120 840" width={size * 1.866} height={size * 1.4} aria-hidden style={{ overflow: "visible" }}>
      <polygon points={pts.map((p) => p.join(",")).join(" ")} fill="var(--red)" stroke="var(--ink)" strokeWidth="10" strokeLinejoin="round" />
      <polygon points={OCT(300, 300, 240).map((p) => p.join(",")).join(" ")} fill="none" stroke="#fff" strokeWidth="8" />
      {edges.map(([a, b], i) => {
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        const ox = mx + (mx - 300) * 0.36;
        const oy = my + (my - 300) * 0.3;
        const anchor = ox < 260 ? "end" : ox > 340 ? "start" : "middle";
        return (
          <g key={i}>
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={lit[i] ? "var(--marigold)" : "rgba(255,255,255,0.0)"} strokeWidth="22" strokeLinecap="round" className={lit[i] ? "a-light" : ""} style={d(delay + i * 160)} />
            {labels[i] && (
              <text x={ox} y={oy + 8} textAnchor={anchor} className={lit[i] ? "a-fade" : ""} style={{ ...d(delay + i * 160), font: "800 30px var(--f-mono)", fill: lit[i] ? "var(--ink)" : "rgba(20,18,43,0.3)" }}>
                {labels[i]}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** A number that counts up when its slide is shown (final at once when motion is off or for the PDF). */
export function Count({ to, prefix = "", suffix = "", decimals = 0, delay = 0, dur = 1300 }: { to: number; prefix?: string; suffix?: string; decimals?: number; delay?: number; dur?: number }) {
  const { fx, still } = useDeck();
  const [v, setV] = useState(fx === "max" && !still ? 0 : to);
  const raf = useRef(0);
  useEffect(() => {
    if (fx !== "max" || still) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setV(to);
      return;
    }
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t + delay;
      const p = Math.max(0, Math.min(1, (t - t0) / dur));
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [fx, still, to, delay, dur]);
  const shown = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString("en-IN");
  return (
    <span style={{ fontVariantNumeric: "tabular-nums" }}>
      {prefix}
      {shown}
      {suffix}
    </span>
  );
}

/** A small mono label. */
export function Label({ children, color = "var(--ink)", style }: { children: ReactNode; color?: string; style?: CSSProperties }) {
  return (
    <p className="d-mono" style={{ fontSize: 24, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.16em", color, ...style }}>
      {children}
    </p>
  );
}

export const delayStyle = d;
