# VetMart — Product Requirements Document (PRD)

**Version:** 0.4 (Simplified — SRS is source of truth)
**Last updated:** 2026-09-21
**Focus:** What to build and why (user-facing). All technical details live in `docs/srs.md`.
**UI reference:** MediCare-style Pharmacy ERP screens (Dashboard, Products, Purchases, POS, Customers, Vendors, Payments, Reports)

> **Source-of-truth rule:** This PRD describes product intent only. `docs/srs.md` is the single technical source of truth (roles, models, relations, fields, thresholds, API, business-rule enforcement). If anything here ever disagrees with the SRS, the SRS wins.

---

### 1. Product Overview

- **Product name:** BagherHat Poultry (বাগেরহাট পোল্ট্রি) — veterinary poultry pharmacy ERP. `VetMart` is the development codename only (repo/asset names) and must never appear in user-facing UI.
- **What it is:** A single-shop veterinary pharmacy ERP — vendor purchases, POS sales (cash/due), customer and vendor dues, stock with batch and expiry, payments, and reports.
- **Why:** Replace notebook-based tracking of purchases, sales, dues, and stock with one system.
- **How it flows:** Vendor → Purchase → Stock → POS Sale → Due/Cash → Payment → Reports.

---

### 2. Goals

- Clear Vendor → Purchase → Stock → POS → Due → Payment → Reports flow in UI.
- Fast counter checkout with customer lookup, discount, VAT, and Cash / bKash / Nagad / Card.
- Customer management by area and category with visible dues.
- Vendor directory with outstanding balances.
- Owner dashboard for sales, purchases, dues, stock alerts, and profit.
- Clickable prototype with mock data for client demo (backend comes after approval).

---

### 3. Users

**Log in (staff only):**

- **Admin / Owner** — full access including Reports Console, costs, profit, user management.
- **Staff / Counter** — POS, customer and vendor lookup and creation, product search (quantity only, no cost or profit), due collection. No Reports Console, no user management.

Future roles (Manager, Accountant) are out of scope for v1. See SRS Section 1.

**Do not log in (records created by staff):**

- **Customer** — buyer for POS sales and due tracking.
- **Supplier / Vendor** — distributor for purchase entry and payable tracking.

No customer portal, no vendor portal. All field and rule details are in SRS Sections 4–6.

---

### 4. Scope

**In scope (prototype):**

| # | Screen | Purpose |
|---|--------|---------|
| 1 | Dashboard | KPIs, charts, due progress, low-stock and expiry alerts |
| 2 | Product Catalog | Search, filters, table, Add Product |
| 3 | Add Product | Medicine and feed specs, prices, VAT, batch, expiry, min stock |
| 4 | Vendor Purchases | Invoice list with Paid / Partial / Due, Add Purchase |
| 5 | Live POS Terminal | Product search, cart, customer select (required), payment |
| 6 | Customers Database | Area filter, category, due, detail panel |
| 7 | Supplier Directory | Outstanding, detail panel, settlement history |
| 8 | Cash Ledger and Payments | Customer vs Vendor tabs, Record Payment |
| 9 | Reports Console | Sales, Purchase, Profit, Due, Stock, Expiry (Admin only) |
| 10 | Audit Trail | Who did what and when across sales, purchases, payments, stock, and users (Admin only, read-only) |

Also in scope: shared shell (sidebar, search, notifications, profile), BDT currency (৳), loading and empty and error states, desktop-first layout.

**Out of scope:**

- Real backend, auth enforcement, payment gateways, multi-branch, SMS reminders, scanner hardware, full accounting export. UI placeholders only.

---

### 5. Features (user-facing only)

#### App Shell and Navigation

Dashboard, Products, Purchases, Sales/POS, Customers, Vendors, Payments, Reports (Admin only), Audit (Admin only), Settings, Logout. Header with search, notifications, and user profile.

#### Dashboard

KPI cards (Today's Sales, Purchase, Collection, Due, Total Customer Due, Total Vendor Due, Stock Value, Today's Profit) plus sales charts, due progress, low-stock and near-expiry tables. Alert thresholds are defined in SRS, not here.

#### Products

Catalog search and filters (category, stock status, expiry), product table, Add Product form (name, category, unit, purchase and selling price, min stock, VAT, description, batch, expiry, stock). Status badges (In Stock, Low Stock, Critical, Near Expiry, Expired) follow SRS rules.

#### Purchases

Invoice list with Total, Paid, Due and Paid / Partial / Due badges. Filters by vendor, date, and status. Add Purchase form details after client feedback.

#### Sales / POS

- Product search and category pills, Add to cart, quantity steppers.
- Customer is required for every sale. If the customer does not exist, staff adds them first, then completes the sale. No anonymous walk-in sale.
- Panel shows Subtotal, Discount, VAT, Grand Total.
- Payment methods: Cash, bKash, Nagad, Card. Unpaid remainder becomes customer due.
- Complete Sale CTA plus staff own-today summary (not full reports).

#### Customers

Search by name or phone, filter by area, Add Customer, due highlighted when above zero, detail panel with contact, area, category, and recent invoices.

#### Vendors / Suppliers

Search, outstanding filter, Add Vendor, list with purchased, paid, and outstanding totals, detail panel with purchase log and settlement history.

#### Payments

Customer Payments and Vendor Payments tabs, Record Payment, filters by invoice, customer, method, and date. Method badges for Cash, bKash, Nagad, and Card.

#### Reports (Admin only)

Sales, Purchase, Profit, Customer Due, Vendor Due, Stock, and Expiry reports with period and area filters and CSV export button (UI only in prototype). Staff sees only own POS summary and single-customer due, never shop-wide reports. Full access matrix is in SRS.

#### Audit Trail (Admin only)

Overview cards (sales, purchases, payments, stock, users) plus a unified activity log: every sale, purchase, void, payment collection, stock movement, and user/master add or removal — with who did it, when, and a detail view. Filter by module, action, and date; search by invoice, email, name, or batch. Read-only: nothing can be created, edited, or deleted from here, and staff never sees it. Full source and exclusion details are in SRS Section 4.15.

#### Settings

Placeholder: profile, shop info, defaults, roles.

---

### 6. User Stories

- As an owner, I want dashboard health at a glance so that I can run the shop.
- As an owner, I want purchases with paid, partial, and due status so that costing and vendor dues stay correct.
- As staff, I want fast POS with required customer, discount, VAT, and instant payment methods so that checkout is quick.
- As an owner, I want per-customer dues with collection via Payments so that no due is lost.
- As an owner, I want customers by area and category so that follow-up is easy.
- As an owner, I want low-stock and near-expiry alerts so that I restock in time.
- As an owner, I want Reports hidden from staff so that costs, profit, and shop-wide dues stay private.
- As an owner, I want an audit trail of who recorded, voided, or collected what so that staff activity stays accountable.
- As an owner, I want to filter the audit log by module, action, and date so that I can investigate a specific invoice, user, or day.
- As staff, I want own-today sales and single-customer due on POS so that I can sell without Reports.

---

### 7. Acceptance Criteria (UI)

- Dashboard renders KPI cards and alert tables; sidebar navigates to all modules.
- Catalog filters work; Add Product validates required fields; status badges appear.
- Purchases show Total, Paid, Due with correct badges and filters.
- POS requires a customer, recalculates totals, and completes a mock sale.
- Customers filter by area, highlight dues, and open a detail panel.
- Vendors show outstanding with purchase and settlement history.
- Payments tabs switch; Record Payment exists with method badges.
- Reports switch types, include area filter, show export button, and stay hidden from staff.
- Audit shows overview cards and a filterable activity log with detail view, is read-only, and stays hidden from staff.
- Exact calculations, stock deduction, and due math are defined in SRS Sections 6–7, not here.

---

### 8. User Flows

**Purchase:** Vendors/Purchases → Add Purchase → Select vendor → Add lines → Set Paid/Partial/Due → Save.

**Sale:** POS → Search and add to cart → Select or create customer (required) → Adjust quantity and discount → Choose Cash/bKash/Nagad/Card → Complete Sale → Due (if any) reflects on customer and Payments.

**Collection:** Customers (see Due) or Payments → Record Payment → Select invoice or customer → Amount and method → Save → Due reduces.

---

### 9. UI/UX Requirements

- Dark navy sidebar, light content, blue primary actions.
- Colors: green (Paid, In Stock, Active), orange (Partial, Low, Near Expiry), red (Due, Critical, Expired).
- Currency ৳ everywhere. Desktop-first, tablet-usable.
- States for loading, empty, error, success toast, and pagination.
- Brand: VetMart (reference screenshots say MediCare; adapt labels to veterinary terms after feedback).

---

### 10. Rules (summary — SRS governs)

- Only Admin and Staff log in. Customers and Suppliers never log in.
- Every sale needs a customer. No anonymous sale.
- Currency is BDT. Purchases and sales support Paid, Partial, and Due.
- POS takes Cash, bKash, Nagad, and Card; remainder goes to customer due.
- Costs, profit, and shop-wide dues are Admin-only.
- Audit Trail is Admin-only and read-only: it observes existing records and never creates, edits, or deletes.
- Stock and expiry alert thresholds, costing method gaps, void rules, and all enforcement details: see `docs/srs.md` Sections 6 and 9.

---

### 11. Non-Functional (prototype)

- Snappy lists and dashboard, target under 2s perceived load.
- No real auth in prototype; role-gating enforced in production per SRS.
- Latest Chrome, Edge, and Firefox on desktop. English UI; Bangla labels later.

---

### 12. Dependencies

None for prototype (mock data only). Backend API, auth, gateways, SMS, and real export come later.

---

### 13. Success Metrics

- Client approves core screens in demo.
- Mock POS sale completes in about a minute.
- Area filter plus customer and vendor dues are clearly understood.

---

### 14. Risks and Assumptions

- Single shop for v1. Screenshots guide the prototype. Vet taxonomy and Bangla copy need client confirmation.
- Due handling, partial payments, costing method (see SRS GAP-1), and invoice edit rights get confirmed after demo.
- Scope creep into full ERP before MVP approval is the main risk.

---

### 15. Milestones

```
Phase 1 → PRD + UI mapping        ← done
Phase 2 → Frontend prototype      ← current
Phase 3 → Client demo and feedback
Phase 4 → SRS lock (source of truth)
Phase 5 → Backend + integration
Phase 6 → Testing and production
```

---

## Document usage

```
PRD (this file) — what to build and why
  -> SRS (docs/srs.md) — single technical source of truth
    -> Architecture (server/docs/architecture.md) — how it is built
      -> Code — implementation
```
