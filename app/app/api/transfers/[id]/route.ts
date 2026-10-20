import { z } from "zod";
import { canActAsElder, deny, isBankStaff, isDemoId } from "@/lib/auth";
import { recordEvent } from "@/lib/metrics";
import { releaseTransfer } from "@/lib/payments";
import { getTransfer, updateTransfer } from "@/lib/store";

const Decision = z.object({
  // release/block come from the fraud desk; cancel comes from the elder.
  action: z.enum(["release", "block", "cancel"]),
});

export async function PATCH(request: Request, ctx: RouteContext<"/api/transfers/[id]">) {
  const { id } = await ctx.params;
  const parsed = Decision.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid action" }, { status: 400 });
  const { action } = parsed.data;

  const t = await getTransfer(id);
  if (!t) return Response.json({ error: "Not found" }, { status: 404 });

  if (action === "cancel") {
    const allowed = await canActAsElder(t.elder_id);
    if (!allowed.ok) return deny(allowed);
  } else if (!isDemoId(t.elder_id) && !(await isBankStaff())) {
    return Response.json({ error: "Only bank staff can release or block a payment." }, { status: 403 });
  }

  // To the customer a duress payment is "completed": answer exactly as for one.
  if (action === "cancel" && t.duress) return Response.json({ error: "Transfer is already completed" }, { status: 409 });
  if (t.status !== "held") return Response.json({ error: `Transfer is already ${t.status}` }, { status: 409 });

  const decided_at = new Date().toISOString();
  const updated =
    action === "release"
      ? await releaseTransfer(t)
      : await updateTransfer(id, { status: action === "block" ? "blocked" : "cancelled", decided_at });
  // A held payment that never went out is money kept: the v2 "money saved" number.
  if (action !== "release") await recordEvent("payment_abandoned", { value: t.amount, demo: isDemoId(t.elder_id) });
  return Response.json(updated);
}
