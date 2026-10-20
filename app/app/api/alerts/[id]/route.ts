import { z } from "zod";
import { canActAsMember, deny } from "@/lib/auth";
import { getAlert, updateAlert } from "@/lib/store";

const Ack = z.object({ status: z.enum(["ack_calling", "ack_fine"]) });

export async function PATCH(request: Request, ctx: RouteContext<"/api/alerts/[id]">) {
  const { id } = await ctx.params;
  const parsed = Ack.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid status" }, { status: 400 });
  const alert = await getAlert(id);
  if (!alert) return Response.json({ error: "Not found" }, { status: 404 });
  const allowed = await canActAsMember(alert.member_id);
  if (!allowed.ok) return deny(allowed);
  return Response.json(await updateAlert(id, parsed.data.status));
}
