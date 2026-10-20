import type { Lang, PatternLibrary } from "./patterns";
import type { Answer, RadarQuestion, RadarResult } from "./radar";

// Warning signs the AI can report from what the person said (a transcript or
// a voice clip) or showed (a screenshot or photo). The AI only reports signs,
// each with the exact words or visible text that show it; this file (code, not
// the AI) turns them into the Scam Radar's answers and decides the level.
// Pure, so it runs on the device and in tests.

export const SIGN_IDS = [
  "arrest_on_call",
  "authority",
  "keep_secret",
  "stay_on_call",
  "pay_to_clear",
  "safe_account",
  "install_app",
  "share_otp",
  "threat_urgency",
  "parcel_or_case",
  "official_document",
] as const;
export type SignId = (typeof SIGN_IDS)[number];

export interface Sign {
  id: SignId;
  /** The exact words heard, or the visible text / a short description for an image. */
  evidence: string;
}

/** What each sign means, for the model's prompt and for the person's screen. */
export const SIGN_TEXT: Record<SignId, { model: string; family: string } & Record<Lang, string>> = {
  arrest_on_call: {
    family: "Told they're under arrest, on a call",
    model: "says the person is under arrest, 'digital arrest', or will be arrested, on a phone or video call",
    en: "They said you are under arrest on a call",
    hi: "कॉल पर कहा कि आप गिरफ़्तार हैं",
  },
  authority: {
    family: "Caller claimed to be police, CBI, customs, a court, RBI or a courier",
    model: "claims to be police, CBI, customs, NCB, ED, a court or judge, RBI, TRAI, a bank's head office or a courier company",
    en: "They said they are police, CBI, customs, a court, RBI or a courier",
    hi: "कहा कि वे पुलिस, CBI, कस्टम, कोर्ट, RBI या कूरियर से हैं",
  },
  keep_secret: {
    family: "Told to keep it secret",
    model: "tells the person not to tell family, friends or the bank, or to keep the matter secret or confidential",
    en: "They told you not to tell anyone",
    hi: "कहा कि किसी को न बताएँ",
  },
  stay_on_call: {
    family: "Told to stay on the call or on camera",
    model: "wants the person to stay on the call or on camera, or not to leave the room or hang up",
    en: "They want you to stay on the call or on camera",
    hi: "कहा कि कॉल या कैमरे पर बने रहें",
  },
  pay_to_clear: {
    family: "Asked for money to clear a name or a case",
    model: "asks for money to clear the person's name, for bail, a fine, a fee, a 'verification' or to close a case",
    en: "They asked for money to clear your name or a case",
    hi: "नाम या केस साफ़ करने के लिए पैसे माँगे",
  },
  safe_account: {
    family: "Asked to move money to a 'safe' account",
    model:
      "asks the person to move money to a 'safe', 'secure', 'RBI', 'government' or 'verification' account, or to break a fixed deposit or take a loan to do so",
    en: "They asked you to move money to a 'safe' account",
    hi: "पैसे किसी 'सेफ़' खाते में भेजने को कहा",
  },
  install_app: {
    family: "Asked to install an app or share the screen",
    model: "asks the person to install an app (AnyDesk, TeamViewer, Skype and similar) or to share their screen",
    en: "They asked you to install an app or share your screen",
    hi: "कोई ऐप डालने या स्क्रीन दिखाने को कहा",
  },
  share_otp: {
    family: "Asked for an OTP, PIN or bank details",
    model: "asks for an OTP, UPI PIN, card number, password or bank login",
    en: "They asked for an OTP, PIN or bank details",
    hi: "OTP, PIN या बैंक की जानकारी माँगी",
  },
  threat_urgency: {
    family: "Threatened or rushed",
    model: "threatens jail, a case, freezing accounts or cutting the SIM, or pushes the person to act right now",
    en: "They threatened you or rushed you",
    hi: "धमकी दी या जल्दी करने का दबाव डाला",
  },
  parcel_or_case: {
    family: "A parcel, a case or Aadhaar misuse came up",
    model: "talks about a parcel with drugs or fake passports, money laundering, or the person's Aadhaar or SIM being misused in a crime",
    en: "They talked about a parcel, a case or your Aadhaar",
    hi: "पार्सल, किसी केस या आपके आधार की बात की",
  },
  official_document: {
    family: "Shown an official-looking warrant, notice or ID",
    model: "the image shows an official-looking arrest warrant, court or agency notice, ID card, uniform, badge, seal or letterhead",
    en: "It shows an official-looking warrant, notice or ID card",
    hi: "इसमें सरकारी जैसा वारंट, नोटिस या पहचान पत्र है",
  },
};

/** Which of the Scam Radar's five questions a sign answers "yes". */
const ANSWERS: Partial<Record<SignId, RadarQuestion>> = {
  stay_on_call: "stay_on_call",
  arrest_on_call: "stay_on_call",
  pay_to_clear: "pay_avoid_arrest",
  safe_account: "pay_avoid_arrest",
  install_app: "install_app",
  share_otp: "share_otp",
  keep_secret: "keep_secret",
};

/** The signs that are a scam's own move, not just its setting. */
export const STRONG: ReadonlySet<SignId> = new Set(["arrest_on_call", "keep_secret", "pay_to_clear", "safe_account"]);

/** Drops empty, unknown and repeated signs, and trims the evidence. */
export function cleanSigns(raw: Array<{ id: string; evidence?: string }>): Sign[] {
  const seen = new Set<SignId>();
  const out: Sign[] = [];
  for (const s of raw) {
    if (!(SIGN_IDS as readonly string[]).includes(s.id)) continue;
    const id = s.id as SignId;
    const evidence = (s.evidence ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
    if (!evidence || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, evidence });
  }
  return out;
}

/** The signs as the Scam Radar's answers, on top of anything the person already answered. */
export function signsToAnswers(signs: Sign[], base: Partial<Record<RadarQuestion, Answer>> = {}) {
  const answers = { ...base };
  for (const s of signs) {
    const q = ANSWERS[s.id];
    if (q) answers[q] = "yes";
  }
  return answers;
}

/**
 * The radar's verdict once the AI has read the words or the photo (call it
 * only then). The signs raise it: a scam's own move plus anything else is a
 * STOP; any sign at all is at least "check first". One exception lowers it,
 * against false alarms: a lone keyword hit (say "parcel" in a real delivery
 * update) with no "yes" answers, in words the AI read in full and found no
 * sign in, is not a warning. A STOP is never lowered. Nothing found is "clear",
 * which the app never words as "safe".
 */
export function withSigns(r: RadarResult, signs: Sign[], lib: PatternLibrary, patternId?: string | null): RadarResult {
  const strong = signs.some((s) => STRONG.has(s.id));
  const raised: RadarResult["level"] = (strong && signs.length >= 2) || signs.length >= 3 ? "stop" : signs.length > 0 ? "caution" : "clear";
  const rank = { clear: 0, caution: 1, stop: 2 } as const;
  const keywordOnly = r.level === "caution" && r.yes === 0 && signs.length === 0;
  const base = keywordOnly ? "clear" : r.level;
  const level = rank[raised] > rank[base] ? raised : base;
  const pattern = r.pattern ?? lib.patterns.find((p) => p.id === patternId) ?? null;
  return { ...r, level, pattern, signals: [...r.signals, ...signs.map((s) => `sign_${s.id}`)] };
}

const QUESTION_LABEL: Record<RadarQuestion, string> = {
  stay_on_call: "Kept on the call or on camera",
  pay_avoid_arrest: "Asked to pay to avoid arrest",
  install_app: "Asked to install an app or share the screen",
  share_otp: "Asked for an OTP, PIN or bank details",
  keep_secret: "Told to keep it secret",
};

/**
 * The family alert's reasons in plain English, from the codes the check
 * stores: "pattern_digital_arrest", "q_keep_secret", "said_…", "sign_…".
 * One line per reason, repeats dropped.
 */
export function reasonLabels(codes: string[], lib: PatternLibrary): Array<{ code: string; label: string }> {
  const name = (id: string) => lib.patterns.find((p) => p.id === id)?.name.en;
  // The AI's signs already say what the yes/no answers derived from them say.
  const hasSigns = codes.some((c) => c.startsWith("sign_"));
  const out: Array<{ code: string; label: string }> = [];
  for (const code of codes) {
    if (hasSigns && code.startsWith("q_")) continue;
    const [kind, ...rest] = code.split("_");
    const id = rest.join("_");
    const label =
      kind === "pattern"
        ? name(id) && `Looks like: ${name(id)}`
        : kind === "q"
          ? QUESTION_LABEL[id as RadarQuestion] && `${QUESTION_LABEL[id as RadarQuestion]} (answered yes)`
          : kind === "said"
            ? name(id) && `Words from this scam's script`
            : kind === "sign"
              ? SIGN_TEXT[id as SignId]?.family
              : undefined;
    const line = label || code.replace(/_/g, " ");
    if (!out.some((o) => o.label === line)) out.push({ code, label: line });
  }
  return out;
}
