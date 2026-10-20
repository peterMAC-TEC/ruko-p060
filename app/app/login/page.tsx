import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/account/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="min-h-[100dvh] bg-paper-2">
      <div className="mx-auto max-w-md shadow-xl">
        <Suspense fallback={<div className="min-h-[100dvh] bg-paper" />}>
          <Login searchParams={searchParams} />
        </Suspense>
      </div>
    </div>
  );
}

async function Login({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { next, error } = await searchParams;
  const safeNext = typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/start";
  return <LoginForm next={safeNext} linkError={error === "link"} />;
}
