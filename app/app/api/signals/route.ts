import { z } from "zod";
import { canActForElder, deny, isDemoId } from "@/lib/auth";
import { flags } from "@/lib/flags";
import { getSignals, setSignals } from "@/lib/store";

export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (!elderId) return Response.json({ error: "elderId required" }, { status: 400 });
  const allowed = await canActForElder(elderId);
  if (!allowed.ok) return deny(allowed);
  return Response.json((await getSignals(elderId)) ?? null);
}

const Patch = z.object({
  elderId: z.string().min(1),
  on_call: z.boolean().optional(),
  unknown_number: z.boolean().optional(),
  call_minutes: z.number().int().min(0).max(6000).optional(),
  call_ended_at: z.string().datetime().nullable().optional(),
});

// Only the demo signal panel writes here, and only for the demo sandbox. Real
// signals will come from the Android app, with consent.
export async function POST(request: Request) {
  if (!flags.MOCK_SIGNALS) return Response.json({ error: "Signal panel is off" }, { status: 403 });
  const parsed = Patch.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid signals" }, { status: 400 });
  const { elderId, ...patch } = parsed.data;
  if (!isDemoId(elderId)) return Response.json({ error: "The signal panel only drives the demo." }, { status: 403 });
  return Response.json(await setSignals(elderId, patch));
}
