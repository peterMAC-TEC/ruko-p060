import { z } from "zod";
import { loadDrillLibrary } from "@/lib/drill-server";
import { recordPracticeEvent } from "@/lib/lab";
import { getUser, listParticipants, listTrialCalls } from "@/lib/store";
import { drillCodes, isTrialAccountId } from "@/lib/trial";

// The trial practice phone. Only practice accounts (a sandbox with no real
// data) can use this. GET: is a call live, is Ruko on, and the fake codes the
// scripts ask the person to read out. POST: a milestone the phone observed.

export async function GET(request: Request) {
  const account = new URL(request.url).searchParams.get("account") ?? "";
  if (!isTrialAccountId(account)) return Response.json({ error: "Not a practice account" }, { status: 403 });
  const [user, participants] = await Promise.all([getUser(account), listParticipants()]);
  const p = participants.find((x) => x.account_id === account);
  const call = p ? (await listTrialCalls({ participantId: p.id })).find((c) => c.status === "live") : undefined;
  let message: { from: string; text: string } | null = null;
  if (call?.is_scam) {
    const lib = await loadDrillLibrary();
    const script = lib.scripts.find((s) => s.id === call.script_id);
    const codes = drillCodes(call.id);
    // The scripts ask for "the code on your screen": it arrives as a message, as real ones do. Clearly a drill code.
    message = /courier|parcel/i.test(call.script_id)
      ? { from: "SwiftParcel", text: `Your parcel tracking reference is ${codes.track6}. (DRILL)` }
      : { from: "CIC-DRILL", text: `Case reference code: ${codes.case4}. Do not share. (DRILL)` };
    if (script && /telecom/i.test(script.id)) message = { from: "TVD-DRILL", text: `Verification code ${codes.case4}. (DRILL)` };
  }
  return Response.json({ code: p?.code ?? null, live: Boolean(call), callId: call?.id ?? null, rukoOn: user?.ruko_enabled !== false, message });
}

const Event = z.object({
  account: z.string(),
  kind: z.enum(["bank_opened", "payee_entered", "amount_entered", "cancel_pressed", "ruko_check_opened", "stop_screen_shown", "messages_opened", "ruko_paused_seen"]),
  detail: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const parsed = Event.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isTrialAccountId(parsed.data.account)) return Response.json({ error: "Invalid" }, { status: 400 });
  const call = await recordPracticeEvent(parsed.data.account, parsed.data.kind, parsed.data.detail);
  return Response.json({ recorded: Boolean(call) });
}
