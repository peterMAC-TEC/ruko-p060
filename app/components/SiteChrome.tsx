"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Two small things every page shares: the pinned "Take a live scam call" pill (only on the judge-facing pages, never on
// the elder screens, which stay calm and one-action), and the footer that says what this is and where help is.

const PILL_ON = ["/results", "/console", "/lab", "/impact", "/line", "/demo", "/survey", "/phone"];

function Inner() {
  const path = usePathname() ?? "/";
  const embed = useSearchParams().get("embed");
  if (embed || path.startsWith("/demo/live")) return null;
  const pill = path !== "/demo/live" && PILL_ON.some((p) => path === p || path.startsWith(p + "/")) && !path.startsWith("/demo/call");
  return (
    <>
      {pill && (
        <Link
          href="/demo/live"
          className="fixed top-3 right-3 z-40 flex min-h-12 items-center rounded-full bg-ink px-5 text-[17px] font-semibold text-white shadow-[0_6px_24px_rgba(0,0,0,0.25)] transition hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        >
          <span className="mr-2 inline-block size-2 rounded-full bg-white motion-safe:animate-pulse" aria-hidden />
          Take a live scam call
        </Link>
      )}
      <footer className="mt-auto border-t border-hair px-6 py-5 text-center text-[15px] text-ink-soft">
        Demo prototype. No real money moves. Scam help: <a href="tel:1930" className="font-semibold text-ink underline underline-offset-4">1930</a> · cybercrime.gov.in
      </footer>
    </>
  );
}

export function SiteChrome() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
