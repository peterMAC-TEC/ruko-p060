// Safety rules for the role-play scammer. These are the guardrails from docs/DECISIONS.md and
// CLAUDE.md, written as code so that no line it speaks (scripted or improvised by the AI) can break them:
// a fictional agency only, never a real agency, company, bank or officer (BNS s.204), never a
// real OTP, PIN, password, card, Aadhaar or account number, money only on the practice bank screen,
// and no threats of violence. Pure, so it works anywhere and is tested.

/** Real agencies, banks and firms a drill must never name. The drill uses "Central Investigation Cell - DRILL". */
const REAL_NAMES =
  /\b(cbi|ncb|enforcement directorate|ed officer|nia|ib|rbi|reserve bank|trai|supreme court|high court|income tax|customs department|interpol|fbi|cyber ?crime branch|fedex|dhl|dtdc|blue ?dart|amazon|flipkart|sbi|hdfc|icici|axis bank|paytm|phonepe|google pay|gpay|aadhaar authority|uidai|police commissioner)\b/i;
/** Asking for the real thing: an OTP, PIN, password, CVV, card number, or a real Aadhaar/account number. */
const REAL_SECRETS =
  /\b(otp|one[- ]time (password|code)|upi pin|atm pin|debit card pin|\bpin\b|password|cvv|card number|aadhaar number|aadhar number|pan number|account number|net ?banking|login)\b/i;
const VIOLENCE = /\b(kill|hurt|beat|shoot|harm your|kidnap|acid|burn)\b/i;
/** A long run of digits looks like a real phone, card or account number. A 4-digit DRILL code is fine. */
const LONG_NUMBER = /\d[\d\s-]{6,}\d/;

export const MAX_BRIDGE_WORDS = 30;

export interface Verdict {
  ok: boolean;
  why?: "real_name" | "real_secret" | "violence" | "long_number" | "too_long" | "empty";
}

/** Is this improvised line safe for the drill caller to say? Scripted lines were reviewed by hand; AI lines go through here. */
export function checkCallerLine(text: string | null | undefined): Verdict {
  const t = (text ?? "").trim();
  if (!t) return { ok: false, why: "empty" };
  if (t.split(/\s+/).length > MAX_BRIDGE_WORDS) return { ok: false, why: "too_long" };
  if (REAL_NAMES.test(t)) return { ok: false, why: "real_name" };
  if (REAL_SECRETS.test(t)) return { ok: false, why: "real_secret" };
  if (VIOLENCE.test(t)) return { ok: false, why: "violence" };
  if (LONG_NUMBER.test(t)) return { ok: false, why: "long_number" };
  return { ok: true };
}

/** A line that fits the drill but is not the AI's: stays in character, asks for nothing, names nobody. */
export const NEUTRAL_BRIDGE = {
  en: "Please listen carefully. This is important and I need your full attention.",
  hing: "Kripya dhyan se suniye. Yeh zaroori hai aur mujhe aapka poora dhyan chahiye.",
  hi: "कृपया ध्यान से सुनिए। यह ज़रूरी है और मुझे आपका पूरा ध्यान चाहिए।",
} as const;
