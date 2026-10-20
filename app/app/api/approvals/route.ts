import { canActAsMember, canActForElder, deny } from "@/lib/auth";
import { getTransfer, getUser, listApprovals } from "@/lib/store";

// GET ?memberId=…   the trusted person's approval requests, newest first
// GET ?transferId=… the elder's screen: has the trusted person decided?
export async function GET(request: Request) {
  const url = new URL(request.url);
  const memberId = url.searchParams.get("memberId") ?? undefined;
  const transferId = url.searchParams.get("transferId") ?? undefined;
  if (!memberId && !transferId) return Response.json({ error: "memberId or transferId required" }, { status: 400 });

  if (memberId) {
    const allowed = await canActAsMember(memberId);
    if (!allowed.ok) return deny(allowed);
  } else {
    const t = await getTransfer(transferId!);
    if (!t) return Response.json([]);
    const allowed = await canActForElder(t.elder_id);
    if (!allowed.ok) return deny(allowed);
  }

  const approvals = await listApprovals({ memberId, transferId });
  const enriched = await Promise.all(
    approvals.map(async (a) => {
      const t = await getTransfer(a.transfer_id);
      const [elder, member] = await Promise.all([t ? getUser(t.elder_id) : undefined, getUser(a.member_id)]);
      const other = t?.reasons.filter((r) => r.code !== "trusted_person_required") ?? [];
      // Same test the rules use: only call it a scam when Ruko actually suspects one,
      // so a big payment to a known person doesn't frighten the family.
      const scam = Boolean(t && (t.score >= 50 || other.some((r) => r.hard)));
      return {
        ...a,
        member_name: member?.name,
        elder_name: elder?.name,
        elder_phone: elder?.phone,
        transfer: t && {
          id: t.id,
          amount: t.amount,
          payee: t.payee,
          payee_account: t.payee_account,
          channel: t.channel,
          status: t.status,
          score: t.score,
          scam,
          // The trusted person sees the other reasons too, so they can decide well.
          reasons: other.map((r) => r.label),
        },
      };
    }),
  );
  return Response.json(enriched);
}
