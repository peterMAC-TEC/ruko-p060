import "server-only";
import { flags, hasSupabase } from "./flags";
import { DEMO_USER_IDS } from "./seed";
import { isTrialAccountId } from "./trial";
import { getUserByAuth, listCircle } from "./store";
import { createAuthClient } from "./supabase/server";
import type { User } from "./types";

// Who is asking, and may they act for this elder? The demo people (Kamala,
// Priya, the fraud desk) are an open sandbox in DEMO_MODE; everyone else's
// data needs a signed-in owner, a family member who accepted their invite, or
// bank staff.

export interface Viewer {
  authId: string;
  email: string | null;
  /** The app account linked to this login, once onboarding has created it. */
  user: User | undefined;
}

export async function getViewer(): Promise<Viewer | null> {
  if (!hasSupabase || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  const supabase = await createAuthClient();
  // getClaims verifies the token's signature; never trust getSession on the server.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;
  return { authId: claims.sub, email: (claims.email as string | undefined) ?? null, user: await getUserByAuth(claims.sub) };
}

/** The open sandbox: the demo people (in DEMO_MODE) and trial practice accounts, which hold no real data. */
export const isDemoId = (id: string) => (flags.DEMO_MODE && DEMO_USER_IDS.includes(id)) || isTrialAccountId(id);

export type Allowed = { ok: true; viewer: Viewer | null } | { ok: false; status: 401 | 403; error: string };

const denied = (viewer: Viewer | null): Allowed =>
  viewer?.user
    ? { ok: false, status: 403, error: "You don't have access to this person's Ruko." }
    : { ok: false, status: 401, error: "Please sign in." };

/** The elder themselves, their Ruko Family, or bank staff. */
export async function canActForElder(elderId: string): Promise<Allowed> {
  if (isDemoId(elderId)) return { ok: true, viewer: null };
  const viewer = await getViewer();
  const me = viewer?.user;
  if (!me) return denied(viewer);
  if (me.id === elderId || me.role === "fraud_analyst") return { ok: true, viewer };
  const { members } = await listCircle(elderId);
  return members.some((m) => m.id === me.id) ? { ok: true, viewer } : denied(viewer);
}

/** Only the elder themselves (e.g. changing their own family or consents). */
export async function canActAsElder(elderId: string): Promise<Allowed> {
  if (isDemoId(elderId)) return { ok: true, viewer: null };
  const viewer = await getViewer();
  return viewer?.user?.id === elderId ? { ok: true, viewer } : denied(viewer);
}

/** Only that family member (their alerts and approvals). */
export async function canActAsMember(memberId: string): Promise<Allowed> {
  if (isDemoId(memberId)) return { ok: true, viewer: null };
  const viewer = await getViewer();
  return viewer?.user?.id === memberId ? { ok: true, viewer } : denied(viewer);
}

/** Bank staff see every customer; everyone else sees only the demo sandbox. */
export async function isBankStaff() {
  const viewer = await getViewer();
  return viewer?.user?.role === "fraud_analyst";
}

export function deny(a: Extract<Allowed, { ok: false }>) {
  return Response.json({ error: a.error }, { status: a.status });
}

/**
 * Whether this request may see the truth about a person's protection (a
 * duress freeze, the full threat picture). By default everyone, including the
 * person's own phone, gets the quiet customer view, because a scammer may be
 * holding that phone. The truth needs ?view=staff *and* real authority: bank
 * staff, a family member in the person's Ruko Family (not the person), or the
 * demo sandbox. (Security review H1.)
 */
export async function seesTruth(elderId: string, request: Request): Promise<boolean> {
  if (new URL(request.url).searchParams.get("view") !== "staff") return false;
  if (await isBankStaff()) return true;
  if (isDemoId(elderId)) return true;
  const me = (await getViewer())?.user;
  if (!me || me.id === elderId) return false;
  const { members } = await listCircle(elderId);
  return members.some((m) => m.id === me.id);
}
