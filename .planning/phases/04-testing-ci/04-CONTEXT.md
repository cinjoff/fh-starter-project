# Phase 4: Testing and CI — Design Decisions

## Locked Decisions

### Vitest Setup
- Environment: `jsdom` for React component testing
- Plugins: `@vitejs/plugin-react` for JSX, `vite-tsconfig-paths` for `@/` aliases
- Coverage: `@vitest/coverage-v8` provider configured in vitest.config
- Test location: `src/tests/` for unit/component tests
- Example unit test: `dates.test.ts` (formatDate, formatRelative)
- Example component test: `submit-button.test.tsx` (renders, shows pending state)

### Playwright Setup
- Run against dev server via `webServer` config
- Base URL: `http://localhost:3000`
- Test unauthenticated flows only (home page loads, 404 page)
- Auth flow tests skipped — Supabase is optional dependency
- Test location: `e2e/`

### GitHub Actions
- Single `ci.yml` workflow
- Pipeline: install → lint (biome check) → typecheck → vitest
- Playwright skipped in CI (needs running server + optional Supabase)
- Runs on push to main + PRs
- Node 22, pnpm

### Release Please
- Type: `node` (package.json version bumps)
- Conventional commits (already enforced via commit conventions)
- Generates CHANGELOG entries + GitHub releases
- Config: `release-please-config.json` + `.release-please-manifest.json`

## Deferred
- Playwright in CI (requires Supabase test environment)
- Visual regression testing
- Test coverage thresholds / enforcement
