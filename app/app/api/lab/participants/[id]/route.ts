import { z } from "zod";
import { labAllowed, labDenied } from "@/lib/lab";
import { deleteParticipant, getParticipant, updateParticipant } from "@/lib/store";

const Patch = z.object({
  withdraw: z.boolean().optional(),
  notes: z.string().max(1000).nullable().optional(),
  // Final visit.
  self_efficacy_post: z.number().int().min(1).max(5).nullable().optional(),
  deception_acceptable: z.boolean().nullable().optional(),
});

// Withdraw (keeps finished calls unless they ask for erasure), notes, final-visit answers.
export async function PATCH(request: Request, ctx: RouteContext<"/api/lab/participants/[id]">) {
  if (!(await labAllowed())) return labDenied();
  const { id } = await ctx.params;
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid" }, { status: 400 });
  const { withdraw, ...rest } = parsed.data;
  const patch: Record<string, unknown> = { ...rest };
  if (withdraw !== undefined) patch.withdrawn_at = withdraw ? new Date().toISOString() : null;
  const p = await updateParticipant(id, patch);
  return p ? Response.json(p) : Response.json({ error: "Not found" }, { status: 404 });
}

// A participant's right to erasure: their record, every call and the practice account.
export async function DELETE(_request: Request, ctx: RouteContext<"/api/lab/participants/[id]">) {
  if (!(await labAllowed())) return labDenied();
  const { id } = await ctx.params;
  if (!(await getParticipant(id))) return Response.json({ error: "Not found" }, { status: 404 });
  await deleteParticipant(id);
  return Response.json({ ok: true });
}
