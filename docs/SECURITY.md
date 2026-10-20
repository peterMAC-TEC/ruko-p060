# Ruko security design and threat model

Ruko protects people who are under active attack by professional scam gangs, so it is designed on the assumption that **the attacker may be watching the victim's screen** (video call, screen share), **talking to the victim** the whole time, and **probing Ruko's own APIs**. This page covers:

- what Ruko defends against;
- how each defence works, with the file it's in;
- how each defence was tested;
- what is still open.

The research behind it is in `research/08-advanced-fraud-defence.md`.

---

## 1. The defences against the scam

| # | Defence | What it stops | Where | Tested by |
|---|---|---|---|---|
| D1 | **Threat engine**: Bayesian fusion of every signal into one live "scam in progress" estimate, mapped onto a 7-stage kill chain (contact → authority → fear → isolation → control → extraction → re-victimisation) | Signals that are weak alone (a risky number, a "yes" on the check, an odd payment) but damning together | `lib/threat.ts`, `lib/threat-server.ts` | `scripts/check-threat.ts` (15 scenarios) |
| D2 | **Graded response playbook**: nudge → STOP before paying (with a 30-second pause) → Money Lock + family alert + fraud desk → verified bank call-back → freeze everything (duress) | One warning alone isn't enough: victims of these scams have simply switched to another bank | `playbookFor`, `observe()` | API tests, browser |
| D3 | **Verified bank calls**: the bank signs a "we are calling you now" notice (Ed25519, 10-minute expiry, a nonce, a 4-digit code the real agent reads out); the phone verifies it with WebCrypto | "This is your bank" impersonation. A "bank" caller with no verified notice counts as evidence of a scam (RT15); a verified one counts against it (RT17) but **can never cancel** a safe-account or mule warning | `lib/callIntent.ts`, `lib/verifyIntent.ts`, `components/radar/VerifiedCall.tsx` | Signature verifies; a forged code fails; the browser verifies on the device |
| D4 | **Duress ("safety") PIN**: typed instead of the UPI PIN when forced. The screen shows a normal *processing* payment; the money is frozen, family get an urgent alert, the fraud desk sees "DURESS" at the top | Coerced payments while the scammer watches | `lib/pin.ts`, `duressPayment()` in `lib/payments.ts` | End-to-end API test |
| D5 | **Coercion signals** in the bank app: payee pasted in, leaving the app mid-payment, the amount typed in dictated chunks, a long pause before Pay. Counts and timings only, never what was typed. **Two or more** are needed to count, they're capped, and never "hard" on their own | Payments dictated by a caller | `lib/coercion.ts`, `useBehaviour` in `BankApp.tsx` | `scripts/check-rules.ts` |
| D6 | **Mule intelligence**: destination accounts compared by salted hash across customers ("2+ other customers were stopped paying this account") and community/bank reports; the fraud desk's Mule watch | The money's destination even when the call went unseen | `payeeIntel`, `muleClusters` in `lib/store.ts`, `/api/mules` | API test (a reported account in different letter case is still caught) |
| D7 | **Hold follows the person**: the protection hold spans every channel (UPI, NEFT, cash, FD) until family or the bank clears it; the elder can't clear it alone (a scammer would just tell them to) | Moving to another channel after one warning | `lib/rules.ts` | `scripts/check-rules.ts` (26 cases) |

## 2. Threat model (STRIDE) for the app itself

| Threat | Example against Ruko | Control | Status |
|---|---|---|---|
| **Spoofing** | A scammer claims to be the bank | D3 signed call notices; the code read out by the real agent | Done |
| | Someone takes over an elder's account | Supabase Auth (email link, PKCE); session refresh in `proxy.ts` | Done |
| | Someone uses the PIN-change API to guess PINs | Account-level lock after 3 wrong tries, shared by payments and PIN changes (works even if the IP is spoofed), plus a per-client limit | Done (fixed after testing) |
| **Tampering** | Someone edits the evidence after a hold | Per-person **hash chain** over every observation and action (`lib/integrity.ts`); `/api/threat` re-verifies it on every read; the fraud desk shows "Evidence chain intact · n · head" or "Tampered at entry #k" | Done; tampering was tested with a direct database edit |
| | The trial analysis is changed after the data is in | **Protocol fingerprint**: a SHA-256 over the scale, the outcomes, the allocation table and its seed, shown on `/results` (`lib/protocol.ts`) | Done |
| **Repudiation** | "Ruko never alerted us" | Every automatic action is a row in the hash chain, with its time and evidence | Done |
| **Information disclosure** | PIN hashes reach the browser | `publicUser()` strips them from `/api/me`; hashes are scrypt with a per-PIN salt | Done |
| | Phone numbers or accounts can be reversed from the community tables | Salted SHA-256; **fails closed** without `RUKO_HASH_SALT` in production | Done |
| | A scammer on the victim's phone spots the duress state | The customer view masks it as a normal *processing* payment; the balance reflects it; no alert is shown on the device | Done; see the residual risk |
| | Trial data is exposed when deployed | The lab opens without login only on localhost or private-network hosts; anywhere else it needs a researcher login | Done (tested with a public Host header) |
| **Denial of service** | Flooding reports, checks or PIN guesses | Sliding-window limits per client in `lib/guard.ts` (PIN 5/min, code word 5/min, payment 20/min, report 10/min, check 20/min) | Done (in memory, per instance) |
| **Elevation of privilege** | Cross-site requests riding a signed-in session | `proxy.ts` blocks writes when `Sec-Fetch-Site: cross-site` or the `Origin` host doesn't match; cookies are `SameSite=Lax` | Done |
| | Clickjacking, injected plugins, foreign scripts | CSP `frame-ancestors 'self'`, `object-src 'none'`, scripts and connections only from Ruko and its Supabase; `X-Frame-Options`, `nosniff`, `Permissions-Policy` (microphone only for Ruko itself), COOP, HSTS in production | Done (see the inline-script note) |

## 3. Data Ruko keeps, and doesn't

**Kept:**
- signal codes;
- tactic IDs with short non-identifying evidence ("stay_on_call: yes");
- payment metadata;
- salted hashes of numbers, accounts and reporters;
- trial participants as codes only (P01…).

**Never kept:**
- call audio;
- transcripts (what is said during a check is scored and discarded);
- typed keystrokes (only counts and timings);
- real OTPs, PINs or Aadhaar numbers (the practice PIN is stored only as an scrypt hash).

## 4. What is still open (be honest about these)

1. **Rotate the Supabase secret key before any deploy.** It was pasted in chat on 8 Oct. Only the user can do this, in the Supabase dashboard.
2. **CSP still allows inline scripts.** Pages prerender a static shell (Cache Components), so per-request nonces aren't possible yet. Next step: make the elder pages fully dynamic and switch to a nonce + `strict-dynamic` policy (see Next's CSP guide).
3. **Signing key.** In development the bank's Ed25519 key is generated per server process, so notices issued before a restart stop verifying. Production: `RUKO_BANK_SIGNING_KEY` from a KMS/HSM, with the public key pinned in the app.
4. **Rate limits are in memory** per server instance, and keyed by `X-Forwarded-For`, which only a trusted proxy (Vercel) should set. Production: a shared store (Redis or Upstash). The account-level PIN lock doesn't depend on the IP.
5. **The hash chain is tamper-*evident*, not tamper-*proof*.** Someone with database write access could rewrite the whole chain. Next step: publish each person's chain head periodically (e.g. in the fraud desk's daily report or to an external timestamping service) so a rewrite is detectable.
6. **Duress residual risk.** If a scammer demands to see the money arrive, the payment can't arrive. The facade buys time, and the family alert and bank call-back are what actually help. Research found no bank offering duress PINs, and false alarms mostly come from mistypes, hence the "differ in 2 or more digits" rule.
7. **The sandbox is open by design.** In `DEMO_MODE`, the demo people and trial practice accounts are an open sandbox with no real data. A public deployment should turn `DEMO_MODE` off, or keep it only on a demo subdomain.
8. **No row-level security policies yet.** RLS is on with no policies (deny-all for the browser key); all access goes through server routes with the service key.
9. **Incident response.** CERT-In requires reporting within 6 hours; the Data Protection Board within 72 hours (DPDP Rules 2025). Keep logs for at least 1 year.

## 5. How to check it yourself

```
npx tsx scripts/check-threat.ts    # threat engine scenarios
npx tsx scripts/check-rules.ts     # payment rules incl. mule, coercion, threat
npx tsx scripts/check-trial.ts     # trial statistics and allocation
```

In the browser:
1. Run a police-scam check on `/check`.
2. Try a payment on `/bank`: the 30-second pause comes first, then the PIN pad (1234).
3. Open `/console` for the threat panel, the evidence chain and **Call Kamala (verified)**.
4. On `/app`, the verified-call card appears with the same code.
5. Duress: pay with PIN **4321**.

## 6. Independent review (10 Oct) and what was fixed

An adversarial review of the new code found these issues. Each fix was re-tested against the live database.

| Finding | Severity | Fix | Verified |
|---|---|---|---|
| H1: the duress state leaked on the person's own phone (protection banner, a new warning, the pause screen, a visible hold on the next payment, `duress:true` in raw API responses unless the client asked for the masked view) | High | The **quiet customer view is the server default** (`seesTruth()` in `lib/auth.ts`); the truth needs `?view=staff` **and** authority (bank staff, a family member, or the demo sandbox). During a freeze: protection reads as off, the threat reads as `none`, nothing new shows in warnings, later payments also "process" silently, the payee is remembered as normal, and cancelling answers "already completed". No later hold can overwrite the duress reason (`lockMoney`) | Yes |
| H2: the duress PIN was an oracle and a way round the lock; wrong tries were counted non-atomically | High | When changing a PIN, the duress PIN counts as a wrong try; failures are counted with an atomic SQL function (`ruko_pin_fail`); scrypt checks are async | wrong, wrong, duress → locked; 6 parallel guesses → at most 3 counted before the lock |
| M1: the lab trusted the client-controlled `Host` / `X-Forwarded-Host` headers; `10.evil.com` passed | Medium | A production build needs a researcher login or the `RUKO_LAB_KEY` cookie (`/lab/unlock?key=`); development accepts only whole private IP addresses and never trusts `X-Forwarded-Host` | `10.evil.com`, `192.168.evil.com` and spoofed headers → 403 |
| M2: any live notice counted as "the real bank is calling" | Medium | Risk only drops after the person confirms the caller read out the right code; a wrong code is strong evidence (likelihood ratio 300 → high: Money Lock, family, fraud desk) | Yes |
| M3: rotating device ids could whitewash a number | Medium | A signed-out person's "not a scam" is stored as "unsure" | Yes |
| M4: any account accepted the PIN 1234 | Medium | Only sandbox (demo/practice) accounts have the practice PIN; real accounts must set a PIN first | Code path |
| M5: concurrent writes could fork the evidence chain; rows could be edited | Medium | Unique `(elder_id, prev_hash)` plus a retry on the new head; an `UPDATE` trigger makes rows append-only. Truncation still needs external anchoring (§4.5) | 12 concurrent writers → an intact chain of 12 |
| M6: anyone could end any call notice | Medium | `DELETE /api/callintent/[id]` only for bank staff or the demo sandbox's own notices | Code path |
| L2: the account normaliser stripped the letter "s"; an invite could be revoked by id without checking its owner; `/auth/signout` had no CSRF check; a new normal PIN could equal the safety PIN | Low | All fixed (CSRF now covers every non-GET request) | Yes |

**Accepted for the hackathon** (documented, not fixed):
- the demo sandbox is open by design (§4.7);
- rate limits are in memory per instance (§4.4);
- the bank's public key is fetched from Ruko's own origin rather than pinned in the app bundle (production: pin it).
