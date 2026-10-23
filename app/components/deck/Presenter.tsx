"use client";

import { useEffect, useRef, useState } from "react";
import { SLIDES, totalSeconds } from "@/lib/deck-content";
import "./deck.css";
import { SlideView } from "./Deck";
import { DeckCtx } from "./parts";
import { DECK } from "./slides";

// The presenter view (P from the deck): this slide, the next one, the speaker notes, a timer and controls.
// It follows the deck over a BroadcastChannel and can drive it.

export function Presenter() {
  const [i, setI] = useState(0);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"live" | "loom">("live");
  const [t0, setT0] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const chan = useRef<BroadcastChannel | null>(null);
  useEffect(() => {
    const c = new BroadcastChannel("ruko-deck");
    chan.current = c;
    c.onmessage = (e: MessageEvent<{ type: string; i: number; step: number }>) => {
      if (e.data.type === "state") {
        setI(e.data.i);
        setStep(e.data.step);
        setT0((t) => t ?? Date.now());
      }
    };
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => {
      c.close();
      clearInterval(id);
    };
  }, []);
  const send = (cmd: "next" | "prev" | "restart") => chan.current?.postMessage({ type: "cmd", cmd });
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) send("next");
      else if (["ArrowLeft", "PageUp"].includes(e.key)) send("prev");
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, []);
  const s = DECK[i];
  const meta = SLIDES.find((x) => x.id === s.id)!;
  const n = DECK[Math.min(DECK.length - 1, i + 1)];
  const secs = t0 && now ? Math.max(0, Math.round((now - t0) / 1000)) : 0;
  const budget = totalSeconds(mode);
  const planned = SLIDES.slice(0, i).reduce((t, x) => t + x[mode], 0);
  const mmss = (x: number) => `${Math.floor(x / 60)}:${String(x % 60).padStart(2, "0")}`;
  return (
    <DeckCtx.Provider value={{ fx: "off", still: true }}>
      <div className="deck-root" data-fx="off" style={{ minHeight: "100dvh", background: "#0d0c1d", color: "#fff", padding: 20, fontFamily: "var(--f-body), system-ui" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <p style={{ font: "700 16px var(--f-mono), monospace", letterSpacing: "0.1em", margin: 0 }}>
            SLIDE {i + 1}/{DECK.length} · BUILD {step}/{s.builds} · {meta.title}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            {(["live", "loom"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} style={{ minHeight: 40, padding: "0 14px", borderRadius: 999, border: "1px solid #ffb000", background: mode === m ? "#ffb000" : "transparent", color: mode === m ? "#14122b" : "#fff", fontWeight: 700 }}>
                {m === "live" ? "3-min pitch" : "Loom"}
              </button>
            ))}
          </div>
          <p style={{ font: "700 28px var(--f-mono), monospace", margin: 0, color: secs > budget ? "#ff6b5c" : "#fff" }}>
            {mmss(secs)} <span style={{ fontSize: 16, opacity: 0.6 }}>/ {mmss(budget)} · on plan {mmss(planned)}</span>
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20, marginTop: 16 }}>
          <div>
            <Thumb w={760}>
              <SlideView slide={s} step={step} still />
            </Thumb>
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button onClick={() => send("prev")} style={btn}>← Back</button>
              <button onClick={() => send("next")} style={{ ...btn, background: "#ffb000", color: "#14122b" }}>Next →</button>
              <button onClick={() => send("restart")} style={btn}>Restart</button>
            </div>
          </div>
          <div>
            <p style={{ font: "700 14px var(--f-mono), monospace", opacity: 0.6, margin: "0 0 6px" }}>NEXT</p>
            <Thumb w={380}>
              <SlideView slide={n} step={0} still />
            </Thumb>
            <p style={{ font: "700 14px var(--f-mono), monospace", opacity: 0.6, margin: "18px 0 6px" }}>
              SAY ({meta[mode]} s)
            </p>
            <p style={{ fontSize: 22, lineHeight: 1.45, margin: 0 }}>{mode === "loom" ? (meta.loomNotes ?? meta.notes) : meta.notes}</p>
          </div>
        </div>
      </div>
    </DeckCtx.Provider>
  );
}

const btn = { minHeight: 48, padding: "0 20px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.4)", background: "transparent", color: "#fff", fontWeight: 700, fontSize: 16 } as const;

function Thumb({ w, children }: { w: number; children: React.ReactNode }) {
  const k = w / 1920;
  return (
    <div style={{ width: w, height: 1080 * k, overflow: "hidden", borderRadius: 10, border: "1px solid rgba(255,255,255,0.2)", position: "relative" }}>
      <div style={{ width: 1920, height: 1080, transform: `scale(${k})`, transformOrigin: "top left" }}>{children}</div>
    </div>
  );
}
