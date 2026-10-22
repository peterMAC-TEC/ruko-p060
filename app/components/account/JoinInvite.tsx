"use client";

import { BellRing, Check, EyeOff } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";

// The invited family member sees exactly what joining means, then accepts or
// declines. Accepting is their own consent (DPDP).

type Info = { elderName?: string; relation?: string; error?: string };

export function JoinInvite({ token, signedIn, hasProfile }: { token: string; signedIn: boolean; hasProfile: boolean }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [done, setDone] = useState<"accepted" | "declined" | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const here = `/join/${token}`;

  useEffect(() => {
    fetch(`/api/invites?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then(setInfo)
      .catch(() => setInfo({ error: "Couldn't load this invite." }));
  }, [token]);

  const decide = async (decision: "accept" | "decline") => {
    setBusy(true);
    const r = await fetch("/api/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, decision }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error ?? "Something went wrong");
    setDone(d.status);
  };

  const first = info?.elderName?.split(" ")[0] ?? "Your family member";

  return (
    <div className="flex min-h-[100dvh] flex-col gap-6 bg-paper px-5 py-6 text-[19px] text-ink">
      <RukoWordmark />
      {!info && <div className="h-40 animate-pulse rounded-3xl bg-white/60" />}
      {info?.error && <p className="rounded-2xl bg-alarm-soft p-5 font-bold text-alarm">{info.error}</p>}

      {info && !info.error && !done && (
        <>
          <h1 className="display text-[40px] leading-[1.05]">
            {first} invited you to their Ruko Family
          </h1>
          <section className="space-y-4 rounded-3xl bg-white p-5 shadow-soft">
            <p className="flex gap-3">
              <BellRing className="mt-1 size-6 shrink-0 text-calm" />
              If Ruko sees signs that {first} is on a scam call, or {first} asks for help, you&apos;ll get an alert asking you to call.
            </p>
            <p className="flex gap-3">
              <Check className="mt-1 size-6 shrink-0 text-calm" />
              As the first to join, you may be asked to OK {first}&apos;s large payments (₹50,000 or more).
            </p>
            <p className="flex gap-3">
              <EyeOff className="mt-1 size-6 shrink-0 text-calm" />
              You&apos;ll never see {first}&apos;s calls, messages, bank balance or location.
            </p>
            <p className="text-[15px] text-ink-soft">
              Ruko keeps your name and phone number to send alerts. You can leave at any time.
            </p>
          </section>

          {!signedIn ? (
            <Link
              href={`/login?next=${encodeURIComponent(here)}`}
              className="flex min-h-16 items-center justify-center rounded-2xl bg-ink text-[21px] font-bold text-white"
            >
              Sign in to accept
            </Link>
          ) : !hasProfile ? (
            <Link
              href={`/start?role=family&next=${encodeURIComponent(here)}`}
              className="flex min-h-16 items-center justify-center rounded-2xl bg-ink text-[21px] font-bold text-white"
            >
              Add your name to accept
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => decide("accept")}
                disabled={busy}
                className="min-h-16 rounded-2xl bg-calm text-[21px] font-bold text-white disabled:opacity-60"
              >
                Accept and join
              </button>
              <button onClick={() => decide("decline")} disabled={busy} className="min-h-14 rounded-2xl border-2 border-ink/12 font-bold">
                No thanks
              </button>
            </div>
          )}
          {error && <p className="text-alarm">{error}</p>}
        </>
      )}

      {done === "accepted" && (
        <section className="rounded-3xl bg-calm-soft p-6">
          <h1 className="display text-[38px] leading-[1.05]">You&apos;re in {first}&apos;s Ruko Family</h1>
          <p className="mt-2 text-ink-soft">Keep Ruko&apos;s family page open and turn on the alert sound.</p>
          <Link href="/family" className="mt-5 flex min-h-14 items-center justify-center rounded-2xl bg-ink font-bold text-white">
            Open family alerts
          </Link>
        </section>
      )}
      {done === "declined" && <p className="rounded-3xl bg-white p-6 shadow-soft">You declined. Nothing about you was saved.</p>}
    </div>
  );
}
