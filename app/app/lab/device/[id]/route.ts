import { NextResponse } from "next/server";
import { labAllowed, labDenied } from "@/lib/lab";
import { PRACTICE_COOKIE } from "@/lib/pages";
import { getParticipant } from "@/lib/store";

// Open on the participant's phone (by the facilitator, at the start of the
// session): the phone then opens the practice home screen (practice bank,
// Ruko, Messages, Phone) for that participant. /lab/device/clear removes it.
export async function GET(request: Request, ctx: RouteContext<"/lab/device/[id]">) {
  if (!(await labAllowed())) return labDenied();
  const { id } = await ctx.params;
  const url = new URL(request.url);
  if (id === "clear") {
    const res = NextResponse.redirect(new URL("/", url));
    res.cookies.delete(PRACTICE_COOKIE);
    return res;
  }
  const p = await getParticipant(id);
  if (!p?.account_id) return Response.json({ error: "No practice account for this participant" }, { status: 404 });
  const to = url.searchParams.get("to") === "bank" ? "/bank" : "/phone";
  const res = NextResponse.redirect(new URL(to, url));
  res.cookies.set(PRACTICE_COOKIE, p.account_id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 12 });
  return res;
}
