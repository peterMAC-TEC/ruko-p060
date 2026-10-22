import { z } from "zod";
import { deny } from "@/lib/auth";
import { hashCodeWord } from "@/lib/circle";
import { canSetUp } from "@/lib/setup-auth";
import { listCircle, setCircleCodeWordHash } from "@/lib/store";

const Body = z.object({ elderId: z.string().min(1), memberId: z.string().min(1), codeWord: z.string().trim().min(3).max(40) });

// The family sets the code word FOR the elder (the family-first setup). Only its hash is stored; it is never shown again.
// Only the trusted person may do this.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "The code word must be 3 to 40 characters." }, { status: 400 });
  const { elderId, memberId, codeWord } = parsed.data;
  const allowed = await canSetUp(elderId, memberId);
  if (!allowed.ok) return deny(allowed);
  const { members } = await listCircle(elderId);
  if (!members.find((m) => m.id === memberId)?.trusted) return Response.json({ error: "Only the trusted person can set the code word." }, { status: 403 });
  await setCircleCodeWordHash(elderId, hashCodeWord(elderId, codeWord));
  return Response.json({ ok: true });
}
