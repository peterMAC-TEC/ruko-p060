import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { CONSENT_NOTICE_VERSION } from "@/lib/consent";
import { grantConsent, listConsents, revokeConsent } from "@/lib/store";

const Scope = z.enum(["call_signals", "family_alerts", "transaction_risk", "drills"]);

const Body = z.object({
  grant: z.array(Scope).default([]),
  revoke: z.array(Scope).default([]),
  lang: z.string().max(5).default("en"),
  // The person's own words about what Ruko does (teach-back).
  teachBack: z.string().trim().max(500).optional(),
});

// Each purpose is consented to separately, and withdrawing is one tap (DPDP).
export async function POST(request: Request) {
  const viewer = await getViewer();
  const me = viewer?.user;
  if (!me) return Response.json({ error: "Please sign in." }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid consent" }, { status: 400 });
  const { grant, revoke, lang, teachBack } = parsed.data;

  for (const scope of grant) {
    await grantConsent({ user_id: me.id, scope, notice_version: CONSENT_NOTICE_VERSION, lang, teach_back: teachBack ?? null });
  }
  for (const scope of revoke) await revokeConsent(me.id, scope);
  return Response.json({ consents: (await listConsents(me.id)).map((c) => c.scope) });
}
