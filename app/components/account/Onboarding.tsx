"use client";

import {
  Check,
  HeartHandshake,
  Languages,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import {
  BackLink,
  BigButton,
  ElderShell,
  Field,
  StepDots,
  Title,
} from "@/components/elder/ui";
import { NOTICES, PURPOSES, type Purpose } from "@/lib/consent";
import { useLang } from "@/lib/i18n";

// First-run setup, under 90 seconds: language, who Ruko is for, a short profile,
// one plain-language consent per purpose on a single screen (DPDP: each one
// separate, none pre-ticked), optional teach-back, then a trusted person.

type Role = "elder" | "family";
type Step =
  "lang" | "role" | "profile" | "consent" | "teach" | "trusted" | "family-wait";

export function Onboarding({
  email,
  next,
  presetRole,
}: {
  email: string | null;
  next: string | null;
  presetRole?: Role;
}) {
  const router = useRouter();
  const { t, toggle, lang } = useLang();
  const [step, setStep] = useState<Step>(presetRole ? "profile" : "lang");
  const [role, setRole] = useState<Role>(presetRole ?? "elder");
  const [profile, setProfile] = useState({
    name: "",
    phone: "+91 ",
    birthYear: "",
  });
  const [choices, setChoices] = useState<Record<Purpose, boolean | undefined>>({
    family_alerts: undefined,
    transaction_risk: undefined,
    call_signals: undefined,
    drills: undefined,
  });
  const [teach, setTeach] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const notices = NOTICES[lang];

  const saveProfile = async () => {
    setBusy(true);
    setError("");
    const r = await fetch("/api/me", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        role,
        language: lang,
        birthYear: profile.birthYear ? Number(profile.birthYear) : undefined,
      }),
    });
    setBusy(false);
    if (!r.ok) return setError((await r.json()).error ?? "Could not save");
    if (role === "family") {
      // Family members join through the elder's invite link.
      if (next) router.push(next);
      else setStep("family-wait");
      return;
    }
    setStep("consent");
  };

  const saveConsents = async () => {
    setBusy(true);
    const grant = PURPOSES.filter((p) => choices[p] === true);
    const revoke = PURPOSES.filter((p) => choices[p] === false);
    const r = await fetch("/api/consents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant,
        revoke,
        lang,
        teachBack: teach.trim() || undefined,
      }),
    });
    setBusy(false);
    if (!r.ok) return setError("Could not save. Please try again.");
    if (next) router.push(next);
    else setStep("trusted");
  };

  const profileValid =
    profile.name.trim() &&
    /^\+?[\d\s-]{8,16}$/.test(profile.phone.trim()) &&
    (role === "family" || /^(19|20)\d{2}$/.test(profile.birthYear));
  const allAnswered = PURPOSES.every((p) => choices[p] !== undefined);

  const action =
    step === "profile" ? (
      <BigButton disabled={!profileValid || busy} onClick={saveProfile}>
        {busy ? "Saving…" : t.next}
      </BigButton>
    ) : step === "consent" ? (
      <BigButton disabled={!allAnswered} onClick={() => setStep("teach")}>
        {t.next}
      </BigButton>
    ) : step === "teach" ? (
      <BigButton variant="brand" disabled={busy} onClick={saveConsents}>
        {busy ? "Saving…" : teach.trim() ? "Finish" : "Skip and finish"}
      </BigButton>
    ) : undefined;

  return (
    <ElderShell
      t={t}
      brand={<RukoWordmark />}
      onToggleLang={toggle}
      action={action}
    >
      {step === "lang" && (
        <div className="flex flex-col gap-5">
          <Languages className="size-10 text-calm" strokeWidth={2} />
          <Title>Choose your language · अपनी भाषा चुनें</Title>
          {(["en", "hi"] as const).map((l) => (
            <button
              key={l}
              onClick={() => {
                if (l !== lang) toggle();
                setStep("role");
              }}
              className="flex min-h-20 items-center justify-between rounded-[24px] bg-white px-6 text-left text-[24px] font-bold shadow-soft active:scale-[0.99]"
            >
              {l === "en" ? "English" : "हिंदी"}
              {l === lang && (
                <Check className="size-6 text-calm" strokeWidth={2.6} />
              )}
            </button>
          ))}
          <p className="text-[16px] text-ink-soft">
            More Indian languages are coming. You can switch any time from the
            top of the screen.
          </p>
        </div>
      )}

      {step === "role" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => setStep("lang")} />
          <Title sub={email ? `Signed in as ${email}` : undefined}>
            Who is Ruko for?
          </Title>
          <RoleCard
            icon={ShieldCheck}
            title="Me"
            sub="I want Ruko to protect me from scam calls"
            onClick={() => {
              setRole("elder");
              setStep("profile");
            }}
          />
          <RoleCard
            icon={HeartHandshake}
            title="I'm protecting a family member"
            sub="I'll get an alert if they may be on a scam call"
            onClick={() => {
              setRole("family");
              setStep("profile");
            }}
          />
        </div>
      )}

      {step === "profile" && (
        <div className="flex flex-col gap-5">
          {!presetRole && <BackLink t={t} onBack={() => setStep("role")} />}
          <StepDots step={1} of={role === "elder" ? 3 : 1} />
          <Title>About you</Title>
          <Field
            label="Your name"
            value={profile.name}
            onChange={(v) => setProfile({ ...profile, name: v })}
            autoFocus
          />
          <Field
            label="Your phone number"
            value={profile.phone}
            onChange={(v) => setProfile({ ...profile, phone: v })}
            inputMode="tel"
          />
          {role === "elder" && (
            <Field
              label="Year you were born"
              value={profile.birthYear}
              onChange={(v) =>
                setProfile({
                  ...profile,
                  birthYear: v.replace(/\D/g, "").slice(0, 4),
                })
              }
              inputMode="numeric"
              placeholder="1954"
            />
          )}
          {role === "elder" && (
            <p className="text-[15px] text-ink-soft">
              Used only for the trusted-person rule: from age 70, large payments
              need your trusted person&apos;s OK.
            </p>
          )}
          {error && <p className="text-alarm">{error}</p>}
        </div>
      )}

      {step === "consent" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => setStep("profile")} />
          <StepDots step={2} of={3} />
          <Title sub="Choose each one separately. You can change your mind any time in Settings.">
            What Ruko may do
          </Title>
          {PURPOSES.map((p) => (
            <ConsentCard
              key={p}
              notice={notices[p]}
              value={choices[p]}
              onChange={(v) => setChoices({ ...choices, [p]: v })}
            />
          ))}
        </div>
      )}

      {step === "teach" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => setStep("consent")} />
          <StepDots step={3} of={3} />
          <Title sub="Optional. This helps make sure Ruko was explained clearly. A family member can write it for you.">
            In your own words, what will Ruko do for you?
          </Title>
          <textarea
            value={teach}
            onChange={(e) => setTeach(e.target.value)}
            rows={4}
            placeholder="For example: if a fake police officer calls me, Ruko will tell my daughter and stop big payments."
            className="w-full rounded-2xl border-2 border-transparent bg-white p-4 text-[20px] shadow-soft outline-none placeholder:text-ink/30 focus:border-calm"
          />
          {error && <p className="text-alarm">{error}</p>}
        </div>
      )}

      {step === "trusted" && (
        <div className="flex flex-col gap-5">
          <span className="flex size-16 items-center justify-center rounded-full bg-calm-soft text-calm">
            <Check className="size-8" strokeWidth={2.6} />
          </span>
          <Title sub="The person Ruko asks you to call when a scam is caught, and who gets an alert. Most people choose a son, daughter or close friend.">
            Last step: add a trusted person
          </Title>
          <BigButton
            variant="brand"
            icon={Users}
            onClick={() => router.push("/circle")}
          >
            {t.addTrusted}
          </BigButton>
          <button
            onClick={() => router.push("/app")}
            className="min-h-14 text-[18px] font-bold text-ink-soft underline underline-offset-4"
          >
            Later
          </button>
        </div>
      )}

      {step === "family-wait" && (
        <div className="flex flex-col gap-5">
          <span className="flex size-16 items-center justify-center rounded-full bg-calm-soft text-calm">
            <Check className="size-8" strokeWidth={2.6} />
          </span>
          <Title sub="Ask your family member to open Ruko, go to Ruko Family, and send you an invite. Open their link on this phone to join.">
            You&apos;re set up
          </Title>
        </div>
      )}
    </ElderShell>
  );
}

function RoleCard({
  icon: I,
  title,
  sub,
  onClick,
}: {
  icon: typeof ShieldCheck;
  title: string;
  sub: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 rounded-[24px] bg-white p-5 text-left shadow-soft active:scale-[0.99]"
    >
      <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-calm-soft text-calm">
        <I className="size-7" strokeWidth={2.2} />
      </span>
      <span>
        <span className="block text-[22px] font-bold leading-tight">
          {title}
        </span>
        <span className="block text-[16px] text-ink-soft">{sub}</span>
      </span>
    </button>
  );
}

function ConsentCard({
  notice,
  value,
  onChange,
}: {
  notice: (typeof NOTICES)["en"]["family_alerts"];
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  return (
    <section className="rounded-3xl bg-white p-4 shadow-soft">
      <h2 className="text-[19px] font-bold leading-snug">{notice.title}</h2>
      <details className="mt-1 text-[16px]">
        <summary className="cursor-pointer py-1 font-bold text-calm">
          What this means
        </summary>
        <p className="mt-1 text-[17px]">{notice.what}</p>
        <dl className="mt-2 space-y-1 text-[15px] text-ink-soft">
          <div>
            <dt className="inline font-bold text-ink">Shared: </dt>
            <dd className="inline">{notice.data}</dd>
          </div>
          <div>
            <dt className="inline font-bold text-calm">Never: </dt>
            <dd className="inline">{notice.never}</dd>
          </div>
        </dl>
      </details>
      {notice.required && (
        <p className="mt-2 text-[14px] text-warn">
          Ruko needs this to protect you.
        </p>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange(true)}
          className={`min-h-14 rounded-2xl text-[18px] font-bold ${value === true ? "bg-calm text-white" : "border-2 border-ink/12"}`}
        >
          Yes
        </button>
        <button
          onClick={() => onChange(false)}
          className={`min-h-14 rounded-2xl text-[18px] font-bold ${value === false ? "bg-ink text-white" : "border-2 border-ink/12"}`}
        >
          Not now
        </button>
      </div>
    </section>
  );
}
