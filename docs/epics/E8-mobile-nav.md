# E8 — Mobile shell + mobile product list

Depends on: E1 (auth + role gating), AppLayout + `menuItems.tsx` as built
SRS refs: n/a (responsive shell + presentation-only change, no API/business-logic change)
Design refs: `docs/designs/Bottom navigation.png` — 5 tabs: হোম, বিক্রি, স্টক, ক্যাশ (active, green pill), আরও; `docs/designs/stockpage.png` — mobile product/stock list (card list + bottom bar); `docs/designs/products.png` — desktop reference only
Scope v1: E8a (bottom tab shell, all routes) + E8b (**product list page only**, `/products`). All other pages keep existing desktop components on mobile (table horizontal scroll).

> Status: design only — no code changes in this epic. This file is the implementation spec for a future sitting. Single file, two sub-epics. Build order: **E8a → E8b** (E8b reuses E8a's `useIsMobile` breakpoint + bottom-bar content spacing).

## Non-goals (both sub-epics)

- No new pages, no route changes, no backend changes (`server/**`, `prisma/**` untouched).
- No redesign of desktop sidebar/header/tables/forms — desktop at `≥ 768px` stays pixel-identical.
- No mobile redesign for any page except `/products` (Sales, Payments, Customers, Vendors, Dashboard, etc. keep tables with horizontal scroll in v1).

## Design source (already provided — do not re-design)

- `docs/designs/Bottom navigation.png`: bottom bar, 5 items, active item = light-green rounded pill + green label, inactive = grey icon + label. Bengali labels.
- `docs/designs/stockpage.png` (mobile Stock / product list): compact header (logo + bell + avatar), title row `স্টক (Stock)` + count `১২৪ টি পণ্য` + green `+ পণ্য যোগ` button, full-width search, 3 filter chips in one scrollable row (`ক্যাটাগরি: সব`, `স্টক: সব ধরন`, `মেয়াদ: সক্রিয় মাত্র`), vertical card list with bottom tab bar visible. Each card: product name (bold) + company (grey), status badge top-right (same `StockBadge`/`ExpiryBadge` colors as desktop: green `স্টক আছে`, red `সংকটজনক`/`মেয়াদ শেষ`, yellow `মেয়াদ শেষ হচ্ছে`/`কম স্টক`); 2×2 meta grid (`ক্যাটাগরি`, `ব্যাচ নং`, `মেয়াদ (Expiry)` red when near/expired, `পরিমাণ (Stock)` bold + `টি`); edit/delete icon buttons bottom-right (same handlers as table row actions).
- `docs/designs/products.png`: desktop reference only. Sidebar from this screen is **not** rendered on mobile.

## Shared decisions (apply to both E8a + E8b)

- **Breakpoint:** `md` (`< 768px` = mobile). One shared `useIsMobile` hook so layout + bar + page switch never disagree (Tailwind `md:` + hook — pick implementation once in E8a, reuse in E8b).
- **Perf guardrail (no double API call):** `useProducts()` stays called **once** in `ProductsPage.tsx` (parent). `ProductTable` / `ProductCardList` / `ProductFilters` are pure presentational — props only, never fetch themselves. Mobile/desktop switch is a ternary (`{isMobile ? <CardList/> : <Table/>}`, only one mounted), never CSS-hide both. `queryKey` (`['products', params]`) is identical for both views, so breakpoint flips are re-renders from React Query cache, not refetches. Same rule applies to any future page: hooks in page, props in views.

---

## E8a — Bottom tab navigation (sidebar hidden on mobile)

### Goal

On mobile hide the desktop `Sider` entirely and navigate via a fixed bottom tab bar per `Bottom navigation.png`. No route, API, or business-logic changes.

### UX spec (locked)

1. **Sidebar:** `display: none` below `md`. No hamburger, no drawer version of the sider, no mini-rail on mobile.
2. **Bottom bar (mobile only):** `position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000`, height `64–72px` + `env(safe-area-inset-bottom)` padding. White bg, top border/divider, 5 equal tabs, min touch target `48×48px`.
3. **Tabs (fixed order, Bengali labels per design):**

   | # | Label (design) | Route | Active when pathname starts with |
   |---|---|---|---|
   | 1 | হোম (Home) | `/dashboard` | `/dashboard` |
   | 2 | বিক্রি (Sales) | `/sales` (list; POS entry `+ নতুন বিক্রি` stays inside the page, not a 6th tab) | `/sales` |
   | 3 | স্টক (Stock) | `/products` | `/products` |
   | 4 | ক্যাশ (Cash) | `/payments` | `/payments` |
   | 5 | আরও (More) | opens bottom sheet, does **not** navigate | — (opens `MoreSheet`) |

   Icons: Ant Design icons already in use (`DashboardOutlined/AppstoreOutlined`, `ShoppingCartOutlined`, `HomeOutlined/MedicineBoxOutlined`, `DollarOutlined/MoneyCollectOutlined`, `MenuOutlined`/`UnorderedListOutlined` for More — match stroke style of design, decide once).
   Active state: green pill background (`#DCFCE7`-ish) + green text (`#16A34A`-ish, from `theme.ts` / Tailwind `green-600`), exactly as in `Bottom navigation.png`. Reuse theme tokens, no hardcoded palette drift.
4. **More sheet (`আরও`):** AntD `Drawer placement="bottom"` (or `Modal`), lists everything **not** in the 4 primary tabs, reusing `getAppMenuItems(role)` filtering so staff never sees admin-only entries:
   `Customers (/customers)`, `Vendors (/vendors)`, `Purchases (/purchases, admin-only)`, `Reports (/reports, admin-only)`, `Settings (/settings)`, `Logout` (danger). Tapping a row navigates + closes the sheet. Sheet also shows user name/role line (same source as `AppHeader`: `useMe()`).
5. **Role gating:** single source of truth stays `getAppMenuItems(role)` in `menuItems.tsx`. Bottom tabs 1–4 are visible to all signed-in roles (all four routes are staff-accessible today); admin-only routes live exclusively in More. Do not fork a second permission list.
6. **Deep-route highlighting:** `/products/new`, `/products/:id`, `/sales/new`, etc. highlight the parent tab via prefix match (same `pathname.startsWith(key)` logic `AppLayout.tsx` uses today). `/customers/*`, `/vendors/*`, `/purchases/*`, `/reports/*`, `/settings` highlight nothing in the bar (or highlight More — decide once); the More sheet highlights the active row.
7. **Header on mobile:** keep `AppHeader` but compact — title (via existing `getPageTitle`), bell, avatar; search `Input` collapses to icon-expandable or moves below title (decide once). No sidebar toggle button on mobile.
8. **Content spacing:** `Content` gets `padding-bottom: calc(bottomBarHeight + safe-area + 16px)` below `md` so pagination / FAB / submit buttons are never covered. Desktop `margin: 24` unchanged. `ReactQueryDevtools buttonPosition="bottom-right"` must be moved/offset on mobile so it doesn't cover the bar (or render only on desktop).
9. **Safe-area:** respect `env(safe-area-inset-bottom)`; bar must not overlap iOS home indicator. No change to router (still `createBrowserRouter`); no scroll-restoration change.

### Affected folder structure (E8a — shell only)

Only `client/src/layouts/**`, `index.css`, optionally `theme/`. No `features/*` changes in E8a.

```
client/src/
├── layouts/
│   ├── index.ts                      # unchanged (re-export)
│   ├── appLayout/
│   │   ├── AppLayout.tsx             # MODIFY: render <Sider> only on desktop; render <BottomTabBar/> + <MoreSheet/> only on mobile; responsive Content padding
│   │   ├── menuItems.tsx             # MODIFY: add bottomTabs[] + moreSheetItems[] definitions reusing AppMenuItem + getAppMenuItems(role); add getBottomTabKey(pathname)
│   │   ├── AppHeader.tsx             # MODIFY: compact mobile variant (search collapse, smaller padding)
│   │   ├── VetMartLogo.tsx           # unchanged
│   │   ├── index.ts                  # MODIFY: export new components/hook
│   │   └── mobile/                   # NEW folder
│   │       ├── BottomTabBar.tsx      # NEW: fixed bottom nav, 5 tabs, active pill, navigates via useNavigate/useLocation
│   │       ├── MoreSheet.tsx         # NEW: bottom Drawer with overflow links + logout, role-filtered
│   │       └── useIsMobile.ts        # NEW: single breakpoint hook (reused later by E8b; or reuse Grid.useBreakpoint — delete whichever isn't chosen)
│   ├── authLayout/                   # unchanged
│   └── ...
├── router/router.tsx                 # NO CHANGE expected (tabs navigate to existing routes)
├── theme/theme.ts + index.ts         # TOUCH ONLY IF active-pill token missing (prefer existing green tokens)
├── lib/brand.ts                      # unchanged
└── index.css                         # MODIFY (small): safe-area helper class + bottom-bar offset utility; no global redesign
```

### Implementation checklist (E8a)

- [ ] `layouts/appLayout/mobile/useIsMobile.ts` (new): single `md`-breakpoint hook.
- [ ] `layouts/appLayout/menuItems.tsx`: add `bottomTabDefs` (key, Bengali label, icon, route) + `getBottomTabKey(pathname)` (deep-route prefix match); derive More-sheet rows from existing `getAppMenuItems(role)` minus the 4 tabbed routes; keep `ADMIN_ONLY` filtering untouched.
- [ ] `layouts/appLayout/mobile/BottomTabBar.tsx` (new): fixed bar, 5 tabs, `useLocation`/`useNavigate`, `aria-current` + `role="tablist"`, active pill per design, `More` tab opens sheet instead of navigating.
- [ ] `layouts/appLayout/mobile/MoreSheet.tsx` (new): bottom `Drawer`, role-filtered rows + user line + logout (reuse `useLogout`, `useMe`); close on navigate.
- [ ] `layouts/appLayout/AppLayout.tsx`: `Sider` hidden below `md`; content `marginLeft` only on desktop; `Content` bottom padding on mobile; render bar + sheet only on mobile.
- [ ] `layouts/appLayout/AppHeader.tsx`: compact mobile variant (title + bell + avatar; search icon-expandable).
- [ ] `layouts/appLayout/index.ts`: export new pieces.
- [ ] `index.css`: safe-area + content-offset utilities only.

### Done when (E8a)

- [ ] Desktop pixel-identical to today at `≥ 768px`; mobile shows zero sidebar chrome and the 5-tab bar per `Bottom navigation.png`
- [ ] All 5 tabs navigate; deep routes highlight parent tab; More sheet lists correct role-filtered rows (staff sees no Purchases/Reports); no content hidden behind bar; no horizontal overflow on 360×800 + 390×844

---

## E8b — Product list mobile design (`/products`, per `stockpage.png`)

Depends on: **E8a** (needs `useIsMobile` + bottom-bar spacing; otherwise independent).

### Goal

Give `/products` (Stock) a mobile card-list layout per `stockpage.png`, presentation-only. Same data, filters, pagination, and actions as desktop `ProductsPage.tsx`. Desktop (`≥ 768px`) keeps `Card > ProductFilters + ProductTable` exactly as today.

### UX spec (locked)

1. **Title row:** `স্টক (Stock)` + product count (`১২৪ টি পণ্য` = `total` from `useProducts`) on the left, green `+ পণ্য যোগ` primary button on the right (`navigate('/products/new')`; staff sees it too — create route is staff-allowed today).
2. **Search:** full-width `Input` on its own row (same `filters.search` value/handler as `ProductFilters` — reuse state, don't fork filter logic).
3. **Filter chips:** the 3 existing `Select`s (category / stockStatus / expiry) rendered as compact pill selects in one horizontally scrollable row (`overflow-x-auto`, no wrap); Reset becomes an icon-only button at the row end. Options, defaults (`DEFAULT_PRODUCT_FILTERS`), and `onChange` wiring unchanged.
4. **List:** below `md`, replace `ProductTable` with `ProductCardList` — one `Card` per product, same order as table rows. Separate presentational component (not a Table restyle — AntD `<Table>` DOM can't morph into cards cleanly; see Shared decisions). Card content:
   - Header: `product.name` (bold) + manufacturer/company line (grey, small); status badge top-right via existing `ProductStatusCell` logic (`StockBadge` / `ExpiryBadge` — reuse, don't restyle colors).
   - Meta grid: `ক্যাটাগরি` → `getCategoryName(product)`; `ব্যাচ নং` → first/nearest batch no. (same source the desktop row uses — decide once: earliest-expiry batch vs first lot); `মেয়াদ (Expiry)` → earliest expiry date, red text when Near/Expired; `পরিমাণ (Stock)` → `getTotalStock(product)` bold + `টি` suffix.
   - Footer: view/edit/delete icon buttons right-aligned, same callbacks as table (`onView` → `/products/:id`, `onEdit` → `/products/:id/edit`, `onDelete` → existing confirm modal). Cost fields never render for staff (same `showCost={isAdmin}` rule as table; cards show qty/selling only).
5. **States:** loading (skeleton cards), error (`Alert` + Retry, same as desktop), empty, and stale-dim on background refetch (`isPlaceholderData`/`isFetching` — same flags passed to table today) all mirrored in the card list.
6. **Pagination:** same `page`/`PAGE_SIZE`/`total`/`onPageChange` state; compact pagination centered above the bottom bar with Bengali total text per design (`দেখানো হচ্ছে ১ থেকে ৮ / মোট ১২৪ টি পণ্য`).
7. **Switching:** reuse E8a's `useIsMobile`, e.g. `{isMobile ? <ProductCardList/> : <ProductTable/>}` inside `ProductsPage.tsx`; `ProductFilters` gets a `variant: 'desktop' | 'mobile-chips'` prop (or a `ProductFilterChips` wrapper reusing its state) — decide once at build. Data hook stays in the page (see Shared decisions — no double fetch).

### Affected folder structure (E8b — products only)

Reuses E8a's `layouts/appLayout/mobile/useIsMobile.ts`. Nothing else in `layouts/` changes in E8b.

```
client/src/features/products/
├── pages/ProductsPage/ProductsPage.tsx        # MODIFY: render ProductCardList instead of ProductTable below md; title/count/+পণ্য যোগ header row on mobile
└── components/
    ├── ProductTable/ProductTable.tsx          # unchanged (desktop only)
    ├── ProductFilters/ProductFilters.tsx      # MODIFY: add mobile-chips variant (or new wrapper reusing its state/handlers)
    ├── ProductCardList/                       # NEW folder (mobile only, presentational — no data fetching inside)
    │   ├── ProductCardList.tsx                # NEW: maps data[] → ProductCard, mirrors table loading/error/stale/pagination states
    │   ├── ProductCard.tsx                    # NEW: single card per stockpage.png (meta grid + StockBadge/ExpiryBadge + edit/delete actions)
    │   └── index.ts                           # NEW: barrel export
    ├── StockBadge/ + ExpiryBadge/             # unchanged, reused by cards
    └── utils/ (productStatus, getTotalStock, getEarliestExpiry) # unchanged, reused by cards
```

Explicitly out of scope for E8b: other `features/*` pages, `server/**`, `prisma/**`.

### Implementation checklist (E8b)

- [ ] `features/products/components/ProductCardList/ProductCard.tsx` (new, presentational): card per `stockpage.png` — name, company, category/batch/expiry/qty grid, `StockBadge`/`ExpiryBadge` reuse, `showCost={isAdmin}` honored, edit/delete icon buttons wired to same handlers as table. No hooks that fetch.
- [ ] `features/products/components/ProductCardList/ProductCardList.tsx` (new, presentational): list wrapper — loading skeletons, error/empty states, stale-dim, compact pagination; same `data/page/pageSize/total/onPageChange` props as `ProductTable`.
- [ ] `features/products/components/ProductFilters/ProductFilters.tsx`: mobile-chips variant (scrollable pill row + icon reset), same filter state/options.
- [ ] `features/products/pages/ProductsPage/ProductsPage.tsx`: mobile header row (title + count + `+ পণ্য যোগ`), `{isMobile ? CardList + Chips : Card + Filters + Table}` switch (ternary — only one view mounted); no change to `useProducts`/mutations/filter logic.

### Done when (E8b)

- [ ] `/products` on mobile matches `stockpage.png`: title + count + add button, full-width search, scrollable chips, cards with correct badges/actions, pagination above the bar; staff cards hide costs
- [ ] No double fetch: single `useProducts` in page, breakpoint flip causes re-render from cache only (verify in Network tab)

---

## Combined verify + Deferred

- [ ] Spec reviewed against `Bottom navigation.png` + `stockpage.png` (tab order, labels, active pill, More behavior, product card fields agreed)
- [ ] Build sitting: `tsc -b` + `eslint .` + `vite build` green; manual on 360×800 + 390×844 (Chrome device toolbar + one real device); role gating verified staff vs admin on a phone viewport
- [ ] Deferred: mobile card layouts for pages other than `/products`; badge counts on tabs (e.g. due payments); push notifications; PWA install prompt; landscape-tablet (`md–lg`) tuning beyond the single `md` breakpoint
