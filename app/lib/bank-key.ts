import { timingSafeEqual } from "node:crypto";

/** A bank's API key matches only if one is configured, one is given, and they are identical (constant-time compare). */
export function bankKeyMatches(configured: string | undefined, given: string | null | undefined): boolean {
  if (!configured || !given) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
