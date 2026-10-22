// The family alert for a risky incoming number (Layer 3). One alert shape for every source (the Android app, the number
// check, the elder's own button). It carries signal CODES only: a risk level, reason codes and a hash of the number.
// Never audio, never words from a call. The same rules decide whether to send it and how often.
import { z } from "zod";

export type AlertLevel = "green" | "yellow" | "orange" | "red";
export type AlertSource = "android" | "number_check" | "elder_button";

/** Plain-words reasons for the codes a device or a check may send. Anything else is dropped. */
export const REASON_LABEL: Record<string, string> = {
  not_in_contacts: "A number that is not in their contacts",
  international: "A number from another country",
  reported_many: "Many people have reported this number as a scam",
  reported_few: "Someone has reported this number as a scam",
  bank_series: "Says it is a bank, but anyone can fake that",
  promo_series: "A sales or promotional number",
  blocked_before: "A number they blocked before",
  short_code: "A very short number",
  unverified_caller: "The phone could not verify who is calling",
  ring_silenced: "Ruko silenced the ring and warned them",
};
export const REASON_CODES = Object.keys(REASON_LABEL);

/** What may travel: codes and a hash. Strict, so a client cannot smuggle in anything else. */
export const AlertBody = z
  .object({
    elderId: z.string().min(1),
    riskLevel: z.enum(["green", "yellow", "orange", "red"]),
    reasonCodes: z.array(z.string().max(40)).max(8).default([]),
    numberHash: z.string().regex(/^[a-f0-9]{64}$/).optional(),
    source: z.enum(["android", "number_check", "elder_button"]),
    at: z.string().max(40).optional(),
  })
  .strict();
export type AlertBodyT = z.infer<typeof AlertBody>;

/** Only orange and red tell the family. Green and yellow never do, so a lone unknown number does not cry wolf. */
export const shouldAlert = (level: AlertLevel) => level === "orange" || level === "red";

export const cleanReasonCodes = (codes: string[]) => [...new Set(codes.filter((c) => c in REASON_LABEL))];

export const SCORE: Record<AlertLevel, number> = { green: 0, yellow: 25, orange: 60, red: 85 };

/** How often one elder may alert the family: the same number once in 10 minutes, and six alerts an hour in all. */
export const SAME_NUMBER_MS = 10 * 60_000;
export const HOUR_MS = 60 * 60_000;
export const MAX_PER_HOUR = 6;

export function throttle(
  history: Array<{ at: number; numberKey?: string | null }>,
  now: number,
  key?: string | null,
): { allow: boolean; reason?: "same_number" | "too_many" } {
  if (key && history.some((h) => h.numberKey === key && now - h.at < SAME_NUMBER_MS)) return { allow: false, reason: "same_number" };
  if (history.filter((h) => now - h.at < HOUR_MS).length >= MAX_PER_HOUR) return { allow: false, reason: "too_many" };
  return { allow: true };
}

/** Calm and short: what happened, and what to do. */
export function alertMessage(elderFirst: string, level: AlertLevel): string {
  return level === "red"
    ? `Ruko warned ${elderFirst} about a very risky incoming call. ${elderFirst} may be on a scam call. Please call ${elderFirst} now.`
    : `Ruko warned ${elderFirst} about a suspicious incoming call. It may be nothing, but please check in with ${elderFirst}.`;
}

/** The note shown to the elder, in plain words, every time the family is told (consent and transparency). */
export const elderNotice = (familyFirst: string | null) => `Ruko told ${familyFirst ?? "your family"} about this call, so they can check on you.`;

/** The key stored with an alert so the same number is not repeated: a short prefix of its hash. */
export const numberKey = (hash?: string | null) => (hash ? hash.slice(0, 12) : null);
export const NUMBER_CODE_PREFIX = "num_";
