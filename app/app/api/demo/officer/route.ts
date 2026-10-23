import { z } from "zod";
import { aiConfigured, runTask } from "@/lib/ai";
import { flags } from "@/lib/flags";
import { buildClassifyPrompt, buildOfficerPrompt, guardAiReply, OBJECTIONS } from "@/lib/officer-brain";

// Words one line for the role-play officer in the live demo call. The state machine in lib/demo-officer.ts decides the
// stage and what happens next; this only writes the sentence, and guardAiReply checks it. Anything unsafe, slow or
// missing comes back as source "script" and the page plays the pre-written line instead. Nothing is stored or logged:
// the turns arrive, are redacted of digits, go to the model, and are gone.

const Body = z
  .object({
    turns: z.array(z.object({ who: z.enum(["officer", "person"]), text: z.string().max(400) }).strict()).max(12),
    stage: z.enum(["contact", "fear", "isolation", "authority", "urgency", "payment_ask", "closing"]),
    rung: z.number().int().min(0).max(12),
    name: z.string().max(20).nullable(),
    lang: z.enum(["en", "hing"]),
    objection: z.enum(OBJECTIONS).nullable(),
    mode: z.enum(["reply", "classify"]).default("reply"),
  })
  .strict();

const Reply = z.object({
  state: z.enum(["agreeing", "doubting", "refusing", "scared", "angry", "asking", "silent", "leaving"]),
  objection: z.string().max(80),
  reply: z.string().max(300),
});

const Classify = z.object({
  state: z.enum(["agreeing", "doubting", "refusing", "scared", "angry", "asking", "silent", "leaving"]),
  objection: z.enum([...OBJECTIONS, "none"]),
  confidence: z.number().min(0).max(1),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "bad request" }, { status: 400 });
  if (!flags.DEMO_MODE || !aiConfigured()) return Response.json({ source: "script" });
  const b = parsed.data;
  try {
    if (b.mode === "classify") {
      // The AI only reads what the person meant. The answer is a recorded line chosen by code.
      const t0 = Date.now();
      const c = await runTask(Classify, { prompt: buildClassifyPrompt(b) });
      return Response.json({ source: "ai", objection: c.objection === "none" ? null : c.objection, state: c.state, confidence: c.confidence, ms: Date.now() - t0, model: process.env.AI_PROVIDER ?? "gemini" });
    }
    const r = await runTask(Reply, { prompt: buildOfficerPrompt(b) });
    const verdict = guardAiReply(r.reply, b.stage);
    if (!verdict.ok) return Response.json({ source: "script", rejected: verdict.why });
    return Response.json({ source: "ai", reply: r.reply.trim(), state: r.state, objection: r.objection });
  } catch {
    return Response.json({ source: "script" });
  }
}
