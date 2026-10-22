import { z } from "zod";
import { canActAsElder, deny, isDemoId } from "@/lib/auth";
import { alertCircle } from "@/lib/circle";
import { flags } from "@/lib/flags";
import { gradeNumber, replayLine, type Decision } from "@/lib/line";
import { recordEvent } from "@/lib/metrics";
import { scoreNumber } from "@/lib/numberRisk";
import { hashNumber, hashReporter } from "@/lib/privacy";
import { addRiskEvent, getUser, hasReportedScam, listCircle, summarizeNumberReports, upsertNumberReport } from "@/lib/store";
import { lockMoney, recordAction } from "@/lib/threat-server";

// Ruko Line, the decision for one screened call. The browser sends the caller's lines so far; this route replays
// them (so a decision can't be forged), and when the call is decided as a scam it blocks the number, tells the family
// and, if the caller asked for money or a code, turns on Money Lock. Nothing the caller said is stored: only the
// number's hash (as this person's block) and the codes of why.

const Body = z.object({
  elderId: z.string().min(1),
  number: z.string().trim().min(3).max(20),
  contact: z.boolean().default(false),
  lang: z.enum(["en", "hing"]).default("en"),
  lines: z.array(z.string().max(500)).max(6).default([]),
});

const last4 = (n: string) => `…${n.replace(/\D/g, "").slice(-4)}`;

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid call" }, { status: 400 });
  const { elderId, number, contact, lang, lines } = parsed.data;
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);

  const numberHash = hashNumber(number);
  const mine = hashReporter(`line:${elderId}`);
  const [reports, alreadyBlocked, elder] = await Promise.all([
    summarizeNumberReports(numberHash, flags.DEMO_MODE),
    hasReportedScam(numberHash, mine),
    getUser(elderId),
  ]);
  const risk = scoreNumber(number, { inContacts: contact, reports });
  const base = gradeNumber(risk, { inContacts: contact, blocked: alreadyBlocked });
  const owner = elder?.name.split(" ")[0] ?? "the owner";

  // A number this person already blocked never rings and is never screened again.
  if (alreadyBlocked) {
    const decision: Decision = { action: "block", why: ["blocked_before"], lockMoney: false };
    return Response.json({ grade: "red", baseGrade: base, reasons: risk.reasons, transcript: [], decision, familyAlerted: false, locked: false });
  }

  const r = replayLine(base, lines, owner, lang);
  let familyAlerted = false;
  let locked = false;
  if (r.decision?.action === "block") {
    const demo = isDemoId(elderId);
    await upsertNumberReport({ number_hash: numberHash, verdict: "scam", pattern_id: null, reporter_hash: mine, demo });
    await recordEvent("scam_flagged", { demo });
    const reasons = r.decision.why.map((c) => ({ code: `line_${c}`, label: `Ruko Line: ${c.replace(/_/g, " ")}`, points: 0, hard: false }));
    const message = `Ruko blocked a call to ${owner} from ${last4(number)}. It was a scam call. ${owner} was not put through. No action needed, but please check in.`;
    const { members } = await listCircle(elderId);
    if (members.length > 0) {
      await alertCircle(elderId, { source: "agent", score: 85, reasons, message });
      familyAlerted = true;
      await recordAction(elderId, "alert_family", "number", "Ruko Line blocked a scam call");
    } else {
      await addRiskEvent({ elder_id: elderId, source: "agent", score: 85, reasons });
    }
    if (r.decision.lockMoney) {
      locked = await lockMoney(elderId, "Ruko Line blocked a caller who asked for money or a code");
      await recordAction(elderId, "money_lock", "number", "A caller asked for money or a code");
    }
  }
  return Response.json({
    grade: r.grade,
    baseGrade: base,
    reasons: risk.reasons,
    transcript: r.transcript,
    decision: r.decision,
    familyAlerted,
    locked,
  });
}
