import { z } from "zod";
import { canActAsMember, deny } from "@/lib/auth";
import { codeWordGate } from "@/lib/code-word";
import { applyApprovalDecision } from "@/lib/payments";
import { decideApproval, getApproval, getTransfer } from "@/lib/store";

const Decision = z.object({ decision: z.enum(["approved", "declined"]), codeWord: z.string().max(60).optional() });

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

  // After a flagged call, approving needs the family code word (saying no never does): a voice on the phone, even a
  // perfect copy of a family member's, cannot get the money released without it.
  const transfer = await getTransfer(approval.transfer_id);
  if (transfer) {
    const gate = await codeWordGate(transfer.elder_id, parsed.data.decision, parsed.data.codeWord);
    if (gate !== "ok") return Response.json({ error: gate }, { status: 403 });
  }
  await decideApproval(id, parsed.data.decision);
  const { outcome } = await applyApprovalDecision(approval.transfer_id, parsed.data.decision);
  return Response.json({ ok: true, outcome });
}
