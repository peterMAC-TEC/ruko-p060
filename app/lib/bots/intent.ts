// What a person just said to a caller, as one of a few intents. Rules, not AI, so it is
// instant, works offline and is the same every time. English, Hinglish (Roman letters) and Hindi.
// Used by the scammer bot to choose its next line and by the defender bot to see how a caller reacts.
// The words are classified and thrown away: only the intent code is ever kept.

export type Intent =
  | "silence"
  | "stop_word"
  | "agree_secret" // "I won't tell anyone"
  | "will_pay" // "I'll send it", "opening my bank app"
  | "code_read" // reads out a 4-digit code
  | "refuse" // "no", "I'm hanging up", "I'll call my son"
  | "ask_proof" // "who are you?", "show your ID"
  | "mention_family"
  | "hesitate" // "wait", "I'm scared", "why?"
  | "comply" // "okay", "haan", "yes"
  | "question" // anything else with a question in it
  | "other";

export const INTENTS: readonly Intent[] = [
  "silence", "stop_word", "agree_secret", "will_pay", "code_read", "refuse", "ask_proof", "mention_family", "hesitate", "comply", "question", "other",
];

const STOP = /\bru+k+h?o+\b|रुको|रूको/i;
const AGREE_SECRET =
  /(won'?t|will not|shall not|not going to) tell (anyone|anybody|nobody|no one|my (son|daughter|family|wife|husband))|nobody will know|kisi ko nahi (bataunga|bataungi|batau|batana)|kisi ko nahin (bataunga|bataungi)|किसी को नहीं (बताऊँगा|बताऊंगा|बताऊँगी)/i;
const WILL_PAY =
  /\b(i('| wi)ll (send|transfer|pay|do it|go to the bank)|sending (it|now|the money)?|going to (the )?bank|(bank|upi)( app)? (open|khol) (kar|karta|karti|raha|rahi)|open(ing)? (my )?(bank|upi|app)|bhej (raha|rahi|deta|deti|dunga|dungi)|transfer (kar raha|kar rahi|karta|karunga|karungi)|abhi (bhejta|bhejti|karta|karti)|bank (ja raha|ja rahi|jaa raha))\b|भेज (रहा|रही|दूँगा|दूंगा|दूँगी)/i;
const DIGIT_WORDS = "(?:zero|one|two|three|four|five|six|seven|eight|nine|ek|do|teen|char|chaar|paanch|panch|chhe|saat|aath|nau)";
const CODE = new RegExp(`\\b(?!1930\\b)\\d(?:[\\s,.-]*\\d){3}\\b|\\b${DIGIT_WORDS}(?:[\\s,.-]+${DIGIT_WORDS}){3}\\b`, "i");
const REFUSE =
  /\b(i (will not|won'?t|refuse|am not going to|am hanging up|am cutting)|not going to|hang(ing)? up|cut(ting)? (the|this) call|disconnect(ing)?|call(ing)? (the )?(police|1930|cyber ?cell|my (son|daughter|lawyer|bank))|nahi (karunga|karungi|bhejunga|bhejungi|dunga|dungi|batunga|batungi)|main (nahi|nahin)|phone rakh (raha|rahi|deta|deti)|call kaat (raha|rahi|deta|deti)|kaat raha|band kar (raha|rahi|deta))\b|नहीं (करूँगा|करूंगा|भेजूँगा|दूँगा|दूंगा)|फ़ोन रख|फोन रख|कॉल काट/i;
const BARE_NO = /^\s*(no+|nahi+n?|nope|na|नहीं|नही)\W*$/i;
const ASK_PROOF =
  /(who are you|who is this|your name|what'?s your name|badge|id card|identity|proof|prove it|verify (you|your|this)|which (office|department|station|branch)|employee (id|number)|official (number|website)|naam kya|kaun (ho|hai|bol|se)|aap kaun|number kya|sabut|सबूत|कौन|नाम क्या)/i;
const FAMILY =
  /\b(my (son|daughter|wife|husband|family|children|nephew|grandson|granddaughter|lawyer)|ask (my|the) (son|daughter|family)|talk to my|beta|beti|bete se|ghar (wale|walon)|family se|pooch(ta|ti|unga|ungi)?|poochna)\b|बेटा|बेटी|पत्नी|पति|परिवार/i;
const HESITATE =
  /\b(wait|hold on|one (minute|moment)|just a (moment|minute)|let me think|i don'?t (know|understand|think)|not sure|scared|afraid|worried|nervous|why|how come|what do you mean|but|really|kyun|kyon|kaise|pata nahi|samajh nahi|dar (lag|raha)|ghabra|ek minute|thoda ruko|ruk jaiye)\b|क्यों|डर|घबरा|रुकिए/i;
const COMPLY =
  /\b(ok(ay)?|yes|yeah|yep|sure|fine|alright|all right|haan|han|haanji|ji|ji haan|theek hai|thik hai|accha|achha|samajh gaya|samajh gayi|i understand|go ahead|done|kar diya|ho gaya)\b|हाँ|हां|ठीक है|जी/i;
const QUESTION = /\?|\b(what|when|where|which|can i|should i|kya|kab|kahan|kaha)\b/i;

/** The person's words → one intent. The order matters: the strongest signals come first. */
export function classify(text: string | null | undefined): Intent {
  const t = (text ?? "").replace(/\s+/g, " ").trim();
  if (!t) return "silence";
  if (STOP.test(t)) return "stop_word";
  if (AGREE_SECRET.test(t)) return "agree_secret";
  if (WILL_PAY.test(t)) return "will_pay";
  if (CODE.test(t)) return "code_read";
  if (BARE_NO.test(t) || REFUSE.test(t)) return "refuse";
  if (ASK_PROOF.test(t)) return "ask_proof";
  if (FAMILY.test(t)) return "mention_family";
  if (HESITATE.test(t)) return "hesitate";
  if (COMPLY.test(t)) return "comply";
  if (QUESTION.test(t)) return "question";
  return "other";
}

/** Intents that mean the person is going along with the caller. */
export const GOING_ALONG: ReadonlySet<Intent> = new Set(["comply", "agree_secret", "will_pay", "code_read", "silence"]);
