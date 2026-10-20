import "server-only";
import { cookies } from "next/headers";
import { getViewer } from "./auth";
import { flags } from "./flags";
import { DEMO_ELDER_ID, DEMO_FAMILY_ID } from "./seed";
import { listCircle, listEldersFor } from "./store";
import { isTrialAccountId } from "./trial";

/** Set on a trial participant's phone by /lab/device/[id]; points at their practice account. */
export const PRACTICE_COOKIE = "ruko_practice";

// Whose Ruko a page shows. A signed-in elder or family member sees their own;
// the guided demo (?embed=1) and signed-out visitors see the demo sandbox
// (Kamala and Priya), which every page labels as a demo.

export interface PageElder {
  elderId: string;
  demo: boolean;
  signedIn: boolean;
}

export async function elderForPage(embed?: string | string[]): Promise<PageElder | null> {
  if (embed === "1") return { elderId: DEMO_ELDER_ID, demo: true, signedIn: false };
  // A trial participant's phone shows their practice account, with no demo labels.
  const practice = (await cookies()).get(PRACTICE_COOKIE)?.value;
  if (practice && isTrialAccountId(practice)) return { elderId: practice, demo: false, signedIn: false };
  const viewer = await getViewer();
  const me = viewer?.user;
  if (me?.role === "elder") return { elderId: me.id, demo: false, signedIn: true };
  return flags.DEMO_MODE ? { elderId: DEMO_ELDER_ID, demo: true, signedIn: Boolean(viewer) } : null;
}

export interface PageMember {
  memberId: string;
  /** The elders this person protects (first one is shown). */
  elderIds: string[];
  demo: boolean;
}

export async function memberForPage(embed?: string | string[]): Promise<PageMember | null> {
  if (embed === "1") return { memberId: DEMO_FAMILY_ID, elderIds: [DEMO_ELDER_ID], demo: true };
  const viewer = await getViewer();
  const me = viewer?.user;
  if (me?.role === "family") {
    const rows = await listEldersFor(me.id);
    return { memberId: me.id, elderIds: rows.map((r) => r.elder_id), demo: false };
  }
  return flags.DEMO_MODE ? { memberId: DEMO_FAMILY_ID, elderIds: [DEMO_ELDER_ID], demo: true } : null;
}

/** The person to call from the STOP screen: the first trusted member, else the first member. */
export async function trustedFor(elderId: string): Promise<{ name: string; phone: string } | undefined> {
  const { members } = await listCircle(elderId);
  const m = members.find((x) => x.trusted) ?? members[0];
  return m ? { name: m.name, phone: m.phone } : undefined;
}
