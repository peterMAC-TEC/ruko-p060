import "server-only";
import { AiError, type AiProvider, type JsonRequest } from "./provider";

// OpenRouter (OpenAI-style chat API). The model list is explicit in OPENROUTER_MODEL: a free model first, then (only
// if it is slow, busy or at its daily limit) one cheap paid model the owner approved. Nothing else can be called.
// Same contract as the Gemini provider: JSON in the shape the caller's schema asks for, or an AiError, and the
// phone's own phrase check stands whenever this is slow, busy or off. It never decides anything.

/** Start the next model if the first hasn't answered by then (a frightened person is waiting). */
const HEDGE_AFTER_MS = 8_000;
const CALL_TIMEOUT_MS = 28_000;
const URL = "https://openrouter.ai/api/v1/chat/completions";

/** Models that can read an image. The rest only get text. */
const SEES = (m: string) => /(gemma|gemini|vision|llava|pixtral)/i.test(m);

function parseJson(text: string): unknown {
  // Some models wrap JSON in a code fence or add a sentence around it.
  const t = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  try {
    return JSON.parse(t);
  } catch {
    const a = t.indexOf("{");
    const b = t.lastIndexOf("}");
    if (a >= 0 && b > a) return JSON.parse(t.slice(a, b + 1));
    throw new Error("not json");
  }
}

export function openrouterProvider(): AiProvider {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const models = (process.env.OPENROUTER_MODEL ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  if (!apiKey || models.length === 0) throw new AiError("not_configured", "OPENROUTER_API_KEY and OPENROUTER_MODEL must be set");
  const free = models;

  async function call(model: string, { system, prompt, media = [], jsonSchema }: JsonRequest): Promise<unknown> {
    if (media.some((m) => m.mimeType.startsWith("audio/"))) throw new AiError("unavailable", `${model}: audio is not supported`);
    if (media.length > 0 && !SEES(model)) throw new AiError("unavailable", `${model}: cannot read images`);
    const content: unknown[] = [
      ...media.map((m) => ({ type: "image_url", image_url: { url: `data:${m.mimeType};base64,${m.base64}` } })),
      { type: "text", text: `${prompt}\n\nReply with ONLY a JSON object that matches this JSON Schema, with no other text:\n${JSON.stringify(jsonSchema)}` },
    ];
    let res: Response;
    try {
      res = await fetch(URL, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json", "x-title": "Ruko" },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: 700,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: system },
            { role: "user", content },
          ],
        }),
        signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      });
    } catch {
      throw new AiError("unavailable", `${model}: no answer`);
    }
    if (res.status === 429) throw new AiError("rate_limited", `${model}: rate limit reached`);
    if (!res.ok) throw new AiError("unavailable", `${model}: HTTP ${res.status}`);
    const data = (await res.json().catch(() => null)) as { choices?: Array<{ message?: { content?: string } }> } | null;
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new AiError("invalid_output", "Empty reply");
    try {
      return parseJson(text);
    } catch {
      throw new AiError("invalid_output", "Reply was not JSON");
    }
  }

  return {
    name: `openrouter:${free.join("|")}`,
    /** Hedged: the first model first; the next starts on an error or after HEDGE_AFTER_MS. First answer wins. */
    generateJson(request) {
      return new Promise((resolve, reject) => {
        let next = 0;
        let running = 0;
        let settled = false;
        const errors: AiError[] = [];
        let timer: ReturnType<typeof setTimeout> | undefined;
        const launch = () => {
          if (settled || next >= free.length) return;
          const name = free[next++];
          running++;
          clearTimeout(timer);
          if (next < free.length) timer = setTimeout(launch, HEDGE_AFTER_MS);
          call(name, request).then(
            (value) => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              resolve(value);
            },
            (err: AiError) => {
              running--;
              errors.push(err instanceof AiError ? err : new AiError("unavailable", "call failed"));
              if (settled) return;
              if (next < free.length) return launch();
              if (running === 0) {
                settled = true;
                reject(errors.find((e) => e.reason === "invalid_output") ?? errors.find((e) => e.reason === "rate_limited") ?? errors[0]);
              }
            },
          );
        };
        launch();
      });
    },
  };
}
