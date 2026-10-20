import { flags } from "@/lib/flags";
import { hashAccount, hashNumber, hashReporter } from "@/lib/privacy";
import { DEMO_MULES, DEMO_NUMBERS } from "@/lib/seed";
import { deleteDemoEvents, deleteDemoMuleReports, deleteDemoNumberReports, insertMuleReports, insertNumberReports, resetDemo } from "@/lib/store";

export async function POST() {
  if (!flags.DEMO_MODE) return Response.json({ error: "Not in demo mode" }, { status: 403 });
  await resetDemo();
  await Promise.all([deleteDemoEvents(), deleteDemoNumberReports(), deleteDemoMuleReports()]);
  // Reported mule accounts (by salted hash), tagged demo.
  await insertMuleReports(
    DEMO_MULES.flatMap((m) =>
      Array.from({ length: m.reports }, (_, i) => ({
        account_hash: hashAccount(m.account),
        reporter_hash: hashReporter(`demo-mule-${m.account}-${i}`),
        pattern_id: m.patternId,
        demo: true,
      })),
    ),
  );
  // Community reports for the demo numbers, all tagged demo.
  await insertNumberReports(
    DEMO_NUMBERS.flatMap((d) => [
      ...Array.from({ length: d.scam }, (_, i) => ({
        number_hash: hashNumber(d.number),
        verdict: "scam" as const,
        pattern_id: d.patternId || null,
        reporter_hash: hashReporter(`demo-seed-${d.number}-${i}`),
        demo: true,
      })),
      ...Array.from({ length: d.notScam }, (_, i) => ({
        number_hash: hashNumber(d.number),
        verdict: "not_scam" as const,
        pattern_id: null,
        reporter_hash: hashReporter(`demo-seed-ok-${d.number}-${i}`),
        demo: true,
      })),
    ]),
  );
  return Response.json({ ok: true });
}
