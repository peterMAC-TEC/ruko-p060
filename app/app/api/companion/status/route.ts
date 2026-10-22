import { z } from "zod";
import { canActAsElder, deny } from "@/lib/auth";
import { ELDER_STATUSES } from "@/lib/companion";
import { setElderStatus } from "@/lib/store";

// What the elder just told Ruko Companion, as a code, for the family's phone.
const Body = z.object({ elderId: z.string().min(1), status: z.enum(ELDER_STATUSES as unknown as [string, ...string[]]) });

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid status" }, { status: 400 });
  const allowed = await canActAsElder(parsed.data.elderId);
  if (!allowed.ok) return deny(allowed);
  const row = await setElderStatus(parsed.data.elderId, parsed.data.status);
  return Response.json({ ok: true, attached: Boolean(row) });
}
