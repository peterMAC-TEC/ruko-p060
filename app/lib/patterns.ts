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

/** How many of a pattern's phrases appear in what the person said. */
export function phraseHits(p: ScamPattern, said: string) {
  if (!said) return 0;
  return p.phrases.reduce((n, src) => {
    try {
      return new RegExp(src, "i").test(said) ? n + 1 : n;
    } catch {
      return n; // a bad regex in remote config must never break the check
    }
  }, 0);
}
