import { z } from "zod";
import { endPatch, labAllowed, labDenied, raiseStep, startCall, syncFromActivity, washoutHours, withEvent } from "@/lib/lab";
import { getParticipant, getTrialCall, updateTrialCall } from "@/lib/store";
import { drillCodes } from "@/lib/trial";

// One trial call. GET also folds in what the practice account logged (bank
// payments, Ruko checks, family alerts) so key outcomes are recorded even if
// the facilitator misses a click. ?light=1 is for the caller screen's polling.
export async function GET(request: Request, ctx: RouteContext<"/api/lab/calls/[id]">) {
  if (!(await labAllowed())) return labDenied();
  const { id } = await ctx.params;
  const call = await getTrialCall(id);
  if (!call) return Response.json({ error: "Not found" }, { status: 404 });
  if (new URL(request.url).searchParams.get("light") === "1") {
    return Response.json({ status: call.status, live: call.live, lang: call.lang, script_id: call.script_id, family_present: call.family_present });
  }
  const [{ call: synced, activity }, participant, washout] = await Promise.all([syncFromActivity(call), getParticipant(call.participant_id), washoutHours(call)]);
  return Response.json({ call: synced, activity, participant, washoutHours: washout, codes: drillCodes(id) });
}

const By = z.enum(["self", "ruko_check", "family", "bank_hold", "stop_word", "facilitator"]);
const Action = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("start"),
    lang: z.enum(["en", "hi"]),
    channel: z.enum(["browser", "phone"]),
    familyPresent: z.boolean(),
    stressPre: z.number().int().min(1).max(5).nullable().optional(),
    facilitatorInRoom: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("say"),
    stepId: z.string().max(40),
    stage: z.string().max(30).optional(),
    kind: z.enum(["line", "pressure", "disclosure", "debrief"]),
    text: z.string().min(1).max(600),
  }),
  // A manual tick raises the level; a correction can lower it and must give a reason (audit log).
  z.object({ action: z.literal("step"), level: z.number().int().min(0).max(7), correct: z.boolean().optional(), why: z.string().max(200).optional() }),
  z.object({ action: z.literal("stopped"), by: By }),
  z.object({ action: z.literal("distress"), level: z.number().int().min(1).max(3) }),
  z.object({ action: z.literal("end"), by: By.optional(), text: z.string().max(600).optional() }),
  z.object({ action: z.literal("answered") }),
  z.object({ action: z.literal("abort") }),
  z.object({ action: z.literal("reset") }),
  z.object({
    action: z.literal("post"),
    stress: z.number().int().min(1).max(5).nullable().optional(),
    stress_after: z.number().int().min(1).max(5).nullable().optional(),
    confidence: z.number().int().min(1).max(5).nullable().optional(),
    belief_real: z.enum(["yes", "unsure", "no"]).nullable().optional(),
    control_outcome: z.enum(["C0", "C1", "C2", "C3"]).nullable().optional(),
    debriefed: z.boolean().optional(),
    deviation: z.string().max(500).nullable().optional(),
    notes: z.string().max(1000).nullable().optional(),
  }),
]);

export async function POST(request: Request, ctx: RouteContext<"/api/lab/calls/[id]">) {
  if (!(await labAllowed())) return labDenied();
  const { id } = await ctx.params;
  const call = await getTrialCall(id);
  if (!call) return Response.json({ error: "Not found" }, { status: 404 });
  const parsed = Action.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid action" }, { status: 400 });
  const a = parsed.data;
  const secs = call.started_at ? Math.round((Date.now() - Date.parse(call.started_at)) / 1000) : 0;

  switch (a.action) {
    case "start":
      if (call.status === "live") return Response.json({ error: "Already live" }, { status: 409 });
      return Response.json(await startCall(call, a));
    case "say": {
      const patch = {
        live: { ...call.live, seq: (call.live.seq ?? 0) + 1, stepId: a.stepId, kind: a.kind === "pressure" ? ("pressure" as const) : ("line" as const), text: a.text },
        ...withEvent(call, a.kind === "pressure" ? "pressure_line" : "line", a.stepId),
      };
      // The first money instruction starts the "time from money demand" clock.
      const moneyAsk = (a.stage === "pivot_money" || a.stage === "instruct_transfer") && call.t_money_ask_s === null ? { t_money_ask_s: secs } : {};
      return Response.json(await updateTrialCall(id, { ...patch, ...moneyAsk }));
    }
    case "step":
      if (a.correct) {
        const stamps = Object.fromEntries(Object.entries(call.step_times).filter(([k]) => Number(k) <= a.level));
        const log = [...call.level_edit_log, { at: new Date().toISOString(), from: call.furthest_step, to: a.level, why: a.why ?? "" }];
        return Response.json(await updateTrialCall(id, { furthest_step: a.level, step_times: stamps, level_edit_log: log }));
      }
      return Response.json(await updateTrialCall(id, { ...raiseStep(call, a.level), ...withEvent(call, `level_${a.level}`) }));
    case "stopped":
      return Response.json(await updateTrialCall(id, { stopped_by: a.by, time_to_stop_s: secs, ...withEvent(call, "stopped", a.by) }));
    case "distress":
      return Response.json(
        await updateTrialCall(id, {
          adverse_event_level: Math.max(call.adverse_event_level ?? 0, a.level),
          ...withEvent(call, "distress", ["", "mild", "moderate", "severe"][a.level]),
        }),
      );
    case "end": {
      if (call.status !== "live") return Response.json(call);
      const { call: synced } = await syncFromActivity(call);
      const patch = endPatch(synced, a.by ?? null);
      return Response.json(await updateTrialCall(id, { ...patch, live: { ...patch.live, text: a.text } }));
    }
    case "answered":
      return Response.json(await updateTrialCall(id, { live: { ...call.live, answered: true }, ...withEvent(call, "answered") }));
    case "abort":
      return Response.json(
        await updateTrialCall(id, {
          status: "aborted",
          ended_at: new Date().toISOString(),
          live: { ...call.live, seq: (call.live.seq ?? 0) + 1, kind: "end", ended: true },
          ...withEvent(call, "aborted"),
        }),
      );
    case "reset":
      return Response.json(
        await updateTrialCall(id, {
          status: "ready",
          live: {},
          started_at: null,
          ended_at: null,
          furthest_step: null,
          step_times: {},
          stopped_by: null,
          time_to_stop_s: null,
          ruko_used: null,
          ruko_level: null,
          family_alerted: null,
          bank_held: null,
          money_moved: null,
          control_outcome: null,
          participant_refused: null,
          belief_real: null,
          stress_pre: null,
          stress: null,
          stress_after: null,
          adverse_event_level: null,
          confidence: null,
          t_money_ask_s: null,
          events: [],
          level_edit_log: [],
          debriefed: false,
        }),
      );
    case "post": {
      const { action: _a, ...rest } = a;
      void _a;
      return Response.json(await updateTrialCall(id, rest));
    }
  }
}
