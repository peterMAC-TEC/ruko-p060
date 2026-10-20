import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckApp } from "@/components/check/CheckApp";
import { elderForPage, trustedFor } from "@/lib/pages";
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
  return (
    <>
      <CheckApp
        elderId={page.elderId}
        demo={page.demo}
        trusted={practice ? undefined : trusted}
        elderName={elder?.name}
        sensitivity={elder?.sensitivity ?? "normal"}
      />
      {practice && <PracticeHomeButton />}
    </>
  );
}
