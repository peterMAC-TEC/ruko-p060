import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client bound to the visitor's sign-in cookies. Uses the public key,
// so it can only do what the signed-in person may do; all data access still
// goes through lib/store.ts with authorisation checks in lib/auth.ts.
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, which can't write cookies. The
          // proxy refreshes the session instead.
        }
      },
    },
  });
}
