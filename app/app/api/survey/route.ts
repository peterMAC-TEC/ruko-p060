import { z } from "zod";
import { labAllowed, labDenied } from "@/lib/lab";
import { addSurveyResponse, getTrialCall } from "@/lib/store";
import { SURVEY_KINDS, validate, type SurveyKind } from "@/lib/survey";

// The survey bot saves one finished survey.
//   open        : anyone with the link; anonymous; needs the person to have agreed on the first screen.
//   participant : the older person after a drill call; family: the family member. Both are opened by the
//                 facilitator in the trial lab, so they need lab access and a call to link to.
// The answers are checked against the allowed options and free text is scrubbed (lib/survey.ts), so no name,
// number or email is ever stored.
const Body = z.object({
  kind: z.enum(SURVEY_KINDS as unknown as [SurveyKind, ...SurveyKind[]]),
  lang: z.enum(["en", "hing"]).default("en"),
  callId: z.string().uuid().optional(),
  consent: z.boolean().optional(),
  answers: z.record(z.string(), z.unknown()),
});

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid survey" }, { status: 400 });
  const { kind, lang, callId, consent, answers } = parsed.data;

  let ctx: Parameters<typeof validate>[1] = {};
  let link: { call_id: string | null; participant_id: string | null; arm: "baseline" | "ruko" | "control" | null; is_scam: boolean | null } = {
    call_id: null,
    participant_id: null,
    arm: null,
    is_scam: null,
  };
  if (kind === "open") {
    if (consent !== true) return Response.json({ error: "Please agree first" }, { status: 400 });
  } else {
    if (!(await labAllowed())) return labDenied();
    const call = callId ? await getTrialCall(callId) : undefined;
    if (!call) return Response.json({ error: "Which call is this survey for?" }, { status: 400 });
    ctx = { arm: call.arm, isScam: call.is_scam };
    link = { call_id: call.id, participant_id: call.participant_id, arm: call.arm, is_scam: call.is_scam };
  }

  const clean = validate(kind, ctx, answers);
  if (!clean) return Response.json({ error: "Some answers are missing or not allowed" }, { status: 400 });
  await addSurveyResponse({ kind, lang, answers: clean, ...link });
  return Response.json({ ok: true });
}
