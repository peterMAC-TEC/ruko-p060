"use client";

import { useEffect, useRef, useState } from "react";
import { Guardian, type Mood } from "./Guardian";

// The landing page's Guardian: its eyes follow the pointer a little, and a tap makes it look attentive for a moment.
// Nothing happens for people who asked for reduced motion; the character just stays as it is.

export function LiveGuardian({ className = "size-64" }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });
  const [mood, setMood] = useState<Mood>("safe");

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const move = (e: PointerEvent) => {
      const r = box.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.max(120, Math.hypot(dx, dy));
      setGaze({ x: dx / d, y: dy / d });
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  useEffect(() => {
    if (mood === "safe") return;
    const t = setTimeout(() => setMood("safe"), 1400);
    return () => clearTimeout(t);
  }, [mood]);

  return (
    <div ref={box} onPointerDown={() => setMood("checking")} className="select-none">
      <Guardian mood={mood} gaze={gaze} className={className} />
    </div>
  );
}
