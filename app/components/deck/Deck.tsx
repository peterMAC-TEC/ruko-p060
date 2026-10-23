"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { SLIDES } from "@/lib/deck-content";
import "./deck.css";
import { DeckCtx, type Fx } from "./parts";
import { DECK, type SlideDef } from "./slides";

// The pitch deck engine: a 1920x1080 stage scaled to any screen (letterboxed), keyboard, click and swipe, builds,
// the slide number in the URL (#5), F fullscreen, P presenter window (synced over BroadcastChannel), R restart,
// M motion level (MAX, CALM, OFF). ?print=1 lays every slide out at its final state, one per page, for the PDF.

const FX_KEY = "ruko-deck-fx";
const NEXT_FX: Record<Fx, Fx> = { max: "calm", calm: "off", off: "max" };
type Msg = { type: "state"; i: number; step: number } | { type: "cmd"; cmd: "next" | "prev" | "restart" | "goto"; i?: number };

export function SlideView({ slide, step, still = false }: { slide: SlideDef; step: number; still?: boolean }) {
  const bg = slide.theme === "ink" ? "var(--ink)" : undefined;
  return (
    <div className={`deck-stage ${slide.theme === "blue" ? "deck-blueprint" : ""}`} style={{ background: bg, position: still ? "relative" : "absolute" }}>
      {slide.theme === "paper" && <div className="deck-grain" />}
      {slide.render(step)}
    </div>
  );
}

function readHash(): number {
  const n = Number((typeof window !== "undefined" ? window.location.hash : "").replace("#", ""));
  return Number.isFinite(n) && n >= 1 && n <= DECK.length ? n - 1 : 0;
}

export function Deck() {
  const [i, setI] = useState(0);
  const [step, setStep] = useState(0);
  const [visit, setVisit] = useState(0);
  const [fx, setFx] = useState<Fx>("max");
  const [scale, setScale] = useState(0.5);
  const [print, setPrint] = useState(false);
  const [toast, setToast] = useState("");
  const chan = useRef<BroadcastChannel | null>(null);
  const touch = useRef<number | null>(null);
  const state = useRef({ i: 0, step: 0 });
  state.current = { i, step };

  // start: the slide from the URL, the saved motion level, print mode
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrint(params.get("print") === "1");
    setI(readHash());
    let f: Fx = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "off" : "max";
    try {
      const saved = localStorage.getItem(FX_KEY) as Fx | null;
      if (saved === "max" || saved === "calm" || saved === "off") f = saved;
    } catch {
      // Storage blocked: the default stands.
    }
    if (params.get("fx") === "off" || params.get("print") === "1") f = "off";
    setFx(f);
    const onHash = () => {
      setI(readHash());
      setStep(0);
      setVisit((v) => v + 1);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // fit the 1920x1080 stage to the window
  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  const go = useCallback(
    (nextI: number, nextStep: number) => {
      const apply = () => {
        flushSync(() => {
          if (nextI !== state.current.i) setVisit((v) => v + 1);
          setI(nextI);
          setStep(nextStep);
        });
        const h = `#${nextI + 1}`;
        if (window.location.hash !== h) history.replaceState(null, "", h);
      };
      const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
      if (nextI !== state.current.i && fx === "max" && doc.startViewTransition) doc.startViewTransition(apply);
      else apply();
    },
    [fx],
  );

  const next = useCallback(() => {
    const { i: ci, step: cs } = state.current;
    if (cs < DECK[ci].builds) go(ci, cs + 1);
    else if (ci < DECK.length - 1) go(ci + 1, 0);
  }, [go]);
  const prev = useCallback(() => {
    const { i: ci, step: cs } = state.current;
    if (cs > 0) go(ci, cs - 1);
    else if (ci > 0) go(ci - 1, DECK[ci - 1].builds);
  }, [go]);

  const say = (t: string) => {
    setToast(t);
    setTimeout(() => setToast(""), 1400);
  };

  // the presenter window
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const c = new BroadcastChannel("ruko-deck");
    chan.current = c;
    c.onmessage = (e: MessageEvent<Msg>) => {
      const m = e.data;
      if (m.type !== "cmd") return;
      if (m.cmd === "next") next();
      else if (m.cmd === "prev") prev();
      else if (m.cmd === "restart") go(0, 0);
      else if (m.cmd === "goto" && typeof m.i === "number") go(m.i, 0);
    };
    return () => c.close();
  }, [next, prev, go]);
  useEffect(() => {
    chan.current?.postMessage({ type: "state", i, step } satisfies Msg);
  }, [i, step]);

  // keys
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (["ArrowRight", " ", "PageDown", "Enter"].includes(e.key)) {
        e.preventDefault();
        next();
      } else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) {
        e.preventDefault();
        prev();
      } else if (e.key === "Home") go(0, 0);
      else if (e.key === "End") go(DECK.length - 1, 0);
      else if (e.key === "f" || e.key === "F") {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void document.documentElement.requestFullscreen?.().catch(() => {});
      } else if (e.key === "p" || e.key === "P") {
        window.open("/deck/presenter", "ruko-presenter", "width=1280,height=760");
      } else if (e.key === "r" || e.key === "R") {
        go(0, 0);
        say("Restarted");
      } else if (e.key === "m" || e.key === "M") {
        setFx((f) => {
          const n = NEXT_FX[f];
          try {
            localStorage.setItem(FX_KEY, n);
          } catch {
            // Fine.
          }
          say(`Motion: ${n.toUpperCase()}`);
          setVisit((v) => v + 1);
          return n;
        });
      }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [next, prev, go]);

  if (print) {
    return (
      <DeckCtx.Provider value={{ fx: "off", still: true }}>
        <div className="deck-root" data-fx="off" style={{ background: "#000" }}>
          <style>{`@page { size: 1920px 1080px; margin: 0 } html, body { margin: 0 } .print-page { width: 1920px; height: 1080px; position: relative; overflow: hidden; break-after: page; page-break-after: always }`}</style>
          {DECK.map((s) => (
            <div key={s.id} className="print-page" data-slide={s.id}>
              <SlideView slide={s} step={s.builds} still />
            </div>
          ))}
        </div>
      </DeckCtx.Provider>
    );
  }

  const slide = DECK[i];
  const meta = SLIDES.find((x) => x.id === slide.id);
  return (
    <DeckCtx.Provider value={{ fx, still: false }}>
      <div
        className="deck-root"
        data-fx={fx}
        style={{ position: "fixed", inset: 0, background: "#0d0c1d", overflow: "hidden", touchAction: "pan-y", userSelect: "none" }}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a,button")) return;
          if (e.clientX < window.innerWidth * 0.25) prev();
          else next();
        }}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          const s = touch.current;
          touch.current = null;
          if (s === null) return;
          const dx = e.changedTouches[0].clientX - s;
          if (Math.abs(dx) > 50) {
            e.preventDefault();
            if (dx < 0) next();
            else prev();
          }
        }}
        role="region"
        aria-roledescription="slide deck"
        aria-label={`Slide ${i + 1} of ${DECK.length}: ${meta?.title ?? ""}`}
      >
        <div key={`${i}-${visit}`} style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%, -50%) scale(${scale})` }}>
          <SlideView slide={slide} step={step} />
        </div>
        {/* progress and slide number */}
        <div aria-hidden style={{ position: "absolute", left: 0, bottom: 0, height: 6, width: `${((i + (DECK[i].builds ? step / (DECK[i].builds + 1) : 0) + 1) / DECK.length) * 100}%`, background: "#ffb000", transition: "width 300ms" }} />
        <div style={{ position: "absolute", right: 14, bottom: 12, font: "600 13px var(--f-mono), monospace", color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em" }}>
          {i + 1}/{DECK.length} · {fx.toUpperCase()} · ← → · F · P · M
        </div>
        {toast && (
          <div role="status" style={{ position: "absolute", left: "50%", top: 20, transform: "translateX(-50%)", background: "#14122b", color: "#fff", padding: "8px 18px", borderRadius: 999, font: "600 14px var(--f-mono), monospace" }}>
            {toast}
          </div>
        )}
      </div>
    </DeckCtx.Provider>
  );
}
