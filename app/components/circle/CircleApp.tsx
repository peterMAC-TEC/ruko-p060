"use client";

import { BellRing, ChevronRight, KeyRound, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { RukoWordmark } from "@/components/brand/RukoMark";
import { FamilyStatus } from "@/components/elder/FamilyStatus";
import { Avatar, BackLink, BigButton, ElderShell, Field, Title } from "@/components/elder/ui";
import { useLang, type Strings } from "@/lib/i18n";
import type { CircleMember } from "@/lib/types";

// The elder's family circle: 1–3 trusted people, a family code word, and one
// big button that tells all of them to call right now.

type Step =
  | { kind: "home" }
  | { kind: "add" }
  | { kind: "invited"; name: string; link: string }
  | { kind: "code" }
  | { kind: "alerted"; riskEventId: string };

type PendingInvite = { id: string; name: string; phone: string; relation: string };

const RELATIONS = ["daughter", "son", "spouse", "friend", "neighbour"];
const MAX = 3;

export function CircleApp({ elderId, demo = false }: { elderId: string; demo?: boolean }) {
  const { t, toggle } = useLang();
  const [step, setStep] = useState<Step>({ kind: "home" });
  const [members, setMembers] = useState<CircleMember[]>([]);
  const [invites, setInvites] = useState<PendingInvite[]>([]);
  const [codeWordSet, setCodeWordSet] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Form state lives here so the pinned Save button can submit it.
  const [form, setForm] = useState({ name: "", phone: "+91 ", relation: "" });
  const [word, setWord] = useState("");

  const load = useCallback(async () => {
    const r = await fetch(`/api/circle?elderId=${elderId}`, { cache: "no-store" });
    if (!r.ok) return;
    const d = await r.json();
    setMembers(d.members);
    setInvites(d.invites ?? []);
    setCodeWordSet(d.codeWordSet);
  }, [elderId]);

  useEffect(() => {
    // Initial fetch of the circle.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch(() => {});
  }, [load]);

  const go = (s: Step) => {
    setError("");
    setConfirmRemove(null);
    setStep(s);
  };

  const post = async (url: string, body: object) => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ elderId, ...body }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Could not save");
      return d;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const alertNow = async () => {
    if (members.length === 0) return setError(t.noFamily);
    const d = await post("/api/alerts", {});
    if (d) go({ kind: "alerted", riskEventId: d.risk_event_id });
  };

  // Nobody's number is used until they accept their invite. In the demo
  // sandbox the invite is accepted on the spot.
  const saveMember = async () => {
    const name = form.name.trim();
    const d = await post("/api/circle/members", { ...form, name, phone: form.phone.trim() });
    if (!d) return;
    setForm({ name: "", phone: "+91 ", relation: "" });
    await load();
    if (d.link) go({ kind: "invited", name, link: `${window.location.origin}${d.link}` });
    else go({ kind: "home" });
  };

  const cancelInvite = async (inviteId: string) => {
    await fetch(`/api/circle/members?elderId=${elderId}&inviteId=${inviteId}`, { method: "DELETE" });
    load();
  };

  const saveWord = async () => {
    if (await post("/api/circle/codeword", { codeWord: word })) {
      setWord("");
      await load();
      go({ kind: "home" });
    }
  };

  const remove = async (memberId: string) => {
    await fetch(`/api/circle/members?elderId=${elderId}&memberId=${memberId}`, { method: "DELETE" });
    setConfirmRemove(null);
    load();
  };

  const formValid = form.name.trim() && /^\+?[\d\s-]{8,16}$/.test(form.phone.trim()) && form.relation;

  const action =
    step.kind === "home" ? (
      <BigButton variant="danger" icon={BellRing} disabled={busy} onClick={alertNow}>
        {busy ? t.alerting : t.alertFamily}
      </BigButton>
    ) : step.kind === "add" ? (
      <BigButton disabled={!formValid || busy} onClick={saveMember}>
        {t.save}
      </BigButton>
    ) : step.kind === "invited" ? (
      <BigButton variant="secondary" onClick={() => go({ kind: "home" })}>
        {t.done}
      </BigButton>
    ) : step.kind === "code" ? (
      <BigButton disabled={word.trim().length < 3 || busy} onClick={saveWord}>
        {t.save}
      </BigButton>
    ) : (
      <BigButton variant="secondary" onClick={() => go({ kind: "home" })}>
        {t.done}
      </BigButton>
    );

  return (
    <ElderShell t={t} brand={<RukoWordmark />} onToggleLang={toggle} action={action}>
      {step.kind === "home" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          {demo && (
            <p className="self-start rounded-full bg-gold-soft px-3 py-1 text-[14px] font-bold text-warn">{t.demoBadge}</p>
          )}
          <section className="emerald-card rounded-[28px] p-6 text-white shadow-lift">
            <ShieldCheck className="size-9" strokeWidth={2} />
            <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-tight">{t.protectedTitle}</h1>
            <p className="mt-1 text-[18px] text-white/80">{t.circleIntro}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-[15px] font-bold">
              <span className="rounded-full bg-white/12 px-3 py-1.5">{t.circleCount(members.length)}</span>
              <span className="rounded-full bg-white/12 px-3 py-1.5">
                {t.codeWord}: {codeWordSet ? "✓" : t.codeWordNotSet}
              </span>
            </div>
          </section>

          <section>
            <h2 className="text-[17px] font-bold text-ink-soft">{t.myFamily}</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {members.map((m) => (
                <li key={m.id} className="rounded-2xl bg-white p-4 shadow-soft">
                  <div className="flex items-center gap-4">
                    <Avatar name={m.name} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-bold">{m.name}</div>
                      <div className="truncate text-[15px] text-ink-soft">
                        {t.relations[m.relation] ?? m.relation} · {m.phone}
                      </div>
                      {m.trusted && (
                        <span className="mt-1 inline-block rounded-full bg-calm-soft px-2 py-0.5 text-[13px] font-bold text-calm">
                          {t.trustedPerson}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setConfirmRemove(confirmRemove === m.id ? null : m.id)}
                      className="flex size-12 items-center justify-center rounded-full text-ink/40 hover:bg-paper hover:text-alarm"
                      aria-label={`${t.remove} ${m.name}`}
                    >
                      <Trash2 className="size-5" />
                    </button>
                  </div>
                  {confirmRemove === m.id && (
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-ink/8 pt-4 animate-in fade-in duration-200">
                      <span className="text-[17px]">{t.removeConfirm(m.name.split(" ")[0])}</span>
                      <span className="flex gap-2">
                        <button onClick={() => setConfirmRemove(null)} className="min-h-11 rounded-full px-4 text-[16px] font-bold">
                          {t.keep}
                        </button>
                        <button
                          onClick={() => remove(m.id)}
                          className="min-h-11 rounded-full bg-alarm-soft px-4 text-[16px] font-bold text-alarm"
                        >
                          {t.yesRemove}
                        </button>
                      </span>
                    </div>
                  )}
                </li>
              ))}
              {invites.map((i) => (
                <li key={i.id} className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-ink/12 p-4">
                  <Avatar name={i.name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{i.name}</div>
                    <div className="text-[15px] text-warn">{t.pending}</div>
                  </div>
                  <button onClick={() => cancelInvite(i.id)} className="min-h-12 px-2 text-[15px] text-ink-soft underline">
                    {t.cancelInvite}
                  </button>
                </li>
              ))}
              {members.length + invites.length < MAX ? (
                <li>
                  <button
                    onClick={() => go({ kind: "add" })}
                    className="flex min-h-[76px] w-full items-center gap-4 rounded-2xl border-2 border-dashed border-calm/35 px-4 text-left font-bold text-calm"
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-calm-soft">
                      <Plus className="size-6" strokeWidth={2.4} />
                    </span>
                    {t.addPerson}
                  </button>
                </li>
              ) : (
                <li className="text-[16px] text-ink-soft">{t.maxReached}</li>
              )}
            </ul>
          </section>

          <button
            onClick={() => go({ kind: "code" })}
            disabled={members.length === 0}
            className="flex items-center gap-4 rounded-2xl bg-white p-4 text-left shadow-soft disabled:opacity-50"
          >
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold-soft text-warn">
              <KeyRound className="size-6" strokeWidth={2.2} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-bold">{t.codeWord}</span>
              <span className={`block text-[15px] ${codeWordSet ? "text-calm" : "font-bold text-warn"}`}>
                {codeWordSet ? `✓ ${t.codeWordSet}` : t.setCodeWord}
              </span>
            </span>
            <ChevronRight className="size-6 shrink-0 text-ink/30" />
          </button>

          {error && <p className="text-alarm">{error}</p>}
        </div>
      )}

      {step.kind === "add" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => go({ kind: "home" })} />
          <Title>{t.addPerson}</Title>
          <Field label={t.personName} value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoFocus />
          <Field label={t.personPhone} value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} inputMode="tel" />
          <RelationPicker t={t} value={form.relation} onChange={(r) => setForm({ ...form, relation: r })} />
          {error && <p className="text-alarm">{error}</p>}
        </div>
      )}

      {step.kind === "invited" && <InviteReady t={t} name={step.name} link={step.link} />}

      {step.kind === "code" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => go({ kind: "home" })} />
          <Title sub={t.codeWordWhy}>{t.codeWord}</Title>
          <Field label={t.codeWord} value={word} onChange={setWord} autoFocus />
          <p className="text-[16px] text-ink-soft">{t.codeWordHint}</p>
          {error && <p className="text-alarm">{error}</p>}
        </div>
      )}

      {step.kind === "alerted" && (
        <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <FamilyStatus riskEventId={step.riskEventId} t={t} />
          <section className="rounded-3xl bg-calm-soft p-5">
            <h2 className="flex items-center gap-2 text-[17px] font-bold text-calm">
              <ShieldCheck className="size-5" strokeWidth={2.4} />
              {t.realityTitle}
            </h2>
            <ul className="mt-3 space-y-2.5 text-[18px]">
              {t.reality.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </ElderShell>
  );
}

function RelationPicker({ t, value, onChange }: { t: Strings; value: string; onChange: (r: string) => void }) {
  return (
    <div>
      <span className="text-[17px] font-bold text-ink-soft">{t.relationQ}</span>
      <div className="mt-3 flex flex-wrap gap-2">
        {RELATIONS.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`min-h-12 rounded-full px-5 text-[18px] font-bold transition ${
              value === r ? "bg-calm text-white" : "bg-white text-ink shadow-soft"
            }`}
          >
            {t.relations[r]}
          </button>
        ))}
      </div>
    </div>
  );
}

function InviteReady({ t, name, link }: { t: Strings; name: string; link: string }) {
  const [copied, setCopied] = useState(false);
  const message = `I'm adding you to my Ruko Family, so you'll know if I'm ever on a scam call. Please open this link: ${link}`;
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <Title sub={t.inviteShareHint(name)}>{t.inviteSent}</Title>
      <p className="break-all rounded-2xl bg-white p-4 font-mono text-[15px] shadow-soft select-all">{link}</p>
      <BigButton
        variant="brand"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(link);
            setCopied(true);
          } catch {}
        }}
      >
        {copied ? t.copied : t.copyLink}
      </BigButton>
      <BigButton variant="secondary" href={`https://wa.me/?text=${encodeURIComponent(message)}`}>
        {t.shareWhatsApp}
      </BigButton>
    </div>
  );
}
