"use client";

import { useEffect, useRef, useState } from "react";
import { useMotionOk } from "@/components/motion/motion";

// The animated scam caller of the live call. The face is the SAME illustrated caller as the trial lab's (components/lab/CallerAvatar.tsx:
// same head, hair, eyes, nose, ears, mouth, shirt and colours). On top of it sit a generic cartoon cap and a plain collar, so
// people learn what a fake "officer" looks like. Both are a clear caricature: a blank shield on the cap, no text, no real agency,
// emblem, rank, badge or colour scheme. All SVG and CSS, nothing from the network.
//
// What moves, and what drives it (nothing here is decided by AI):
//   mouth      opens with the loudness of the caller's recorded voice (Web Audio analyser), or a gentle simulated wave
//   idle life  blinking, a slight head sway, a breath in the shoulders
//   expression set by the persuasion stage and the tactic in use (see expressionFor in lib/caller-expression.ts)
//   unmasking  when Ruko steps in, the cap and collar drop away, "Fake officer" appears, then the face fades to a silhouette
//   reduced motion: every animation is off and the final picture is shown at once.

export type Expression = "friendly" | "sympathetic" | "stern" | "urgent" | "frustrated";
/** silhouette: ringing. face: answered. unmask: the reveal plays. anon: plain face, tagged. frozen: still face (payment paused). */
export type FacePhase = "silhouette" | "face" | "unmask" | "anon" | "frozen";

const TONES = ["#c98b62", "#a86f4c", "#d9a07a", "#8d5a3b"];
const BROWS: Record<Expression, [string, string]> = {
  friendly: ["M108 116 Q120 110 130 116", "M150 116 Q160 110 172 116"],
  sympathetic: ["M106 121 Q118 113 132 108", "M148 108 Q162 113 174 121"],
  stern: ["M106 110 L132 120", "M148 120 L174 110"],
  urgent: ["M106 108 Q120 98 132 106", "M148 106 Q160 98 174 108"],
  frustrated: ["M106 112 L132 118", "M148 118 L174 112"],
};
const EYE_RY: Record<Expression, number> = { friendly: 6.5, sympathetic: 6, stern: 5, urgent: 7.8, frustrated: 5.4 };
const TILT: Record<Expression, number> = { friendly: 0, sympathetic: -4, stern: 0, urgent: 0, frustrated: 3 };
const TEMPO: Record<Expression, number> = { friendly: 1, sympathetic: 0.9, stern: 1, urgent: 1.5, frustrated: 1.25 };

export function CallerFace({
  phase,
  expression = "friendly",
  getLevel,
  speaking = false,
  seed = 0,
  size = 160,
  backdrop = true,
  tag = true,
  className = "",
}: {
  phase: FacePhase;
  expression?: Expression;
  /** 0..1 loudness of the caller's voice, or a negative number when it cannot be measured (the mouth then simulates). */
  getLevel?: () => number;
  speaking?: boolean;
  seed?: number;
  size?: number;
  backdrop?: boolean;
  /** Show the "Fake officer" tag after the unmasking. */
  tag?: boolean;
  className?: string;
}) {
  const ok = useMotionOk();
  const mouth = useRef<SVGEllipseElement>(null);
  const speakRef = useRef(speaking);
  speakRef.current = speaking;
  const levelRef = useRef(getLevel);
  levelRef.current = getLevel;
  const [tagOn, setTagOn] = useState(false);
  const [gone, setGone] = useState(false); // after the reveal, the face fades to a silhouette
  const skin = TONES[seed % TONES.length];
  const shirt = ["#3a5a78", "#5b6b5a", "#6b4f6a", "#4a4f57"][seed % 4];

  // Lip-sync: the mouth follows the voice. Still when motion is off, and when the face is not "live".
  useEffect(() => {
    const m = mouth.current;
    if (!m) return;
    const live = phase === "face" || phase === "unmask";
    if (!ok || !live) {
      m.style.transform = "scaleY(0.25)";
      return;
    }
    let raf = 0;
    let v = 0.25;
    const tick = (t: number) => {
      let target = 0.2;
      if (speakRef.current) {
        const raw = levelRef.current ? levelRef.current() : -1;
        target = raw >= 0 ? 0.25 + Math.min(1, raw * 1.6) * 0.85 : 0.3 + 0.55 * Math.abs(Math.sin(t / 95) * Math.sin(t / 240 + 1));
      }
      v += (target - v) * 0.4;
      m.style.transform = `scaleY(${v.toFixed(3)})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ok, phase]);

  // The reveal: cap and collar drop (about 0.6 s), the tag appears, and at 1.2 s the face fades to a silhouette.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGone(false);
    if (phase !== "unmask" || !ok) return;
    const t = setTimeout(() => setGone(true), 1200);
    return () => clearTimeout(t);
  }, [phase, ok]);

  // "Fake officer" appears just after the cap drops (0.55 s), or at once without motion.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTagOn(false);
    if (phase === "anon" || (phase === "unmask" && !ok)) {
      setTagOn(true);
      return;
    }
    if (phase !== "unmask") return;
    const t = setTimeout(() => setTagOn(true), 550);
    return () => clearTimeout(t);
  }, [phase, ok]);

  const unmasked = phase === "unmask" || phase === "anon";
  const frozen = phase === "frozen";
  const dropping = phase === "unmask" && ok;
  const sil = phase === "silhouette" || (phase === "unmask" && gone);
  const ry = EYE_RY[expression];
  const [bl, br] = BROWS[expression];
  const tempo = TEMPO[expression];
  const showCap = !unmasked || dropping;

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 280 280"
        width={size}
        height={size}
        role="img"
        aria-label={phase === "silhouette" ? "Unknown caller (silhouette)" : "The scam caller (role-play)"}
        className={frozen ? "cf-still" : undefined}
        style={{ filter: sil ? "brightness(0.12) contrast(0.8)" : "none", opacity: sil ? 0.55 : 1, transition: ok ? "filter 600ms ease, opacity 600ms ease" : undefined, borderRadius: backdrop ? 24 : 0 }}
      >
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .cf-blink { transform-box: fill-box; transform-origin: center; animation: cf-blink 4.2s infinite; }
            .cf-sway { transform-origin: 140px 205px; animation: cf-sway calc(6.5s / var(--cf-tempo, 1)) ease-in-out infinite; }
            .cf-breathe { animation: cf-breathe calc(4.2s / var(--cf-tempo, 1)) ease-in-out infinite; }
            .cf-cap-off { animation: cf-cap 0.6s cubic-bezier(.5,0,.9,.4) forwards; }
            .cf-collar-off { animation: cf-collar 0.55s 0.08s ease-in forwards; }
          }
          .cf-still * { animation: none !important; }
          @keyframes cf-blink { 0%,94%,100% { transform: scaleY(1) } 97% { transform: scaleY(.1) } }
          @keyframes cf-sway { 0%,100% { transform: rotate(calc(var(--cf-tilt, 0) * 1deg - 1.2deg)) } 50% { transform: rotate(calc(var(--cf-tilt, 0) * 1deg + 1.2deg)) } }
          @keyframes cf-breathe { 0%,100% { transform: translateY(0) } 50% { transform: translateY(2px) } }
          @keyframes cf-cap { to { transform: translate(46px,-110px) rotate(38deg); opacity: 0 } }
          @keyframes cf-collar { to { transform: translateY(46px); opacity: 0 } }
        `}</style>
        <g style={{ ["--cf-tempo" as string]: tempo, ["--cf-tilt" as string]: TILT[expression] }}>
          {backdrop && (
            <>
              <rect width="280" height="280" fill="#2a3036" />
              <rect x="18" y="30" width="70" height="120" rx="6" fill="#39424a" />
              <rect x="196" y="22" width="66" height="96" rx="6" fill="#343c43" />
              {[0, 1, 2, 3].map((i) => (
                <rect key={i} x={26 + i * 15} y="44" width="10" height="44" rx="2" fill={["#55606a", "#4a5560", "#626d77", "#4f5a64"][i]} />
              ))}
              <rect x="0" y="200" width="280" height="80" fill="#22282d" />
            </>
          )}
          <g className="cf-breathe">
            {/* body */}
            <path d="M40 280 C46 222 92 204 140 204 C188 204 234 222 240 280 Z" fill={shirt} />
            <path d="M118 206 L140 236 L162 206 Z" fill="#e9eef2" />
            {/* a plain collar: two flaps, no stripes, pins or lettering */}
            {(!unmasked || dropping) && (
              <g className={dropping ? "cf-collar-off" : ""}>
                <path d="M92 216 L132 205 L141 240 L100 250 Z" fill="#3b4650" />
                <path d="M188 216 L148 205 L139 240 L180 250 Z" fill="#3b4650" />
                <path d="M132 205 L141 240 L136 212 Z" fill="#2a333b" />
              </g>
            )}
            <rect x="124" y="176" width="32" height="34" rx="12" fill={skin} />
            <g className="cf-sway">
              {/* head, exactly as the lab caller */}
              <ellipse cx="140" cy="132" rx="50" ry="58" fill={skin} />
              <path d="M90 124 C90 82 116 70 140 70 C170 70 192 86 190 124 C182 104 166 96 140 96 C116 96 98 104 90 124 Z" fill="#1d1a19" />
              <ellipse cx="90" cy="136" rx="8" ry="13" fill={skin} />
              <ellipse cx="190" cy="136" rx="8" ry="13" fill={skin} />
              <path d={bl} stroke="#1d1a19" strokeWidth="4" fill="none" strokeLinecap="round" />
              <path d={br} stroke="#1d1a19" strokeWidth="4" fill="none" strokeLinecap="round" />
              <ellipse className="cf-blink" cx="119" cy="130" rx="6" ry={ry} fill="#1d1a19" />
              <ellipse className="cf-blink" cx="161" cy="130" rx="6" ry={ry} fill="#1d1a19" />
              <path d="M140 136 Q136 150 141 154" stroke="#7a4a32" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" />
              <ellipse ref={mouth} cx="140" cy="168" rx={expression === "frustrated" ? 12 : 15} ry="9" fill="#5a2a22" style={{ transformOrigin: "140px 168px", transform: "scaleY(0.25)" }} />
              {/* a generic cartoon peaked cap: grey, with a blank shield. No text, no real force's colours, crest or insignia. */}
              {showCap && (
                <g className={dropping ? "cf-cap-off" : ""}>
                  <path d="M82 110 C80 54 110 38 140 38 C170 38 200 54 198 110 C186 98 168 94 140 94 C112 94 94 98 82 110 Z" fill="#323d47" />
                  <path d="M84 100 C100 92 120 90 140 90 C160 90 180 92 196 100 L197 111 C182 101 164 98 140 98 C116 98 98 101 83 111 Z" fill="#56646f" />
                  <path d="M94 106 Q140 132 186 106 L182 115 Q140 140 98 115 Z" fill="#1d252c" />
                  <path d="M140 52 L156 58 V74 C156 83 149 88 140 91 C131 88 124 83 124 74 V58 Z" fill="#e8dcc0" />
                </g>
              )}
            </g>
          </g>
        </g>
      </svg>
      {frozen && (
        <span className="absolute inset-x-0 bottom-1 mx-auto w-fit rounded-full bg-[#060a10]/85 px-3 py-0.5 text-[12px] font-bold tracking-wide whitespace-nowrap text-white uppercase">Payment paused</span>
      )}
      {tag && (unmasked || sil) && phase !== "silhouette" && (
        <span
          className="absolute inset-x-0 bottom-1 mx-auto w-fit rounded-full bg-[#ff4d3d] px-3 py-0.5 text-[12px] font-bold tracking-wide whitespace-nowrap text-white uppercase"
          style={{ opacity: tagOn ? 1 : 0, transform: tagOn ? "scale(1)" : "scale(0.8)", transition: ok ? "opacity 300ms ease, transform 300ms cubic-bezier(.22,1,.36,1)" : undefined }}
        >
          Fake officer
        </span>
      )}
    </div>
  );
}

/** Ending A: the caller's silhouette fades out and a calm Ruko shield takes its place. Only the shield when motion is off. */
export function SilhouetteToShield({ shield, size = 96 }: { shield: React.ReactNode; size?: number }) {
  const ok = useMotionOk();
  return (
    <div className="relative" style={{ width: size, height: size }} aria-hidden>
      {ok && (
        <div className="absolute inset-0 overflow-hidden rounded-full" style={{ animation: "ruko-fade 0.9s ease-in reverse forwards" }}>
          <CallerFace phase="silhouette" size={size} />
        </div>
      )}
      <div className="absolute inset-0 grid place-items-center" style={{ animation: ok ? "ruko-fade 0.7s 0.5s ease-out both" : undefined }}>
        {shield}
      </div>
    </div>
  );
}
