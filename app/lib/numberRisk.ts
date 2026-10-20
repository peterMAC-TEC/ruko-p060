// Scam Radar's pre-call risk check for a phone number. Pure: the same code
// runs on the server and (later) inside the Android call-screening service,
// which must answer within 5 seconds, so it never waits on the network itself.

export type NumberKind = "bank_1600" | "promo_140" | "international" | "indian_mobile" | "landline" | "short_code" | "invalid";
export type RiskLevel = "high" | "medium" | "low";

export interface ReportSummary {
  scam: number;
  notScam: number;
  unsure: number;
  /** The scam type people most often reported for this number. */
  topPattern?: string | null;
}

export interface NumberRisk {
  normalized: string;
  kind: NumberKind;
  level: RiskLevel;
  score: number;
  /** Codes; the app turns them into plain words in the person's language. */
  reasons: string[];
  reports: number;
  topPattern: string | null;
}

/** +91 98450 00001, 09845000001 and 9845000001 all become +919845000001. */
export function normalizeNumber(raw: string): string {
  const s = raw.trim().replace(/[\s()-]/g, "");
  if (/^\+\d{6,15}$/.test(s)) return s;
  if (/^00\d{6,15}$/.test(s)) return `+${s.slice(2)}`;
  if (/^0[6-9]\d{9}$/.test(s)) return `+91${s.slice(1)}`;
  if (/^[6-9]\d{9}$/.test(s)) return `+91${s}`;
  if (/^(1600|140)\d{6,7}$/.test(s)) return s; // Indian service series, no country code
  if (/^\d{3,6}$/.test(s)) return s; // short codes
  return s;
}

export function classifyNumber(n: string): NumberKind {
  if (/^1600\d{6}$/.test(n) || /^\+911600\d{6}$/.test(n)) return "bank_1600";
  if (/^140\d{7}$/.test(n) || /^\+91140\d{7}$/.test(n)) return "promo_140";
  if (/^\d{3,6}$/.test(n)) return "short_code";
  if (/^\+91[6-9]\d{9}$/.test(n)) return "indian_mobile";
  if (/^\+91\d{10}$/.test(n)) return "landline";
  if (/^\+\d{6,15}$/.test(n)) return "international";
  return "invalid";
}

export function scoreNumber(raw: string, opts: { inContacts?: boolean; reports?: ReportSummary } = {}): NumberRisk {
  const normalized = normalizeNumber(raw);
  const kind = classifyNumber(normalized);
  const r = opts.reports ?? { scam: 0, notScam: 0, unsure: 0 };
  const reasons: string[] = [];
  let score = 0;

  if (opts.inContacts) reasons.push("in_contacts");
  else if (kind === "indian_mobile" || kind === "landline") {
    score += 10;
    reasons.push("not_in_contacts");
  }

  if (kind === "international") {
    // Indian police, banks and couriers don't call from abroad; spoofed +91 calls
    // from abroad are now blocked by DoT, so scammers use foreign numbers instead.
    score += 35;
    reasons.push("international");
  }
  if (kind === "bank_1600") reasons.push("bank_series");
  if (kind === "promo_140") reasons.push("promo_series");

  // Community reports: a few loud reporters shouldn't outweigh many "not a scam".
  const net = r.scam - r.notScam;
  if (r.scam >= 3 && net > 0) {
    score += Math.min(70, 40 + r.scam * 2);
    reasons.push("reported_many");
  } else if (r.scam >= 1 && net > 0) {
    score += 25;
    reasons.push("reported_few");
  } else if (r.notScam > r.scam && r.notScam >= 3) {
    score = Math.max(0, score - 15);
    reasons.push("reported_safe");
  }

  // A real bank's 1600 number or a saved contact pulls the risk right down,
  // unless the community has clearly flagged it.
  if ((kind === "bank_1600" || opts.inContacts) && !reasons.includes("reported_many")) score = Math.min(score, 5);

  score = Math.min(100, score);
  const level: RiskLevel = score >= 60 ? "high" : score >= 30 ? "medium" : "low";
  return { normalized, kind, level, score, reasons, reports: r.scam, topPattern: r.topPattern ?? null };
}
