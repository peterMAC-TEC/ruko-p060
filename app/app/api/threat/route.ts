import { canActForElder, deny, seesTruth } from "@/lib/auth";
import { verifyThreatChain } from "@/lib/store";
import { assessElder, duressActive, summary } from "@/lib/threat-server";

// GET ?elderId=…  the fused threat picture for this person.
// ?view=staff (fraud desk, family): level, attack stage, the evidence, what Ruko
// did, and whether the hash-chained evidence log is intact.
// Anyone else, including the person's own phone (a scammer may be holding it):
// only the level the bank app needs for its pause screen, and "none" while a
// duress freeze is on, so nothing on the phone changes (security review H1).
export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (!elderId) return Response.json({ error: "elderId required" }, { status: 400 });
  const allowed = await canActForElder(elderId);
  if (!allowed.ok) return deny(allowed);

  if (!(await seesTruth(elderId, request))) {
    const quiet = await duressActive(elderId);
    const { assessment } = quiet ? { assessment: null } : await assessElder(elderId);
    return Response.json({ level: quiet ? "none" : assessment!.level }, { headers: { "cache-control": "no-store" } });
  }

  const [{ assessment, events }, chain] = await Promise.all([assessElder(elderId), verifyThreatChain(elderId)]);
  return Response.json(
    {
      ...summary(assessment),
      timeline: events.slice(-40).map((e) => ({
        at: e.at,
        kind: e.kind,
        source: e.source,
        tactic: e.tactic,
        action: e.action,
        evidence: e.evidence,
        hash: e.hash.slice(0, 12),
      })),
      integrity: { ok: chain.ok, count: chain.count, brokenAt: chain.brokenAt, head: chain.head.slice(0, 16) },
    },
    { headers: { "cache-control": "no-store" } },
  );
}
