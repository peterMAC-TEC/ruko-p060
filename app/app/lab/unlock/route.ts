import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { LAB_COOKIE } from "@/lib/lab";

// /lab/unlock?key=…  Opens the trial lab on this device in a production
// deployment (RUKO_LAB_KEY), by setting an httpOnly cookie that holds only a
// hash of the key. The key itself never goes into links or logs here.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") ?? "";
  const expected = process.env.RUKO_LAB_KEY;
  const a = Buffer.from(createHash("sha256").update(key).digest("hex"));
  const b = Buffer.from(createHash("sha256").update(expected ?? "\u0000no-key").digest("hex"));
  if (!expected || !timingSafeEqual(a, b)) return Response.json({ error: "Wrong lab key" }, { status: 403 });
  const res = NextResponse.redirect(new URL("/lab", url));
  res.cookies.set(LAB_COOKIE, a.toString(), { httpOnly: true, sameSite: "strict", secure: url.protocol === "https:", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
