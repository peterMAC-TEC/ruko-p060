import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CircleApp } from "@/components/circle/CircleApp";
import { elderForPage } from "@/lib/pages";

export const metadata: Metadata = { title: "Ruko Family" };

export default function CirclePage({ searchParams }: PageProps<"/circle">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
          <Circle searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Circle({ searchParams }: Pick<PageProps<"/circle">, "searchParams">) {
  const { embed } = await searchParams;
  const page = await elderForPage(embed);
  if (!page) redirect("/login?next=/circle");
  return <CircleApp elderId={page.elderId} demo={page.demo} />;
}
