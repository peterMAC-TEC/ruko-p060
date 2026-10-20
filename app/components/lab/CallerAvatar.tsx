// An illustrated caller (DECISIONS: a voice plus an animated caller, not a
// real person; no uniform, badge, emblem or logo). Plain shirt, office blur.
// The mouth moves while the voice speaks; the eyes blink.

const TONES = ["#c98b62", "#a86f4c", "#d9a07a", "#8d5a3b"];

export function CallerAvatar({ speaking, seed = 0, size = 280 }: { speaking: boolean; seed?: number; size?: number }) {
  const skin = TONES[seed % TONES.length];
  const shirt = ["#3a5a78", "#5b6b5a", "#6b4f6a", "#4a4f57"][seed % 4];
  return (
    <svg viewBox="0 0 280 280" width={size} height={size} role="img" aria-label="The caller">
      <style>{`
        @keyframes ruko-talk { 0%,100% { transform: scaleY(.25) } 30% { transform: scaleY(1) } 60% { transform: scaleY(.5) } }
        @keyframes ruko-blink { 0%,94%,100% { transform: scaleY(1) } 97% { transform: scaleY(.1) } }
        .ruko-mouth { transform-origin: 140px 168px; transform: scaleY(.25); }
        .ruko-mouth.on { animation: ruko-talk .32s ease-in-out infinite; }
        .ruko-eye { transform-box: fill-box; transform-origin: center; animation: ruko-blink 4.2s infinite; }
      `}</style>
      {/* office backdrop, softly out of focus */}
      <rect width="280" height="280" fill="#2a3036" />
      <rect x="18" y="30" width="70" height="120" rx="6" fill="#39424a" />
      <rect x="196" y="22" width="66" height="96" rx="6" fill="#343c43" />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={26 + i * 15} y="44" width="10" height="44" rx="2" fill={["#55606a", "#4a5560", "#626d77", "#4f5a64"][i]} />
      ))}
      <rect x="0" y="200" width="280" height="80" fill="#22282d" />
      {/* body */}
      <path d={`M40 280 C46 222 92 204 140 204 C188 204 234 222 240 280 Z`} fill={shirt} />
      <path d="M118 206 L140 236 L162 206 Z" fill="#e9eef2" />
      <rect x="124" y="176" width="32" height="34" rx="12" fill={skin} />
      {/* head */}
      <ellipse cx="140" cy="132" rx="50" ry="58" fill={skin} />
      <path d="M90 124 C90 82 116 70 140 70 C170 70 192 86 190 124 C182 104 166 96 140 96 C116 96 98 104 90 124 Z" fill="#1d1a19" />
      <ellipse cx="90" cy="136" rx="8" ry="13" fill={skin} />
      <ellipse cx="190" cy="136" rx="8" ry="13" fill={skin} />
      {/* eyes and brows */}
      <path d="M108 116 Q120 110 130 116" stroke="#1d1a19" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M150 116 Q160 110 172 116" stroke="#1d1a19" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse className="ruko-eye" cx="119" cy="130" rx="6" ry="6.5" fill="#1d1a19" />
      <ellipse className="ruko-eye" cx="161" cy="130" rx="6" ry="6.5" fill="#1d1a19" />
      <path d="M140 136 Q136 150 141 154" stroke="#7a4a32" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".6" />
      {/* mouth */}
      <ellipse className={`ruko-mouth ${speaking ? "on" : ""}`} cx="140" cy="168" rx="15" ry="9" fill="#5a2a22" />
    </svg>
  );
}
