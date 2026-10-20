import "server-only";
import { createHash } from "node:crypto";
import { canonical } from "./canonical";

export { canonical };

// Tamper-evident logs: each entry's hash covers the previous entry's hash and
// the entry's own fields in a fixed order, so changing, inserting or deleting
// any entry breaks every hash after it.

export const GENESIS = "0".repeat(64);

export const sha256 = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");

export const chainHash = (prevHash: string, entry: unknown) => sha256(`${prevHash}|${canonical(entry)}`);

export interface ChainCheck {
  ok: boolean;
  count: number;
  /** Index of the first entry whose hash doesn't match, if any. */
  brokenAt: number | null;
  head: string;
}

export function verifyChain<T extends { prev_hash: string; hash: string }>(rows: T[], fields: (row: T) => unknown): ChainCheck {
  let prev = GENESIS;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.prev_hash !== prev || chainHash(prev, fields(r)) !== r.hash) return { ok: false, count: rows.length, brokenAt: i, head: prev };
    prev = r.hash;
  }
  return { ok: true, count: rows.length, brokenAt: null, head: prev };
}
