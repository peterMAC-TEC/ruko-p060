// The survey bot's questions, in English and Hinglish, plus the rules that keep the data clean and safe.
// Three surveys:
//   participant : the older person, right after a drill call (the facilitator opens it, linked to their code P01...)
//   family      : the family member, after a drill call
//   open        : anyone, from a shared link or QR code (anonymous): past scam experiences and what would help
// Pure code: the same checks run on the phone and on the server. No names, phone numbers or emails are kept:
// free text is scrubbed, and every choice is checked against the allowed answers.

export type SurveyKind = "participant" | "family" | "open";
export const SURVEY_KINDS: readonly SurveyKind[] = ["participant", "family", "open"];

type Text = { en: string; hing: string };
export type Answer = string | number | string[];
export type Answers = Record<string, Answer>;

/** What the survey may know about the call it follows. */
export interface Ctx {
  arm?: "baseline" | "ruko" | "control" | null;
  isScam?: boolean | null;
}

export interface Question {
  id: string;
  type: "choice" | "multi" | "scale" | "text";
  ask: Text;
  options?: Array<{ id: string; label: Text }>;
  /** For scales: what 1 and 5 mean. */
  low?: Text;
  high?: Text;
  optional?: boolean;
  when?: (ctx: Ctx, answers: Answers) => boolean;
}

const opt = (id: string, en: string, hing: string) => ({ id, label: { en, hing } });
const YES_NO_NOT_SURE = [opt("yes", "Yes", "Haan"), opt("unsure", "Not sure", "Pata nahi"), opt("no", "No", "Nahi")];

const PARTICIPANT: Question[] = [
  {
    id: "belief_real",
    type: "choice",
    ask: { en: "While it was happening, did you think it was a real call?", hing: "Jab yeh ho raha tha, kya aapko laga ki yeh asli call hai?" },
    options: YES_NO_NOT_SURE,
    when: (c) => c.isScam !== false,
  },
  {
    id: "fear",
    type: "scale",
    ask: { en: "How scared or worried did you feel?", hing: "Aapko kitna dar ya chinta mehsoos hui?" },
    low: { en: "Not at all", hing: "Bilkul nahi" },
    high: { en: "Very much", hing: "Bahut zyada" },
  },
  {
    id: "why",
    type: "multi",
    ask: { en: "What made you carry on, or stop? Pick all that fit.", hing: "Aapne kyun jaari rakha, ya kyun roka? Jo sahi lage sab chuniye." },
    options: [
      opt("sounded_real", "The caller sounded real", "Caller asli lag raha tha"),
      opt("afraid_trouble", "I was afraid of getting into trouble", "Mujhe museebat mein padne ka dar tha"),
      opt("not_bother_family", "I didn't want to bother my family", "Main parivar ko pareshan nahi karna chahta tha"),
      opt("remembered_scam", "I remembered it could be a scam", "Mujhe yaad aaya ki yeh dhokha ho sakta hai"),
      opt("ruko_warned", "Ruko warned me", "Ruko ne mujhe chetaya"),
      opt("family_told", "Someone told me to stop", "Kisi ne mujhe rukne ko kaha"),
      opt("dont_know", "I don't know", "Pata nahi"),
    ],
    when: (c) => c.isScam !== false,
  },
  {
    id: "thought_tell",
    type: "choice",
    ask: { en: "Did you think of telling someone?", hing: "Kya aapne kisi ko batane ka socha?" },
    options: [opt("yes", "Yes", "Haan"), opt("no", "No", "Nahi")],
    when: (c) => c.isScam !== false,
  },
  {
    id: "ruko_help",
    type: "choice",
    ask: { en: "Did Ruko's warning help?", hing: "Kya Ruko ki chetavni se madad mili?" },
    options: [opt("a_lot", "Yes, a lot", "Haan, bahut"), opt("a_little", "A little", "Thodi"), opt("no", "No", "Nahi"), opt("no_notice", "I didn't notice it", "Mujhe dikhi hi nahi")],
    when: (c) => c.arm === "ruko",
  },
  {
    id: "easy",
    type: "scale",
    ask: { en: "Was Ruko easy to use?", hing: "Kya Ruko istemaal karna aasan tha?" },
    low: { en: "Very hard", hing: "Bahut mushkil" },
    high: { en: "Very easy", hing: "Bahut aasan" },
    when: (c) => c.arm === "ruko",
  },
  { id: "confusing", type: "text", optional: true, ask: { en: "Anything confusing or hard? (Please don't give names or numbers.)", hing: "Kuch samajh nahi aaya ya mushkil laga? (Kripya naam ya number na likhein.)" } },
  {
    id: "would_use",
    type: "choice",
    ask: { en: "Would you keep Ruko on your phone?", hing: "Kya aap Ruko ko apne phone mein rakhenge?" },
    options: [opt("yes", "Yes", "Haan"), opt("maybe", "Maybe", "Shayad"), opt("no", "No", "Nahi")],
    when: (c) => c.arm === "ruko",
  },
];

const FAMILY: Question[] = [
  {
    id: "saw_alert",
    type: "choice",
    ask: { en: "Did you see Ruko's alert on your phone?", hing: "Kya aapne apne phone par Ruko ka alert dekha?" },
    options: [opt("yes", "Yes", "Haan"), opt("late", "Yes, but late", "Haan, par der se"), opt("no", "No", "Nahi")],
  },
  {
    id: "how_fast",
    type: "choice",
    ask: { en: "How quickly did you notice it?", hing: "Aapne kitni jaldi dekha?" },
    options: [opt("lt1", "Under a minute", "Ek minute se kam"), opt("1to5", "1 to 5 minutes", "1 se 5 minute"), opt("gt5", "More than 5 minutes", "5 minute se zyada"), opt("never", "I didn't", "Nahi dekha")],
    when: (_c, a) => a.saw_alert !== "no",
  },
  {
    id: "clear",
    type: "scale",
    ask: { en: "Was it clear what to do?", hing: "Kya saaf tha ki kya karna hai?" },
    low: { en: "Not clear", hing: "Saaf nahi" },
    high: { en: "Very clear", hing: "Bahut saaf" },
    when: (_c, a) => a.saw_alert !== "no",
  },
  {
    id: "action",
    type: "choice",
    ask: { en: "What did you do?", hing: "Aapne kya kiya?" },
    options: [opt("called", "Called them", "Unhe phone kiya"), opt("messaged", "Messaged them", "Message kiya"), opt("waited", "Waited to see", "Dekhne ke liye ruke"), opt("nothing", "Nothing", "Kuch nahi")],
  },
  {
    id: "trust",
    type: "choice",
    ask: { en: "Would you trust an alert like this at 2 in the night?", hing: "Kya aap raat ke 2 baje aise alert par bharosa karenge?" },
    options: [opt("yes", "Yes", "Haan"), opt("maybe", "Maybe", "Shayad"), opt("no", "No", "Nahi")],
  },
  { id: "improve", type: "text", optional: true, ask: { en: "What would make the alert better? (No names or numbers, please.)", hing: "Alert ko behtar kaise banayein? (Naam ya number na likhein.)" } },
];

const OPEN: Question[] = [
  {
    id: "who",
    type: "choice",
    ask: { en: "Who are you answering for?", hing: "Aap kiske baare mein jawab de rahe hain?" },
    options: [opt("self", "Myself (I am 60 or older)", "Apne baare mein (main 60 ya usse bada hoon)"), opt("parent", "A parent or grandparent", "Maa-baap ya dada-dadi/nana-nani"), opt("other", "Someone else", "Kisi aur ke baare mein")],
  },
  {
    id: "age_band",
    type: "choice",
    ask: { en: "How old is that person?", hing: "Unki umar kitni hai?" },
    options: [opt("lt60", "Under 60", "60 se kam"), opt("60-64", "60 to 64", "60 se 64"), opt("65-69", "65 to 69", "65 se 69"), opt("70-74", "70 to 74", "70 se 74"), opt("75-79", "75 to 79", "75 se 79"), opt("80+", "80 or more", "80 ya zyada")],
  },
  {
    id: "place",
    type: "choice",
    optional: true,
    ask: { en: "Where do they live?", hing: "Woh kahan rehte hain?" },
    options: [opt("bengaluru", "Bengaluru", "Bengaluru"), opt("metro", "Another big city", "Koi aur bada sheher"), opt("town", "A smaller town", "Chhota sheher"), opt("village", "A village", "Gaon")],
  },
  {
    id: "got_call",
    type: "choice",
    ask: { en: "Have they ever got a call or message from a fake police, CBI, customs or courier officer, or a similar scam?", hing: "Kya unhe kabhi nakli police, CBI, customs ya courier officer jaisa call ya message aaya hai?" },
    options: [opt("never", "Never", "Kabhi nahi"), opt("once", "Once", "Ek baar"), opt("several", "Several times", "Kai baar"), opt("lost_money", "Yes, and they lost money", "Haan, aur paise gaye")],
  },
  {
    id: "types",
    type: "multi",
    ask: { en: "Which kinds? Pick all that fit.", hing: "Kaun se tarah ke? Jo sahi lage sab chuniye." },
    options: [
      opt("digital_arrest", "\"You are under digital arrest\"", "\"Aap digital arrest mein hain\""),
      opt("courier", "A parcel or courier with drugs", "Parcel ya courier mein drugs"),
      opt("kyc", "Bank KYC or account blocked", "Bank KYC ya account band"),
      opt("electricity", "Electricity cut", "Bijli kat jayegi"),
      opt("family", "A family member in trouble", "Parivar ka koi museebat mein"),
      opt("job_invest", "A job or investment offer", "Naukri ya investment ka offer"),
      opt("other", "Something else", "Kuch aur"),
    ],
    when: (_c, a) => a.got_call !== "never",
  },
  {
    id: "what_did",
    type: "multi",
    ask: { en: "What did they do? Pick all that fit.", hing: "Unhone kya kiya? Jo sahi lage sab chuniye." },
    options: [
      opt("hung_up", "Hung up", "Phone kaat diya"),
      opt("asked_family", "Asked family or a friend", "Parivar ya dost se poocha"),
      opt("blocked", "Blocked the number", "Number block kiya"),
      opt("reported", "Reported it (1930 or police)", "Report kiya (1930 ya police)"),
      opt("went_along", "Went along for a while", "Kuch der saath chale"),
      opt("paid", "Sent money", "Paise bheje"),
    ],
    when: (_c, a) => a.got_call !== "never",
  },
  {
    id: "told_during",
    type: "choice",
    ask: { en: "Did they tell anyone while the call was going on?", hing: "Kya unhone call ke dauraan kisi ko bataya?" },
    options: [opt("yes", "Yes", "Haan"), opt("no", "No", "Nahi"), opt("dont_know", "I don't know", "Pata nahi")],
    when: (_c, a) => a.got_call !== "never",
  },
  {
    id: "loss",
    type: "choice",
    optional: true,
    ask: { en: "If money was lost, about how much? (You can skip.)", hing: "Agar paise gaye, to lagbhag kitne? (Chhod sakte hain.)" },
    options: [opt("none", "None", "Kuch nahi"), opt("lt10k", "Under ₹10,000", "₹10,000 se kam"), opt("10k-1l", "₹10,000 to ₹1 lakh", "₹10,000 se ₹1 lakh"), opt("gt1l", "More than ₹1 lakh", "₹1 lakh se zyada"), opt("skip", "Prefer not to say", "Batana nahi chahta")],
    when: (_c, a) => a.got_call === "lost_money" || (Array.isArray(a.what_did) && a.what_did.includes("paid")),
  },
  {
    id: "upi",
    type: "choice",
    ask: { en: "Do they use UPI or a bank app?", hing: "Kya woh UPI ya bank app istemaal karte hain?" },
    options: [opt("yes", "Yes", "Haan"), opt("with_help", "Only with help", "Sirf madad se"), opt("no", "No", "Nahi")],
  },
  {
    id: "help_with",
    type: "multi",
    ask: { en: "What would have helped most? Pick up to three.", hing: "Sabse zyada kya madad karta? Teen tak chuniye." },
    options: [
      opt("family_alert", "An alert to family at once", "Parivar ko turant alert"),
      opt("talk_helper", "A helper to talk them through it", "Samjhane wala helper"),
      opt("bank_pause", "The bank pausing a big payment", "Bank badi payment rok de"),
      opt("caller_id", "Knowing who is really calling", "Pata chale asli caller kaun hai"),
      opt("practice", "Practice calls so they know the tricks", "Practice calls taaki tareeke pata chalein"),
      opt("other", "Something else", "Kuch aur"),
    ],
  },
  { id: "comment", type: "text", optional: true, ask: { en: "Anything else we should know? (Please don't write names, phone numbers or account numbers.)", hing: "Aur kuch jo hamein pata hona chahiye? (Kripya naam, phone number ya account number na likhein.)" } },
];

export const QUESTIONS: Record<SurveyKind, Question[]> = { participant: PARTICIPANT, family: FAMILY, open: OPEN };

/** The questions to ask given what is known so far, in order. */
export function visible(kind: SurveyKind, ctx: Ctx, answers: Answers): Question[] {
  return QUESTIONS[kind].filter((q) => !q.when || q.when(ctx, answers));
}

/** The next question not yet answered (or skipped), or null when the survey is done. */
export function nextQuestion(kind: SurveyKind, ctx: Ctx, answers: Answers, skipped: ReadonlySet<string> = new Set()): Question | null {
  return visible(kind, ctx, answers).find((q) => answers[q.id] === undefined && !skipped.has(q.id)) ?? null;
}

const MULTI_LIMIT: Record<string, number> = { help_with: 3 };

/** Free text with anything that could identify someone taken out: emails, long numbers, @handles, links. */
export function scrub(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[removed]")
    .replace(/https?:\/\/\S+|www\.\S+/gi, "[removed]")
    .replace(/(?:\+?\d[\s-]?){6,}/g, "[removed]")
    .replace(/@\w{3,}/g, "[removed]")
    .trim()
    .slice(0, 500);
}

/**
 * The answers, checked and cleaned: only questions that apply, only allowed options, scales 1-5, text scrubbed.
 * Returns null if something is wrong or a required question is unanswered.
 */
export function validate(kind: SurveyKind, ctx: Ctx, raw: unknown): Answers | null {
  if (!raw || typeof raw !== "object") return null;
  const input = raw as Record<string, unknown>;
  const clean: Answers = {};
  for (const q of QUESTIONS[kind]) {
    const v = input[q.id];
    if (v === undefined || v === null || v === "") continue;
    if (q.type === "scale") {
      if (typeof v !== "number" || !Number.isInteger(v) || v < 1 || v > 5) return null;
      clean[q.id] = v;
    } else if (q.type === "choice") {
      if (typeof v !== "string" || !q.options?.some((o) => o.id === v)) return null;
      clean[q.id] = v;
    } else if (q.type === "multi") {
      if (!Array.isArray(v) || v.length > (MULTI_LIMIT[q.id] ?? 12)) return null;
      const ids = [...new Set(v)];
      if (ids.some((x) => typeof x !== "string" || !q.options?.some((o) => o.id === x))) return null;
      if (ids.length) clean[q.id] = ids as string[];
    } else {
      if (typeof v !== "string") return null;
      const t = scrub(v);
      if (t) clean[q.id] = t;
    }
  }
  // Questions that were not asked (their condition is false) must be empty; required ones must be answered.
  const shown = new Set(visible(kind, ctx, clean).map((q) => q.id));
  for (const id of Object.keys(clean)) if (!shown.has(id)) delete clean[id];
  for (const q of visible(kind, ctx, clean)) if (!q.optional && clean[q.id] === undefined) return null;
  return clean;
}

// ---- results

export interface SurveyRow {
  kind: SurveyKind;
  arm: "baseline" | "ruko" | "control" | null;
  isScam: boolean | null;
  answers: Answers;
}

export interface Tally {
  n: number;
  counts: Record<string, number>;
  /** For scales. */
  mean?: number;
}

export interface SurveySummary {
  n: Record<SurveyKind, number>;
  /** kind → question id → tally, over everyone. */
  tallies: Record<SurveyKind, Record<string, Tally>>;
  /** Participant questions split by arm: "ruko/fear", "baseline/fear"... */
  byArm: Record<string, Tally>;
  /** Free-text answers, newest not guaranteed, for reading. */
  texts: Array<{ kind: SurveyKind; question: string; text: string }>;
}

function add(t: Tally, q: Question, v: Answer) {
  t.n++;
  if (q.type === "scale" && typeof v === "number") {
    t.counts[String(v)] = (t.counts[String(v)] ?? 0) + 1;
    t.mean = ((t.mean ?? 0) * (t.n - 1) + v) / t.n;
  } else if (Array.isArray(v)) for (const id of v) t.counts[id] = (t.counts[id] ?? 0) + 1;
  else if (typeof v === "string") t.counts[v] = (t.counts[v] ?? 0) + 1;
}

export function summarize(rows: SurveyRow[]): SurveySummary {
  const out: SurveySummary = {
    n: { participant: 0, family: 0, open: 0 },
    tallies: { participant: {}, family: {}, open: {} },
    byArm: {},
    texts: [],
  };
  for (const r of rows) {
    out.n[r.kind]++;
    for (const q of QUESTIONS[r.kind]) {
      const v = r.answers[q.id];
      if (v === undefined) continue;
      if (q.type === "text") {
        if (typeof v === "string") out.texts.push({ kind: r.kind, question: q.id, text: v });
        continue;
      }
      add((out.tallies[r.kind][q.id] ??= { n: 0, counts: {} }), q, v);
      if (r.kind === "participant" && r.arm) add((out.byArm[`${r.arm}/${q.id}`] ??= { n: 0, counts: {} }), q, v);
    }
  }
  return out;
}

/** One row per response for a spreadsheet: every question id is a column; lists are joined with "|". */
export function toCsv(rows: Array<SurveyRow & { at?: string; code?: string | null }>): string {
  const ids = [...new Set(SURVEY_KINDS.flatMap((k) => QUESTIONS[k].map((q) => `${k}.${q.id}`)))];
  const cell = (s: unknown) => `"${String(s ?? "").replace(/"/g, '""')}"`;
  const head = ["at", "kind", "participant_code", "arm", "is_scam", ...ids];
  const lines = rows.map((r) =>
    [r.at ?? "", r.kind, r.code ?? "", r.arm ?? "", r.isScam ?? "", ...ids.map((id) => {
      const [k, q] = id.split(".");
      const v = k === r.kind ? r.answers[q] : undefined;
      return Array.isArray(v) ? v.join("|") : v;
    })]
      .map(cell)
      .join(","),
  );
  return [head.map(cell).join(","), ...lines].join("\n");
}
