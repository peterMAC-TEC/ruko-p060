import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LineApp } from "@/components/line/LineApp";
import { elderForPage } from "@/lib/pages";
import { getUser } from "@/lib/store";

export const metadata: Metadata = { title: "Ruko Line" };

export default function LinePage({ searchParams }: PageProps<"/line">) {
  return (
    <div className="min-h-[100dvh] bg-white">
      <Suspense fallback={<div className="min-h-[100dvh] bg-white" />}>
        <Line searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function Line({ searchParams }: Pick<PageProps<"/line">, "searchParams">) {
  const { embed } = await searchParams;
  const page = await elderForPage(embed);
  if (!page) redirect("/login?next=/line");
  const elder = await getUser(page.elderId);
  return <LineApp elderId={page.elderId} owner={elder?.name.split(" ")[0] ?? "the owner"} />;
}
