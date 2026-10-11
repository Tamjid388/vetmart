# E2 — Party Masters (Customer decouple + Supplier new) — IMPLEMENTED 2026-09-19

Depends on: E1
SRS refs: Sections 4.2, 4.3, Rule 3, Section 8 items 2–3

## Goal

Standalone non-login masters. No FK to `User`. Phone-unique per table. Due/payable balances ready for E4/E5.

## Backend implementation (`server/`)

- [x] `prisma/schema/user.prisma`: `Customer` — drop `userId` + `user` relation and `User.customer` back-relation. Add `name` (required), `phone @unique` (required), `address?`, `area?`, `category?`, `dueBalance Decimal(12,2) @default(0)`, `isActive @default(true)`, `isDeleted @default(false)`, timestamps.
- [x] New file `prisma/schema/party.prisma` (or `supplier.prisma`): `Supplier` per SRS 4.3 (`companyName`, `contactPerson?`, `phone @unique`, `address?`, `tradeLicense?`, `paymentTerms?`, `payableBalance @default(0)`, `isActive`, `isDeleted`, timestamps, `@@map("suppliers")`). Confirm `prisma.config.ts` schema folder still picks it up (`schema: 'prisma/schema'`).
- [x] Migrate: `prisma migrate deploy` applied `0004_party_masters` + `pnpm db:generate`. Backfill convention (decided once, baked into the migration SQL; table was empty so the UPDATEs were no-ops): `name = 'Walk-in <id>'`, `phone = 'WALKIN-<id>'` (unique per row; staff must replace with the real phone before E4 POS use).
- [x] New modules following `products/` pattern (6 files each):
  - `src/app/modules/customers/` — `customer.routes.ts` (`GET/POST /`, `GET /areas` distinct area list, `GET/PATCH/DELETE /:id`, all `auth('admin','staff')`; `/areas` above `/:id`), `customer.controller.ts` (catchAsync + sendResponse), `customer.service.ts` (Prisma + QueryBuilder + soft delete + P2002 phone-conflict → `409`; `area` normalized via `shared/normalize.ts` `toStoredArea` on create/update and `normalizeArea` on the `?area=` filter; `getAreas()` groupBy with read-time merge), `customer.validation.ts` (Zod: create requires `name` + `phone`; update all-optional with refine non-empty), `customer.interface.ts` (payload types + `toCustomerResponse` Decimal→number), `customer.constant.ts` (`CustomerSearchableFields = ['name','phone','area']`).
  - `src/app/modules/suppliers/` — same shape, searchable `['companyName','phone','contactPerson']`, `toSupplierResponse` for `payableBalance`.
- [x] `src/app/routes/index.ts`: mount `{ path: '/customers', route: CustomerRoutes }` and `{ path: '/suppliers', route: SupplierRoutes }`.
- [x] Verify in `server/`: generate + `tsc --noEmit` + `eslint` + `test`.

## Frontend implementation (`client/src/`)

Follow the existing `features/products/` pattern (`api/`, `hooks/`, `components/`, `pages/`, `types/`, `schemas/`).

- [x] `features/customers/` (was mock — rewired to API):
  - `api/customer.api.ts`: `getCustomers(params)`, `getCustomerById`, `createCustomer`, `updateCustomer`, `deleteCustomer` via `lib/axios/axios.ts` (`apiGetWithMeta`, `apiPost`, `apiPatch`, `apiDelete`), `BASE = '/customers'`.
  - `hooks/useCustomers/`, `hooks/useCustomer/`, `hooks/useCustomerMutations/`: `@tanstack/react-query` `useQuery(['customers', params])` + mutations invalidating the list query.
  - `types/customer.types.ts` + `schemas/customer.schema.ts`: `name` required, `phone` required + 409 unique-error mapping (`getCustomerSubmitErrorMessage`), `area` free-text (rural-proof, no hardcoded list; stored lowercase canonical, Title Case display via `formatArea`), `category` (Regular/Wholesale), address. Mock store (`customerStore`, `customers.json`, local filter) deleted.
  - `api/customer.api.ts` + `hooks/useCustomerAreas/`: `getCustomerAreas()` (`GET /customers/areas`, 5-min stale + `keepPreviousData`) feeds the form AutoComplete suggestions (free-type + new-area confirm). No area-filter dropdown — area covered by search box; `CustomerListFilters` = `{ search }` only; hardcoded `CUSTOMER_AREAS` (Mirpur/Uttara/…) deleted.
  - `pages/`: list + `new` + `:id/edit` bound to mutations with server pagination, due `Tag` badge when `dueBalance > 0`.
- [x] `features/vendors/` (same shape, `BASE = '/suppliers'`): company form (`companyName`, `contactPerson`, `phone`, `address`, `tradeLicense`, `paymentTerms`), outstanding column from `payableBalance`.
- [x] `router/router.tsx`: keep `/customers`, `/customers/new`, `/customers/:id/edit`, `/vendors`, `/vendors/new`, `/vendors/:id/edit` (already routed — no changes needed). No login routes for parties.
- [x] POS prep: `CustomerSearchSelect` component (search by name/phone, create-inline entry point via `onCreateNew`) reusable by E4.

## Done when

- [x] Backend verify green; `POST /customers` duplicate phone → `409`
- [x] `vite build` passes
- [x] Manual: create customer → appears in list; soft-deleted hidden; supplier create works; schema has no `userId` on Customer

## Deferred

- `Purchase` module (Supplier stays standalone until then)
