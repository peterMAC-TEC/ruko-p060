import { isBankStaff } from "@/lib/auth";
import { flags } from "@/lib/flags";
import { maskAccount } from "@/lib/privacy";
import { muleClusters } from "@/lib/store";

// GET: the fraud desk's mule watch. Destination accounts several customers
// were stopped paying, or that were reported, shown masked.
export async function GET() {
  if (!flags.DEMO_MODE && !(await isBankStaff())) return Response.json({ error: "Bank staff only" }, { status: 403 });
  const { clusters, reportedOnly } = await muleClusters();
  return Response.json(
    {
      clusters: clusters.slice(0, 20).map((c) => ({ ...c, account: maskAccount(c.account), hash: c.hash.slice(0, 12) })),
      reportedOnly,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
