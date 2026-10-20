import { NextResponse, type NextRequest } from "next/server";
import { csrfBlocked, rateLimited } from "@/lib/guard";
import { updateSession } from "@/lib/supabase/proxy";

// Runs before every request: block cross-site writes (CSRF), rate-limit the
// API, then refresh the sign-in session. Security headers are in next.config.ts.
export async function proxy(request: NextRequest) {
  const csrf = csrfBlocked(request);
  if (csrf) return NextResponse.json({ error: csrf }, { status: 403 });

  const limited = rateLimited(request);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "retry-after": String(limited.wait) } },
    );
  }
  return updateSession(request);
}

export const config = {
  // Everything except static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
