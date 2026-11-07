# Refactoring code to packages/shared-lib

> The DRY ("Don't Repeat Yourself") and KISS ("Keep It Simple, Stupid") principles are core software engineering standards for writing clean, maintainable code.

Create `packages/shared-lib`, `packages/shared-lib/components`, and `packages/shared-lib/hooks`, then apply DRY and KISS principles to refactor [tasks-table](../../apps/web/components/tasks-table.tsx) so it is:

- Clean: easy to read
- Reusable: reusable when creating new tables
- Maintainable: easy to fix
