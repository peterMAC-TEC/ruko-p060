import { canActAsElder, deny } from "@/lib/auth";
import { aiConfigured } from "@/lib/ai";
import { AiError, type AiMedia } from "@/lib/ai/provider";
import { readScamSigns, type ReadInput } from "@/lib/ai/scam";
import { loadPatternLibrary } from "@/lib/store";

// "Tell me what they said" / "Show me a photo": the AI reads a transcript, a
// voice clip or an image into warning signs with evidence. Nothing is stored:
// not the words, not the clip, not the image. The device then runs the Scam
// Radar on the signs (code decides) and reports the verdict to /api/check as
// usual. When the AI is busy or off, the device falls back to its own phrase
// check, so this route failing never leaves the person without an answer.

const MAX_BYTES = 4 * 1024 * 1024; // Vercel's request limit is 4.5 MB.
const TIMEOUT_MS = 30_000;
const AUDIO = /^audio\/(webm|ogg|mp4|mpeg|wav|aac|x-m4a)/;
const IMAGE = /^image\/(jpeg|png|webp|heic|heif)$/;

async function media(file: File, allowed: RegExp): Promise<AiMedia | null> {
  const type = file.type.split(";")[0];
  if (!allowed.test(type) || file.size === 0 || file.size > MAX_BYTES) return null;
  return { mimeType: type, base64: Buffer.from(await file.arrayBuffer()).toString("base64") };
}

const fail = (reason: string, status = 200) => Response.json({ ok: false, reason }, { status });

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return fail("bad_request", 400);
  const elderId = String(form.get("elderId") ?? "");
  if (!elderId) return fail("bad_request", 400);
  const allowed = await canActAsElder(elderId);
  if (!allowed.ok) return deny(allowed);
  if (!aiConfigured()) return fail("not_configured");

  let input: ReadInput | null = null;
  const transcript = form.get("transcript");
  const audio = form.get("audio");
  const image = form.get("image");
  if (typeof transcript === "string" && transcript.trim()) input = { transcript: transcript.trim().slice(0, 1500) };
  else if (audio instanceof File) {
    const m = await media(audio, AUDIO);
    if (m) input = { audio: m };
  } else if (image instanceof File) {
    const m = await media(image, IMAGE);
    if (m) input = { image: m };
  }
  if (!input) return fail("bad_input", 400);

  const lib = await loadPatternLibrary();
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const result = await Promise.race([
      readScamSigns(lib, input),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new AiError("unavailable", "timed out")), TIMEOUT_MS);
      }),
    ]);
    return Response.json({ ok: true, engine: "ai", ...result });
  } catch (err) {
    const reason = err instanceof AiError ? err.reason : "unavailable";
    console.error("[check/read]", reason, err instanceof Error ? err.message.slice(0, 200) : "");
    return fail(reason);
  } finally {
    clearTimeout(timer);
  }
}
