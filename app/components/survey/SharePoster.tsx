"use client";

import { useEffect, useState } from "react";
import { QrCode } from "./QrCode";

export function SharePoster() {
  const [url, setUrl] = useState("");
  useEffect(() => {
    // The page's own address, known only in the browser.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(`${window.location.origin}/survey`);
  }, []);
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col items-center justify-center gap-6 bg-white px-6 py-10 text-center text-ink">
      <h1 className="display text-[44px] leading-[1.04]">Has a scam call ever come to your family?</h1>
      <p className="text-[21px]">Scan to answer 3 quick questions. It is anonymous, and it helps protect other families.</p>
      {url ? <QrCode payload={url} label="QR code for the survey" /> : <div className="aspect-square w-64 animate-pulse rounded-2xl bg-ink/5" />}
      <p className="text-[18px] font-bold break-all">{url.replace(/^https?:\/\//, "")}</p>
      <p className="text-[16px] text-ink-soft">Ruko is a student project that helps older people stop phone scams (the 1930 helpline is always free).</p>
    </main>
  );
}
