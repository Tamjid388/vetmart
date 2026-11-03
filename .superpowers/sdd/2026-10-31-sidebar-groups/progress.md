# SDD ledger — plan: docs/superpowers/plans/2026-10-31-sidebar-groups.md
- Pre-flight: Task1 produces MENU_GROUPS/ROUTE_GROUP_MAP/getAppMenuItems(grouped)/getFlatMenuItems/getMoreSheetSections; Task2 consumes getFlatMenuItems+grouped items for selectedKey; Task3 consumes getMoreSheetSections. No conflicts; signatures match plan.
- Ruling: skip git worktree + implement on main — user standing instruction forbids worktrees/moving session, requires direct local edits. Cost if wrong: pollutes main; mitigated by small scoped commits user pushes manually.
- Ruling: no unit test runner in client/package.json (no vitest/jest); verification = `npx tsc --noEmit` + `npm run lint` + `npm run build` + manual nav checks per plan. Cost if wrong: logic regressions caught only manually.
