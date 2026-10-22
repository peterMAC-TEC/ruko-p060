import { z } from "zod";
import { bankAllowed } from "@/lib/bank-auth";
import { assessGuard } from "@/lib/guard-assess";

const Body = z
  .object({
    customerAgeBand: z.enum(["under_60", "60_69", "70_plus"]),
    amountInr: z.number().min(0).max(100_000_000),
    newPayee: z.boolean(),
    merchant: z.boolean().optional(),
    rukoFlag: z.boolean(),
    payeeRisk: z.object({ reports: z.number().int().min(0).max(100_000), victims: z.number().int().min(0).max(100_000).optional() }).optional(),
    hasTrustedPerson: z.boolean(),
    paymentsPaused: z.boolean().optional(),
  })
  .strict();

// POST /api/guard/assess: the decision a bank asks for BEFORE moving money. Stateless: nothing is stored, and the body
// carries no names, accounts or phone numbers, only the facts the decision needs. See docs/BANK-INTEGRATION.md.
export async function POST(request: Request) {
  const who = bankAllowed(request);
  if (!who.ok) return Response.json({ error: "A bank API key is required." }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "Invalid request", issues: parsed.error.issues.slice(0, 5).map((i) => `${i.path.join(".")}: ${i.message}`) }, { status: 400 });
  }
  return Response.json(assessGuard(parsed.data));
}
