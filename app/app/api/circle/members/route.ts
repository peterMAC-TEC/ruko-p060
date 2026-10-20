import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { canActAsElder, deny, isDemoId } from "@/lib/auth";
import { addCircleMember, createInvite, listCircle, listInvites, removeCircleMember, updateInvite } from "@/lib/store";

const MAX_CIRCLE = 3;

const NewMember = z.object({
  elderId: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  phone: z.string().trim().regex(/^\+?[\d\s-]{8,16}$/, "Phone number looks wrong"),
  relation: z.string().trim().min(1).max(30),
});

// The elder invites someone. Nobody's number is used until they accept
// (DPDP: each person consents to their own data). In the demo sandbox the
// invite is accepted on the spot, and the response says so.
export async function POST(request: Request) {
  const parsed = NewMember.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  const { elderId, ...m } = parsed.data;
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);

  const [{ members }, pending] = await Promise.all([listCircle(elderId), listInvites(elderId)]);
  if (members.length + pending.length >= MAX_CIRCLE) {
    return Response.json({ error: `Ruko Family has room for ${MAX_CIRCLE} people` }, { status: 409 });
  }

  const token = randomBytes(24).toString("base64url");
  const invite = await createInvite({
    elder_id: elderId,
    ...m,
    token_hash: createHash("sha256").update(token).digest("hex"),
  });

  if (isDemoId(elderId)) {
    const member = await addCircleMember(elderId, m);
    await updateInvite(invite.id, { status: "accepted", member_id: member.id, decided_at: new Date().toISOString() });
    return Response.json({ member, demoAutoAccepted: true }, { status: 201 });
  }

  // The link is shown once, for the elder to share (WhatsApp, SMS, in person).
  return Response.json({ inviteId: invite.id, link: `/join/${token}` }, { status: 201 });
}

export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const elderId = url.searchParams.get("elderId");
  const memberId = url.searchParams.get("memberId");
  const inviteId = url.searchParams.get("inviteId");
  if (!elderId || (!memberId && !inviteId)) {
    return Response.json({ error: "elderId and memberId or inviteId required" }, { status: 400 });
  }
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);
  if (memberId) await removeCircleMember(elderId, memberId);
  if (inviteId) {
    const mine = (await listInvites(elderId)).some((i) => i.id === inviteId);
    if (!mine) return Response.json({ error: "Not found" }, { status: 404 });
    await updateInvite(inviteId, { status: "revoked", decided_at: new Date().toISOString() });
  }
  return Response.json({ ok: true });
}
