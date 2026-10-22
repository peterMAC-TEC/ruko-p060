// Recorded voices for the live call. Every line the officer (and Ruko's STOP line) can say from the script is recorded
// ahead of time with natural Indian voices (scripts/make-live-audio.py), the same way as the "Watch Ruko step in" demo,
// so it sounds the same on every phone and laptop. A line with no recording (for example one the AI worded) is read
// by the browser's own voice instead. Pure code: the key of a line is a short hash of who says it, the language and the words.
import { ACK_LINES, ALL_OFFICER_LINES_BY_LANG } from "./demo-officer";
import { FILLERS, OBJECTION_LINES } from "./officer-brain";

export type VoiceRole = "officer" | "ruko";
export type LiveLang = "en" | "hing";
export type LiveManifest = Record<string, Record<string, number>>;

export const RUKO_STOP: Record<LiveLang, string> = {
  en: "Stop. This is a scam call. Do not send any money. Hang up now. Then call one nine three zero, or tell your family.",
  hing: "Ruko. Yeh scam call hai. Koi paise mat bhejiye. Abhi call kaat dijiye. Phir ek nau teen zero par phone kijiye, ya apne parivar ko bataiye.",
};

export function lineKey(role: VoiceRole, lang: LiveLang, text: string): string {
  let h = 0x811c9dc5;
  for (const ch of `${role}|${lang}|${text}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

/** Everything to record: [role, lang, text]. */
export function allLiveLines(): { role: VoiceRole; lang: LiveLang; text: string; key: string }[] {
  const out: { role: VoiceRole; lang: LiveLang; text: string; key: string }[] = [];
  const add = (role: VoiceRole, lang: LiveLang, text: string) => out.push({ role, lang, text, key: lineKey(role, lang, text) });
  for (const lang of ["en", "hing"] as LiveLang[]) {
    for (const t of ALL_OFFICER_LINES_BY_LANG[lang]) add("officer", lang, t);
    for (const lines of Object.values(OBJECTION_LINES)) for (const l of lines) add("officer", lang, l[lang]);
    for (const f of FILLERS) add("officer", lang, f[lang]);
    add("ruko", lang, RUKO_STOP[lang]);
  }
  const seen = new Set<string>();
  return out.filter((l) => (seen.has(l.key) ? false : (seen.add(l.key), true)));
}

/** The recorded clips to play for a line, in order, or null when it has none (then the browser voice reads it). */
export function clipPlan(role: VoiceRole, lang: LiveLang, text: string, manifest: LiveManifest | null): string[] | null {
  const have = manifest?.[lang];
  if (!have) return null;
  const whole = lineKey(role, lang, text);
  if (have[whole] !== undefined) return [whole];
  if (role === "officer") {
    for (const a of ACK_LINES) {
      const prefix = `${a[lang]} `;
      if (text.startsWith(prefix)) {
        const k1 = lineKey(role, lang, a[lang]);
        const k2 = lineKey(role, lang, text.slice(prefix.length));
        if (have[k1] !== undefined && have[k2] !== undefined) return [k1, k2];
      }
    }
  }
  return null;
}
