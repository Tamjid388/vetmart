# Sidebar Grouped Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Group the desktop sidebar (and mobile More sheet) under 5 labeled sections without breaking roles, highlight, or titles.

**Architecture:** Keep flat `appMenuItems` as the single permission/title source; add a `MENU_GROUPS` order array + route-to-group map; `getAppMenuItems()` filters by role then wraps children in AntD `type: 'group'` items, dropping empty groups.

**Tech Stack:** React 19, TypeScript, Ant Design 6 `Menu type: 'group'`, react-router 8, Vite.

**Spec:** `docs/superpowers/specs/2026-10-31-sidebar-groups-design.md`

## Global Constraints
- Single permission source stays `appMenuItems` + `roles` in `client/src/layouts/appLayout/menuItems.tsx`.
- Never create git worktrees or move the session; edit directly in the local codebase, user pushes manually.
- Grouping: Overview: `/dashboard` — ইনভেন্টরি (Inventory): `/products`, `/categories`, `/purchases` — বিক্রি ও পার্টি (Sales & Parties): `/sales`, `/customers`, `/vendors`, `/payments` — ইনসাইটস (Insights): `/reports`, `/audits` — সিস্টেম (System): `/settings`, `/auth/login`.
- Empty groups must be hidden (staff view hides admin-only groups when all children filtered).
- No route, permission, or bottom-tab changes; no visual redesign beyond group labels.

## Review Focus
- Staff role (`role='staff'`) with admin-only items filtered must show no empty `ইনসাইটস (Insights)` header — expect header absent.
- Logged-out (`role=undefined`) must still show `লগইন (Login)` under `সিস্টেম (System)` — expect login visible.
- Deep route e.g. `/products/123` must still highlight `/products` in grouped sider — expect `selectedKeys=['/products']`.
- Collapsed sider (`collapsed=true`) must not crash or show orphan labels — expect AntD auto-hides group titles.
- Mobile More sheet overflow route e.g. `/vendors` must highlight and show under its group — expect grouped header + active row.

---

### Task 1: Grouped menu model in `menuItems.tsx`

**Files:**
- Modify: `client/src/layouts/appLayout/menuItems.tsx`
- Modify: `client/src/layouts/appLayout/index.ts`
- Test: manual via `tsc` (no unit runner in `client/package.json`)

**Interfaces:**
- Consumes: existing `appMenuItems: AppMenuItem[]`, `ADMIN_ONLY: string[]`, `BOTTOM_TAB_ROUTES: string[]`.
- Produces:
  - `export type MenuGroupKey = 'overview' | 'inventory' | 'salesParties' | 'insights' | 'system'`
  - `export const MENU_GROUPS: { key: MenuGroupKey; label: string }[]`
  - `export const ROUTE_GROUP_MAP: Record<string, MenuGroupKey>`
  - `export function getAppMenuItems(role?: string): AppMenuItem[]` (same signature, now returns `type: 'group'` wrappers)
  - `export function getFlatMenuItems(role?: string): AppMenuItem[]` (new, filtered flat list for `selectedKey`/`getPageTitle` use)
  - `export function getMoreSheetSections(role?: string): { groupLabel: string; items: MoreSheetRow[] }[]` (new)

- [ ] **Step 1: Write failing check — role-filtered grouping renders 5 groups for admin, 3-4 for staff**

  Since no test runner exists, add a temporary node check script (delete after) that imports the TS via `npx tsc` compiled output or asserts by reading file: simpler — verify current `getAppMenuItems('admin').length === 12` flat vs expected grouped `length === 5` with `type === 'group'`. Record current behavior:
  Run: `cd client && npx tsc --noEmit 2>&1 | head -20`
  Expected: PASS (baseline clean) — proves file compiles before change.

- [ ] **Step 2: Implement `MENU_GROUPS` + `ROUTE_GROUP_MAP` + grouped `getAppMenuItems()` in `client/src/layouts/appLayout/menuItems.tsx`**

  Exact labels: `Overview`, `ইনভেন্টরি (Inventory)`, `বিক্রি ও পার্টি (Sales & Parties)`, `ইনসাইটস (Insights)`, `সিস্টেম (System)`. Keep `appMenuItems` flat unchanged; filter by role first (existing logic incl. `/auth` hide when `role` truthy), then bucket by `ROUTE_GROUP_MAP`, then map in `MENU_GROUPS` order to `{ type: 'group' as const, key: groupKey, label: groupLabel, children: [...] }`, dropping groups with zero children.

- [ ] **Step 3: Add `getFlatMenuItems()` and refactor `getPageTitle()` + `getMoreSheetItems()` to use it**

  `getFlatMenuItems(role)` = current filter logic extracted verbatim. `getPageTitle(pathname)` searches `appMenuItems` (unfiltered, unchanged behavior). Add `getMoreSheetSections(role)` that calls `getFlatMenuItems`, excludes `BOTTOM_TAB_ROUTES`, buckets by group, drops empties. Keep legacy `getMoreSheetItems(role): MoreSheetRow[]` delegating to flattened sections for backward compat.

- [ ] **Step 4: Export new symbols from `client/src/layouts/appLayout/index.ts`**

  Add `MENU_GROUPS, ROUTE_GROUP_MAP, getFlatMenuItems, getMoreSheetSections` to export list; add `MenuGroupKey` to type exports.

- [ ] **Step 5: Verify compile + lint**

  Run: `cd client && npx tsc --noEmit`
  Expected: PASS with no errors.

  Run: `cd client && npm run lint 2>&1 | tail -20`
  Expected: PASS (no new errors in touched files).

- [ ] **Step 6: Commit**

  ```bash
  git add client/src/layouts/appLayout/menuItems.tsx client/src/layouts/appLayout/index.ts
  git commit -m "feat: group sidebar menu items under labeled sections"
  ```

### Task 2: Fix desktop `AppLayout` selection for grouped shape

**Files:**
- Modify: `client/src/layouts/appLayout/AppLayout.tsx`

**Interfaces:**
- Consumes: `getAppMenuItems(role)` (grouped), `getFlatMenuItems(role)` (flat) from Task 1.
- Produces: unchanged component signature `AppLayout()`; `selectedKey: string` still a route key.

- [ ] **Step 1: Reproduce selection bug — grouped `menuItems.find(item.key)` misses nested routes**

  Manual check: after Task 1, `menuItems` top-level keys are `overview|inventory|...`, so existing `menuItems.find(item.key startsWith pathname)` returns undefined and falls back to `/dashboard` for e.g. `/products`. Note this in code comment.

- [ ] **Step 2: Implement flat-based `selectedKey` in `client/src/layouts/appLayout/AppLayout.tsx`**

  Import `getFlatMenuItems`; compute `const flatItems = getFlatMenuItems(user?.role)`; compute `selectedKey` from `flatItems.find(...)` with existing `startsWith` logic. Keep `items={menuItems}` (grouped) on `<Menu>`. No other prop changes.

- [ ] **Step 3: Verify compile + visual check**

  Run: `cd client && npx tsc --noEmit`
  Expected: PASS.

  Run: `cd client && npm run dev` then open `/products/123` (or any deep route), `/vendors`, `/reports` as admin and staff; confirm correct item highlighted and group header visible; collapse sider and confirm no crash.

- [ ] **Step 4: Commit**

  ```bash
  git add client/src/layouts/appLayout/AppLayout.tsx
  git commit -m "fix: sidebar selection for grouped menu shape"
  ```

### Task 3: Group mobile `MoreSheet` by same sections

**Files:**
- Modify: `client/src/layouts/appLayout/mobile/MoreSheet.tsx`

**Interfaces:**
- Consumes: `getMoreSheetSections(role)` from Task 1; existing `MoreSheetRow` type.
- Produces: unchanged props `{ open: boolean; onClose: () => void }`.

- [ ] **Step 1: Replace flat `rows` with grouped sections**

  In `client/src/layouts/appLayout/mobile/MoreSheet.tsx`, replace `const rows = getMoreSheetItems(...)` with `const sections = getMoreSheetSections(user?.role)`. Render: for each section with `items.length > 0`, output a group title (`Typography.Text type="secondary"` small) followed by existing `<List dataSource={section.items} ...>` block (reuse same `renderItem` with `isActive` `startsWith` logic and `go(key)`).

- [ ] **Step 2: Verify compile + mobile check**

  Run: `cd client && npx tsc --noEmit`
  Expected: PASS.

  Run: `cd client && npm run build 2>&1 | tail -10`
  Expected: PASS (vite build succeeds).

  Manual: resize to mobile (`useIsMobile`), open আরও (More), confirm groups appear, empty admin groups hidden for staff, active route highlighted.

- [ ] **Step 3: Commit**

  ```bash
  git add client/src/layouts/appLayout/mobile/MoreSheet.tsx
  git commit -m "feat: group mobile more-sheet by sidebar sections"
  ```
