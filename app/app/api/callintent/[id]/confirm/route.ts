import { z } from "zod";
import { canActAsElder, deny } from "@/lib/auth";
import { confirmCallIntent, getCallIntent } from "@/lib/store";
import { observe } from "@/lib/threat-server";

// POST { match }  The person tells Ruko whether the caller read out the code
// shown in their verified-call card. Only a matching code makes the call count
// as the real bank (security review M2); a wrong code is strong evidence that
// someone is impersonating the bank during a real notice window.
const Body = z.object({ match: z.boolean() });

export async function POST(request: Request, ctx: RouteContext<"/api/callintent/[id]/confirm">) {
  const { id } = await ctx.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid" }, { status: 400 });
  const intent = await getCallIntent(id);
  if (!intent || intent.ended_at || Date.parse(intent.expires_at) < Date.now()) return Response.json({ error: "Not found" }, { status: 404 });
  const allowed = await canActAsElder(intent.elder_id);
  if (!allowed.ok) return deny(allowed);

  await confirmCallIntent(id, parsed.data.match);
  await observe(intent.elder_id, [
    parsed.data.match
      ? { tactic: "RT17", source: "callintent", evidence: "the caller read out the right code" }
      : { tactic: "RT15", source: "callintent", lr: 300, evidence: "the caller gave the WRONG code" },
  ]);
  return Response.json({ ok: true, match: parsed.data.match });
}
