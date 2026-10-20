"use client";

import { Mail } from "lucide-react";
import { useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { createAuthBrowserClient } from "@/lib/supabase/client";

// Email sign-in link (works today) and Google (works once Google is switched
// on in the Supabase dashboard). No passwords to forget.

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(linkError ? "That sign-in link didn't work or has expired. Send a new one." : "");

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  const sendLink = async () => {
    setBusy(true);
    setError("");
    const { error } = await createAuthBrowserClient().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo() },
    });
    setBusy(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  const google = async () => {
    setError("");
    const { error } = await createAuthBrowserClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setError("Google sign-in isn't switched on yet. Use the email link for now.");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper px-5 py-6 text-[19px] text-ink">
      <RukoWordmark />
      <div className="mt-10 flex flex-col gap-5">
        <h1 className="text-[30px] font-bold leading-tight tracking-tight">Sign in to Ruko</h1>

        {sent ? (
          <div className="rounded-3xl bg-calm-soft p-6">
            <Mail className="size-8 text-calm" />
            <p className="mt-3 text-[20px] font-bold">Check your email</p>
            <p className="mt-1 text-ink-soft">
              We sent a sign-in link to <b className="text-ink">{email}</b>. Open it on this phone.
            </p>
          </div>
        ) : (
          <>
            <p className="text-ink-soft">We&apos;ll email you a link. No password needed.</p>
            <label className="block">
              <span className="text-[17px] font-bold text-ink-soft">Your email</span>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 min-h-16 w-full rounded-2xl border-2 border-transparent bg-white px-5 text-[21px] shadow-soft outline-none focus:border-calm"
              />
            </label>
            <button
              onClick={sendLink}
              disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}
              className="min-h-16 rounded-2xl bg-ink text-[21px] font-bold text-white disabled:bg-ink/25"
            >
              {busy ? "Sending…" : "Email me a sign-in link"}
            </button>
            <div className="flex items-center gap-3 text-[15px] text-ink-soft">
              <span className="h-px flex-1 bg-ink/10" />
              or
              <span className="h-px flex-1 bg-ink/10" />
            </div>
            <button onClick={google} className="min-h-16 rounded-2xl border-2 border-ink/12 bg-white text-[20px] font-bold">
              Continue with Google
            </button>
          </>
        )}

        {error && <p className="text-alarm">{error}</p>}
        <p className="text-[15px] text-ink-soft">
          A family member can help you set up. Ruko never asks for your bank PIN, OTP or password.
        </p>
      </div>
    </div>
  );
}
