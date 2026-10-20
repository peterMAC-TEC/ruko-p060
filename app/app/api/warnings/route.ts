import { canActForElder, deny, seesTruth } from "@/lib/auth";
import { getProtection } from "@/lib/store";
import { duressActive } from "@/lib/threat-server";
import { listRiskEvents } from "@/lib/store";

// The elder's recent warnings for the home screen: when, how serious, and which
// scam (if Ruko named one). Signal codes only, never what was said.
export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (!elderId) return Response.json({ error: "elderId required" }, { status: 400 });
  const allowed = await canActForElder(elderId);
  if (!allowed.ok) return deny(allowed);
  let rows = await listRiskEvents(elderId, 5);
  // During a duress freeze the person's own phone shows nothing new (review H1).
  if (!(await seesTruth(elderId, request)) && (await duressActive(elderId))) {
    // By the duress marker itself, and with a minute's margin: the database and
    // the server clocks can differ by a second or two.
    const since = Date.parse((await getProtection(elderId)).since ?? new Date().toISOString()) - 60_000;
    rows = rows.filter((r) => !r.reasons.some((x) => x.code === "RT14" || x.code === "duress") && Date.parse(r.created_at) < since);
  }
  return Response.json(
    rows.map((r) => ({
      id: r.id,
      at: r.created_at,
      source: r.source,
      level: r.score >= 70 ? "stop" : "caution",
      patternId: r.reasons.find((x) => x.code.startsWith("pattern_"))?.code.slice("pattern_".length) ?? null,
    })),
  );
}
