import { NextResponse } from "next/server";
import { cleanShared, SHARED_COOKIE } from "@/lib/share";

// The phone's Share sheet posts here (see app/manifest.ts, share_target). We keep the text for two minutes in a cookie
// scoped to /check, and send the person to the check with it already in the box. Never in the URL, never stored.
export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const text = cleanShared([form?.get("title") as string | null, form?.get("text") as string | null, form?.get("url") as string | null]);
  const res = NextResponse.redirect(new URL("/check", request.url), 303);
  if (text) {
    res.cookies.set(SHARED_COOKIE, encodeURIComponent(text), { path: "/check", maxAge: 120, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }
  return res;
}

// Someone opened /share directly: just go to the check.
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/check", request.url), 303);
}
