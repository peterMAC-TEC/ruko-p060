import { z } from "zod";
import { canActForElder, deny, getViewer, isBankStaff, isDemoId, seesTruth } from "@/lib/auth";
import { duressActive } from "@/lib/threat-server";
import { DEMO_FAMILY_ID } from "@/lib/seed";
import { getProtection, listCircle, setProtection } from "@/lib/store";

export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (!elderId) return Response.json({ error: "elderId required" }, { status: 400 });
  const allowed = await canActForElder(elderId);
  if (!allowed.ok) return deny(allowed);
  // The person's own phone never shows a duress freeze (review H1); family and the bank do.
  if (!(await seesTruth(elderId, request)) && (await duressActive(elderId))) {
    return Response.json({ elder_id: elderId, active: false, since: null, reason: null, cleared_by: null, cleared_at: null });
  }
  return Response.json(await getProtection(elderId));
}

const Clear = z.object({ elderId: z.string().min(1), memberId: z.string().optional() });

// A family member or the bank clears protection once they've spoken to the
// elder. The elder can't clear it alone: a scammer would simply tell them to.
export async function POST(request: Request) {
  const parsed = Clear.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "elderId required" }, { status: 400 });
  const { elderId, memberId } = parsed.data;

  let clearedBy: string | null = null;
  if (isDemoId(elderId)) {
    clearedBy = memberId ?? DEMO_FAMILY_ID;
  } else {
    const viewer = await getViewer();
    const me = viewer?.user;
    if (!me) return Response.json({ error: "Please sign in." }, { status: 401 });
    const { members } = await listCircle(elderId);
    if (me.id === elderId) {
      return Response.json({ error: "Your family or your bank needs to clear this, to keep you safe." }, { status: 403 });
    }
    if (!members.some((m) => m.id === me.id) && !(await isBankStaff())) {
      return Response.json({ error: "You don't have access to this person's Ruko." }, { status: 403 });
    }
    clearedBy = me.id;
  }

  return Response.json(
    await setProtection(elderId, { active: false, cleared_by: clearedBy, cleared_at: new Date().toISOString() }),
  );
}
