import "server-only";
import { ApiError, GoogleGenAI, type ThinkingLevel } from "@google/genai";
import { AiError, type AiProvider, type JsonRequest } from "./provider";

/** Start the backup model if the main one hasn't answered by then. */
const HEDGE_AFTER_MS = 12_000;

export function geminiProvider(): AiProvider {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey || !model) throw new AiError("not_configured", "GEMINI_API_KEY and GEMINI_MODEL must be set");
  // Optional: LOW keeps bill reading to a few seconds on the free tier.
  const thinkingLevel = (process.env.GEMINI_THINKING_LEVEL || undefined) as ThinkingLevel | undefined;
  // Optional backup model(s), comma-separated: used when the main one is busy (503) or slow.
  const backups = (process.env.GEMINI_FALLBACK_MODEL ?? "").split(",").map((m) => m.trim()).filter(Boolean);
  const ai = new GoogleGenAI({ apiKey });

  async function call(name: string, { system, prompt, images = [], jsonSchema }: JsonRequest, withThinking: boolean): Promise<unknown> {
    let text: string | undefined;
    try {
      const response = await ai.models.generateContent({
        model: name,
        contents: [
          {
            role: "user",
            parts: [...images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.base64 } })), { text: prompt }],
          },
        ],
        config: {
          systemInstruction: system,
          responseMimeType: "application/json",
          responseJsonSchema: jsonSchema,
          temperature: 0,
          ...(withThinking && thinkingLevel ? { thinkingConfig: { thinkingLevel } } : {}),
        },
      });
      text = response.text;
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) throw new AiError("rate_limited", `${name}: rate limit reached`);
      throw new AiError("unavailable", `${name}: ${err instanceof Error ? err.message.slice(0, 200) : "call failed"}`);
    }
    if (!text) throw new AiError("invalid_output", "Empty reply");
    try {
      return JSON.parse(text);
    } catch {
      throw new AiError("invalid_output", "Reply was not JSON");
    }
  }

  return {
    name: `gemini:${[model, ...backups].join("|")}`,
    /** Hedged: the main model first; the next backup starts on an error or after HEDGE_AFTER_MS. First answer wins. */
    generateJson(request) {
      const models = [model, ...backups];
      return new Promise((resolve, reject) => {
        let next = 0;
        let running = 0;
        let settled = false;
        const errors: AiError[] = [];
        let timer: ReturnType<typeof setTimeout> | undefined;

        const launch = () => {
          if (settled || next >= models.length) return;
          const name = models[next];
          const isMain = next === 0;
          next++;
          running++;
          clearTimeout(timer);
          if (next < models.length) timer = setTimeout(launch, HEDGE_AFTER_MS);
          call(name, request, isMain).then(
            (value) => {
              if (settled) return;
              settled = true;
              clearTimeout(timer);
              resolve(value);
            },
            (err: AiError) => {
              running--;
              errors.push(err);
              if (settled) return;
              if (next < models.length) return launch();
              if (running === 0) {
                settled = true;
                // Prefer the most actionable reason: a rate limit beats a generic outage.
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
