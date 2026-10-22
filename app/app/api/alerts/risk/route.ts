import { canActAsElder, deny } from "@/lib/auth";
import { verifyDeviceToken } from "@/lib/device-token";
import { AlertBody } from "@/lib/risk-alert";
import { sendRiskAlert } from "@/lib/risk-alert-server";

// POST: a risky incoming number has been seen. The same alert whatever reported it: the Android app (with its pairing
// code in the x-ruko-device header), the number check, or the elder in the web app. Codes and a hash only: the body is
// strict, so audio, words from a call or a real phone number are refused.
export async function POST(request: Request) {
  const parsed = AlertBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid alert" }, { status: 400 });
  const body = parsed.data;
  if (body.source === "android") {
    if (!verifyDeviceToken(body.elderId, request.headers.get("x-ruko-device"))) return Response.json({ error: "This phone is not paired." }, { status: 401 });
  } else {
    const allowed = await canActAsElder(body.elderId);
    if (!allowed.ok) return deny(allowed);
  }
  return Response.json(await sendRiskAlert(body));
}
