"use client";

import { b64url, canonical } from "./canonical";

// On-device verification of a bank's signed "we are calling you now" notice
// (lib/callIntent.ts). Checks, in order: the key is the bank's published key,
// the Ed25519 signature is valid over the exact payload, it's for this
// customer, it hasn't expired (±60 s clock skew), and its nonce hasn't been
// seen before on this device (no replays).

export interface SignedIntent {
  id: string;
  payload: {
    v: number;
    kid: string;
    iss: string;
    iss_name: string;
    sub: string;
    agent: string;
    purpose: "payment_check" | "fraud_alert" | "kyc_reminder";
    code: string;
    iat: number;
    exp: number;
    nonce: string;
  };
  sig: string;
  /** Not signed: whether the person confirmed the caller read out the right code. */
  codeMatch?: boolean | null;
}

export type Verdict = { ok: true; intent: SignedIntent } | { ok: false; reason: "bad_signature" | "unknown_key" | "wrong_customer" | "expired" | "replayed" | "unsupported" };

const SKEW_S = 60;
const NONCES = "ruko.intent.nonces";

let keyCache: { at: number; keys: Array<{ kid: string; x: string; crv: string; kty: string }> } | null = null;

async function bankKeys() {
  if (keyCache && Date.now() - keyCache.at < 5 * 60_000) return keyCache.keys;
  const r = await fetch("/api/callintent/keys", { cache: "no-store" });
  const d = await r.json();
  keyCache = { at: Date.now(), keys: d.keys };
  return d.keys as Array<{ kid: string; x: string; crv: string; kty: string }>;
}

function seen(nonce: string, id: string): boolean {
  // The same notice may be shown again (polling); a *different* notice reusing a nonce is a replay.
  try {
    const map = JSON.parse(localStorage.getItem(NONCES) ?? "{}") as Record<string, string>;
    if (map[nonce] && map[nonce] !== id) return true;
    map[nonce] = id;
    const entries = Object.entries(map).slice(-200);
    localStorage.setItem(NONCES, JSON.stringify(Object.fromEntries(entries)));
  } catch {}
  return false;
}

export async function verifyIntent(intent: SignedIntent, customerId: string): Promise<Verdict> {
  const p = intent.payload;
  const keys = await bankKeys().catch(() => []);
  const key = keys.find((k) => k.kid === p.kid);
  if (!key) return { ok: false, reason: "unknown_key" };
  let valid = false;
  try {
    const pub = await crypto.subtle.importKey("jwk", { kty: key.kty, crv: key.crv, x: key.x }, { name: "Ed25519" }, false, ["verify"]);
    valid = await crypto.subtle.verify({ name: "Ed25519" }, pub, b64url.decode(intent.sig), new TextEncoder().encode(canonical(p)));
  } catch {
    return { ok: false, reason: "unsupported" };
  }
  if (!valid) return { ok: false, reason: "bad_signature" };
  if (p.sub !== customerId) return { ok: false, reason: "wrong_customer" };
  const now = Date.now() / 1000;
  if (now > p.exp + SKEW_S || now < p.iat - SKEW_S) return { ok: false, reason: "expired" };
  if (seen(p.nonce, intent.id)) return { ok: false, reason: "replayed" };
  return { ok: true, intent };
}
