import { z } from "zod";
import { canActAsMember, deny, isDemoId } from "@/lib/auth";
import { recordEvent } from "@/lib/metrics";
import { TEST_ALERT_CODE } from "@/lib/setup-status";
import { getAlert, getRiskEvent, updateAlert } from "@/lib/store";

const Ack = z.object({ status: z.enum(["ack_calling", "ack_fine"]) });

export async function PATCH(request: Request, ctx: RouteContext<"/api/alerts/[id]">) {
  const { id } = await ctx.params;
  const parsed = Ack.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid status" }, { status: 400 });
  const alert = await getAlert(id);
  if (!alert) return Response.json({ error: "Not found" }, { status: 404 });
  const allowed = await canActAsMember(alert.member_id);
  if (!allowed.ok) return deny(allowed);
  const updated = await updateAlert(id, parsed.data.status);
  // "It's fine, I've checked" is the family telling Ruko the warning was a false alarm. It feeds the false-alarm rate
  // (the card forbids ignoring false alarms), but a setup TEST alert is not a real warning, so it never counts.
  if (parsed.data.status === "ack_fine" && alert.status !== "ack_fine") {
    const risk = await getRiskEvent(alert.risk_event_id);
    if (risk && !risk.reasons.some((r) => r.code === TEST_ALERT_CODE)) await recordEvent("false_positive", { demo: isDemoId(alert.member_id) });
  }
  return Response.json(updated);
}
