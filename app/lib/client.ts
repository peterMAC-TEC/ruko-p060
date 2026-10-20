"use client";

import { useEffect, useState } from "react";
import { BUNDLED_LIBRARY, type PatternLibrary } from "./patterns";
import { isTrialAccountId } from "./trial";

// Device-side helpers. The pattern library is cached so the STOP screen works
// offline and appears instantly; a newer version from the server replaces it.

const LIB_KEY = "ruko.patterns";
const DEVICE_KEY = "ruko.device";

function readCached(): PatternLibrary | null {
  try {
    const raw = localStorage.getItem(LIB_KEY);
    return raw ? (JSON.parse(raw) as PatternLibrary) : null;
  } catch {
    return null;
  }
}

export function usePatternLibrary(): PatternLibrary {
  const [lib, setLib] = useState<PatternLibrary>(BUNDLED_LIBRARY);
  useEffect(() => {
    const cached = readCached();
    // Reading the device cache once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (cached && cached.version >= BUNDLED_LIBRARY.version) setLib(cached);
    fetch("/api/patterns")
      .then((r) => (r.ok ? r.json() : null))
      .then((fresh: PatternLibrary | null) => {
        if (!fresh?.patterns?.length) return;
        setLib(fresh);
        try {
          localStorage.setItem(LIB_KEY, JSON.stringify(fresh));
        } catch {}
      })
      .catch(() => {}); // offline: keep the cached or bundled copy
  }, []);
  return lib;
}

/** A random id for this device, used (hashed) to count one report per device. */
export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

/** Fire-and-forget anonymous event; never blocks or breaks protection. */
export function track(kind: "stop_shown" | "time_to_warning" | "emergency_opened", value?: number, patternId?: string) {
  fetch("/api/metrics", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ kind, value, patternId }),
    keepalive: true,
  }).catch(() => {});
}

/**
 * Trial practice phones only: tells the lab what the participant just did
 * (opened the bank, entered a payee …) so the call log fills itself in.
 * Does nothing for anyone else.
 */
export function practiceEvent(accountId: string, kind: string, detail?: string) {
  if (!isTrialAccountId(accountId)) return;
  fetch("/api/practice", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ account: accountId, kind, detail }),
    keepalive: true,
  }).catch(() => {});
}
