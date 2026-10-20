import { z } from "zod";
import { canActAsElder, canActForElder, deny, isBankStaff, seesTruth } from "@/lib/auth";
import { customerView, submitPayment } from "@/lib/payments";
import { DEMO_ELDER_ID } from "@/lib/seed";
import { getUser, listTransfers } from "@/lib/store";

// GET ?elderId=…  that elder's payments (elder, family or bank staff)
// GET             the fraud desk queue: every customer for bank staff, the demo sandbox for everyone else
export async function GET(request: Request) {
  const elderId = new URL(request.url).searchParams.get("elderId");
  if (elderId) {
    const allowed = await canActForElder(elderId);
    if (!allowed.ok) return deny(allowed);
  }
  const scope = elderId ?? ((await isBankStaff()) ? undefined : DEMO_ELDER_ID);
  // A person's own payments come back in the quiet customer view by default (a
  // duress payment looks like a normal pending one): a scammer may be holding the
  // phone. Family and the fraud desk ask for ?view=staff and must have the authority.
  const masked = elderId ? !(await seesTruth(elderId, request)) : false;
  const rows = (await listTransfers({ elderId: scope })).map((t) => (masked ? customerView(t) : t));
  const names = new Map<string, string>();
  for (const id of new Set(rows.map((r) => r.elder_id))) names.set(id, (await getUser(id))?.name ?? "Unknown");
  return Response.json(rows.map((r) => ({ ...r, elder_name: names.get(r.elder_id) })));
}

const NewTransfer = z.object({
  elderId: z.string().min(1),
  amount: z.number().positive().max(10_000_000),
  payee: z.string().trim().min(1).max(80),
  payeeAccount: z.string().trim().min(2).max(80),
  channel: z.enum(["upi", "imps", "neft", "rtgs", "cash", "fd_break"]).default("upi"),
  pin: z.string().regex(/^\d{4}$/).optional(),
  behaviour: z
    .object({
      pastedPayee: z.boolean(),
      appSwitches: z.number().int().min(0).max(100),
      amountPauses: z.number().int().min(0).max(100),
      amountEdits: z.number().int().min(0).max(100),
      confirmDwellMs: z.number().min(0).max(3_600_000),
      flowMs: z.number().min(0).max(3_600_000),
    })
    .nullable()
    .optional(),
});

// Only the elder moves their own money.
export async function POST(request: Request) {
  const parsed = NewTransfer.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid transfer" }, { status: 400 });
  const { elderId, ...input } = parsed.data;
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);

  const result = await submitPayment(elderId, input);
  if ("pinError" in result) {
    return Response.json(
      { error: result.pinError === "locked" ? "Too many wrong PINs. Try again in 5 minutes." : "Incorrect PIN", ...result },
      { status: result.pinError === "locked" ? 423 : 401 },
    );
  }
  return Response.json({ ...result.transfer, risk_event_id: result.riskEventId }, { status: 201 });
}
