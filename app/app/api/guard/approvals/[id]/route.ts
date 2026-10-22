import { isDemoId } from "@/lib/auth";
import { bankAllowed } from "@/lib/bank-auth";
import { getTransfer, listApprovals } from "@/lib/store";

// GET: the bank reads the family's answer. "pending" until a trusted person decides; "approved" or "declined" after.
export async function GET(request: Request, ctx: RouteContext<"/api/guard/approvals/[id]">) {
  const who = bankAllowed(request);
  if (!who.ok) return Response.json({ error: "A bank API key is required." }, { status: 401 });
  const { id } = await ctx.params;
  const t = await getTransfer(id);
  if (!t || (who.mode === "demo" && !isDemoId(t.elder_id))) return Response.json({ error: "Not found" }, { status: 404 });
  const approvals = await listApprovals({ transferId: id });
  const status = approvals.some((a) => a.status === "approved") ? "approved" : approvals.length > 0 && approvals.every((a) => a.status === "declined") ? "declined" : "pending";
  return Response.json({ approvalRequestId: id, status, decidedAt: approvals.find((a) => a.decided_at)?.decided_at ?? null });
}
