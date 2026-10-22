import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckApp } from "@/components/check/CheckApp";
import { elderForPage, trustedFor } from "@/lib/pages";
import { SHARED_COOKIE, SHARED_MAX_CHARS } from "@/lib/share";
import { getUser } from "@/lib/store";
import { isTrialAccountId } from "@/lib/trial";
import { PracticeHomeButton } from "@/components/lab/PracticePhone";

export const metadata: Metadata = { title: "Is this a scam?" };

export default function CheckPage({ searchParams }: PageProps<"/check">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
          <Check searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Check({ searchParams }: Pick<PageProps<"/check">, "searchParams">) {
  const { embed } = await searchParams;
  const page = await elderForPage(embed);
  if (!page) redirect("/login?next=/check");
  const [elder, trusted] = await Promise.all([getUser(page.elderId), trustedFor(page.elderId)]);
  const practice = isTrialAccountId(page.elderId);
  // Something shared to Ruko from another app (see app/share/route.ts): offered in the "tell me what they said" box.
  const sharedRaw = (await cookies()).get(SHARED_COOKIE)?.value;
  let shared = "";
  try {
    shared = sharedRaw ? decodeURIComponent(sharedRaw).slice(0, SHARED_MAX_CHARS) : "";
  } catch {
    shared = "";
  }
  return (
    <>
      <CheckApp
        elderId={page.elderId}
        demo={page.demo}
        trusted={practice ? undefined : trusted}
        elderName={elder?.name}
        sensitivity={elder?.sensitivity ?? "normal"}
        sharedText={shared || undefined}
      />
      {practice && <PracticeHomeButton />}
    </>
  );
}
