"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { MotionToggle } from "@/components/motion/motion";

// The footer every page shares: what this is and where help is. (The control-room bar is components/tech/TechNav.tsx.)

function Inner() {
  const path = usePathname() ?? "/";
  const embed = useSearchParams().get("embed");
  if (embed || path.startsWith("/demo/live")) return null;
  const dark = path === "/" || path === "/demo" || path.startsWith("/demo/how");
  return (
    <footer className={`mt-auto border-t px-6 py-5 text-center text-[15px] ${dark ? "border-white/10 bg-[#060a10] text-white/60" : "border-hair text-ink-soft"}`}>
      Demo prototype. No real money moves. Scam help:{" "}
      <a href="tel:1930" className={`font-semibold underline underline-offset-4 ${dark ? "text-white" : "text-ink"}`}>
        1930
      </a>{" "}
      · cybercrime.gov.in
      <div className="mt-3 flex justify-center">
        <MotionToggle tone={dark ? "dark" : "light"} />
      </div>
    </footer>
  );
}

export function SiteChrome() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
