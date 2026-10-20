import "server-only";
import { flags } from "./flags";

// Every SMS and phone call goes through here. With MOCK_TELEPHONY on (the
// default) nothing leaves the server: the message is logged and the in-app
// alert carries the moment. Twilio is used only when it's switched on and
// configured. Untested until Twilio keys exist.

export type Channel = "sms" | "voice";
export interface NotifyResult {
  channel: Channel;
  sent: boolean;
  mocked: boolean;
  error?: string;
}

const twilio = {
  sid: process.env.TWILIO_ACCOUNT_SID,
  token: process.env.TWILIO_AUTH_TOKEN,
  from: process.env.TWILIO_FROM_NUMBER,
};
const twilioReady = Boolean(twilio.sid && twilio.token && twilio.from);

const escapeXml = (s: string) =>
  s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

export async function notify(to: { name: string; phone: string }, channel: Channel, text: string): Promise<NotifyResult> {
  if (flags.MOCK_TELEPHONY || !twilioReady || !to.phone) {
    console.log(`[mock ${channel}] to ${to.name} (${to.phone || "no phone"}): ${text}`);
    return { channel, sent: false, mocked: true };
  }

  const path = channel === "sms" ? "Messages.json" : "Calls.json";
  const body = new URLSearchParams({ To: to.phone.replace(/\s/g, ""), From: twilio.from! });
  if (channel === "sms") body.set("Body", text);
  // Said twice so it isn't missed if the phone is picked up late.
  else body.set("Twiml", `<Response><Say>${escapeXml(text)}</Say><Pause length="1"/><Say>${escapeXml(text)}</Say></Response>`);

  try {
    const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilio.sid}/${path}`, {
      method: "POST",
      headers: { authorization: `Basic ${Buffer.from(`${twilio.sid}:${twilio.token}`).toString("base64")}` },
      body,
    });
    if (!r.ok) return { channel, sent: false, mocked: false, error: `Twilio ${r.status}: ${await r.text()}` };
    return { channel, sent: true, mocked: false };
  } catch (e) {
    return { channel, sent: false, mocked: false, error: String(e) };
  }
}
