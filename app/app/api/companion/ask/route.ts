import { z } from "zod";
import { canActAsElder, deny } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { askCompanion } from "@/lib/ai/companion";
import { fallbackAnswer, safeReply } from "@/lib/companion";

// Ruko Companion's free questions. Nothing is stored: not the question, not the answer.
// The AI's reply is shown only if it passes safeReply(); otherwise (or when the AI is
// busy, slow or off) the offline answer is used, so this always answers within seconds.

const Body = z.object({ elderId: z.string().min(1), question: z.string().min(1).max(400), lang: z.enum(["en", "hing"]) });
const TIMEOUT_MS = 10_000;

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid question" }, { status: 400 });
  const { elderId, question, lang } = parsed.data;
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);

  // Money, OTPs, arrest and fear have fixed answers: too important to improvise.
  const offline = fallbackAnswer(question, lang);
  if (offline.intent !== "other" || !aiConfigured()) return Response.json({ ...offline, engine: "local" });

  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const ai = await Promise.race([
      askCompanion(question, lang),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("timed out")), TIMEOUT_MS);
      }),
    ]);
    const reply = safeReply(ai.reply);
    // An "already paid" answer always comes from the fixed line: money and OTPs are too serious to improvise.
    if (reply && ai.intent !== "already_paid") return Response.json({ reply, intent: ai.intent, engine: "ai" });
    return Response.json({ ...(ai.intent === "already_paid" ? fallbackAnswer("already paid", lang) : offline), engine: "local" });
  } catch {
    return Response.json({ ...offline, engine: "local" });
  } finally {
    clearTimeout(timer);
  }
}
