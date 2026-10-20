"use client";

import { useState } from "react";

export function ResetDemo() {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        await fetch("/api/demo/reset", { method: "POST" });
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
      className="rounded-lg border border-white/15 px-4 py-2 font-mono text-[12px] uppercase tracking-[0.18em] text-white/60 hover:border-white/40 hover:text-white"
    >
      {done ? "Demo reset ✓" : "Reset demo data"}
    </button>
  );
}
