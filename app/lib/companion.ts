// Ruko Companion: what Ruko says to an older person once a scam alert has fired.
// A fixed, calm script comes first (hang up, send nothing, family is coming).
// The AI only answers free questions after that, and everything it says goes
// through safeReply(). Pure code, so it works offline and is tested.
// Nothing here listens to or joins a call: it talks to the person, on their own phone.

export type CLang = "en" | "hing"; // English, or Hinglish (Hindi in Roman letters)

/** What the family sees about the elder. Codes only, never words. */
export type ElderStatus = "talking" | "hung_up" | "needs_help" | "paid";
export const ELDER_STATUSES: readonly ElderStatus[] = ["talking", "hung_up", "needs_help", "paid"];

export type StepId = "hello" | "end_call" | "scared" | "after" | "paid" | "calm" | "free";
export type Action = "call_family" | "call_1930" | "help" | "close";

type Text = Record<CLang, string>;

export interface Option {
  id: string;
  label: Text;
  /** Where the conversation goes next. */
  to?: StepId;
  /** A phone call, a page, or closing the chat. */
  action?: Action;
  /** Tells the family. */
  status?: ElderStatus;
}

export interface Step {
  say: Text;
  options: Option[];
}

export const STEPS: Record<StepId, Step> = {
  hello: {
    say: {
      en: "I'm Ruko, and I'm here with you. You are safe. You have done nothing wrong. Is the caller still on the line?",
      hing: "Main Ruko hoon, aapke saath hoon. Aap surakshit hain. Aapne kuch galat nahi kiya. Kya woh abhi bhi line par hain?",
    },
    options: [
      { id: "still_on", label: { en: "Yes, still on", hing: "Haan, abhi line par hain" }, to: "end_call" },
      { id: "hung_up", label: { en: "No, I hung up", hing: "Nahi, maine phone kaat diya" }, to: "after", status: "hung_up" },
    ],
  },
  end_call: {
    say: {
      en: "Please end the call now. Press the red button, or just put the phone down. Police never arrest anyone on a video call. Tell me when it's done.",
      hing: "Kripya abhi call kaat dijiye. Laal button dabaiye, ya phone neeche rakh dijiye. Police video call par kisi ko giraftar nahi karti. Ho jaye to bataiye.",
    },
    options: [
      { id: "done", label: { en: "I ended the call", hing: "Maine call kaat di" }, to: "after", status: "hung_up" },
      { id: "cant", label: { en: "I can't, I'm scared", hing: "Nahi kar sakta, mujhe dar lag raha hai" }, to: "scared", status: "needs_help" },
    ],
  },
  scared: {
    say: {
      en: "That's okay. Don't argue, and don't send anything. Say you need a minute, then put the phone face down. Your family is being told right now. I'm staying with you.",
      hing: "Koi baat nahi. Bahas mat kijiye aur kuch bhejiye mat. Kahiye ki ek minute chahiye, phir phone ulta rakh dijiye. Aapke parivar ko abhi bataya ja raha hai. Main aapke saath hoon.",
    },
    options: [
      { id: "call_family", label: { en: "Call my family", hing: "Parivar ko phone karo" }, action: "call_family" },
      { id: "done", label: { en: "I put the phone down", hing: "Maine phone rakh diya" }, to: "after", status: "hung_up" },
    ],
  },
  after: {
    say: {
      en: "Well done. One question. Before this, did you send any money or tell them an OTP?",
      hing: "Bahut accha kiya. Ek sawaal. Isse pehle, kya aapne paise bheje ya OTP bataya?",
    },
    options: [
      { id: "yes", label: { en: "Yes, I did", hing: "Haan, bataya ya bheja" }, to: "paid", status: "paid" },
      { id: "no", label: { en: "No, nothing", hing: "Nahi, kuch nahi" }, to: "calm" },
    ],
  },
  paid: {
    say: {
      en: "Thank you for telling me. It is not your fault. Please call 1930 now, then your bank. The first few hours matter most.",
      hing: "Batane ke liye shukriya. Isme aapki galti nahi hai. Kripya abhi 1930 par phone kijiye, phir apne bank ko. Pehle kuch ghante sabse zaroori hain.",
    },
    options: [
      { id: "call_1930", label: { en: "Call 1930", hing: "1930 par phone karo" }, action: "call_1930" },
      { id: "help", label: { en: "What else to do", hing: "Aur kya karna hai" }, action: "help" },
    ],
  },
  calm: {
    say: {
      en: "Good. Don't send money or share an OTP with anyone who called you. Your family is calling you. Would you like to call them first?",
      hing: "Accha. Jisne aapko phone kiya, use paise mat bhejiye aur OTP mat bataiye. Aapka parivar aapko phone kar raha hai. Kya aap pehle unhe phone karna chahenge?",
    },
    options: [
      { id: "call_family", label: { en: "Call my family", hing: "Parivar ko phone karo" }, action: "call_family" },
      { id: "stay", label: { en: "Stay with me", hing: "Mere saath rahiye" }, to: "free" },
      { id: "ok", label: { en: "I'm okay now", hing: "Ab main theek hoon" }, action: "close" },
    ],
  },
  free: {
    say: {
      en: "I'm here. You can ask me anything, or just tell me what is worrying you.",
      hing: "Main yahan hoon. Aap kuch bhi pooch sakte hain, ya bata sakte hain ki aapko kya pareshan kar raha hai.",
    },
    options: [
      { id: "call_family", label: { en: "Call my family", hing: "Parivar ko phone karo" }, action: "call_family" },
      { id: "call_1930", label: { en: "Call 1930", hing: "1930 par phone karo" }, action: "call_1930" },
    ],
  },
};

/** What the family's phone shows. English, because the family screen is English. */
export const FAMILY_LINE: Record<ElderStatus, string> = {
  talking: "is talking to Ruko right now",
  hung_up: "says the caller has hung up",
  needs_help: "is scared and may still be on the call. Call now",
  paid: "says money or an OTP was already shared. Call now, then 1930",
};

// ---------- what the AI may say ----------

export const MAX_REPLY_CHARS = 320;

/** Telling someone to do the risky thing. "Do not send money" is fine; "you should send money" is not. */
const RISKY_INSTRUCTION =
  /\b(you (should|can|must|need to)|please|go ahead and|just|kindly|aap (kar sakte|karein|kijiye)|kar dijiye|bhej dijiye|bata dijiye)\b[^.!?]{0,40}\b(send|transfer|pay|share|give|install|download|open|click|bhej\w*|bata\w*|de\s?d\w*|daal\w*)\b/i;
/** Money, investment and legal advice are not Ruko's job. */
const ADVICE = /\b(invest|shares?|stocks?|mutual fund|loan|lawyer|sue|bail|guarantee|100% safe|refund)\b/i;
/** Accusing or blaming the person. */
const BLAME = /\b(your fault|you were foolish|stupid|careless|should have known|aapki galti)\b/i;

/**
 * The AI's reply, or null if it is unusable. Short, no instruction to
 * send or share, no financial or legal advice, no blame.
 */
export function safeReply(text: string | undefined | null): string | null {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t || t.length > MAX_REPLY_CHARS) return null;
  if (RISKY_INSTRUCTION.test(t) && !/\b(do not|don't|never|mat|nahi)\b/i.test(t)) return null;
  // "It is not your fault" is exactly what Ruko should say; only real blame is refused.
  const unblamed = t.replace(/\b(not|never|nothing|no one|nobody)\b[^.!?]{0,20}\b(your fault|stupid|foolish|careless)\b/gi, "").replace(/aapki galti nahi/gi, "");
  if (ADVICE.test(t) || BLAME.test(unblamed)) return null;
  return t;
}

export type Intent = "explain" | "hang_up" | "call_family" | "call_1930" | "already_paid" | "other";
export const INTENTS: readonly Intent[] = ["explain", "hang_up", "call_family", "call_1930", "already_paid", "other"];

/** The offline answer, when the AI is busy, off, or its reply wasn't safe. Keyword rules; always safe. */
export function fallbackAnswer(question: string, lang: CLang): { reply: string; intent: Intent } {
  const q = question.toLowerCase();
  const has = (re: RegExp) => re.test(q);
  const say = (en: string, hing: string, intent: Intent) => ({ reply: lang === "en" ? en : hing, intent });

  if (has(/already|paid|sent|bhej\s?(diya|chuka)|transfer\s?(kar|kiya)|otp\s?(bata|de)\s?(diya|di)|bata\s?diya/))
    return say(
      "Thank you for telling me. It is not your fault. Please call 1930 now, then your bank, as fast as you can.",
      "Batane ke liye shukriya. Isme aapki galti nahi hai. Kripya abhi 1930 par phone kijiye, phir bank ko, jitna jaldi ho sake.",
      "already_paid",
    );
  if (has(/money|pay|transfer|send|paise|bhej|account|rbi|safe|verify|verification/))
    return say(
      "Please do not send any money to someone who called you. No police, CBI or bank asks for money on a call, and there is no 'safe account'.",
      "Jisne aapko phone kiya use paise mat bhejiye. Koi police, CBI ya bank call par paise nahi maangta, aur koi 'safe account' nahi hota.",
      "explain",
    );
  if (has(/otp|pin|password|code|aadhaar|aadhar/))
    return say(
      "Never tell anyone your OTP, PIN or password. Real police and banks never ask for it on a call.",
      "Apna OTP, PIN ya password kisi ko mat bataiye. Asli police ya bank call par kabhi nahi maangte.",
      "explain",
    );
  if (has(/arrest|jail|giraft|warrant|police|cbi|customs|court|case|fir|digital/))
    return say(
      "Digital arrest does not exist in Indian law. Nobody can arrest you over a phone or video call. Please hang up.",
      "Digital arrest bharatiya kanoon me hota hi nahi. Phone ya video call par koi aapko giraftar nahi kar sakta. Kripya call kaat dijiye.",
      "hang_up",
    );
  if (has(/scared|afraid|dar|ghabra|panic|worried|tension|help/))
    return say(
      "It's okay to feel scared. That is what they want. You are safe, and your family is on the way. Take a slow breath.",
      "Dar lagna swabhavik hai, woh yahi chahte hain. Aap surakshit hain aur parivar aa raha hai. Ek dheemi saans lijiye.",
      "call_family",
    );
  if (has(/family|son|daughter|beta|beti|call|phone/))
    return say(
      "Yes, please call your family now. They want to hear from you.",
      "Haan, abhi apne parivar ko phone kijiye. Woh aapse baat karna chahte hain.",
      "call_family",
    );
  return say(
    "I'm here. The safe thing to do is hang up, send nothing, and call your family.",
    "Main yahan hoon. Sahi yahi hai ki call kaat dein, kuch na bhejein, aur parivar ko phone karein.",
    "other",
  );
}

/** Which buttons to put in front of the person after a free answer. */
export function actionsFor(intent: Intent): Action[] {
  switch (intent) {
    case "already_paid":
      return ["call_1930", "call_family"];
    case "call_1930":
      return ["call_1930", "call_family"];
    default:
      return ["call_family", "call_1930"];
  }
}

export const ACTION_LABEL: Record<Action, Text> = {
  call_family: { en: "Call my family", hing: "Parivar ko phone karo" },
  call_1930: { en: "Call 1930", hing: "1930 par phone karo" },
  help: { en: "What else to do", hing: "Aur kya karna hai" },
  close: { en: "I'm okay now", hing: "Ab main theek hoon" },
};
