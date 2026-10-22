import "server-only";
import { bankKeyMatches } from "./bank-key";
import { flags } from "./flags";

/**
 * Who may call Ruko Guard as a bank: a request carrying the bank's API key (RUKO_BANK_API_KEY, in the x-ruko-bank-key
 * header). With no key configured, only the demo sandbox is open (DEMO_MODE), so a real deployment never accepts anonymous
 * bank calls. The assess endpoint stores nothing; the approvals endpoints are limited to what the key may do.
 */
export function bankAllowed(request: Request): { ok: boolean; mode: "key" | "demo" | "none" } {
  const key = process.env.RUKO_BANK_API_KEY;
  const given = request.headers.get("x-ruko-bank-key");
  if (bankKeyMatches(key, given)) return { ok: true, mode: "key" };
  if (!key && flags.DEMO_MODE) return { ok: true, mode: "demo" };
  return { ok: false, mode: "none" };
}
