# VetMart — BagherHat Poultry ERP

Single-shop veterinary pharmacy ERP: Vendor → Purchase → Stock → POS Sale → Due/Cash → Payment → Reports.

Product name is **BagherHat Poultry (বাগেরহাট পোল্ট্রি)**. `VetMart` is the development codename only (repo/folder names) and must never appear in user-facing UI.

## Repo layout

```text
vetmart/
├── client/          # React 19 + Vite + Ant Design + Tailwind frontend
│   ├── prd.md       # Product intent (what/why)
│   └── src/         # features/, layouts/, router/, lib/, theme/
├── server/          # Express 5 + TypeScript + Prisma 7 + PostgreSQL backend
│   ├── src/app/modules/  # route → controller → service → prisma
│   ├── prisma/schema/    # Split PSL: base, user, catalog, inventory
│   └── docs/architecture.md
├── docs/
│   ├── srs.md       # Technical source of truth (models, rules, API)
│   ├── backlog.md   # Build order E1–E9
│   ├── epics/       # Per-epic specs
│   └── designs/
└── README.md        # This file
```

Doc chain: `client/prd.md` → `docs/srs.md` → `server/docs/architecture.md` → code. If PRD and SRS disagree, SRS wins.

## Stack

- **Client:** React 19, Vite 8, React Router 8, Ant Design 6, Tailwind 4, TanStack Query 5, Axios, Recharts. Currency: ৳ (BDT).
- **Server:** Express 5, TypeScript 5, Prisma 7 (`@prisma/adapter-pg` + `pg` Pool), PostgreSQL, Zod, JWT in HttpOnly cookies, Vitest + Supertest.
- **Package managers:** client uses npm, server uses pnpm 10 (`packageManager: pnpm@10.30.3`, Node >= 18).

## Prerequisites

- Node >= 18
- PostgreSQL database (server needs live `DATABASE_URL` for migrate/seed)
- pnpm 10 for `server/`, npm for `client/`

## Quickstart

```bash
# 1. Server
cd server
cp .env.example .env        # set DATABASE_URL, JWT secrets, CORS_ORIGIN
pnpm install                # postinstall runs prisma generate
pnpm db:migrate
pnpm db:seed                # upserts admin@vetmart.com / Admin123!
pnpm dev                    # http://localhost:5000, API at /api/v1

# 2. Client (new terminal)
cd client
npm install
cp .env.example .env.development
npm run dev                 # Vite dev server, /api proxied to :5000
```

Verify server after changes:

```bash
cd server
pnpm db:generate && pnpm exec tsc --noEmit && pnpm exec eslint . && pnpm test
```

## Environment

Client (`VITE_API_URL=http://localhost:5000/api/v1`):

| Var | Purpose |
|-----|---------|
| `VITE_API_URL` | Base URL of Express API (`/api/v1`) |

Server (see `server/.env.example`):

| Var | Purpose |
|-----|---------|
| `PORT` | Default `5000` |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` / `JWT_ACCESS_EXPIRES_IN` | Access-token signing |
| `JWT_REFRESH_SECRET` / `JWT_REFRESH_EXPIRES_IN` | Refresh-token signing + rotation |
| `BCRYPT_SALT_ROUNDS` | Password hashing cost |
| `CORS_ORIGIN` | Allowed frontend origin |
| `NODE_ENV` | `development` / `production` (Secure cookies, logging) |

Auth: HttpOnly `accessToken` + `refreshToken` cookies, frontend sends `withCredentials: true` and stores no token.

## Scripts

Client (`npm run …`): `dev`, `build` (`tsc -b && vite build`), `lint`, `preview`.

Server (`pnpm …`): `dev` (`tsx watch`), `build` (`tsc`), `start` (`node dist/server.js`), `lint`, `format`, `test` (`vitest run`), `db:generate`, `db:migrate`, `db:seed`, `db:studio`.

## Roles and access

Only staff log in. Customers and Suppliers never log in.

| Role | Access |
|------|--------|
| `admin` | Full: products, purchases, sales, payments, Reports, Audit Trail, users |
| `staff` (default) | POS, customer/supplier lookup + create, collection, product qty only. No Reports, no user management, no purchase costs/profit |

Key rules (enforced server-side, see `docs/srs.md` §6):

- Every sale requires a `customerId`. No anonymous sale.
- Single payment method per sale/GRN (`CASH`, `BKASH`, `NAGAD`, `CARD`); remainder becomes due. No split payments in v1.
- `POST /sales` and `POST /purchases` require client-generated `idempotencyKey`; `invoiceNo` is server-generated with unique-retry.
- POS deducts FIFO oldest-expiry-first, skips expired/empty lots; oversell and expired-only sales return `409`.
- No sale/purchase edit or partial return in v1 — full void by admin only (soft delete + compensating ledger entries).
- Audit Trail (`/audits`, admin-only) is read-only over existing rows; adds no tables.

## API (base `/api/v1`)

Health: `GET /health`. Envelope: `{ success, statusCode, message, meta?, data? }`.

| Area | Endpoints |
|------|-----------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh-token`, `POST /auth/logout`, `GET /auth/me` |
| Users | `POST /users`, `GET /users`, `GET/PATCH/DELETE /users/:id` (admin) |
| Products | `GET /products`, `POST/PATCH/DELETE /products[/:id]` |
| Sales / Purchases / Parties / Payments | See `docs/srs.md` §7 (planned/implementing per `docs/backlog.md` E1–E6) |
| Audits | `GET /audits/overview`, `GET /audits/events`, `GET /audits/events/:module/:id` (admin) |

Full contracts: `server/docs/architecture.md` §10.

## Build status

See `docs/backlog.md`. E9 (Audit Trail) implemented 2026-09-21. Build order: E1 Auth → E2 Parties → E3 Catalog → E4 POS Sale → E5 Payments → E6 Purchase → E7 Users → E8 Mobile shell (spec only).
