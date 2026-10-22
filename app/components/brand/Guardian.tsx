// The Guardian: Ruko's character. One plain geometric shape (a shield with two eyes and the bar from the Ruko mark)
// that changes expression with the person's situation. It is always decoration: it carries no information that
// is not also in words, it never sits on top of text or controls, and it only moves when the person has not
// asked for reduced motion (see globals.css). On danger it holds still.

export type Mood = "safe" | "checking" | "danger" | "after";

const INK = "#171717";
const RED = "#d92d20";
const CREAM = "#f4e8cf";
const GREEN = "#bcd9c5";

export function Guardian({
  mood = "safe",
  className = "size-28",
  label,
  gaze,
}: {
  mood?: Mood;
  className?: string;
  label?: string;
  /** Where to look, -1 to 1 on each axis (the landing page uses it to follow the pointer). */
  gaze?: { x: number; y: number };
}) {
  const gx = (gaze?.x ?? 0) * 4;
  const gy = (gaze?.y ?? 0) * 3;
  // The bar across the chest (the Ruko mark's "hand held up"): cream when calm, red only when danger.
  const bar = mood === "danger" ? RED : mood === "after" ? GREEN : CREAM;
  const look = mood === "checking";
  const still = mood === "danger";
  const brow =
    mood === "danger" ? "M28 40 L52 44 M92 40 L68 44" : mood === "checking" ? "M28 42 Q40 36 52 41 M68 44 L92 44" : mood === "after" ? "M28 44 Q40 40 52 44 M68 44 Q80 40 92 44" : "M28 41 Q40 35 52 41 M68 41 Q80 35 92 41";
  const mouth =
    mood === "danger" ? "M48 86 H72" : mood === "checking" ? "M50 86 Q60 88 70 85" : mood === "after" ? "M44 82 Q60 96 76 82" : "M46 83 Q60 93 74 83";
  return (
    <svg viewBox="0 0 120 132" className={`${className} shrink-0 ${mood === "safe" ? "g-bob" : ""}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      <path d="M60 5 C84 5 108 13 108 13 V62 C108 96 86 118 60 127 C34 118 12 96 12 62 V13 C12 13 36 5 60 5Z" fill={INK} />
      <g className={still ? "" : "g-blink"}>
        <ellipse cx="40" cy="60" rx="12" ry={mood === "after" ? 9 : 12} fill="#fff" />
        <ellipse cx="80" cy="60" rx="12" ry={mood === "after" ? 9 : 12} fill="#fff" />
      </g>
      <g className={look ? "g-look" : ""}>
        <circle cx={(mood === "danger" ? 40 : 41) + gx} cy={61 + gy} r="5.5" fill={INK} />
        <circle cx={(mood === "danger" ? 80 : 81) + gx} cy={61 + gy} r="5.5" fill={INK} />
      </g>
      <path d={brow} stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <path d={mouth} stroke="#fff" strokeWidth="4" strokeLinecap="round" fill="none" />
      <rect x="38" y="102" width="44" height="7" rx="3.5" fill={bar} />
    </svg>
  );
}
