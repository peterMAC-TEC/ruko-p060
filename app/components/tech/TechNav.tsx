"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";

// The control-room bar on the judge-facing pages: every part of Ruko one tap away, the live call pinned and lit.
// It does not appear on the calm elder screens, the live call itself, or inside embedded phones.

const SHOW_ON = ["/", "/demo", "/architecture", "/eval", "/console", "/lab", "/impact", "/line", "/survey", "/phone", "/family", "/bank", "/setup"];
export const NAV: [string, string][] = [
  ["/demo/live", "Live call"],
  ["/family", "Family phone"],
  ["/bank", "Mock bank"],
  ["/console", "Fraud desk"],
  ["/line", "Ruko Line"],
  ["/architecture", "Architecture"],
  ["/eval", "Eval"],
];

function Inner() {
  const path = usePathname() ?? "/";
  const embed = useSearchParams().get("embed");
  if (embed || path.startsWith("/demo/live")) return null;
  if (!SHOW_ON.some((p) => (p === "/" ? path === "/" : path === p || path.startsWith(p + "/")))) return null;
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#060a10]/85 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2.5">
        <Link href="/" className="shrink-0" aria-label="Ruko home">
          <RukoWordmark tone="light" />
        </Link>
        <span className="hidden font-mono text-[12px] tracking-[0.14em] text-white/45 uppercase sm:inline">Control room</span>
        <nav aria-label="Ruko sections" className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto">
          {NAV.map(([href, label], i) => {
            const on = path === href || path.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={
                  i === 0
                    ? "mr-1 flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-[#38e1ff] px-4 text-[15px] font-semibold text-[#041016] shadow-[0_0_24px_rgba(56,225,255,0.35)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    : `flex min-h-11 shrink-0 items-center rounded-full px-3 text-[15px] transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${on ? "bg-white/10 text-white" : "text-white/70"}`
                }
              >
                {i === 0 && <span className="size-2 rounded-full bg-[#041016] motion-safe:animate-pulse" aria-hidden />}
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function TechNav() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
