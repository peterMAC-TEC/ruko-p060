import type { NextRequest } from "next/server";

// Request guards run by proxy.ts before any route: CSRF protection for every
// state-changing API call, and per-client rate limits (stricter on PIN, money,
// code words and reports). In-memory per server instance: production puts the
// counters in a shared store (Redis / Upstash) so limits hold across instances.

const SAFE = new Set(["GET", "HEAD", "OPTIONS"]);

/** Same-origin check for writes: a page on another site can't make the browser call Ruko's API. */
export function csrfBlocked(req: NextRequest): string | null {
  if (SAFE.has(req.method)) return null;
  const site = req.headers.get("sec-fetch-site");
  if (site === "cross-site") return "Cross-site request blocked";
  const origin = req.headers.get("origin");
  if (origin) {
    let host: string;
    try {
      host = new URL(origin).host;
    } catch {
      return "Bad origin";
    }
    const expected = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    if (host !== expected) return "Cross-origin request blocked";
  }
  return null;
}

type Rule = { test: (path: string, method: string) => boolean; limit: number; name: string };

// Requests per minute per client. First match wins.
const RULES: Rule[] = [
  { name: "pin", test: (p, m) => p === "/api/pin" && m === "POST", limit: 5 },
  { name: "codeword", test: (p) => p.startsWith("/api/circle/codeword"), limit: 5 },
  { name: "payment", test: (p, m) => p === "/api/transfers" && m === "POST", limit: 20 },
  { name: "report", test: (p, m) => p.startsWith("/api/number/report") && m === "POST", limit: 10 },
  { name: "invite", test: (p, m) => p.startsWith("/api/invites") && m === "POST", limit: 10 },
  { name: "check", test: (p, m) => p === "/api/check" && m === "POST", limit: 20 },
  { name: "intent", test: (p, m) => p.startsWith("/api/callintent") && m === "POST", limit: 20 },
  { name: "number", test: (p) => p === "/api/number", limit: 60 },
  { name: "write", test: (p, m) => p.startsWith("/api/") && !SAFE.has(m), limit: 240 },
  { name: "read", test: (p) => p.startsWith("/api/"), limit: 900 },
];

const WINDOW_MS = 60_000;
const g = globalThis as unknown as { __rukoRate?: Map<string, number[]> };
const hits = (): Map<string, number[]> => (g.__rukoRate ??= new Map<string, number[]>());

export function clientKey(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

/** Sliding-window limit. Returns seconds to wait, or 0 if allowed. */
export function rateLimited(req: NextRequest): { wait: number; rule: string } | null {
  const path = req.nextUrl.pathname;
  const rule = RULES.find((r) => r.test(path, req.method));
  if (!rule) return null;
  const key = `${rule.name}:${clientKey(req)}`;
  const now = Date.now();
  const list = (hits().get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= rule.limit) {
    hits().set(key, list);
    return { wait: Math.ceil((WINDOW_MS - (now - list[0])) / 1000), rule: rule.name };
  }
  list.push(now);
  hits().set(key, list);
  // Keep the map small.
  if (hits().size > 5000) for (const [k, v] of hits()) if (!v.some((t) => now - t < WINDOW_MS)) hits().delete(k);
  return null;
}

/** Hosts the trial lab is open to without a researcher login (the facilitator's own laptop and LAN). */
export function isPrivateHost(host: string | null) {
  if (!host) return false;
  const h = host.replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return (
    h === "localhost" ||
    h === "127.0.0.1" ||
    h === "::1" ||
    h.endsWith(".localhost") ||
    h.endsWith(".local") ||
    // Whole dotted-quad addresses only, so "10.evil.com" doesn't pass (security review M1).
    /^10(\.\d{1,3}){3}$/.test(h) ||
    /^192\.168(\.\d{1,3}){2}$/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])(\.\d{1,3}){2}$/.test(h)
  );
}
