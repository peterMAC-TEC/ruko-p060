"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client for sign-in only. All data goes through the app's API routes.
export function createAuthBrowserClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
