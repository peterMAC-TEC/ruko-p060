import "server-only";
import { createHash } from "node:crypto";
import { normalizeNumber } from "./numberRisk";

// Phone numbers, reporters and destination accounts are only ever stored as
// salted hashes, so the community tables can't be turned back into a list of
// who called or paid whom. In production a missing salt is an error, not a
// silent default (a public default salt would make the hashes reversible by
// brute force over the small space of phone numbers).
function salt() {
  const s = process.env.RUKO_HASH_SALT;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("RUKO_HASH_SALT must be set in production");
  return "ruko-dev-salt-change-me";
}

export const hashNumber = (raw: string) => createHash("sha256").update(`num:${salt()}:${normalizeNumber(raw)}`).digest("hex");
export const hashReporter = (id: string) => createHash("sha256").update(`rep:${salt()}:${id}`).digest("hex");

/** UPI IDs and account numbers: case and spaces don't matter. */
export const normalizeAccount = (raw: string) => raw.trim().toLowerCase().replace(/\s+/g, "");
export const hashAccount = (raw: string) => createHash("sha256").update(`acct:${salt()}:${normalizeAccount(raw)}`).digest("hex");

/** For display to bank staff: keep the handle, hide most of the name ("rbi.v****@axis"). */
export function maskAccount(raw: string) {
  const a = normalizeAccount(raw);
  const [user, host] = a.split("@");
  const shown = user.slice(0, Math.min(5, Math.ceil(user.length / 3)));
  return `${shown}${"*".repeat(Math.max(3, user.length - shown.length))}${host ? `@${host}` : ""}`;
}
