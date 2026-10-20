import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { TabBundle } from "../types";
import type { TabRepository } from "./types";

// Supabase store. Tables are locked (RLS, no policies); the server calls lc_* database functions that check
// SUPABASE_RPC_SECRET. So the app needs only the project's publishable key plus that server-only secret.
// Schema: docs/supabase-schema.sql.

let client: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key || !process.env.SUPABASE_RPC_SECRET) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_RPC_SECRET must be set for STORE=supabase");
  }
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}

/** Call one of our database functions with the server secret. */
export async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase().rpc(fn, { p_secret: process.env.SUPABASE_RPC_SECRET, ...args });
  if (error) throw new Error(`Supabase ${fn} failed: ${error.message}`);
  return data as T;
}

export const supabaseRepository: TabRepository = {
  get: async (tabId) => (await rpc<TabBundle | null>("lc_get", { p_id: tabId })) ?? null,
  put: (bundle, expectedVersion) =>
    rpc<boolean>("lc_put", { p_id: bundle.tab.id, p_version: bundle.version, p_data: bundle, p_expected: expectedVersion }),
  list: async () => (await rpc<TabBundle[]>("lc_list", {})) ?? [],
};
