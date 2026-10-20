import { z } from "zod";
import { canActAsMember, deny } from "@/lib/auth";
import { applyApprovalDecision } from "@/lib/payments";
import { decideApproval, getApproval } from "@/lib/store";

const Decision = z.object({ decision: z.enum(["approved", "declined"]) });

// The trusted person says yes or no to a large payment.
export async function PATCH(request: Request, ctx: RouteContext<"/api/approvals/[id]">) {
  const { id } = await ctx.params;
  const parsed = Decision.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid decision" }, { status: 400 });

  const approval = await getApproval(id);
  if (!approval) return Response.json({ error: "Not found" }, { status: 404 });
  const allowed = await canActAsMember(approval.member_id);
  if (!allowed.ok) return deny(allowed);
  if (approval.status !== "pending") return Response.json({ error: `Already ${approval.status}` }, { status: 409 });

  await decideApproval(id, parsed.data.decision);
  const { outcome } = await applyApprovalDecision(approval.transfer_id, parsed.data.decision);
  return Response.json({ ok: true, outcome });
}
