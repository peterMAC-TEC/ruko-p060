// "Share to Ruko": the phone's Share button can hand Ruko a message, a link or a call transcript (from WhatsApp, SMS, the
// phone's own call-screening transcript, an email...). The text is only ever a suggestion for the "tell me what they
// said" box: Ruko shows it to the person, who taps Check themselves. Nothing is stored, and the text never goes in a URL
// (it travels in a short-lived cookie that the page reads once), so it stays out of server logs.

export const SHARED_COOKIE = "ruko_shared";
export const SHARED_MAX_CHARS = 1500;

/** Plain text from whatever the other app shared: title, text and link joined, control characters removed, capped. */
export function cleanShared(parts: Array<string | null | undefined>): string {
  const joined = parts
    .map((p) => (typeof p === "string" ? p : ""))
    // eslint-disable-next-line no-control-regex -- stripping control characters is the point
    .map((p) => p.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, " ").replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
  return joined.length > SHARED_MAX_CHARS ? joined.slice(0, SHARED_MAX_CHARS) : joined;
}
