// "Is this call real?": scores an elder's answers about a call against the
// digital-arrest playbook (research/01). Pure, so it runs and tests anywhere.
// Only the matched codes are stored, never what the elder said (signals, not content).

export type QuestionId = "authority" | "arrest" | "secrecy" | "money" | "bank_number";
export type Answer = "yes" | "no" | "unsure";
export type Level = "high" | "medium" | "low";

export const QUESTIONS: Array<{ id: QuestionId; weight: number }> = [
  { id: "authority", weight: 25 }, // police, CBI, customs, TRAI, courier, RBI, court
  { id: "arrest", weight: 45 }, // "digital arrest", "you will be arrested"
  { id: "secrecy", weight: 40 }, // stay on video, tell no one
  { id: "money", weight: 45 }, // move money, OTP, install an app
  { id: "bank_number", weight: 25 }, // says it's the bank but not a 1600 number
];

// Phrases from real scripts, in English, Hindi and common transliterations.
const PHRASES: Array<{ code: string; re: RegExp; points: number; question?: QuestionId }> = [
  { code: "digital_arrest", re: /digital\s*arrest|डिजिटल\s*(अरेस्ट|गिरफ्तारी)/i, points: 60, question: "arrest" },
  { code: "arrest", re: /\barrest|warrant|\bjail\b|गिरफ्तार|वारंट|जेल/i, points: 35, question: "arrest" },
  {
    code: "authority",
    re: /\b(cbi|police|customs|ncb|narcotics|enforcement|trai|rbi|reserve bank|court|judge|cyber ?cell|fedex|dhl|courier)\b|सीबीआई|पुलिस|कस्टम|कोर्ट|जज|आरबीआई|कूरियर|ट्राई/i,
    points: 20,
    question: "authority",
  },
  { code: "parcel_drugs", re: /parcel|package|drugs|mdma|पार्सल|ड्रग/i, points: 20 },
  { code: "aadhaar_misuse", re: /aadh?aar|आधार/i, points: 15 },
  { code: "money_laundering", re: /money\s*launder|hawala|मनी\s*लॉन्ड्रिंग|हवाला/i, points: 25 },
  { code: "sim_cut", re: /(sim|number).{0,20}(block|cut|disconnect|बंद)|सिम.{0,10}बंद/i, points: 15 },
  {
    code: "secrecy",
    re: /don'?t tell|do not tell|tell no ?one|nobody|keep (it )?secret|stay on (the )?(video|camera|call)|किसी को (मत|ना|न) बता|कैमरा/i,
    points: 40,
    question: "secrecy",
  },
  {
    code: "money_move",
    re: /transfer|send (the )?money|rtgs|neft|\bupi\b|safe account|verification account|fixed deposit|\bfd\b|gold loan|\botp\b|पैसे भेज|ट्रांसफर|ओटीपी|सेफ अकाउंट/i,
    points: 40,
    question: "money",
  },
  { code: "refund_promise", re: /refund|return(ed)? after|after (the )?verification|वेरिफिकेशन|वापस कर/i, points: 20 },
];

export interface CheckResult {
  score: number;
  level: Level;
  /** Codes only; labels are shown in the elder's language by the app. */
  signals: string[];
  /** The kind of scam it most looks like, so the advice can be specific. */
  kind: "digital_arrest" | "courier" | "trai" | "bank" | "unknown";
}

export function scoreCall(answers: Partial<Record<QuestionId, Answer>>, said = ""): CheckResult {
  const signals = new Set<string>();
  let score = 0;

  for (const q of QUESTIONS) {
    const a = answers[q.id];
    if (a === "yes") {
      score += q.weight;
      signals.add(`q_${q.id}`);
    } else if (a === "unsure") {
      score += Math.round(q.weight / 3);
    }
  }

  const coveredByAnswers = new Set(QUESTIONS.filter((q) => answers[q.id] === "yes").map((q) => q.id));
  for (const p of PHRASES) {
    if (!said || !p.re.test(said)) continue;
    signals.add(p.code);
    // Don't double-count what a "yes" answer already scored.
    if (!p.question || !coveredByAnswers.has(p.question)) score += p.points;
  }

  // The playbook combination is a scam whatever the total: an arrest threat
  // plus secrecy or a money request.
  const has = (...codes: string[]) => codes.some((c) => signals.has(c));
  const arrest = has("q_arrest", "digital_arrest", "arrest");
  const pressure = has("q_secrecy", "secrecy", "q_money", "money_move");
  if (arrest && pressure) score = Math.max(score, 90);
  if (has("digital_arrest")) score = Math.max(score, 80);

  score = Math.min(100, score);
  const level: Level = score >= 60 ? "high" : score >= 30 ? "medium" : "low";

  const kind = has("digital_arrest", "q_arrest", "arrest", "money_laundering")
    ? "digital_arrest"
    : has("parcel_drugs")
      ? "courier"
      : has("sim_cut")
        ? "trai"
        : has("q_bank_number")
          ? "bank"
          : "unknown";

  return { score, level, signals: [...signals], kind };
}
