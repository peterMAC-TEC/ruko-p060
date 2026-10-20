import { z } from "zod";
import { canActAsElder, deny } from "@/lib/auth";
import { hashCodeWord } from "@/lib/circle";
import { listCircle, setCircleCodeWordHash } from "@/lib/store";

const Body = z.object({
  elderId: z.string().min(1),
  codeWord: z.string().trim().min(3).max(40),
});

// The elder sets the family code word. Only its hash is stored.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Code word must be 3–40 characters" }, { status: 400 });
  const { elderId, codeWord } = parsed.data;
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);

  const { members } = await listCircle(elderId);
  if (members.length === 0) return Response.json({ error: "Add a family member first" }, { status: 409 });
  await setCircleCodeWordHash(elderId, hashCodeWord(elderId, codeWord));
  return Response.json({ ok: true });
}
