import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { recordEvent } from "@/lib/metrics";
import { hashNumber, hashReporter } from "@/lib/privacy";
import { upsertNumberReport } from "@/lib/store";

const Body = z.object({
  number: z.string().trim().min(3).max(20).optional(),
  verdict: z.enum(["scam", "not_scam", "unsure"]),
  patternId: z.string().max(40).optional(),
  // Did Ruko warn about this call? A warned call later marked "not a scam" is a false positive.
  warned: z.boolean().default(false),
  // Anonymous device id for people who aren't signed in (demo); hashed before storage.
  device: z.string().min(8).max(64).optional(),
});

// Post-call "Was this a scam?". Trains the community database and measures false positives.
export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid report" }, { status: 400 });
  const { number, verdict, patternId, warned, device } = parsed.data;

  const viewer = await getViewer();
  const reporter = viewer?.user?.id ?? (device ? `device:${device}` : null);
  if (!reporter) return Response.json({ error: "Sign in to report numbers." }, { status: 401 });
  // Signed-out reports come from the demo sandbox and are kept apart from real data.
  const demo = !viewer?.user;

  if (number) {
    await upsertNumberReport({
      number_hash: hashNumber(number),
      // Signed-out reporters can't vouch for a number: their "not a scam" is
      // stored as "unsure", so rotating device ids can't clean a scammer's number.
      verdict: demo && verdict === "not_scam" ? "unsure" : verdict,
      pattern_id: verdict === "scam" ? (patternId ?? null) : null,
      reporter_hash: hashReporter(reporter),
      demo,
    });
  }
  if (verdict === "scam") await recordEvent("confirmed_scam", { patternId, demo });
  if (verdict === "not_scam" && warned) await recordEvent("false_positive", { patternId, demo });
  return Response.json({ ok: true });
}
