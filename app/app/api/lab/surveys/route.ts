import { labAllowed, labDenied } from "@/lib/lab";
import { getParticipant, listSurveyResponses } from "@/lib/store";
import { summarize, toCsv, type SurveyRow } from "@/lib/survey";

// For the facilitator: every survey answer, summed up (and as a CSV with ?csv=1).
export async function GET(request: Request) {
  if (!(await labAllowed())) return labDenied();
  const records = await listSurveyResponses();
  const rows: SurveyRow[] = records.map((r) => ({ kind: r.kind, arm: r.arm, isScam: r.is_scam, answers: r.answers }));
  if (new URL(request.url).searchParams.get("csv") === "1") {
    const codes = new Map<string, string | null>();
    for (const r of records) if (r.participant_id && !codes.has(r.participant_id)) codes.set(r.participant_id, (await getParticipant(r.participant_id))?.code ?? null);
    const csv = toCsv(records.map((r) => ({ kind: r.kind, arm: r.arm, isScam: r.is_scam, answers: r.answers, at: r.created_at, code: r.participant_id ? (codes.get(r.participant_id) ?? null) : null })));
    return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="ruko-surveys.csv"' } });
  }
  return Response.json({ summary: summarize(rows), total: records.length });
}
