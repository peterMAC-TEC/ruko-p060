import { z } from "zod";
import { activeIntents, issueIntent, PURPOSE_LABEL } from "@/lib/callIntent";
import { canActForElder, deny, isBankStaff, isDemoId } from "@/lib/auth";
import { recordAction } from "@/lib/threat-server";

// GET ?elderId=…  the customer's app: signed notices for calls the bank is making right now.
export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (!elderId) return Response.json({ error: "elderId required" }, { status: 400 });
  const allowed = await canActForElder(elderId);
  if (!allowed.ok) return deny(allowed);
  return Response.json(await activeIntents(elderId), { headers: { "cache-control": "no-store" } });
}

const Issue = z.object({
  elderId: z.string().min(1),
  agent: z.string().trim().min(1).max(60).default("Fraud desk"),
  purpose: z.enum(Object.keys(PURPOSE_LABEL) as [keyof typeof PURPOSE_LABEL, ...Array<keyof typeof PURPOSE_LABEL>]).default("payment_check"),
});

// POST: the bank's fraud desk is about to call this customer. Only bank staff
// (or anyone, for the demo sandbox people) can issue a notice.
export async function POST(request: Request) {
  const parsed = Issue.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid call notice" }, { status: 400 });
  const { elderId, agent, purpose } = parsed.data;
  if (!isDemoId(elderId) && !(await isBankStaff())) return Response.json({ error: "Bank staff only" }, { status: 403 });
  const { row, payload } = await issueIntent(elderId, agent, purpose);
  await recordAction(elderId, "bank_callback", "callintent", `${purpose} · ${agent}`);
  // The code goes back to the agent, who reads it out on the call.
  return Response.json({ id: row.id, code: payload.code, expiresAt: row.expires_at, agent: payload.agent }, { status: 201 });
}
