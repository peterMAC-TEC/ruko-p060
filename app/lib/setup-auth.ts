import "server-only";
import { canActAsMember, isDemoId, type Allowed } from "./auth";
import { listCircle } from "./store";

/** The person setting Ruko up must be that family member, and must really be in this elder's circle (the demo family is open). */
export async function canSetUp(elderId: string, memberId: string): Promise<Allowed> {
  const who = await canActAsMember(memberId);
  if (!who.ok) return who;
  if (isDemoId(elderId) && isDemoId(memberId)) return who;
  const { members } = await listCircle(elderId);
  return members.some((m) => m.id === memberId) ? who : { ok: false, status: 403, error: "You are not in this person's Ruko family." };
}
