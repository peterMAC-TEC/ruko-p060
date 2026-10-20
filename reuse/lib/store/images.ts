import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { rpc } from "./supabase";

// Photo storage (bill photos, payment screenshots). File mode keeps them in <repo>/data/uploads/<tabId>/;
// Supabase mode stores them in the locked `photos` table. Either way the app serves them from
// /api/tabs/<tabId>/files/<name>, and the unguessable tab id is the secret.
const DIR = process.env.UPLOADS_DIR ?? path.resolve(process.cwd(), "..", "data", "uploads");
const NAME = /^[A-Za-z0-9_-]{1,64}\.(jpg|png|webp)$/;
const TYPES: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const useSupabase = () => process.env.STORE === "supabase";

export const extensionFor = (mimeType: string) =>
  mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg";

/** Saves an image and returns the URL path the app serves it from. */
export async function saveImage(tabId: string, name: string, bytes: Buffer): Promise<string> {
  if (!NAME.test(name)) throw new Error("Bad image name");
  const type = TYPES[name.split(".").pop()!];
  if (useSupabase()) {
    await rpc("lc_put_photo", { p_tab: tabId, p_name: name, p_type: type, p_base64: bytes.toString("base64") });
  } else {
    await fs.mkdir(path.join(DIR, tabId), { recursive: true });
    await fs.writeFile(path.join(DIR, tabId, name), bytes);
  }
  return `/api/tabs/${tabId}/files/${name}`;
}

export async function readImage(tabId: string, name: string): Promise<{ bytes: Buffer; type: string } | null> {
  if (!NAME.test(name) || !/^[A-Za-z0-9_-]{10,64}$/.test(tabId)) return null;
  try {
    if (useSupabase()) {
      const rows = await rpc<{ content_type: string; base64: string }[]>("lc_get_photo", { p_tab: tabId, p_name: name });
      return rows?.[0] ? { bytes: Buffer.from(rows[0].base64, "base64"), type: rows[0].content_type } : null;
    }
    return { bytes: await fs.readFile(path.join(DIR, tabId, name)), type: TYPES[name.split(".").pop()!] };
  } catch {
    return null;
  }
}
