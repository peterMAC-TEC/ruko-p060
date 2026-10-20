import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ElderHome } from "@/components/home/ElderHome";
import { elderForPage, trustedFor } from "@/lib/pages";
import { getUser } from "@/lib/store";
import { isTrialAccountId } from "@/lib/trial";
import { PracticeHomeButton } from "@/components/lab/PracticePhone";

export const metadata: Metadata = { title: "Home" };

export default function ElderHomePage({ searchParams }: PageProps<"/app">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
          <Home searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Home({ searchParams }: Pick<PageProps<"/app">, "searchParams">) {
  const { embed } = await searchParams;
  const page = await elderForPage(embed);
  if (!page) redirect("/login?next=/app");
  const [elder, trusted] = await Promise.all([getUser(page.elderId), trustedFor(page.elderId)]);
  const practice = isTrialAccountId(page.elderId);
  if (practice && elder?.ruko_enabled === false) {
    return (
      <div className="flex min-h-[100dvh] flex-col justify-center gap-3 bg-paper px-6 text-ink">
        <h1 className="text-[28px] leading-tight font-bold">Ruko is paused for this practice call.</h1>
        <p className="text-[19px] text-ink-soft">Do whatever you would normally do.</p>
        <PracticeHomeButton />
      </div>
    );
  }
  return (
    <>
      <ElderHome elderId={page.elderId} name={practice ? "" : (elder?.name ?? "")} demo={page.demo} signedIn={page.signedIn} trusted={practice ? undefined : trusted} />
      {practice && <PracticeHomeButton />}
    </>
  );
}
