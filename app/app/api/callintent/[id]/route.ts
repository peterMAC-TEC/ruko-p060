import { isBankStaff, isDemoId } from "@/lib/auth";
import { endCallIntent } from "@/lib/callIntent";
import { getCallIntent } from "@/lib/store";

// DELETE: the call is over; the notice disappears from the customer's app.
// Bank staff only, or a notice to a demo-sandbox person (security review M6).
export async function DELETE(_request: Request, ctx: RouteContext<"/api/callintent/[id]">) {
  const { id } = await ctx.params;
  const intent = await getCallIntent(id);
  if (!intent) return Response.json({ error: "Not found" }, { status: 404 });
  if (!isDemoId(intent.elder_id) && !(await isBankStaff())) return Response.json({ error: "Bank staff only" }, { status: 403 });
  await endCallIntent(id);
  return Response.json({ ok: true });
}
