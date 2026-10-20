import "server-only";
import type { TabBundle } from "../types";
import { fileRepository } from "./file";
import { supabaseRepository } from "./supabase";
import type { TabRepository } from "./types";

const ID_PATTERN = /^[A-Za-z0-9_-]{10,64}$/;

function repository(): TabRepository {
  const kind = process.env.STORE ?? "file";
  if (kind === "file") return fileRepository;
  if (kind === "supabase") return supabaseRepository;
  throw new Error(`Unknown STORE "${kind}". Use "file" or "supabase".`);
}

export async function getTab(tabId: string): Promise<TabBundle | null> {
  if (!ID_PATTERN.test(tabId)) return null;
  return repository().get(tabId);
}

export const listTabs = () => repository().list();

export async function createTab(bundle: TabBundle): Promise<void> {
  const ok = await repository().put({ ...bundle, version: 1 }, null);
  if (!ok) throw new Error("Tab already exists");
}

/** Read-modify-write with a retry if someone else wrote in between. */
export async function updateTab(
  tabId: string,
  change: (bundle: TabBundle) => void,
): Promise<TabBundle> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const current = await getTab(tabId);
    if (!current) throw new Error("Tab not found");
    const next = structuredClone(current);
    change(next);
    next.version = current.version + 1;
    if (await repository().put(next, current.version)) return next;
  }
  throw new Error("Tab is busy, try again");
}
