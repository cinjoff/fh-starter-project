# Phase 5: Documentation and Polish — Design Decisions

## Locked Decisions

### README.md Scope
**Decision:** Comprehensive README covering setup, features, tech stack, architecture, commands, env config, deployment, and extending guide.
**Why:** This is a starter template — the README is how developers evaluate and adopt it. Must sell the value and enable fast onboarding.

### Purpose Comments Strategy
**Decision:** Self-documenting code approach. Add concise header comments only to files where purpose isn't obvious from name/exports (supabase clients, proxy.ts, env.ts, action types, error boundaries). Skip trivial files (utils.ts, page.tsx).
**Why:** Helps both humans and LLMs understand the codebase without cluttering obvious files.

### robots.txt + sitemap
**Decision:** Next.js route handlers (app/robots.ts + app/sitemap.ts) instead of static files.
**Why:** Idiomatic Next.js approach, allows dynamic configuration, proxy matcher already excludes these paths.

## Deferred
- GETTING_STARTED.md (separate from README — not needed for v1)
- ADRs (architectural decision records)
- Contributing guide
