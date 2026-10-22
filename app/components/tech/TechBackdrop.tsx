// The backdrop of the judge-facing "control room" screens: near-black, a faint blueprint grid, one cool glow.
// Pure CSS, no images, so it costs nothing to load. Decorative only.
export function TechBackdrop({ glow = "cyan" }: { glow?: "cyan" | "green" }) {
  const c = glow === "cyan" ? "56,225,255" : "74,222,128";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.5]"
        style={{
          backgroundImage: "linear-gradient(rgba(120,200,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(120,200,255,0.07) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 30%, transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 0%, #000 30%, transparent 85%)",
        }}
      />
      <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full blur-3xl" style={{ background: `radial-gradient(closest-side, rgba(${c},0.18), transparent)` }} />
    </div>
  );
}

/** A small mono label with a status dot: "● LIVE". */
export function Chip({ children, tone = "cyan" }: { children: React.ReactNode; tone?: "cyan" | "green" | "red" | "grey" }) {
  const t = { cyan: "text-[#38e1ff] border-[#38e1ff]/30 bg-[#38e1ff]/10", green: "text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10", red: "text-[#ff6b5c] border-[#ff4d3d]/40 bg-[#ff4d3d]/10", grey: "text-white/60 border-white/15 bg-white/5" }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[12px] font-semibold tracking-[0.1em] uppercase ${t}`}>{children}</span>;
}
