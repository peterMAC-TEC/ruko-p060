import { z } from "zod";
import { enrol, labAllowed, labDenied } from "@/lib/lab";
import { listParticipants, listTrialCalls } from "@/lib/store";
import { AGE_BANDS } from "@/lib/trial";

// The participant list with every call, for the lab home.
export async function GET() {
  if (!(await labAllowed())) return labDenied();
  const [participants, calls] = await Promise.all([listParticipants(), listTrialCalls()]);
  return Response.json({ participants, calls });
}

const Enrol = z.object({
  age_band: z.enum(AGE_BANDS as [string, ...string[]]),
  gender: z.enum(["f", "m", "x", "na"]).nullable().default(null),
  language: z.enum(["en", "hi", "kn", "ta", "te", "ml", "mr", "bn"]).default("en"),
  phone_type: z.enum(["smartphone", "feature", "none"]).nullable().default(null),
  uses_upi: z.boolean().nullable().default(null),
  lives_alone: z.boolean().nullable().default(null),
  family_present_default: z.boolean().default(false),
  prior_awareness: z.boolean().nullable().default(null),
  self_efficacy_pre: z.number().int().min(1).max(5).nullable().default(null),
  teachback_attempts: z.number().int().min(1).max(5).default(1),
  // Consent and teach-back come first; only then is the person's allocation row revealed.
  consent_signed: z.literal(true),
  teachback_passed: z.literal(true),
});

export async function POST(request: Request) {
  if (!(await labAllowed())) return labDenied();
  const parsed = Enrol.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path[0];
    const error =
      field === "consent_signed"
        ? "Confirm the signed consent form first."
        : field === "teachback_passed"
          ? "The teach-back must be passed before enrolling."
          : "Check the form.";
    return Response.json({ error }, { status: 400 });
  }
  const { consent_signed: _c, ...input } = parsed.data;
  void _c;
  const p = await enrol(input as Parameters<typeof enrol>[0]);
  return Response.json(p, { status: 201 });
}
