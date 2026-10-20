import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsApp } from "@/components/settings/SettingsApp";
import type { Purpose } from "@/lib/consent";
import { elderForPage, trustedFor } from "@/lib/pages";
import { getUser, listConsents } from "@/lib/store";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage({ searchParams }: PageProps<"/settings">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
          <Settings searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Settings({ searchParams }: Pick<PageProps<"/settings">, "searchParams">) {
  const { embed } = await searchParams;
  const page = await elderForPage(embed);
  if (!page) redirect("/login?next=/settings");
  const [user, consents, trusted] = await Promise.all([
    getUser(page.elderId),
    page.demo ? Promise.resolve([]) : listConsents(page.elderId),
    trustedFor(page.elderId),
  ]);
  return (
    <SettingsApp
      userId={page.elderId}
      demo={page.demo}
      signedIn={page.signedIn}
      initialSensitivity={user?.sensitivity ?? "normal"}
      initialConsents={consents.map((c) => c.scope as Purpose)}
      hasDuressPin={Boolean(user?.duress_hash)}
      trusted={trusted}
    />
  );
}
