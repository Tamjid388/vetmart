# VetMart Server — Architecture Blueprint

Express 5 + TypeScript + PostgreSQL + Prisma 7 backend, modular (feature-based) pattern.
Base URL: `/api/v1`. Health: `GET /health`.

> `docs/arechetecture.md` (typo) was renamed to this file.

## 1. Stack & Why

| Layer        | Package(s)                                              | Why / notes                                                        |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------ |
| Framework    | `express@5`, `@types/express`                           | Express 5 handles async errors natively; `catchAsync` kept for typing consistency |
| Language     | `typescript@5`, `tsx` (dev), `node --experimental-strip-types` n/a | TS 5 pinned: TS 7 breaks `typescript-eslint` + Prisma peers. `tsx watch` for dev |
| Database     | `postgresql` + `prisma@7`, `@prisma/client`, `@prisma/adapter-pg`, `pg` | Prisma 7 **requires** a driver adapter (`PrismaPg` + `pg` Pool). See §6 |
| Validation   | `zod`                                                   | Per-module schemas + `validateRequest` middleware. Query strings coerced via `z.coerce` / manual parse |
| Auth         | `jsonwebtoken`, `bcryptjs`                              | **HttpOnly cookies** (`accessToken` + `refreshToken`); `BCRYPT_SALT_ROUNDS` configurable. Frontend sends `withCredentials: true`, stores no token |
| Security     | `helmet`, `cors`, `express-rate-limit` (200 / 15 min), `cookie-parser` | `CORS_ORIGIN` env-gated; rate-limit message follows error envelope |
| Perf/ops     | `compression`, `morgan`, `dotenv`                       | `dev`/`combined` log format by `NODE_ENV`                          |
| Contracts    | `http-status-codes`                                     | No magic numbers: `StatusCodes.OK`, `.CREATED`, …                  |
| Quality      | `eslint` (flat + `typescript-eslint`), `prettier`, `husky` + `lint-staged`, `vitest` + `supertest` | `pnpm lint`, `pnpm format`, `pnpm test`. Run `git init` to activate husky hooks |

## 2. Scripts (`pnpm …`)

| Script        | Command                              | Purpose                          |
| ------------- | ------------------------------------ | -------------------------------- |
| `dev`         | `tsx watch src/server.ts`            | Hot-reload dev server            |
| `build`       | `tsc`                                | Emit to `dist/` (declarations off — API server needs none) |
| `start`       | `node dist/server.js`                | Production start                 |
| `lint`        | `eslint .`                           | Flat config, no `any` without warning |
| `format`      | `prettier --write …`                 | `singleQuote`, `printWidth: 120` |
| `test`        | `vitest run`                         | `src/**/*.test.ts`               |
| `db:generate` | `prisma generate`                    | Regenerate client (also `postinstall`, tolerant `‖ exit 0`) |
| `db:migrate`  | `prisma migrate dev`                 | Needs live `DATABASE_URL`        |
| `db:seed`     | `tsx prisma/seed.ts`                 | Admin + sample products          |
| `db:studio`   | `prisma studio`                      | DB GUI                           |

## 3. Folder Structure

```text
server/
├── prisma/
│   ├── schema/                  # Split PSL (2026-09-17, was single schema.prisma): base, user, catalog, inventory
│   │   ├── base.prisma          # generator + datasource only
│   │   ├── user.prisma          # UserRole, User, Customer
│   │   ├── catalog.prisma       # ProductType/Unit/Form enums + Category, Product, Medicine/FeedDetails
│   │   └── inventory.prisma     # StockLedgerType + ProductBatch ↔ StockLedger (batch FK SetNull, fixed)
│   ├── migrations/0001_init/  # Created via `migrate diff` (no live DB needed)
│   │   └── 0002_product_erp/    # ERP hybrid + OPENING backfill (price→selling/purchase, stock→batches+ledger)
│   └── seed.ts                # Upserts admin@vetmart.com / Admin123!
├── prisma.config.ts           # Prisma 7 config: schema: 'prisma/schema' (folder) + datasource URL + seed cmd (loads .env via dotenv)
├── src/
│   ├── app.ts                 # Express app: middleware chain, /health, /api/v1, notFound, globalErrorHandler
│   ├── server.ts              # Bootstrap only: prisma.$connect → listen → graceful shutdown
│   ├── health.test.ts         # Supertest: health / 404 / validation envelope
│   └── app/
│       ├── config/index.ts    # Zod-validated env. Missing/invalid env → fail fast (exit 1)
│       ├── routes/index.ts    # Module aggregator → /auth, /users, /products
│       ├── middlewares/
│       │   ├── auth.ts              # auth(...roles): Bearer verify → req.user → role gate
│       │   ├── validateRequest.ts   # Zod {body,query,params} check → forward ZodError
│       │   ├── globalErrorHandler.ts# Single error funnel (see §5)
│       │   └── notFound.ts          # 404 envelope for unknown routes
│       ├── modules/<name>/
│       │   ├── <name>.routes.ts     # Public vs protected endpoints only
│       │   ├── <name>.controller.ts # catchAsync + sendResponse, no business logic
│       │   ├── <name>.service.ts    # Prisma + business rules (passwords, soft delete)
│       │   ├── <name>.validation.ts # Zod schemas keyed by { body }
│       │   ├── <name>.interface.ts  # Payload/response types, searchable fields
│       │   └── <name>.constant.ts   # Roles, enums, defaults
│       ├── shared/
│       │   ├── prisma.ts      # Singleton PrismaClient + pg Pool adapter (dev HMR-safe)
│       │   ├── AppError.ts    # Operational error class (statusCode + message)
│       │   ├── catchAsync.ts  # Async → next(err) wrapper
│       │   ├── sendResponse.ts# Uniform success envelope
│       │   └── QueryBuilder.ts# search/filter/sort/paginate/fields + meta
│       └── utils/
│           ├── jwtHelpers.ts  # sign/verify access + refresh (header-only)
│           ├── password.ts    # bcrypt hash/compare
│           └── pick.ts        # Whitelist query keys
├── docs/architecture.md       # This file
├── .env / .env.example / .gitignore / tsconfig (@/* paths) / eslint / prettier / vitest.config
└── .husky/pre-commit          # lint-staged (needs `git init` to activate)
```

**Module rule:** `route → controller → service → prisma`. Controllers never touch Prisma; services never touch `req/res`.

## 4. Response Contract

```ts
// success
{ success: true, statusCode: 200, message: '…', meta?: { page, limit, total, totalPage }, data?: T }
// error (globalErrorHandler + notFound)
{ success: false, message: '…', errorSources: [{ path, message }], stack?: '…' /* non-prod only */ }
```

## 5. Error Handling (global)

`globalErrorHandler` is the **only** place that shapes errors:

| Input | Mapping |
| ----- | ------- |
| `ZodError` | `400 Validation error`, per-issue `errorSources` |
| Prisma `P2002` | `409 Duplicate value for <target>` |
| Prisma `P2025` | `404 Record not found` |
| Other Prisma errors | `400` (+ validation variant) |
| `AppError` | its own `statusCode`/`message` |
| Bad JSON body | `400 Malformed JSON in request body` |
| Unknown `Error` | `500` (+ `stack` outside production) |

`server.ts` also handles `unhandledRejection` / `uncaughtException` / `SIGTERM` / `SIGINT` → close HTTP → `prisma.$disconnect()`.

## 6. Prisma 7 Gotchas (already handled — don't regress)

1. **Driver adapter mandatory:** `new PrismaClient({ adapter: new PrismaPg(new Pool({ connectionString })) })` in `shared/prisma.ts`. Plain `new PrismaClient()` throws `PrismaClientConstructorValidationError`.
2. **`datasource db { provider = "postgresql" }`** (no `url`) stays in `schema/base.prisma`; the URL lives in `prisma.config.ts` via `env('DATABASE_URL')`.
3. **`prisma.config.ts` must call `dotenv.config()`** — the CLI does not auto-load `.env`.
4. **Generated client lives in the pnpm store:** after every `pnpm add/remove`, re-run `pnpm db:generate` (postinstall covers it; if types vanish with `has no exported member`, regenerate).
5. **No live DB?** `0001_init/migration.sql` was produced with `prisma migrate diff --from-empty --to-schema …`. With a real DB: `pnpm db:migrate && pnpm db:seed`.

## 7. Auth (JWT cookie-based — DECIDED 2026-09-18, E1 target; current code still header-only Bearer + tokens in body, see SRS Section 1)

Cookies `accessToken` + `refreshToken`: `HttpOnly`, `Secure` in production, `SameSite=Lax`, `Path=/`. Frontend uses `withCredentials: true` and stores no token.

- `POST /api/v1/auth/register` → always `role: staff` (public cannot self-assign admin). Sets both cookies. Returns `{ user (no password) }`, no tokens in body.
- `POST /api/v1/auth/login` → same shape. Wrong credentials → `401 Invalid email or password` (no user enumeration).
- `POST /api/v1/auth/refresh-token` (no body; reads refresh cookie, rotates both cookies) → `{}`. Deleted user → `401`.
- `POST /api/v1/auth/logout` → clears both cookies.
- `GET /api/v1/auth/me` → `auth()` (reads `req.cookies.accessToken`, Bearer fallback during one-release transition only) → current profile.
- Protect: `auth('admin')`, `auth('admin','staff')`. Missing/invalid credential → `401`; wrong role → `403`.

## 8. QueryBuilder (list endpoints)

```ts
new QueryBuilder(delegate, { ...req.query, isDeleted: false })
  .search(['name', 'description']).filter().sort().paginate().fields().execute();
// → { meta: { page, limit, total, totalPage }, data }
```

- Query: `?searchTerm=dog&page=2&limit=20&sortBy=price&sortOrder=asc&fields=id,name,price`.
- `limit` clamped 1–100. `fields=` maps to Prisma `select`. Services pre-force `isDeleted: false`; users service additionally strips `password` from `fields`.

## 9. Data Model (see `prisma/schema/*.prisma` — split 2026-09-17, config `schema: 'prisma/schema'`)

- `User`: `id cuid, email unique, password (bcrypt), name?, role UserRole(admin|vendor|customer), isDeleted, timestamps`. `register` forces `customer`; deletes are soft.
- `Customer`: `1–1 → User` (`userId unique`, cascade delete). Profile fields `phone?, address?`. **Module not yet implemented** — `src/app/modules/customer/` is the next build target (follow `products/` as template).
- `Category(productType)`: `@@unique([productType, name])`, `1 → N Product`.
- `Product` (unified base): `productType MEDICINE/FEED, sku? unique, name, description?, categoryId→Category, unit ProductUnit, purchasePrice/sellingPrice Decimal→number, minStock, vatPercent, manufacturer?, barcode? unique, imageUrl?, isActive, isDeleted, timestamps` + `medicineDetails?/feedDetails? 1-1, batches[], ledger[]`.
- `MedicineDetails/FeedDetails`: PK=FK `productId` cascade; medicine `form MedicineForm?, genericName?, strength?, requiresPrescription`; feed `targetSpecies?, feedType?, proteinPct?, nominalPackKg?`.
- `ProductBatch`: `productId→Product cascade, batchNumber? (MEDICINE required, FEED optional; @@unique([productId, batchNumber])), expiryDate? (required both types per owner), purchasePrice, stock (sum = Product stock), weightKg? (feed lot actual), receivedAt` + `ledgerEntries[]` back-relation.
- `StockLedger` (audit, FIX 2026-09-17): `productId→Product cascade, batchId?→ProductBatch SetNull + batch relation + @@index([batchId]), type PURCHASE/SALE/ADJUSTMENT/RETURN/OPENING, qtyDelta, stockAfter (negative allowed), refId?, createdBy?, createdAt`. Invariant: when `batchId` set, `productId == batch.productId` (service-enforced).

## 10. Endpoints (reference)

| Method | Path | Auth | Notes |
| ------ | ---- | ---- | ----- |
| `GET` | `/health` | – | Liveness |
| `POST` | `/api/v1/auth/register` | – | Staff-only roles; sets cookies, no tokens in body |
| `POST` | `/api/v1/auth/login` | – | Sets cookies |
| `POST` | `/api/v1/auth/refresh-token` | – | Reads refresh cookie, rotates |
| `POST` | `/api/v1/auth/logout` | – | Clears cookies |
| `GET` | `/api/v1/auth/me` | user | Cookie-authenticated |
| `GET` | `/api/v1/users[?query]` | admin | QueryBuilder |
| `GET/PATCH/DELETE` | `/api/v1/users/:id` | admin | Soft delete |
| `GET` | `/api/v1/products[?query]` | – | Public list/detail |
| `POST/PATCH/DELETE` | `/api/v1/products[/:id]` | admin, staff | Zod-validated, soft delete |

## 11. Conventions

- Files: `kebab` irrelevant — module files are `<name>.<layer>.ts`. Imports use `.js` suffixes (required by `moduleResolution: nodenext`).
- Path alias `@/* → src/*` configured (relative `./src/*`, TS-5-compatible).
- Commits: `feat:`, `fix:`, `chore:`, `docs:`. Pre-commit runs `eslint --fix` + `prettier` on `*.ts`.
- Never return `password`. Never trust client `role`/`isDeleted` — services force them.
- Env: copy `.env.example → .env`; `config/index.ts` is the single reader of `process.env`.

## 12. Verify (all passing 2026-09-10)

```bash
pnpm db:generate
pnpm exec tsc --noEmit   # clean
pnpm exec eslint .       # clean
pnpm test                # 3 passed (health, 404, validation envelope)
pnpm build && pnpm start # needs live DATABASE_URL, then: pnpm db:migrate && pnpm db:seed
```

## 13. Roadmap (next, in order)

1. `customer` module (profile CRUD on top of `Customer` model) + link on registration.
2. Refresh-token rotation + revocation list; login rate-limit tightening on `/auth/*`.
3. File upload (`multer`/`cloudinary`) for product images; `orders` module.
4. Pagination `cursor` option for large catalogs; Redis cache for `GET /products`.
5. CI (GitHub Actions: install → generate → lint → typecheck → test → build) + `Dockerfile`.
6. Central logger (`pino`) replacing `morgan`+`console`; request-id middleware.
