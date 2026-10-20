import { createHash } from "node:crypto";
import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { addCircleMember, getInviteByHash, getUser, grantConsent, updateInvite } from "@/lib/store";
import { CONSENT_NOTICE_VERSION } from "@/lib/consent";

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

async function findOpenInvite(token: string) {
  const invite = await getInviteByHash(hash(token));
  if (!invite) return { error: "This invite link isn't valid.", status: 404 as const };
  if (invite.status !== "pending") return { error: `This invite was already ${invite.status}.`, status: 409 as const };
  if (Date.parse(invite.expires_at) < Date.now()) return { error: "This invite has expired. Ask for a new one.", status: 410 as const };
  return { invite };
}

// GET ?token=… what the invite is (who invited you), shown before you accept.
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return Response.json({ error: "token required" }, { status: 400 });
  const found = await findOpenInvite(token);
  if ("error" in found) return Response.json({ error: found.error }, { status: found.status });
  const elder = await getUser(found.invite.elder_id);
  return Response.json({ elderName: elder?.name, name: found.invite.name, relation: found.invite.relation });
}

const Decide = z.object({ token: z.string().min(10), decision: z.enum(["accept", "decline"]) });

// POST: the invited person, signed in, accepts or declines. Accepting is their
// own consent to receive alerts about the elder (DPDP).
export async function POST(request: Request) {
  const parsed = Decide.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid" }, { status: 400 });
  const found = await findOpenInvite(parsed.data.token);
  if ("error" in found) return Response.json({ error: found.error }, { status: found.status });
  const { invite } = found;
  const decided_at = new Date().toISOString();

  if (parsed.data.decision === "decline") {
    await updateInvite(invite.id, { status: "declined", decided_at });
    return Response.json({ ok: true, status: "declined" });
  }

  const viewer = await getViewer();
  const me = viewer?.user;
  if (!me) return Response.json({ error: "Please sign in to accept." }, { status: 401 });
  if (me.id === invite.elder_id) return Response.json({ error: "You can't join your own Ruko Family." }, { status: 409 });

  const member = await addCircleMember(invite.elder_id, { name: me.name, phone: me.phone, relation: invite.relation }, me.id);
  await grantConsent({ user_id: me.id, scope: "family_alerts", notice_version: CONSENT_NOTICE_VERSION, lang: me.language });
  await updateInvite(invite.id, { status: "accepted", member_id: me.id, decided_at });
  return Response.json({ ok: true, status: "accepted", member });
}
