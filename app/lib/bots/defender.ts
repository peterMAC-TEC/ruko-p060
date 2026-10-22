import { BUNDLED_LIBRARY } from "../patterns";
import { runRadar } from "../radar";

// The defender bot: Ruko answering a caller who looks like a threat, on the person's behalf.
// It never argues, never lies and never complies. It follows a short, calm "disarm" playbook that
// real bank staff use (docs/research/03 s.3): slow it down and ask for proof, state the rule, ask for it in
// writing, then leave the call and bring in the family and 1930.
//
// IMPORTANT: this runs in the lab, against our own role-play scammer bot, to test the idea and
// Ruko's detection. A phone app cannot join or listen to a real call, and the card forbids call
// interception, so nothing here ever talks to a real caller.

export type DLang = "en" | "hing";
export type Tactic = "listen" | "verify" | "boundary" | "written" | "exit" | "thanks";

export interface DefenderState {
  /** Turns in which the caller looked like a threat. */
  threats: number;
  ended: boolean;
  alerted: boolean;
}
export const defenderStart = (): DefenderState => ({ threats: 0, ended: false, alerted: false });

export interface Threat {
  /** Ruko's own phrase check over everything the caller has said so far. */
  level: "clear" | "caution" | "stop";
  money: boolean;
  secrecy: boolean;
  arrest: boolean;
  secrets: boolean;
}

const MONEY = /\b(transfer|send (the )?money|rtgs|neft|upi|safe account|verification account|fixed deposit|\bfd\b|savings|lakh|crore|break your|bhej(o|iye)?|paise)\b|ट्रांसफर|भेजिए|लाख|वेरिफिकेशन खाते|खाते में डालिए/i;
const SECRECY = /\b(confidential|do not tell|don'?t tell|tell (no ?one|anyone)|keep (it )?secret|not even (your )?family|kisi ko mat|gopniya)\b|गोपनीय|किसी को मत|परिवार को भी नहीं/i;
const ARREST = /\b(arrest|warrant|digital arrest|case (is |has been )?registered|fir\b|non-?cooperation|disconnect(ing)? (this|the) call|do not disconnect|stay on (this|the) (call|line))\b|गिरफ़?्तार|वारंट|कॉल मत काटिए/i;
const SECRETS = /\b(read|tell|give|share|send|provide|say|enter|bataiye|batao|batana|padhiye|dijiye)\b[^.?!]{0,40}\b(otp|pin|password|cvv|card number|case code|four[- ]digit code|code)\b|केस कोड (पढ़िए|बताइए)|कोड (पढ़िए|बताइए)/i;

/** Is this caller a threat? Uses Ruko's own pattern library (the same one that shows STOP on the phone) plus four plain flags. */
export function assess(callerSoFar: string): Threat {
  const r = runRadar(BUNDLED_LIBRARY, { answers: {}, said: callerSoFar });
  return {
    level: r.level,
    money: MONEY.test(callerSoFar),
    secrecy: SECRECY.test(callerSoFar),
    arrest: ARREST.test(callerSoFar),
    secrets: SECRETS.test(callerSoFar),
  };
}

const LINES: Record<Exclude<Tactic, "listen">, Record<DLang, string>> = {
  verify: {
    en: "This is the account holder's safety assistant. Please tell me your full name, your ID number and your office phone number, and I will verify them on the official number.",
    hing: "Main khaatadhaarak ka safety assistant hoon. Kripya apna poora naam, ID number aur office ka phone number bataiye. Main official number par verify karunga.",
  },
  boundary: {
    en: "I will not share any bank details or codes on a call, and I will not send any money. No agency arrests anyone or collects money over a call.",
    hing: "Main call par koi bank details ya code nahi dunga aur paise nahi bhejunga. Koi agency call par kisi ko giraftar nahi karti aur paise nahi maangti.",
  },
  written: {
    en: "I am not going to continue this on a call. If this is genuine, please send it in writing to the registered address.",
    hing: "Main yeh call par aage nahi karunga. Agar yeh asli hai, to kripya likhit mein registered pate par bhejiye.",
  },
  exit: {
    en: "I am hanging up now. The family and the 1930 helpline are being informed. Goodbye.",
    hing: "Main abhi call kaat raha hoon. Parivar aur 1930 helpline ko bataya ja raha hai. Namaste.",
  },
  thanks: {
    en: "Thank you for calling. I will check this on the number printed on the passbook, or at the branch. Goodbye.",
    hing: "Call karne ke liye shukriya. Main ise passbook par chhape number par ya branch mein jaakar check karunga. Namaste.",
  },
};

export interface DefenderTurn {
  text: string;
  tactic: Tactic;
  end: boolean;
  /** Ruko tells the family (once) when it first sees a real threat. */
  alertFamily: boolean;
  threat: Threat;
  state: DefenderState;
}

/**
 * What the defender says to the caller's latest line. `callerSoFar` is everything the caller has said, so Ruko's
 * phrase check sees the whole call. One tactic per threatening turn, in order; the exit comes at once if the caller
 * asks for money or a code, or on the fourth threatening turn.
 */
export function defend(state: DefenderState, callerSoFar: string, lang: DLang): DefenderTurn {
  const threat = assess(callerSoFar);
  const isThreat = threat.level !== "clear" || threat.money || threat.secrecy || threat.arrest || threat.secrets;
  if (!isThreat) {
    // A genuine call: stay polite, accuse nobody, never alert the family for nothing.
    return { text: LINES.thanks[lang], tactic: "thanks", end: false, alertFamily: false, threat, state };
  }
  const threats = state.threats + 1;
  const mustLeave = threat.money || threat.secrets || threats >= 4;
  const tactic: Tactic = mustLeave ? "exit" : threats === 1 ? "verify" : threats === 2 ? "boundary" : "written";
  const alertFamily = !state.alerted && (threat.level === "stop" || threat.money || threat.secrets || threat.secrecy);
  return {
    text: LINES[tactic as Exclude<Tactic, "listen">][lang],
    tactic,
    end: tactic === "exit",
    alertFamily,
    threat,
    state: { threats, ended: tactic === "exit", alerted: state.alerted || alertFamily },
  };
}

/** Everything the defender can say, for tests: none may ever agree to pay, share or hand over anything. */
export const ALL_DEFENDER_LINES: string[] = Object.values(LINES).flatMap((l) => [l.en, l.hing]);
