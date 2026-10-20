import { loadDrillLibrary } from "@/lib/drill-server";
import { labAllowed, labDenied } from "@/lib/lab";
import { PROTOCOL, protocolFingerprint } from "@/lib/protocol";
import { listParticipants, listTrialCalls } from "@/lib/store";
import { stoppedBeforePay, summarize } from "@/lib/trial";

// Results for the dashboard (?data=real|seeded) and a CSV of every call
// (?format=csv). Participants are codes only: there are no names or numbers to export.
export async function GET(request: Request) {
  if (!(await labAllowed())) return labDenied();
  const url = new URL(request.url);
  const seeded = url.searchParams.get("data") === "seeded";
  const [participants, calls, lib] = await Promise.all([listParticipants(), listTrialCalls(), loadDrillLibrary()]);
  const ps = participants.filter((p) => p.seeded === seeded);
  const byId = new Map(ps.map((p) => [p.id, p]));
  const rows = calls.filter((c) => byId.has(c.participant_id));

  if (url.searchParams.get("format") === "csv") {
    const head = [
      "participant", "data", "row", "order", "age_band", "language", "prior_awareness", "call", "block", "arm", "script", "is_scam",
      "status", "channel", "family_present", "furthest_step", "stopped_before_pay", "money_moved", "stopped_by", "time_to_stop_s",
      "t_money_ask_s", "ruko_used", "ruko_level", "family_alerted", "bank_held", "control_outcome", "belief_real", "stress_pre",
      "stress_post", "stress_after_debrief", "adverse_event_level", "confidence", "debriefed", "deviation", "started_at",
    ];
    const cell = (v: unknown) => (v === null || v === undefined ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
    const lines = rows.map((c) => {
      const p = byId.get(c.participant_id)!;
      return [
        p.code, p.seeded ? "seeded" : "real", p.row_no, p.arm_order, p.age_band, p.language, p.prior_awareness, c.order_no, c.block, c.arm,
        c.script_id, c.is_scam, c.status, c.channel, c.family_present, c.furthest_step,
        c.is_scam && c.status === "ended" ? stoppedBeforePay(c.furthest_step) : "", c.money_moved, c.stopped_by, c.time_to_stop_s,
        c.t_money_ask_s, c.ruko_used, c.ruko_level, c.family_alerted, c.bank_held, c.control_outcome, c.belief_real, c.stress_pre, c.stress,
        c.stress_after, c.adverse_event_level, c.confidence, c.debriefed, c.deviation, c.started_at,
      ].map(cell).join(",");
    });
    return new Response([head.join(","), ...lines].join("\n"), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="ruko-trial-${seeded ? "seeded" : "real"}.csv"`,
      },
    });
  }

  const summary = summarize(rows);
  const real = ps.filter((p) => !p.withdrawn_at);
  const callsOf = (pid: string) => rows.filter((c) => c.participant_id === pid);
  const ended = rows.filter((c) => c.status === "ended");
  // Data completeness: the post-call fields the method needs (doc §4.3 progression criteria).
  const complete = ended.filter((c) => c.stress !== null && c.debriefed && (c.is_scam ? c.furthest_step !== null : c.control_outcome !== null)).length;
  return Response.json({
    data: seeded ? "seeded" : "real",
    summary,
    feasibility: {
      enrolled: ps.length,
      withdrawn: ps.length - real.length,
      completedAll: ps.filter((p) => callsOf(p.id).length > 0 && callsOf(p.id).every((c) => c.status === "ended")).length,
      callsDelivered: ended.length,
      callsPlanned: rows.length,
      aborted: rows.filter((c) => c.status === "aborted").length,
      deviations: ended.filter((c) => c.deviation).length,
      completeness: ended.length ? complete / ended.length : null,
      teachbackFirstTime: ps.filter((p) => p.teachback_attempts === 1).length,
      deceptionAcceptable: ps.filter((p) => p.deception_acceptable === true).length,
      deceptionAsked: ps.filter((p) => p.deception_acceptable !== null).length,
    },
    participants: ps.map((p) => ({ id: p.id, code: p.code, row: p.row_no, order: p.arm_order, age_band: p.age_band, withdrawn: Boolean(p.withdrawn_at) })),
    titles: Object.fromEntries(lib.scripts.map((s) => [s.id, s.title_en])),
    protocol: { version: PROTOCOL.version, sha256: protocolFingerprint() },
  });
}
