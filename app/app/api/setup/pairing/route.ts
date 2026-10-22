import { z } from "zod";
import { deny } from "@/lib/auth";
import { deviceToken } from "@/lib/device-token";
import { canSetUp } from "@/lib/setup-auth";
import { listCircle } from "@/lib/store";

const Q = z.object({ elderId: z.string().min(1), memberId: z.string().min(1) });

// GET: the pairing code for the elder's Android app. Only the trusted person sees it.
export async function GET(request: Request) {
  const u = new URL(request.url);
  const parsed = Q.safeParse({ elderId: u.searchParams.get("elderId"), memberId: u.searchParams.get("memberId") });
  if (!parsed.success) return Response.json({ error: "elderId and memberId required" }, { status: 400 });
  const { elderId, memberId } = parsed.data;
  const allowed = await canSetUp(elderId, memberId);
  if (!allowed.ok) return deny(allowed);
  const { members } = await listCircle(elderId);
  if (!members.find((m) => m.id === memberId)?.trusted) return Response.json({ error: "Only the trusted person can pair a phone." }, { status: 403 });
  return Response.json({ code: `${elderId}.${deviceToken(elderId)}` });
}
