import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Onboarding } from "@/components/account/Onboarding";
import { getViewer } from "@/lib/auth";
import { listConsents } from "@/lib/store";

export const metadata: Metadata = { title: "Set up Ruko" };

export default function StartPage({ searchParams }: PageProps<"/start">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
          <Start searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Start({ searchParams }: Pick<PageProps<"/start">, "searchParams">) {
  const { next, role } = await searchParams;
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/start${safeNext ? `?next=${safeNext}` : ""}`)}`);

  const me = viewer.user;
  if (me) {
    // Already set up: go where they were heading, or home.
    if (me.role === "family") redirect(safeNext ?? "/family");
    if ((await listConsents(me.id)).length > 0) redirect(safeNext ?? "/app");
  }
  return (
    <Onboarding
      email={viewer.email}
      next={safeNext}
      presetRole={role === "family" ? "family" : me?.role === "elder" ? "elder" : undefined}
    />
  );
}
