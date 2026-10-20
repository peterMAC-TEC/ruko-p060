import { canActForElder, deny } from "@/lib/auth";
import { listCircle, listInvites } from "@/lib/store";

// The elder's Ruko Family: people who accepted, plus invites still waiting.
export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (!elderId) return Response.json({ error: "elderId required" }, { status: 400 });
  const allowed = await canActForElder(elderId);
  if (!allowed.ok) return deny(allowed);
  const [circle, invites] = await Promise.all([listCircle(elderId), listInvites(elderId)]);
  return Response.json({
    ...circle,
    invites: invites.map((i) => ({ id: i.id, name: i.name, phone: i.phone, relation: i.relation, created_at: i.created_at })),
  });
}
