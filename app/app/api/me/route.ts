import { z } from "zod";
import { getViewer, isDemoId } from "@/lib/auth";
import { createUser, deleteAuthLogin, deleteUserCompletely, listConsents, listEldersFor, updateUser } from "@/lib/store";
import { publicUser } from "@/lib/types";

// The signed-in person, their app account and their consents.
export async function GET() {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ signedIn: false });
  const user = viewer.user;
  const [consents, eldersIProtect] = user ? await Promise.all([listConsents(user.id), listEldersFor(user.id)]) : [[], []];
  return Response.json({
    signedIn: true,
    email: viewer.email,
    user: publicUser(user),
    consents: consents.map((c) => c.scope),
    protects: eldersIProtect.map((c) => c.elder_id),
  });
}

const Profile = z.object({
  name: z.string().trim().min(1).max(60),
  phone: z.string().trim().regex(/^\+?[\d\s-]{8,16}$/, "Phone number looks wrong"),
  role: z.enum(["elder", "family"]),
  birthYear: z.number().int().min(1900).max(new Date().getFullYear()).optional(),
  language: z.enum(["en", "hi", "kn", "ta", "te", "ml", "mr", "bn"]).default("en"),
});

// Onboarding: creates (or updates) the app account for this login.
export async function POST(request: Request) {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Please sign in." }, { status: 401 });
  const parsed = Profile.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "Invalid" }, { status: 400 });
  const p = parsed.data;
  const fields = { name: p.name, phone: p.phone, role: p.role, language: p.language, birth_year: p.birthYear ?? null };

  const user = viewer.user
    ? await updateUser(viewer.user.id, fields)
    : await createUser({ ...fields, auth_id: viewer.authId, email: viewer.email });
  return Response.json(publicUser(user), { status: viewer.user ? 200 : 201 });
}

const Settings = z.object({
  sensitivity: z.enum(["low", "normal", "high"]).optional(),
  language: z.enum(["en", "hi", "kn", "ta", "te", "ml", "mr", "bn"]).optional(),
  // Only for the demo sandbox, where no one is signed in.
  demoUserId: z.string().optional(),
});

// Settings: how readily STOP appears, and the language.
export async function PATCH(request: Request) {
  const parsed = Settings.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid settings" }, { status: 400 });
  const { demoUserId, ...patch } = parsed.data;
  if (demoUserId) {
    if (!isDemoId(demoUserId)) return Response.json({ error: "Not a demo person" }, { status: 403 });
    return Response.json(publicUser(await updateUser(demoUserId, patch)));
  }
  const viewer = await getViewer();
  if (!viewer?.user) return Response.json({ error: "Please sign in." }, { status: 401 });
  return Response.json(publicUser(await updateUser(viewer.user.id, patch)));
}

// "Delete my data": the account, family links, consents, payments, alerts and
// the sign-in itself. Anonymous metrics hold nothing that points back to them.
export async function DELETE() {
  const viewer = await getViewer();
  if (!viewer) return Response.json({ error: "Please sign in." }, { status: 401 });
  if (viewer.user) await deleteUserCompletely(viewer.user.id);
  await deleteAuthLogin(viewer.authId);
  return Response.json({ ok: true, deleted: true });
}
