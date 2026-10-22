import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// The Android app proves it belongs to one elder with a pairing code, not a password. The code is an HMAC of the elder's id
// with a server secret, so nothing has to be stored, and it cannot be guessed or made up for someone else's elder.
// It lets a device do exactly one thing: report a risky number for that elder (codes and a hash only).
// Shown only to the elder's trusted family member, in the setup screen.

function secret() {
  const s = process.env.RUKO_DEVICE_SECRET ?? process.env.RUKO_HASH_SALT;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("RUKO_DEVICE_SECRET or RUKO_HASH_SALT must be set in production");
  return "ruko-dev-device-secret-change-me";
}

export const deviceToken = (elderId: string) => createHmac("sha256", secret()).update(`device:${elderId}`).digest("base64url");

export function verifyDeviceToken(elderId: string, token: string | null | undefined): boolean {
  if (!token) return false;
  const a = Buffer.from(deviceToken(elderId));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
