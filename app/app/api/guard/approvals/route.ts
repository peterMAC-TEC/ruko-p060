import { z } from "zod";
import { isDemoId } from "@/lib/auth";
import { bankAllowed } from "@/lib/bank-auth";
import { hashAccount } from "@/lib/privacy";
import { createApprovals, createTransfer, getUser, listCircle } from "@/lib/store";

const Body = z
  .object({
    elderId: z.string().min(1),
    amountInr: z.number().positive().max(100_000_000),
    /** A label the family will see, and the destination account (kept as given for the fraud desk, hashed for matching). */
    payeeLabel: z.string().trim().min(1).max(80),
    payeeAccount: z.string().trim().min(2).max(80),
    channel: z.enum(["upi", "imps", "neft", "rtgs"]).default("upi"),
    bankRef: z.string().max(60).optional(),
  })
  .strict();

// POST /api/guard/approvals: the bank asks Ruko to get a trusted person's yes or no for a held payment. The family sees
// it on their phone (PATCH /api/approvals/{id} resolves it, and needs the family code word after a flagged call).
// GET /api/guard/approvals/{id} lets the bank read the answer.
export async function POST(request: Request) {
  const who = bankAllowed(request);
  if (!who.ok) return Response.json({ error: "A bank API key is required." }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const b = parsed.data;
  // Without a bank key (the open demo), only the demo family can be asked: real people are never reachable that way.
  if (who.mode === "demo" && !isDemoId(b.elderId)) return Response.json({ error: "A bank API key is required for real customers." }, { status: 403 });
  if (!(await getUser(b.elderId))) return Response.json({ error: "Unknown customer" }, { status: 404 });
  const { members } = await listCircle(b.elderId);
  const trusted = members.filter((m) => m.trusted);
  if (trusted.length === 0) return Response.json({ error: "no_trusted_person" }, { status: 409 });
  const transfer = await createTransfer({
    elder_id: b.elderId,
    amount: b.amountInr,
    payee: b.payeeLabel,
    payee_account: b.payeeAccount,
    channel: b.channel,
    flagged: true,
    score: 0,
    reasons: [{ code: "guard_external_request", label: `Ruko Guard: ${who.mode === "key" ? "a bank" : "the demo bank"} asked for a trusted person's approval${b.bankRef ? ` (ref ${b.bankRef})` : ""}.`, points: 0, hard: false }],
    needs_approval: true,
    status: "held",
    hold_until: null,
    payee_hash: hashAccount(b.payeeAccount),
    behaviour: null,
  });
  await createApprovals(transfer.id, trusted.map((m) => m.id));
  return Response.json({ approvalRequestId: transfer.id, status: "pending", familyAsked: trusted.length }, { status: 201 });
}
