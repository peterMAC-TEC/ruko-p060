import bundled from "@/data/scam-patterns.json";

// The scam pattern library. The bundled JSON ships with the app (and works
// offline); the server serves the live version from the scam_patterns table,
// so a new scam can be added by inserting a row, with no app update.

export type Lang = "en" | "hi";
export type Localised = Record<Lang, string>;

export type Identity =
  | "police"
  | "courier"
  | "bank"
  | "electricity"
  | "customer_care"
  | "family"
  | "investment"
  | "video_stranger"
  | "loan"
  | "tech_support"
  | "unknown";

export interface ScamPattern {
  id: string;
  severity: "high" | "medium";
  /** Who the caller claims to be, for patterns that start that way. */
  identity: Identity[];
  name: Localised;
  /** The one rule the caller is breaking, shown on the STOP screen. */
  rule: Localised;
  /** Three short lines for "I'm not sure". */
  explain: Record<Lang, string[]>;
  /** Case-insensitive regex sources, English and Hindi. */
  phrases: string[];
}

export interface PatternLibrary {
  version: number;
  patterns: ScamPattern[];
}

export const BUNDLED_LIBRARY = bundled as PatternLibrary;

export function findPattern(lib: PatternLibrary, id: string | null | undefined) {
  return id ? lib.patterns.find((p) => p.id === id) : undefined;
}

/**
 * Hindi letters with a dot (nukta), like फ़ in गिरफ़्तार, can be typed or spoken two ways: one character or two.
 * Fold both to the plain letter so "गिरफ़्तार" and "गिरफ्तार" are the same word.
 */
export function foldDevanagari(s: string) {
  return s.normalize("NFD").replace(/़/g, "").normalize("NFC");
}

/** Sentences like "we will never ask for your OTP" are a warning, not a scam sign: they are not counted. */
const REASSURANCE =
  /\b(never|will not|won'?t|do not|don'?t|does not|doesn'?t)\s+(ask|asks|request|requests|call you for)\b|(कभी|नहीं)[^।.!?]*(माँग|मांग)/i;

/** What to look for phrases in: the person's words, without the reassuring sentences and with Hindi letters folded. */
export function forPhrases(said: string) {
  const sentences = foldDevanagari(said).split(/(?<=[.!?।])\s+/);
  return sentences.filter((s) => !REASSURANCE.test(s)).join(" ");
}

/**
 * Words that are common in ordinary, honest calls (a bank that mentions KYC, a courier that mentions a parcel).
 * Together they count as half a sign, so they never raise a warning on their own. Everything else (arrest,
 * warrant, safe account, AnyDesk, OTP...) counts in full.
 */
const WEAK = new Set([
  "\\bkyc\\b", "\\brbi\\b", "आरबीआई", "केवाईसी", "pan card", "parcel", "package", "courier", "पार्सल", "कूरियर", "fedex", "dtdc", "\\bdhl\\b",
  "electricity", "bijli", "बिजली", "bescom", "customer care", "कस्टमर केयर", "refund", "रिफंड", "रिफ़ंड", "cashback", "amazon", "flipkart",
  "accident", "hospital", "एक्सीडेंट", "अस्पताल", "\\btask", "टास्क", "trading", "crypto", "\\bipo\\b", "निवेश", "youtube", "telegram", "\\bloan\\b", "लोन", "\\bemi\\b",
]);

/** How strongly a pattern's phrases show in what the person said: a strong phrase counts 1, a common-word phrase 0.5. */
export function phraseHits(p: ScamPattern, said: string) {
  if (!said) return 0;
  const text = forPhrases(said);
  let strong = 0;
  let weak = false;
  for (const src of p.phrases) {
    try {
      if (!new RegExp(foldDevanagari(src), "i").test(text)) continue;
    } catch {
      continue; // a bad regex in remote config must never break the check
    }
    if (WEAK.has(src)) weak = true;
    else strong++;
  }
  // Common words together ("parcel", "courier", "SwiftParcel") still count as just one half.
  return strong + (weak ? 0.5 : 0);
}
