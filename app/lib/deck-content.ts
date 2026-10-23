// The pitch deck's words: titles, speaker notes (3-minute live pitch and 5-to-6-minute Loom) and sources.
// Pure data, so the deck, the presenter view and scripts/deck-notes.ts (docs/deck/SPEAKER-NOTES.md) share one copy.
// Every number here is either sourced (SOURCES) or measured by `npm run eval` on synthetic data (data/eval-results.json).

export const SOURCES = {
  daCases: "Digital-arrest complaints, 2023 and 2024: Rajya Sabha reply, 12 Mar 2025 (rsdebate.nic.in), via Inc42",
  daLoss: "₹1,935 crore lost to digital arrest in 2024: same Rajya Sabha reply, via Inc42",
  da2025: "2025 fall to 58,249 complaints: secondary summary of I4C data (Drishti IAS); original release not seen",
  seniors: "1,03,488 complaints and ₹4,005 crore from senior citizens, 2025: MHA written reply, Rajya Sabha, via Asianet Newsable",
  total2024: "₹22,845 crore lost to cyber fraud in 2024: MHA reply in Parliament, July 2025, via Scroll",
  perSecond: "≈ ₹7,200 a second: our arithmetic, the 2024 total divided by the seconds in a year",
  mcafee: "47% of Indian adults experienced an AI voice scam or knew someone who had: McAfee, The Artificial Imposter, 2023 (1,010 Indian respondents)",
  rbi: "RBI discussion paper on payment friction, reported Apr 2026: a DRAFT, not a final rule",
  eval: "Measured by `npm run eval` on 66 + 45 + 27 synthetic, hand-written examples (23 Oct 2026). Not field results.",
  checks: "526 automated checks in 20 test suites (`npm test`), counted 23 Oct 2026",
} as const;

export interface SlideText {
  id: string;
  title: string;
  /** Seconds in the 3-minute live pitch (0 = skip it live). */
  live: number;
  /** Seconds in the Loom walkthrough. */
  loom: number;
  notes: string;
  loomNotes?: string;
}

export const SLIDES: SlideText[] = [
  { id: "hook", title: "1 Problem", live: 25, loom: 35, notes: "Ruko means 'stop'. This is how the scam starts: 'This is the CBI. Your Aadhaar is linked to a crime. Do not hang up. Do not tell your family.' Older adults are kept on video for hours until they transfer their savings. Families find out after the money is gone." },
  { id: "current", title: "2 Current state", live: 20, loom: 30, notes: "Today's workflow: the call, fear, isolation, the transfer, and the family finds out days later. The help that exists comes too late: awareness campaigns, and 1930 after the loss. Nobody steps in before the money moves." },
  { id: "scale", title: "3 Opportunity", live: 20, loom: 30, notes: "Digital-arrest complaints doubled in a year, to 1,23,672 in 2024: about 340 a day, with about ₹1,935 crore lost. Senior citizens filed over a lakh fraud complaints in 2025 and lost about ₹4,005 crore. Early 2025 data suggests a fall, so awareness helps; we think AI voices could reverse it, which is our hypothesis." },
  { id: "layers", title: "4 Solution", live: 35, loom: 120, notes: "Our mentor asked: is the intervention at the right time, and will a panicking person act right? We don't rely on them. Before the call, the family sets Ruko up calmly. During the call, one big STOP with one action, and the family is told silently. At the money, the payment waits for the family's code word, even if the person is fully convinced.", loomNotes: "Our mentor asked whether the intervention comes at the right time. We don't rely on a panicking person. Three layers: before, during, at the money. Let me show it live with a new call. [Switch to ruko-seven.vercel.app, press 2. Answer and play the older person with your own new replies. Show STOP. Choose 'I still want to pay': the bank pauses it, the family phone gets the request, refuse it: 'Money did not move'. Press X to show the trace.]" },
  { id: "proof", title: "5 AI thinking", live: 25, loom: 40, notes: "Where AI adds value: it reads what the person meant when the rules can't tell, extracts scam signs from speech, text or a photo, and words calm guidance. Measured on our synthetic test set: rules alone read 75.8% of replies right, with AI 90.9%. And code keeps it safe: the guard blocked all 22 unsafe AI outputs, zero false STOPs on genuine calls." },
  { id: "arch", title: "6 Architecture", live: 25, loom: 45, notes: "Inputs: voice, a number, a message, a payment. The AI model reads and words, with a confidence score. Logic decides: the call state machine, the threat engine fusing 17 tactics with log-odds, the guard. Tools act: Money Lock, the Ruko Guard API, family alerts, Supabase with signal codes only. Outputs: STOP, the family alert, the payment paused. AI reads and words; code decides." },
  { id: "impact", title: "7 Impact", live: 15, loom: 30, notes: "Time: a warning before the money moves, not days after. Quality: measured safety and accuracy, 526 automated checks. Scale: any phone, Hinglish, and banks can plug in through the Ruko Guard API. Next: a field test with 10 older adults." },
  { id: "close", title: "8 Business model and close", live: 15, loom: 30, notes: "Business, as hypotheses we will test: banks and payment apps pay for the Ruko Guard API per protected account, families get core protection free with a paid family plan, telcos and insurers later. Either way, the money didn't move. Ruko doesn't try to win the argument with a scammer. It protects the moment that matters." },
];

export const totalSeconds = (k: "live" | "loom") => SLIDES.reduce((t, s) => t + s[k], 0);
