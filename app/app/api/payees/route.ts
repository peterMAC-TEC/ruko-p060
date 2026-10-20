import { canActForElder, deny } from "@/lib/auth";
import { listPayees } from "@/lib/store";

export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (!elderId) return Response.json({ error: "elderId required" }, { status: 400 });
  const allowed = await canActForElder(elderId);
  if (!allowed.ok) return deny(allowed);
  return Response.json(await listPayees(elderId));
}
