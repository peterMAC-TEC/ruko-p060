"use client";

import { useEffect, useState } from "react";
import { useSaveStatus } from "@/lib/outbox";

/** Tiny "Saving… / Saved ✓ / Offline" note, so nobody wonders whether a tap counted. */
export function SaveStatus() {
  const status = useSaveStatus();
  const [justSaved, setJustSaved] = useState(false);
  const [prev, setPrev] = useState(status);

  if (prev !== status) {
    setPrev(status);
    if (prev !== "idle" && status === "idle") setJustSaved(true);
  }
  useEffect(() => {
    if (!justSaved) return;
    const t = setTimeout(() => setJustSaved(false), 1800);
    return () => clearTimeout(t);
  }, [justSaved]);

  const text = status === "saving" ? "Saving…" : status === "offline" ? "No signal. Will retry" : justSaved ? "Saved ✓" : "";
  return (
    <span aria-live="polite" className={`text-xs ${status === "offline" ? "text-warn" : "text-muted"}`}>
      {text}
    </span>
  );
}
