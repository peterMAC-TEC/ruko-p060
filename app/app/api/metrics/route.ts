import { z } from "zod";
import { getViewer } from "@/lib/auth";
import { impactSummary, recordEvent } from "@/lib/metrics";

// GET  the anonymous impact numbers (money saved, warnings, false positives).
export async function GET(request: Request) {
  const days = Math.min(365, Math.max(1, Number(new URL(request.url).searchParams.get("days") ?? 30) || 30));
  return Response.json(await impactSummary(days));
}

// POST events the device itself observes. Only these kinds; payments and
// reports are recorded on the server where they happen.
const Body = z.object({
  kind: z.enum(["stop_shown", "time_to_warning", "emergency_opened"]),
  value: z.number().min(0).max(600_000).optional(),
  patternId: z.string().max(40).optional(),
});

// A crude per-process limit, so one page can't flood the table.
const recent = new Map<string, number[]>();
function allowed(key: string) {
  const now = Date.now();
  const list = (recent.get(key) ?? []).filter((t) => now - t < 60_000);
  if (list.length >= 30) return false;
  list.push(now);
  recent.set(key, list);
  return true;
}

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid event" }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!allowed(ip)) return Response.json({ error: "Too many events" }, { status: 429 });
  const viewer = await getViewer();
  await recordEvent(parsed.data.kind, { value: parsed.data.value, patternId: parsed.data.patternId, demo: !viewer?.user });
  return Response.json({ ok: true }, { status: 201 });
}
