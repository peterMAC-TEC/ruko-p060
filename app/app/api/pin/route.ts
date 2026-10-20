import { z } from "zod";
import { canActAsElder, deny, isDemoId } from "@/lib/auth";
import { verifyPin } from "@/lib/payments";
import { checkPin, hashPin, isPinFormat } from "@/lib/pin";
import { getPinState, updateUser } from "@/lib/store";

// Set the practice bank PIN and the duress ("safety") PIN. Changing either
// needs the current normal PIN. The duress PIN must differ from the normal PIN
// in at least two digits, so a slip of one finger can't trigger it by mistake
// (most false duress alarms are mistypes; docs/research/08 §3).

const Body = z.object({
  elderId: z.string().min(1),
  /** Not needed only when a real account sets its very first PIN. */
  currentPin: z.string().optional(),
  newPin: z.string().optional(),
  duressPin: z.string().nullable().optional(), // null removes it
});

const digitsDiffer = (a: string, b: string) => [...a].filter((c, i) => c !== b[i]).length;

export async function POST(request: Request) {
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid" }, { status: 400 });
  const { elderId, currentPin, newPin, duressPin } = parsed.data;
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);

  const state = await getPinState(elderId);
  if (!state) return Response.json({ error: "Not found" }, { status: 404 });
  // Wrong tries here count towards the same lock as payments (no PIN-guessing
  // oracle), and the duress PIN counts as a wrong try (security review H2).
  const firstPin = !state.pin_hash && !isDemoId(elderId);
  if (!firstPin) {
    const check = await verifyPin(elderId, currentPin, { duressIsWrong: true });
    if (typeof check === "object") {
      return check.pinError === "locked"
        ? Response.json({ error: "Too many wrong PINs. Try again in a few minutes." }, { status: 423 })
        : Response.json({ error: "Your current PIN is not right." }, { status: 401 });
    }
  } else if (newPin === undefined) {
    return Response.json({ error: "Set your PIN first." }, { status: 400 });
  }

  const normal = newPin ?? currentPin ?? "";
  if (newPin !== undefined && !isPinFormat(newPin)) return Response.json({ error: "A PIN is 4 digits." }, { status: 400 });
  const patch: Record<string, string | null> = {};
  if (newPin !== undefined) {
    // A normal PIN equal to the safety PIN would turn every payment into a silent freeze.
    if (duressPin === undefined && state.duress_hash && (await checkPin(newPin, state.duress_hash))) {
      return Response.json({ error: "Your PIN can't be the same as your safety PIN." }, { status: 400 });
    }
    patch.pin_hash = hashPin(newPin);
  }
  if (duressPin === null) patch.duress_hash = null;
  else if (duressPin !== undefined) {
    if (!isPinFormat(duressPin)) return Response.json({ error: "A PIN is 4 digits." }, { status: 400 });
    if (digitsDiffer(duressPin, normal) < 2) {
      return Response.json({ error: "The safety PIN must differ from your normal PIN in at least 2 digits." }, { status: 400 });
    }
    patch.duress_hash = hashPin(duressPin);
  }
  await updateUser(elderId, patch);
  return Response.json({ ok: true, hasDuressPin: duressPin === null ? false : duressPin !== undefined || Boolean(state.duress_hash) });
}
