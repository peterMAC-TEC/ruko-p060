import "server-only";
import { randomBytes, scrypt, scryptSync, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// The practice bank's UPI PIN and the duress ("safety") PIN. Stored only as
// scrypt hashes with a per-PIN salt; compared in constant time; three wrong
// tries lock the PIN for five minutes (counted atomically in the database).

export const PRACTICE_PIN = "1234"; // the demo/practice accounts' PIN until the person sets their own
export const MAX_TRIES = 3;
export const LOCK_MINUTES = 5;
const N = 2 ** 14;
const scryptAsync = promisify(scrypt) as (pw: string, salt: Buffer, len: number, opts: { N: number; r: number; p: number }) => Promise<Buffer>;

export const isPinFormat = (pin: string) => /^\d{4}$/.test(pin);

/** Hashing happens only when a PIN is set (rate-limited), so the sync form is fine here. */
export function hashPin(pin: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pin, salt, 32, { N, r: 8, p: 1 });
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function checkPin(pin: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored) return false;
  const [scheme, saltB64, hashB64] = stored.split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(pin, Buffer.from(saltB64, "base64"), expected.length, { N, r: 8, p: 1 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Which PIN was typed: the normal one, the duress one, or neither. Without a
 * set PIN only sandbox (demo/practice) accounts accept the practice PIN; real
 * accounts must set one first (security review M4).
 */
export async function classifyPin(
  pin: string,
  state: { pin_hash: string | null; duress_hash: string | null },
  opts: { sandbox: boolean },
): Promise<"ok" | "duress" | "wrong" | "unset"> {
  if (!state.pin_hash && !opts.sandbox) return "unset";
  if (!isPinFormat(pin)) return "wrong";
  // Check both every time so the timing doesn't reveal which one matched.
  const [duress, normal] = await Promise.all([
    checkPin(pin, state.duress_hash),
    state.pin_hash ? checkPin(pin, state.pin_hash) : Promise.resolve(pin === PRACTICE_PIN),
  ]);
  if (duress) return "duress";
  return normal ? "ok" : "wrong";
}
