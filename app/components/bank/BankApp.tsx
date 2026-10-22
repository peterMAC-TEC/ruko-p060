"use client";

import { ArrowDownLeft, ArrowUpRight, Banknote, Check, ChevronRight, Clock, Delete, Hourglass, Landmark, Lock, Phone, Plus, Send, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RukoMark } from "@/components/brand/RukoMark";
import { FamilyStatus } from "@/components/elder/FamilyStatus";
import { Avatar, BackLink, BigButton, ElderShell, Field, StepDots, Title } from "@/components/elder/ui";
import { inr, useLang } from "@/lib/i18n";
import { practiceEvent } from "@/lib/client";
import type { Channel, Payee, PaymentBehaviour, Transfer } from "@/lib/types";

// The elder's practice bank. One action per screen, buttons at the bottom
// where thumbs are, and a cooling-off screen that leads with what to do next.

type Step =
  | { kind: "home" }
  | { kind: "pick" }
  | { kind: "new" }
  | { kind: "amount" }
  | { kind: "confirm" }
  | { kind: "pause" }
  | { kind: "pin" }
  | { kind: "result"; transfer: Sent };

/** A just-sent transfer; held ones carry the risk event that alerted the family. */
type Sent = Transfer & { risk_event_id?: string };

export type Prefill = { name: string; account: string; amount: number; /** The live demo shortens the cooling-off so the story fits in three minutes. */ shortPause?: boolean };

const OPENING_BALANCE = 642180;
const PAUSE_SECONDS = 30; // like Google's in-call banking protection (docs/research/08)
const PAUSE_LEVELS = ["elevated", "high", "critical"];

/** Consented coercion signals: counts and timings only, never what was typed. */
function useBehaviour(step: Step["kind"]) {
  const b = useRef({ pastedPayee: false, appSwitches: 0, amountPauses: 0, amountEdits: 0, flowStart: 0, confirmAt: 0, lastDigitAt: 0 });
  const inFlow = ["pick", "new", "amount", "confirm", "pause", "pin"].includes(step);
  useEffect(() => {
    if (inFlow && !b.current.flowStart) b.current.flowStart = Date.now();
    if (step === "confirm") b.current.confirmAt = Date.now();
    if (step === "home") b.current = { pastedPayee: false, appSwitches: 0, amountPauses: 0, amountEdits: 0, flowStart: 0, confirmAt: 0, lastDigitAt: 0 };
  }, [step, inFlow]);
  useEffect(() => {
    if (!inFlow) return;
    const onVis = () => {
      if (document.visibilityState === "hidden") b.current.appSwitches++;
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [inFlow]);
  return {
    pasted: () => {
      b.current.pastedPayee = true;
    },
    amountTyped: (before: string, after: string) => {
      const now = Date.now();
      if (after.length > before.length) {
        if (b.current.lastDigitAt && now - b.current.lastDigitAt >= 1500) b.current.amountPauses++;
        b.current.lastDigitAt = now;
      } else if (after.length < before.length) b.current.amountEdits++;
    },
    snapshot: (): PaymentBehaviour => ({
      pastedPayee: b.current.pastedPayee,
      appSwitches: b.current.appSwitches,
      amountPauses: b.current.amountPauses,
      amountEdits: b.current.amountEdits,
      confirmDwellMs: b.current.confirmAt ? Date.now() - b.current.confirmAt : 0,
      flowMs: b.current.flowStart ? Date.now() - b.current.flowStart : 0,
    }),
  };
}
const QUICK_AMOUNTS = [500, 2000, 10000, 480000];

export function BankApp({
  elderId,
  familyName,
  familyPhone,
  prefill,
  rukoOn = true,
}: {
  /** Off for a trial's baseline call: no Ruko branding on the bank. */
  rukoOn?: boolean;
  elderId: string;
  familyName: string;
  familyPhone: string;
  /** Guided demo: opens straight on the confirm screen with these details. */
  prefill?: Prefill;
}) {
  const { t, toggle } = useLang();
  const [step, setStep] = useState<Step>(prefill ? { kind: "confirm" } : { kind: "home" });
  const [payees, setPayees] = useState<Payee[]>([]);
  const [history, setHistory] = useState<Transfer[]>([]);
  const [payee, setPayee] = useState(prefill ? { name: prefill.name, account: prefill.account } : { name: "", account: "" });
  const [amount, setAmount] = useState(prefill ? String(prefill.amount) : "");
  const [channel, setChannel] = useState<Channel>("upi");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [behaviour, setBehaviour] = useState<PaymentBehaviour | null>(null);
  const tracker = useBehaviour(step.kind);

  const load = useCallback(async () => {
    const [p, h] = await Promise.all([
      fetch(`/api/payees?elderId=${elderId}`).then((r) => r.json()),
      // The customer's own view: a duress payment appears as a normal pending one.
      fetch(`/api/transfers?elderId=${elderId}&view=customer`).then((r) => r.json()),
    ]);
    setPayees(p);
    setHistory(h);
  }, [elderId]);

  // Trial practice phones: log bank milestones for the call record.
  useEffect(() => {
    practiceEvent(elderId, "bank_opened");
  }, [elderId]);
  useEffect(() => {
    if (step.kind === "amount") practiceEvent(elderId, "payee_entered");
    if (step.kind === "confirm") practiceEvent(elderId, "amount_entered");
  }, [step.kind, elderId]);

  useEffect(() => {
    // Initial fetch of the practice account.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load().catch(() => {});
  }, [load]);

  const done = history.filter((x) => !x.seeded && (x.status === "completed" || x.status === "released"));
  // Closing a fixed deposit moves money into savings; everything else moves it out.
  const balance =
    OPENING_BALANCE +
    done.filter((x) => x.channel === "fd_break").reduce((n, x) => n + x.amount, 0) -
    done.filter((x) => x.channel !== "fd_break").reduce((n, x) => n + x.amount, 0);

  // Before the PIN: when Ruko's threat engine sees an active scam pattern, a
  // 30-second pause with the one fact that matters (Ruko on only).
  const beforePin = async () => {
    setBehaviour(tracker.snapshot());
    setError("");
    setPin("");
    if (rukoOn) {
      const r = await fetch(`/api/threat?elderId=${elderId}`, { cache: "no-store" }).catch(() => null);
      const level = r?.ok ? (await r.json()).level : null;
      if (level && PAUSE_LEVELS.includes(level)) return setStep({ kind: "pause" });
    }
    setStep({ kind: "pin" });
  };

  const send = async (enteredPin: string) => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/transfers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ elderId, amount: Number(amount), payee: payee.name, payeeAccount: payee.account, channel, pin: enteredPin, behaviour }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.status === 401) {
        setPin("");
        return setError(t.pinWrong(d.triesLeft ?? 0));
      }
      if (r.status === 423) {
        setPin("");
        return setError(t.pinLocked);
      }
      if (d.pinError === "unset") {
        setPin("");
        return setError(t.pinUnset);
      }
      if (!r.ok) throw new Error();
      setStep({ kind: "result", transfer: d });
      load();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const typePin = (digit: string) => {
    if (busy) return;
    const next = digit === "del" ? pin.slice(0, -1) : (pin + digit).slice(0, 4);
    setPin(next);
    if (next.length === 4) send(next);
  };

  const restart = () => {
    setPayee({ name: "", account: "" });
    setAmount("");
    setChannel("upi");
    setStep({ kind: "home" });
    load();
  };

  const choose = (p: { name: string; account: string }, via: Channel = "upi") => {
    setPayee(p);
    setChannel(via);
    setStep({ kind: "amount" });
  };

  const brand = (
    <span className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-ink text-[18px] font-bold text-gold">S</span>
      <span className="leading-tight">
        <span className="block text-[19px] font-bold tracking-tight">{t.bankName}</span>
        <span className="block text-[13px] text-ink-soft">{t.demoBank}</span>
      </span>
    </span>
  );

  const action =
    step.kind === "new" ? (
      <BigButton disabled={!payee.name.trim() || payee.account.trim().length < 3} onClick={() => setStep({ kind: "amount" })}>
        {t.next}
      </BigButton>
    ) : step.kind === "amount" ? (
      <BigButton disabled={!Number(amount)} onClick={() => setStep({ kind: "confirm" })}>
        {t.next}
      </BigButton>
    ) : step.kind === "confirm" ? (
      <BigButton variant="brand" icon={Send} disabled={busy} onClick={beforePin}>
        {t.confirm}
      </BigButton>
    ) : undefined;

  return (
    <ElderShell t={t} brand={brand} onToggleLang={toggle} action={action}>
      {step.kind === "home" && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-300">
          <section className="emerald-card relative overflow-hidden rounded-[28px] p-6 text-white shadow-lift">
            <div className="text-[16px] text-white/75">{t.account}</div>
            <div className="mt-4 text-[16px] text-white/75">{t.balance}</div>
            <div className="mt-1 text-[42px] font-bold leading-none tracking-tight tabular">{inr(balance)}</div>
            {rukoOn && (
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1.5 text-[15px] font-bold">
                <RukoMark className="size-[18px] text-white" />
                {t.protectedBy}
              </div>
            )}
          </section>

          <BigButton icon={Send} onClick={() => setStep({ kind: "pick" })}>
            {t.sendMoney}
          </BigButton>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => choose({ name: t.cashPayee, account: "branch" }, "cash")}
              className="flex min-h-16 items-center gap-2 rounded-2xl bg-white px-4 text-left text-[17px] font-bold shadow-soft"
            >
              <Banknote className="size-6 shrink-0 text-calm" />
              {t.withdrawCash}
            </button>
            <button
              onClick={() => choose({ name: t.fdPayee, account: "fd-7731" }, "fd_break")}
              className="flex min-h-16 items-center gap-2 rounded-2xl bg-white px-4 text-left text-[17px] font-bold shadow-soft"
            >
              <Landmark className="size-6 shrink-0 text-calm" />
              {t.closeFd}
            </button>
          </div>

          {payees.length > 0 && (
            <section>
              <h2 className="text-[17px] font-bold text-ink-soft">{t.payAgain}</h2>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {payees.slice(0, 4).map((p) => (
                  <button key={p.account} onClick={() => choose(p)} className="flex flex-col items-center gap-2 rounded-2xl py-2">
                    <Avatar name={p.name} size="size-14" />
                    <span className="line-clamp-1 text-[15px]">{p.name.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="text-[17px] font-bold text-ink-soft">{t.recent}</h2>
            <ul className="mt-3 divide-y divide-ink/6 rounded-3xl bg-white px-4 shadow-soft">
              {history.slice(0, 5).map((x) => (
                <li key={x.id} className="flex items-center gap-3 py-3.5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-paper text-ink-soft">
                    {x.channel === "fd_break" ? <ArrowDownLeft className="size-5" /> : <ArrowUpRight className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[18px]">{x.payee}</span>
                    <span className="block text-[14px] text-ink-soft">
                      {new Date(x.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {x.facade === "processing" && <span className="ml-2 rounded-full bg-paper px-2 py-0.5 font-bold text-ink-soft">{t.processingChip}</span>}
                      {x.status !== "completed" && x.status !== "released" && (
                        <span className="ml-2 rounded-full bg-warn-soft px-2 py-0.5 font-bold text-warn">{t.status[x.status] ?? x.status}</span>
                      )}
                    </span>
                  </span>
                  <span className="text-[18px] font-bold tabular">
                    {x.channel === "fd_break" ? "+" : "−"}
                    {inr(x.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      {step.kind === "pick" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => setStep({ kind: "home" })} />
          <StepDots step={1} of={3} />
          <Title>{t.sendTo}</Title>
          <ul className="flex flex-col gap-3">
            {payees.map((p) => (
              <li key={p.account}>
                <button
                  onClick={() => choose(p)}
                  className="flex min-h-[76px] w-full items-center gap-4 rounded-2xl bg-white px-4 text-left shadow-soft transition active:scale-[0.99]"
                >
                  <Avatar name={p.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-bold">{p.name}</span>
                    <span className="block truncate text-[15px] text-ink-soft">{p.account}</span>
                  </span>
                  <ChevronRight className="size-6 text-ink/30" />
                </button>
              </li>
            ))}
            <li>
              <button
                onClick={() => setStep({ kind: "new" })}
                className="flex min-h-[76px] w-full items-center gap-4 rounded-2xl border-2 border-dashed border-calm/35 px-4 text-left font-bold text-calm"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-calm-soft">
                  <Plus className="size-6" strokeWidth={2.4} />
                </span>
                {t.newPerson}
              </button>
            </li>
          </ul>
        </div>
      )}

      {step.kind === "new" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => setStep({ kind: "pick" })} />
          <StepDots step={1} of={3} />
          <Title>{t.newPerson}</Title>
          <Field label={t.payeeName} value={payee.name} onChange={(v) => setPayee({ ...payee, name: v })} autoFocus />
          <div onPasteCapture={tracker.pasted}>
            <Field label={t.payeeUpi} value={payee.account} onChange={(v) => setPayee({ ...payee, account: v })} placeholder="name@bank" />
          </div>
        </div>
      )}

      {step.kind === "amount" && (
        <div className="flex flex-col gap-5">
          <BackLink t={t} onBack={() => setStep({ kind: "pick" })} />
          <StepDots step={2} of={3} />
          <Title>{t.amount}</Title>
          <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
            <Avatar name={payee.name} size="size-11" />
            <span className="min-w-0">
              <span className="block truncate font-bold">{payee.name}</span>
              <span className="block truncate text-[15px] text-ink-soft">{payee.account}</span>
            </span>
          </div>
          <label className="flex items-baseline justify-center gap-1 border-b-2 border-ink/10 pb-3 focus-within:border-calm">
            <span className="text-[40px] font-bold text-ink/40">₹</span>
            <input
              inputMode="numeric"
              autoFocus
              value={amount ? Number(amount).toLocaleString("en-IN") : ""}
              onChange={(e) => {
                const next = e.target.value.replace(/[^\d]/g, "").slice(0, 8);
                tracker.amountTyped(amount, next);
                setAmount(next);
              }}
              placeholder="0"
              className="w-full min-w-0 bg-transparent text-center text-[48px] font-bold tracking-tight outline-none tabular placeholder:text-ink/20"
              aria-label={t.amount}
            />
          </label>
          <div className="flex flex-wrap justify-center gap-2">
            {QUICK_AMOUNTS.map((a) => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className={`min-h-11 rounded-full px-4 text-[17px] font-bold tabular transition ${
                  Number(amount) === a ? "bg-calm text-white" : "bg-white text-ink shadow-soft"
                }`}
              >
                {inr(a)}
              </button>
            ))}
          </div>
        </div>
      )}

      {step.kind === "confirm" && (
        <div className="flex flex-col gap-5">
          {!prefill && <BackLink t={t} onBack={() => setStep({ kind: "amount" })} />}
          <StepDots step={3} of={3} />
          <Title>{t.youSend}</Title>
          <section className="rounded-3xl bg-white p-6 shadow-soft animate-in fade-in zoom-in-95 duration-300">
            <div className="text-[46px] font-bold leading-none tracking-tight tabular">{inr(Number(amount))}</div>
            <dl className="mt-6 space-y-5 border-t border-ink/8 pt-5">
              <div>
                <dt className="text-[15px] font-bold text-ink-soft">{t.toLabel}</dt>
                <dd className="mt-2 flex min-w-0 items-center gap-3">
                  <Avatar name={payee.name} size="size-11" />
                  <span className="min-w-0">
                    <span className="block font-bold leading-snug">{payee.name}</span>
                    <span className="block break-all text-[15px] text-ink-soft">{payee.account}</span>
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-[15px] font-bold text-ink-soft">{t.fromLabel}</dt>
                <dd className="mt-1 text-[18px]">{t.account}</dd>
              </div>
            </dl>
          </section>
          {error && <p className="text-alarm">{error}</p>}
        </div>
      )}

      {step.kind === "pause" && (
        <PauseScreen
          seconds={prefill?.shortPause ? 8 : PAUSE_SECONDS}
          familyName={familyName}
          familyPhone={familyPhone}
          onContinue={() => setStep({ kind: "pin" })}
          onStop={() => {
            practiceEvent(elderId, "cancel_pressed", "pause");
            restart();
          }}
        />
      )}

      {step.kind === "pin" && (
        <div className="flex flex-col items-center gap-5">
          <div className="self-start">
            <BackLink t={t} onBack={() => setStep({ kind: "confirm" })} />
          </div>
          <Lock className="size-8 text-calm" strokeWidth={2.2} />
          <h1 className="text-[26px] font-bold">{t.pinTitle}</h1>
          <p className="text-[17px] text-ink-soft tabular">
            {inr(Number(amount))} → {payee.name}
          </p>
          <div className="flex gap-4" aria-label={`${pin.length} of 4 digits entered`}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className={`size-5 rounded-full border-2 border-ink/40 ${i < pin.length ? "bg-ink" : ""}`} />
            ))}
          </div>
          {error && <p className="text-center text-[17px] font-bold text-alarm">{error}</p>}
          <div className="grid w-full max-w-[320px] grid-cols-3 gap-3">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, i) =>
              k === "" ? (
                <span key={i} />
              ) : (
                <button
                  key={i}
                  onClick={() => typePin(k)}
                  disabled={busy}
                  aria-label={k === "del" ? "Delete" : k}
                  className="flex min-h-[64px] items-center justify-center rounded-2xl bg-white text-[28px] font-bold shadow-soft active:scale-95 disabled:opacity-50"
                >
                  {k === "del" ? <Delete className="size-7" /> : k}
                </button>
              ),
            )}
          </div>
          <p className="text-[15px] text-ink-soft">{busy ? t.sending : t.pinHint}</p>
        </div>
      )}

      {step.kind === "result" && (
        <Result initial={step.transfer} familyName={familyName} familyPhone={familyPhone} onDone={restart} />
      )}
    </ElderShell>
  );
}

function Result({
  initial,
  familyName,
  familyPhone,
  onDone,
}: {
  initial: Sent;
  familyName: string;
  familyPhone: string;
  onDone: () => void;
}) {
  const { t } = useLang();
  const [tr, setTr] = useState<Transfer>(initial);
  const riskEventId = initial.risk_event_id;
  const [now, setNow] = useState(() => Date.now());

  // While held, watch for the fraud desk's decision and tick the countdown.
  useEffect(() => {
    if (tr.status !== "held") return;
    const id = setInterval(async () => {
      setNow(Date.now());
      const all: Transfer[] = await fetch(`/api/transfers?elderId=${tr.elder_id}&view=customer`).then((r) => r.json());
      const fresh = all.find((x) => x.id === tr.id);
      if (fresh && fresh.status !== tr.status) setTr(fresh);
    }, 2000);
    return () => clearInterval(id);
  }, [tr.id, tr.status, tr.elder_id]);

  const cancel = async () => {
    practiceEvent(tr.elder_id, "cancel_pressed");
    const r = await fetch(`/api/transfers/${tr.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    });
    if (r.ok) setTr(await r.json());
  };

  const amt = inr(tr.amount);
  const callFamily = familyPhone ? `tel:${familyPhone.replace(/\s/g, "")}` : undefined;

  if (tr.facade === "processing") {
    return (
      <Outcome icon="ok" title={t.processingTitle} body={t.processingBody}>
        <BigButton onClick={onDone}>{t.done}</BigButton>
      </Outcome>
    );
  }
  if (tr.status === "completed" || tr.status === "released") {
    return (
      <Outcome icon="ok" title={tr.status === "released" ? t.releasedTitle : t.sentTitle} body={t.sentBody(amt, tr.payee)}>
        <BigButton onClick={onDone}>{t.done}</BigButton>
      </Outcome>
    );
  }
  if (tr.status === "cancelled") {
    return (
      <Outcome icon="shield" title={t.cancelledTitle} body={t.cancelledBody}>
        <BigButton onClick={onDone}>{t.done}</BigButton>
      </Outcome>
    );
  }
  if (tr.status === "blocked") {
    return (
      <Outcome icon="shield" title={t.blockedTitle} body={t.blockedBody}>
        {riskEventId && <FamilyStatus riskEventId={riskEventId} t={t} />}
        <BigButton variant="brand" icon={Phone} href={callFamily}>
          {t.callFamily(familyName)}
        </BigButton>
        <BigButton variant="secondary" onClick={onDone}>
          {t.done}
        </BigButton>
      </Outcome>
    );
  }

  // Held: the cooling-off screen. What to do comes first; why comes after.
  const minsLeft = tr.hold_until ? Math.max(0, Math.ceil((Date.parse(tr.hold_until) - now) / 60_000)) : 0;
  const reasonCodes = [...new Set(tr.reasons.map((r) => (r.code === "amount_large" ? "amount_extreme" : r.code)))].filter(
    (c) => c !== "trusted_person_required",
  );

  return (
    <div className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="rounded-[28px] bg-warn-soft p-6">
        <div className="flex items-center gap-2 text-[16px] font-bold text-warn">
          <Clock className="size-5" strokeWidth={2.4} />
          <span className="tabular">{t.holdLeft(minsLeft)}</span>
        </div>
        <p className="mt-3 text-[15px] font-semibold tracking-[0.14em] uppercase text-warn">{t.pauseKicker}</p>
        <h1 className="mt-1 text-[30px] font-bold leading-[1.15] tracking-tight">{t.pausedTitle}</h1>
        <p className="mt-2 text-[19px]">{t.pausedBody(amt, tr.payee)}</p>
      </section>

      {tr.needs_approval && <ApprovalStatus transferId={tr.id} t={t} />}
      {riskEventId && <FamilyStatus riskEventId={riskEventId} t={t} />}

      <div className="flex flex-col gap-3">
        <BigButton variant="brand" icon={Phone} href={callFamily}>
          {t.callFamily(familyName)}
        </BigButton>
        <BigButton variant="secondary" icon={X} onClick={cancel}>
          {t.cancelPayment}
        </BigButton>
      </div>

      {reasonCodes.length > 0 && (
      <section className="rounded-3xl bg-white p-5 shadow-soft">
        <h2 className="text-[17px] font-bold text-ink-soft">{t.why}</h2>
        <ul className="mt-3 space-y-3">
          {reasonCodes.map((c) => (
            <li key={c} className="flex gap-3">
              <span className="mt-2.5 size-2 shrink-0 rounded-full bg-warn" />
              <span className="text-[18px]">{t.reasons[c] ?? c}</span>
            </li>
          ))}
        </ul>
      </section>
      )}

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

      <p className="text-[16px] text-ink-soft">{t.waitNote}</p>
    </div>
  );
}

function Outcome({
  icon,
  title,
  body,
  children,
}: {
  icon: "ok" | "shield";
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 pt-6">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-calm text-white shadow-lift animate-in zoom-in-50 duration-500">
          {icon === "ok" ? <Check className="size-10" strokeWidth={3} /> : <ShieldCheck className="size-10" strokeWidth={2.4} />}
        </span>
        <h1 className="mt-6 text-[30px] font-bold leading-[1.15] tracking-tight">{title}</h1>
        <p className="mt-2 text-[19px] text-ink-soft">{body}</p>
      </div>
      <div className="mt-auto flex flex-col gap-3">{children}</div>
    </div>
  );
}

// "Waiting for Priya's OK" → "Priya said yes / no", live.
function ApprovalStatus({ transferId, t }: { transferId: string; t: ReturnType<typeof useLang>["t"] }) {
  const [rows, setRows] = useState<Array<{ id: string; status: string; member_name?: string }>>([]);
  useEffect(() => {
    let stop = false;
    const load = async () => {
      try {
        const r = await fetch(`/api/approvals?transferId=${transferId}`, { cache: "no-store" });
        if (!stop && r.ok) setRows(await r.json());
      } catch {}
    };
    load();
    const id = setInterval(load, 2000);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [transferId]);
  if (rows.length === 0) return null;
  return (
    <section className="rounded-3xl bg-white p-5 shadow-soft" aria-live="polite">
      {rows.map((a) => {
        const name = a.member_name?.split(" ")[0] ?? "";
        return (
          <p key={a.id} className="flex items-center gap-3 text-[19px] font-bold">
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                a.status === "approved" ? "bg-calm text-white" : a.status === "declined" ? "bg-alarm-soft text-alarm" : "bg-gold-soft text-warn"
              }`}
            >
              {a.status === "approved" ? <Check className="size-5" strokeWidth={2.6} /> : a.status === "declined" ? <X className="size-5" strokeWidth={2.6} /> : <Hourglass className="size-5" />}
            </span>
            {a.status === "approved" ? t.approvedBy(name) : a.status === "declined" ? t.declinedBy(name) : t.waitingApproval(name)}
          </p>
        );
      })}
      <p className="mt-3 text-[16px] text-ink-soft">{t.approvalWhy}</p>
    </section>
  );
}

/** The 30-second pause before paying while a scam pattern is active. Calm, one fact, no blame. */
function PauseScreen({
  familyName,
  familyPhone,
  onContinue,
  onStop,
  seconds = PAUSE_SECONDS,
}: {
  familyName: string;
  familyPhone: string;
  onContinue: () => void;
  onStop: () => void;
  seconds?: number;
}) {
  const { t } = useLang();
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const id = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(id);
  }, [left]);
  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-300">
      <span className="flex size-16 items-center justify-center rounded-full bg-warn-soft text-warn">
        <Hourglass className="size-8" strokeWidth={2.2} />
      </span>
      <Title sub={t.pauseBody}>{t.pauseTitle}</Title>
      <p className="rounded-3xl bg-white p-5 text-[22px] leading-snug font-bold shadow-soft">{t.pauseQ}</p>
      <p className="text-[19px]">{t.pauseFact}</p>
      {familyPhone && (
        <BigButton variant="brand" icon={Phone} href={`tel:${familyPhone.replace(/\s/g, "")}`}>
          {t.pauseCall(familyName)}
        </BigButton>
      )}
      <BigButton variant="primary" icon={X} onClick={onStop}>
        {t.pauseStop}
      </BigButton>
      <button
        onClick={onContinue}
        disabled={left > 0}
        className="min-h-14 rounded-2xl text-[17px] font-bold text-ink-soft underline underline-offset-4 disabled:no-underline disabled:opacity-60"
      >
        {left > 0 ? t.pauseWait(left) : t.pauseContinue}
      </button>
    </div>
  );
}
