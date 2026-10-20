import "server-only";
import { z } from "zod";
import { geminiProvider } from "./gemini";
import { AiError, DATA_ONLY, type AiImage, type AiProvider } from "./provider";

export function getProvider(): AiProvider {
  const name = process.env.AI_PROVIDER ?? "gemini";
  if (name === "gemini") return geminiProvider();
  throw new AiError("not_configured", `Unknown AI_PROVIDER "${name}"`);
}

/** JSON Schema for the model, from the same zod schema we validate with. */
export function jsonSchemaOf(schema: z.ZodType): object {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

/** Ask for JSON, validate it, retry once on invalid output, then give up with an AiError. */
export async function runTask<T extends z.ZodType>(
  schema: T,
  request: { prompt: string; images?: AiImage[] },
): Promise<z.infer<T>> {
  const provider = getProvider();
  const jsonSchema = jsonSchemaOf(schema);
  let lastIssue = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt = attempt === 0 ? request.prompt : `${request.prompt}\n\nYour previous reply did not match the schema (${lastIssue}). Reply again, strictly matching it.`;
    try {
      const reply = await provider.generateJson({ system: DATA_ONLY, prompt, images: request.images, jsonSchema });
      const parsed = schema.safeParse(reply);
      if (parsed.success) return parsed.data;
      lastIssue = parsed.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    } catch (err) {
      if (err instanceof AiError && err.reason === "invalid_output") {
        lastIssue = err.message;
        continue;
      }
      throw err;
    }
  }
  throw new AiError("invalid_output", `AI reply failed validation twice: ${lastIssue}`);
}
