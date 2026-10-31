# Sidebar Grouped Navigation — Short Design

Date: 2026-10-31 | Approach picked: A (Domain-grouped)

## Intent / Why
Flat 11-item sidebar is hard to scan. Group under labeled sections so daily ops (Sales/Inventory) are visually separated from Insights/System.

## Goals
- Desktop `Sider` shows 5 labeled groups using AntD `Menu type: 'group'`.
- Role-filtering still works; empty groups hidden (staff never sees empty admin groups).
- Selected/highlight state keeps working for deep routes (`startsWith`).
- Mobile `MoreSheet` shows same groups for consistency.

## Non-goals
- No route, permission, or bottom-tab changes.
- No visual redesign (colors, widths, collapse behavior unchanged).
- No i18n framework; keep existing bilingual label pattern.

## Anti-goals
- Must not break `getPageTitle`, `BOTTOM_TAB_ROUTES`, or collapsed sider (group titles auto-hide by AntD).
- Must not leave empty group headers when role filters out all children.

## Constraints
- Single permission source stays `appMenuItems` + `roles` in `menuItems.tsx`.
- Existing files: `client/src/layouts/appLayout/menuItems.tsx`, `AppLayout.tsx`, `mobile/MoreSheet.tsx`.
- Never use worktrees; edit directly in local codebase.

## Approaches considered
- **A. Domain-grouped (picked):** Overview / Inventory / Sales & Parties / Insights / System. Scales, matches shop workflow.
- **B. Compact 3-group:** fewer headers but mixes inventory with sales; rejected (gets messy as menus grow).
- **C. Dividers only:** no text labels; rejected (doesn't meet "with label" request).

## Decided (Approach A grouping)
- Overview: `/dashboard`
- Inventory: `/products`, `/categories` [admin], `/purchases` [admin]
- Sales & Parties: `/sales`, `/customers`, `/vendors`, `/payments`
- Insights: `/reports` [admin], `/audits` [admin]
- System: `/settings`, `/auth/login` (login only when logged out)

## Left to builder
- Implementation detail: keep flat `appMenuItems` as source of truth + add `routeKey -> groupKey` map and `MENU_GROUPS` order array; `getAppMenuItems()` filters then groups into `{ type: 'group', label, key, children }`, dropping empty groups.
- Fix `AppLayout.tsx selectedKey`: currently `menuItems.find(item.key)` breaks on grouped items — must search flat source or flattened children.
- `getPageTitle()` keeps searching flat source (no change in behavior).
- `getMoreSheetItems()` returns grouped sections (or grouped rows); keep `BOTTOM_TAB_ROUTES` exclusion logic.
- Verify: admin sees all 5 groups, staff sees 3 (Overview, part of Inventory, Sales & Parties, System without admin items), logged-out sees Login under System.
