# E4b — Cash Customer Sale (no customer record) + Customer History — IMPLEMENTED 2026-10-11

Depends on: E4, E5
SRS refs: Section 4.10, Rules 9–18, Section 7 sales API.
> NOTE: Cash-customer sale is a NEW client requirement, not in the SRS. No SRS matching needed before implementation — implement this epic as-is, then update SRS + related docs as a follow-up (see §4).

## 0. Requirement + conflict with current rule

Client wants two sale categories at POS:

1. **Registered sale (current approach, unchanged):** `customerId` required, `paidAmount <= grandTotal`, `paymentMethod` in `{ CASH BKASH NAGAD CARD }`, `paymentStatus` in `{ PAID PARTIAL DUE }`, due tracked on `Customer.dueBalance`, clearable via `POST /payments`.
2. **Cash-customer sale (new):** buyer pays **fully in cash at counter**, staff enters **no customer info** (no name/phone/create-first step). Confirmed with client: cash sale is **only used when the full amount is paid**, so by definition a cash sale never has a due.

This is a NEW requirement outside the current SRS (Rule 9 says "no anonymous walk-in sale", `srs.md:429`). Per owner decision: implement first, update docs after. No SRS matching needed to start. The follow-up doc updates are listed in §4 — Rule 9 wording, ER table row, E4 goal line, user guide.

## 1. Recommended design (Option A — nullable FK + type flag)

### 1.1 Prisma (`server/prisma/schema/sale.prisma`)

- New enum:
  ```prisma
  enum SaleType { REGISTERED CASH }
  ```
  (Name it `CASH`, not `WALKIN` — E2 already used "Walk-in" as a backfill hack for missing phones; reusing the word invites confusion.)
- `Sale` changes:
  - `saleType SaleType @default(REGISTERED)` (default keeps old rows valid, zero backfill).
  - `customerId String?` + `customer Customer? @relation(..., onDelete: Restrict)` — make both optional.
  - Keep `@@index([customerId])`; add `@@index([saleType])` for POS/report filters.
- Do NOT add `customerName/phone` snapshot columns — there is nothing to snapshot. Receipt shows static label "Cash Customer".
- Do NOT add `cashReceived/change` columns in this epic (deferred — see §5 edge case 11). `paidAmount == grandTotal` is enough for v1.
- Migration is safe: existing rows have `customerId` set + default `REGISTERED`; new column default fills them.

### 1.2 Rejected alternative (Option B — one shared "Cash Customer" master row)

Tempting because it needs no schema change (`customerId = 'CASH'` for every anonymous sale). Reject it:

- All cash sales pile `dueBalance` risk onto one row; one bad write corrupts every cash report.
- Single-row hot spot under concurrent POS checkouts (same lock contention E4 already avoids with ordered `FOR UPDATE`).
- Customer list / due report / area stats get polluted by a fake customer; phone-`@unique` needs a magic value (`CASH`/`WALKIN-xxx`) that staff can accidentally edit/delete.
- `GET /customers/:id` detail becomes meaningless (thousands of unrelated sales). Only revisit if a future "no-migration-allowed" constraint appears.

## 2. Backend changes (`server/src/app/modules/sales/`)

### 2.1 `sale.validation.ts` (Zod `create`)

Current (`sale.validation.ts:4-25`): `customerId` required string, `paymentMethod` nullish enum, `paidAmount >= 0`.

Change to a discriminated union on `saleType` (default `REGISTERED` for backward compat):

```ts
// sketch — exact shape to be finalized at implementation
const base = z.object({
  idempotencyKey: z.string().uuid(),
  items: z.array(z.object({ productId: z.string().min(1), qty: z.number().int().min(1) }).strict()).min(1),
  discount: z.number().min(0).optional(),
  paidAmount: z.number().min(0),
  notes: z.string().trim().max(1000).optional(),
});
const create = z.object({ body: z.discriminatedUnion('saleType', [
  base.extend({ saleType: z.literal('REGISTERED').default('REGISTERED'), customerId: z.string().min(1), paymentMethod: z.enum(SALE_PAYMENT_METHODS).nullish() }),
  base.extend({ saleType: z.literal('CASH'), customerId: z.never().optional(), paymentMethod: z.literal('CASH').default('CASH') }),
]).strict() });
```

Server must re-enforce (never trust client): if `saleType === 'CASH'` → `paymentMethod` must be `CASH`, `paidAmount` must equal `grandTotal` (checked after totals computed, like the existing guards at `sale.service.ts:174-186`), resulting `paymentStatus` must be `PAID` / `dueAmount === 0`. Reject otherwise with `400`.

### 2.2 `sale.service.ts` — `createInTransaction`

- Step 2 (`sale.service.ts:80-86`) becomes conditional: only load/404-check `Customer` when `saleType === 'REGISTERED'`. For `CASH`, skip entirely and create `Sale` with `customerId: null`.
- Totals/FIFO/invoice-counter/ledger code paths are **identical** for both types (no change to `sale.logic.ts`, `nextInvoiceNo`, batch decrement, `StockLedger SALE` rows).
- Due update (`sale.service.ts:258-263`): only when `totals.dueAmount > 0` — which for `CASH` is provably 0, so the existing `if` already no-ops. Keep as-is but add an assertion/comment; do not `increment` any customer for `CASH`.
- `getAll`: accept `?saleType=` + `?customerId=` filters; `customerId` filter naturally excludes cash sales (NULL never matches). Add `saleType` to the `qbQuery` allowlist (same pattern as `paymentStatus` at `sale.service.ts:306`).
- `saleInclude.customer` stays as-is — Prisma returns `null` for cash sales; `toSaleResponse` already spreads `...(customer ? { customer } : {})` so no change needed in `sale.interface.ts` beyond making `customerId: string | null` / `customer?` nullable in `ICreateSalePayload` and `TPopulatedSale`.
- `voidSale` (`sale.service.ts:350-437`): restock + `RETURN` ledger rows **still run** for cash sales; the `dueAmount > 0` reversal block already no-ops (due is 0). Guard the `tx.customer.update` with a null-check on `sale.customerId` so a cash void never throws on a null FK. Double-void `409` unchanged.

### 2.3 `sale.constant.ts` / search

- Add `SaleTypes = ['REGISTERED','CASH']` constant next to `SALE_PAYMENT_METHODS`.
- `SaleSearchableFields = ['invoiceNo']` unchanged (cash sales have no customer name/phone to search).

### 2.4 Payments module (`src/app/modules/payments/`)

- `POST /payments` with `saleId` pointing at a `CASH` sale → reject `400` ("cash sales carry no due"). `amount <= Customer.dueBalance` check is unaffected (cash sales never created a due).
- `GET /payments?customerId=` unchanged — cash sales simply never appear there.

## 3. Frontend changes (`client/src/features/sales/`)

Following `features/products/` conventions, same files E4 touched:

### 3.1 UI mockup (POS — `/sales/new`)

Toggle sits at the TOP of the Sale Cart card so staff chooses the sale type BEFORE adding anything. Default = Registered (protects the customer DB — see story 11).

```text
┌─ Sale Cart ─────────────────────────────────────────────┐
│ Sale type:  (•) Registered   ( ) Cash customer           │
│ ─────────────────────────────────────────────────────── │
│ REGISTERED MODE (today's behavior, unchanged):          │
│   Customer (required)                                   │
│   [ Search name/phone...              ▼ ] [+ New]       │
│   Cart lines...   [Add Product search...]                │
├─ Payment ───────────────────────────────────────────────┤
│   Subtotal ......... ৳500                               │
│   Discount  [  0 ]   VAT ......... ৳0                   │
│   Grand Total ...... ৳500                               │
│   Paid      [ 300 ]  (partial allowed)                   │
│   Method    (•)Cash ( )bKash ( )Nagad ( )Card            │
│   Due ................ ৳200 (red)                        │
│   [ Complete Sale ]  (disabled until customer + items)   │
└─────────────────────────────────────────────────────────┘

┌─ Sale Cart ─────────────────────────────────────────────┐
│ Sale type:  ( ) Registered   (•) Cash customer           │
│ ─────────────────────────────────────────────────────── │
│ CASH MODE (new):                                        │
│   ┌─────────────────────────────────────────────────┐   │
│   │  💵 Cash customer — full cash payment.          │   │
│   │  No customer info needed. No due allowed.       │   │
│   └─────────────────────────────────────────────────┘   │
│   (Customer search + due warning HIDDEN)                 │
│   Cart lines...   [Add Product search...]                │
├─ Payment ───────────────────────────────────────────────┤
│   Subtotal ......... ৳500                               │
│   Discount  [  0 ]   VAT ......... ৳0                   │
│   Grand Total ...... ৳500                               │
│   Paid      [ 500 ]  (LOCKED = grand total, greyed out)  │
│   Method    [Cash]   (fixed label, no radio)             │
│   Due ................ ৳0                                │
│   [ Complete Sale ]  (enabled with items only)           │
└─────────────────────────────────────────────────────────┘
```

Receipt / list rendering for cash sales:

```text
Sale list row:  #SALE-00042  [CASH]  Cash Customer   ৳500   [PAID green]
Sale detail:    Customer: [Cash Customer grey tag]   Payment Method: Cash
```

Behavior notes for the mockup:

- Switching toggle mid-cart KEEPS cart lines, only swaps the customer block + payment rules.
- Cash → Paid auto-fills to grand total on every cart/discount change; input is read-only.
- Registered → exactly today's form, no visual change except the new toggle row.

- `types/sale.types.ts` + `schemas/sale.schema.ts`: `CreateSalePayload = { saleType: 'REGISTERED' | 'CASH', customerId?: string, ... }`; client-side rule: `CASH` → force `paidAmount = grandTotal`, `paymentMethod = 'CASH'`, hide method radio.
- `components/SaleForm/SaleForm.tsx` (current gate at `:84,132`: `canSubmit = customerId !== null && ...`):
  - Add a `Sale type` toggle (`Registered | Cash customer`) at the top, default `Registered` (preserves current behavior).
  - `Cash` mode: hide `CustomerSearchSelect` + due-warning block (`:199-210`), set `canSubmit = lines.length > 0`, auto-set paid = grand total and lock the paid input, show hint "Full cash payment — no due allowed".
  - `Registered` mode: exactly today's behavior.
  - `handleSubmit`: omit `customerId` and send `saleType: 'CASH'` in cash mode; keep `customerId` + `saleType: 'REGISTERED'` otherwise.
- `hooks/useSaleMutations/`: idempotency key handling unchanged (key per checkout attempt).
- `components/SaleTable/` + `SaleCardList/` + `SaleFilters/`: add `saleType` filter tab/column; customer cell renders `"Cash Customer"` tag when `sale.customer == null`.
- `components/SaleDetails/SaleDetails.tsx` (`:119-121` already renders `'—'` for null customer): change fallback to `<Tag>Cash Customer</Tag>`; void button/logic unchanged (admin only).
- `api/sale.api.ts`: `createSale` passes `saleType` through; no endpoint change (`POST /sales` stays one endpoint — no separate `/sales/cash` route).

## 4. Docs follow-up + verify

SRS does NOT describe this feature — that is expected. Ship the code first, then bring docs in line:

- [ ] `docs/srs.md` → Rule 9 wording ("Registered sales require a customer; CASH sales are anonymous, full-cash-only"), ER table Sale row (`:85` nullable FK), sales API `customerId` field (`:268` optional for CASH).
- [ ] `docs/epics/E4-sale.md` → goal line ("required customer" → "required customer for REGISTERED; anonymous allowed for CASH paid-in-full").
- [ ] `docs/user-guide-bn.md` + `docs/ERP_BUSINESS_DOCUMENTATION_BN.md` → add the two sale types + when to use which, plus the customer history tabs (§7).
- [ ] Verify (same as E4): `pnpm db:generate` → `tsc --noEmit` → `eslint` → `test` → `vite build`.
- New tests: (a) cash sale with no `customerId` → `201`, `PAID`, `due 0`, no `Customer` touched; (b) cash + partial pay → `400` (safety net; per client this flow never happens because cash = full payment); (c) cash + `BKASH` → `400`; (d) cash + `customerId` sent → `400` (strict body); (e) registered flow unchanged incl. `409` oversell; (f) void cash sale restocks + no customer update; (g) payment against cash `saleId` → `400`.

## 5. Edge cases — simple stories (read before implementing)

Business rule confirmed: **cash sale = full cash payment, no due, no customer**. The server still enforces this (rejects anything else with `400`), so there is no "partial cash sale" in practice. The stories below cover everything else that can still surprise us.

1. **"Wrong button" story — bKash on a cash sale.**
   Say a buyer pays by bKash but staff picks "Cash customer" to skip typing the name. bKash money needs a traceable record (whose account, which number). An anonymous bKash sale can't be reconciled later. Fix: server accepts only `paymentMethod: CASH` for cash sales, rejects the rest with `400`. Staff must use Registered sale for bKash/Nagad/Card.

2. **"Due with no owner" story — safety net, not a real flow.**
   Since cash = full payment, a cash sale should never create a due. But if a bug ever computes `due > 0` on a cash sale, that money would have no customer to collect from — it just disappears from the due list. Fix: explicit server assertion `CASH && dueAmount !== 0 → throw`, plus cash sales never touch `Customer.dueBalance` or `/payments`.

3. **"Oops, wrong items" story — voiding a cash sale.**
   A cash buyer leaves, then returns the medicine. Admin voids the sale. Stock must come back (same restock + `RETURN` ledger rows as normal), but there is no customer due to reverse. Today's `voidSale` assumes `sale.customerId` always exists (`sale.service.ts:421-425`) and would crash on a null. Fix: null-check before the customer update.

4. **"Best customer?" story — reports.**
   Owner asks "who buys the most?" If the report groups by `customerId`, hundreds of cash sales all land under `null` and "null" looks like the biggest customer — or the report crashes. Fix: exclude `saleType CASH` from customer-wise / due-aging / top-customer reports; count them only in total-revenue reports.

5. **"Where is today's cash bill?" story — search/filter.**
   Staff filters sales by customer to find a bill — cash bills never appear there (NULL never matches, which is correct but confusing). Fix: add `?saleType=` filter so staff can list "today's cash sales"; invoice-number search works for both types.

6. **"Who bought this?" story — audit limit.**
   A month later someone asks "which person bought this cash-sale medicine?" That answer is gone forever — by design, we never stored it. The sale is still traceable by *who sold it* (`soldBy + saleDate + invoiceNo + ledger refId`), just not *who bought it*. Confirm the client accepts this; no fix needed, just expectations.

7. **"Add him to due later" story — no conversion.**
   A cash buyer comes back next week and says "put my last bill on my account." We can't attach a customer to an old cash sale — that would rewrite history (dues, ledgers, reports). Fix (process, not code): create a *new* registered sale if credit is needed; v1 offers no convert-cash-to-registered button.

8. **"Discount works the same" story — no special math.**
   A cash buyer also gets a 10% discount. Good news: nothing special — cash sales use the exact same `computeSaleTotals` (line rounding, `discount <= subtotal + vat`). No second math path to maintain.

9. **"Double-click" story — idempotency.**
   Staff double-clicks "Complete Sale" on a cash bill. Same as registered: same `idempotencyKey` returns the original sale, stock deducts once, invoice counter untouched. No new race.

10. **"Here's ৳1000, keep ৳950" story — change (deferred).**
    A buyer hands ৳1000 for a ৳950 bill and takes ৳50 change. v1 only stores `paidAmount == grandTotal` — it does not record tendered/change. If the counter needs that, it's a separate small epic (two nullable columns + receipt line), not part of this change.

11. **"Cash is faster" story — staff habit.**
    Cash sale skips the customer form, so busy staff may pick it for everyone and the customer database starves (no dues history, no repeat-buyer stats). Fix (UX, not backend): default the POS toggle to `Registered`; cash is one extra deliberate click.

## 6. Files touched (implementation record 2026-10-11)

- [x] `server/prisma/schema/sale.prisma` → `SaleType` enum, `saleType`, nullable `customerId/customer`, index
- [x] migration `0006_cash_customer_sale` + `pnpm db:generate` — NOTE: applied via hand-written SQL + `migrate resolve --applied` because `migrate dev` is blocked by a PRE-EXISTING drift (`20260919162844_purchase_grn` was edited after apply; reset would wipe the dev DB so it was left alone). Next `migrate dev` will still complain about that old drift — fix by reconciling that file, never by reset without backup.
- [x] `server/src/app/modules/sales/sale.validation.ts`, `sale.interface.ts`, `sale.service.ts`, `sale.constant.ts`
- [x] `server/src/app/modules/payments/` → reject `saleId` of cash sales
- [x] `server/src/app/modules/sales/sale.validation.test.ts` (6 pure tests: default REGISTERED, shapes b–d) + live smoke 16/16 green (cash create/retry/partial-400/bkash-400/payment-400/filters/registered-DUE-regression/voids)
- [ ] docs follow-up (§4: `srs.md`, `E4-sale.md`, user guide + business doc)
- [x] `client/src/features/sales/` → types (+barrel), schema untouched (no antd-form rules to change), `SaleForm` (toggle + locked paid, effect-free derivation per `react-hooks/set-state-in-effect`), `SaleTable` + `SaleCard` (Cash Customer + type tag), `SaleDetails` (Cash Customer tag + sale type row), `SaleFilters` + `SalesPage` (type filter), `sale.api.ts`
- [x] `client/src/features/customers/` → new `CustomerHistory` (Purchases + Payments tabs, expandable items, server pagination, counts strip) wired into `ViewCustomerPage`
- [x] verify: generate + `tsc --noEmit` (server) + `tsc -b` (client build) + `eslint` both + `test` 28/28 + `vite build` + manual smoke (cash full-pay → `PAID` "Cash Customer"; registered partial → due correct; void cash → stock back, no due move; Rahim page → visits time-ordered with items + payments)

## 7. Customer details — visit-wise purchase + payment history (NEW, agreed)

### 7.0 Story

Rahim buys 5 items on 9 Oct, 9 AM. Same day he comes back and buys more. Days later he returns a third time. Today his details page shows only the overall card (phone, area, due, since) — staff cannot answer "what did Rahim buy each time, and what did he pay?" After this change the same page keeps the overall header (unchanged) and adds a time-wise list below: one row per visit (date/time, invoice, items, visit total, paid, due, status) that expands to the item lines (name, qty, price, line total), plus a second tab listing his due-payments (amount, method, date).

### 7.1 Current state (verified)

- `ViewCustomerPage` + `CustomerDetails` render the overall header only — no history queries.
- Backend already supports everything needed, no new endpoint for v1:
  - `GET /sales?customerId=<id>&sortBy=saleDate&sortOrder=desc` → full sale rows with `items[]` (product/batch, qty, sellingPrice, lineTotal), totals, paid/due, status, method (`sale.service.ts:getAll`, `sale.api.ts:getSales` already accepts `customerId`).
  - `GET /payments?customerId=<id>` → collection rows (amount, method, paidAt) per E5.
  - Staff cost-strip already applies on sale rows (`purchasePrice` omitted for `staff`), so history reuses the same rule for free.
- `customer.service.ts:getById` stays header-only — no change.

### 7.2 Design

- Tabs under the existing header card on `ViewCustomerPage` (default tab: Purchases):
  - **Purchases tab:** server-paginated table (`useSales({ customerId, sortBy: 'saleDate', sortOrder: 'desc' })`), expandable rows. Columns: Date/Time, Invoice, Items (count), Total, Paid, Due, Status, Method. Expanded panel: item lines (product name, lot if any, qty, selling price, line total) + discount/VAT line + "View receipt →" link to `/sales/:id`. Header strip above the table shows the visit count + "newest first" note; the current due stays on the existing header card (never client-summed — see story 6).
  - **Payments tab:** table (`usePayments({ customerId })`) — Date, Amount, Method, Against sale (link if `saleId`), Collected by. Summary: Total collected. The existing `Record Payment` button stays where it is; on success it invalidates `['customers']`, `['sales']`, `['payments']` so header due + both tabs refresh together.
- Pagination: server-side on both tabs (same `page/limit` pattern as list pages). Do NOT fetch "all sales then group in browser" — Rahim with 200 visits would freeze the page.
- No backend work in v1. Optional later (deferred): `GET /customers/:id/summary` returning `{ lifetimePurchased, lifetimePaid, salesCount }` so the strip doesn't sum only the visible page.

### 7.3 UI mockup (`/customers/:id`)

```text
┌─ Rahim  (019… · CUST-xxxx)  [Active] [Regular] [Due ৳200] ─┐
│  [Record Payment] [Edit] [Delete]                          │
│  Phone / Area / Category / Address / Due / Since (as today)│
├─ [ Purchases (12) ]  [ Payments (4) ] ─────────────────────┤
│ PURCHASES TAB:                                             │
│  Lifetime purchased ৳5,200 · Lifetime paid ৳5,000 · Due ৳200│
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ▼ 9 Oct, 9:00 AM  #SALE-00040  5 items              │   │
│  │   Total ৳1,000 · Paid ৳800 · Due ৳200 [PARTIAL] Cash │   │
│  │   ├ Napa 500mg ×10 @ ৳2.00 = ৳20                    │   │
│  │   ├ … (4 more lines)                                │   │
│  │   Discount ৳0 · VAT ৳0 · [View receipt →]            │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ▶ 9 Oct, 5:30 PM  #SALE-00044  2 items              │   │
│  │   Total ৳700 · Paid ৳700 · Due ৳0 [PAID] bKash       │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │ ▶ 12 Oct, 11:15 AM #SALE-00051  3 items …           │   │
│  └─────────────────────────────────────────────────────┘   │
│  < 1 2 3 … >  (server pagination)                          │
│                                                            │
│ PAYMENTS TAB:                                              │
│  Total collected ৳5,000                                    │
│  10 Oct, 10 AM · ৳500 · Cash · vs #SALE-00040 · by Sakib   │
│  13 Oct, 2 PM  · ৳300 · bKash · vs — · by Sakib            │
└────────────────────────────────────────────────────────────┘
```

### 7.4 Edge cases — simple stories

1. **"Rahim came twice today" story — ordering.**
   Two visits share the date (9 AM + 5:30 PM). Date-only sorting would jumble them. Fix: sort by full timestamp `saleDate desc` (time included), tie-break by `invoiceNo desc`. Both columns already exist.
2. **"That bill was a mistake" story — voided sales (DEFERRED v1).**
   Decided at implementation: voided sales stay hidden from the history tabs (backend `getAll` filters `isDeleted: false`, unchanged). They remain reachable via the sales list/receipt audit path. Showing them with a `[VOIDED]` tag needs an `includeVoided` flag — small follow-up, not in this cut.
3. **"New customer" story — empty state.**
   A just-created Rahim has no visits. Fix: friendly empty cards ("No purchases yet — [New Sale]", "No payments yet"), not blank tables.
4. **"Nosy staff" story — cost visibility.**
   Purchase history shows selling prices (Rahim saw them on his receipt — fine) but never `purchasePrice` for `staff` role. Backend already strips it; the new tab must not add a "profit per visit" column that leaks cost.
5. **"Cash bills" story — no mixing.**
   Anonymous CASH sales never appear on any customer's page (their `customerId` is null). Rahim's history contains only his REGISTERED sales. No filter needed — correct by construction.
6. **"200 visits" story — pagination.**
   Summing only the visible page and calling it "Lifetime" lies. Fix: label page sums as page sums; lifetime figures come from the header due + (later) the summary endpoint. Never client-sum across pages as truth.
7. **"Deleted Rahim" story — soft-delete.**
   Soft-deleted customers hide from lists; their sales rows remain for audit. History tab follows the same rule: reachable via direct link/receipt, not via customer search.

## 8. Post-implementation test + code-quality gate (NO functionality changes) — DONE 2026-10-11

This phase changed no behavior — only tests, types, lint fixes, docs. Results:

- [x] Backend: `pnpm db:generate` → `tsc --noEmit` clean → `eslint .` 0 errors (1 pre-existing warning in `prisma/seed-products.ts`, untouched) → `test` 28/28 green (22 existing + 6 new validation).
- [x] Frontend: `vite build` passes (only the pre-existing chunk-size warning); `eslint .` clean. One quality fix during the gate: replaced a `setState`-in-`useEffect` paid-sync with render-time derivation (`react-hooks/set-state-in-effect`) — same behavior, no loop risk.
- [x] Regression (registered flow byte-for-byte): live smoke confirmed DUE sale bumps `dueBalance` and void reverses it; oversell/idempotency/staff-strip paths untouched (no code changes there).
- [x] Manual: cash full-pay → `PAID` receipt "Cash Customer"; cash partial/`BKASH` → `400`; payment on cash `saleId` → `400`; `?saleType=CASH` finds it; `?customerId=` excludes it; void cash → stock back, no due move; Rahim page → visits newest-first with expandable items + payments tab.
- [x] Code-quality fixes only (strict-null narrowing via `customerId` const, `Tag` import, barrel export, aria-label on toggle). No behavior change needed re-entry to §6.
