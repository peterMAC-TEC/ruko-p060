# Ruko Guard: bank integration spec

**Status, said plainly: no real bank is connected.** This is the integration contract, and a working mock bank (`/bank`) that uses it the way a real bank would. Ruko cannot stop a real UPI PIN entry in a real bank app today. The real-money stop depends on a bank or payment app calling Ruko Guard.

## What it is

A small, stateless decision API a bank or UPI app can call **before it moves money**. The bank sends a few facts; Ruko answers `allow`, `delay`, `require_trusted_person` or `block`, with plain reason codes. It stores nothing from the assess call, and the request carries no names, accounts or phone numbers.

The defaults follow the **RBI discussion paper (reported April 2026)**. **That paper is a draft, not a final rule**, and the exact thresholds come from press summaries, so every threshold below is a constant the bank can change. Rules say where they come from: `rbi_draft`, `ruko_own` (Ruko's choice), or `customer_choice`.

## Authentication

Header `x-ruko-bank-key: <key>`, matching the server's `RUKO_BANK_API_KEY`. With no key configured, only the demo sandbox is open (`DEMO_MODE`). A real deployment must set the key.

## 1. Assess a payment

`POST /api/guard/assess`

```json
{
  "customerAgeBand": "70_plus",        // "under_60" | "60_69" | "70_plus"
  "amountInr": 50000,
  "newPayee": true,
  "merchant": false,                   // optional; merchant payments are excluded from the RBI-draft rules
  "rukoFlag": true,                    // Ruko flagged a risky call for this customer recently (Money Lock on)
  "payeeRisk": { "reports": 0, "victims": 0 },   // optional; what is known about the destination account
  "hasTrustedPerson": true,
  "paymentsPaused": false              // the customer's kill switch
}
```

Response:

```json
{
  "decision": "require_trusted_person",   // allow | delay | require_trusted_person | block
  "delaySeconds": null,                   // set for "delay" (the cooling-off), otherwise null
  "reasons": [
    { "code": "senior_trusted_person", "basis": "rbi_draft", "label": "Customers aged 70+ need a trusted person ..." },
    { "code": "flagged_call_approval", "basis": "ruko_own", "label": "Ruko flagged a risky call ..." }
  ],
  "version": "guard-1"
}
```

The body is **strict**: any extra field (a name, an account number) is rejected with `400`. The most restrictive rule wins.

### Defaults

| Rule | Decision | Basis | Threshold (changeable) |
|---|---|---|---|
| Transfer above ₹10,000, not a merchant | `delay` 3600 s, cancellable | rbi_draft | `RBI_DRAFT.delayAboveInr` |
| Age 70+, not a merchant, ₹50,000 or more | `require_trusted_person` | rbi_draft (optional in the draft; amount from secondary reports) | `trustedPersonAge`, `trustedPersonAboveInr` |
| Flagged call, ₹2,000 or more | `delay` | ruko_own | `RUKO_OWN.flagMinInr` |
| Flagged call, ₹10,000 or more | `require_trusted_person` | ruko_own | `flagApprovalAboveInr` |
| First payment to a new payee, ₹25,000 or more | `delay` | ruko_own | `newPayeeDelayAboveInr` |
| Destination reported 1 to 2 times | `delay` | ruko_own | |
| Destination reported 3+ times, or 2+ other customers held for it | `block` | ruko_own | `blockAtReports`, `blockAtVictims` |
| Kill switch on | `block` | customer_choice | |
| Approval needed but no trusted person set up | falls back to `delay` and says so | ruko_own | |

An unknown age is treated as under 60 (no senior rule on a guess).

## 2. Trusted-person approval

- `POST /api/guard/approvals` (bank key): `{ elderId, amountInr, payeeLabel, payeeAccount, channel, bankRef? }`. Creates the request and asks the customer's trusted people. Returns `201 { approvalRequestId, status: "pending", familyAsked }`, or `409 no_trusted_person`.
- The family decides in the Ruko app: `PATCH /api/approvals/{id}` with `{ decision: "approved" | "declined", codeWord? }`. **After a flagged call, approving needs the family code word** (checked on the server; declining never needs it).
- `GET /api/guard/approvals/{approvalRequestId}` (bank key): `{ status: "pending" | "approved" | "declined", decidedAt }`. The bank releases or cancels the payment accordingly.

## 3. The customer's kill switch

`POST /api/guard/kill-switch`, `{ elderId, action: "pause" | "resume", by, codeWord? }`.

- **Pause** takes effect at once for every digital payment (`upi`, `imps`, `neft`, `rtgs`); the family is told if the customer pressed it.
- **Resume** needs the **family code word**. With no code word set, the customer cannot resume alone (a scammer could coach them): a family member must.
- A paused customer's assess calls should be sent with `paymentsPaused: true`; the answer is `block`.

## How the mock bank uses it

`/bank` (marked MOCK BANK) takes a payment through `lib/payments.ts`, which asks `assessGuard` (the same function behind the endpoint) for a decision on every digital payment and merges it with the practice bank's own rules; the stricter wins. Guard reasons are saved on the payment as `guard_*` codes, and the fraud desk (`/console`) lists each decision under **Ruko Guard** (demo data). **Honest note:** the mock calls the shared function in-process rather than over HTTP, so the HTTP surface above is separately tested (`scripts/check-guard.ts` for the decisions; the endpoints were exercised against the running app).

## Privacy and safety

- Assess is stateless and holds no personal data. Approvals store the customer id, the amount, a label and a salted hash of the destination account.
- Ruko never sees a PIN, an OTP or a card number, and never moves money. It only advises the bank, and holds nothing itself in a real deployment.
- Everything here is a draft integration on a practice bank. Before any real pilot: legal review, a data-processing agreement, security testing, and the bank's own risk sign-off.

## Next

A pilot bank calls assess from its payment flow, shows the reason in its own app, and uses the approval endpoints for the trusted-person step. The RBI paper's final rules (if issued) replace the draft constants; nothing else changes.
