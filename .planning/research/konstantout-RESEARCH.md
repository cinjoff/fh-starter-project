# konstantout Research

**Repo:** `cinjoff/konstantout` (private)
**Author:** Konstantin Indjov
**License:** MIT

## What Is It?

Privacy-first personal life-management app ("second brain"). Journals, tasks, media tracking (books, movies, podcasts, articles, music), people/contacts, and a social graph -- all in one unified interface. Tagline: "Out of your head. Into your system."

Local-first architecture using Automerge CRDT stored in IndexedDB, with Supabase cloud sync for cross-device access.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS 4, Shadcn-ui (new-york style, neutral base), Phosphor Icons |
| Data | Automerge CRDT + IndexedDB (local-first), Supabase (auth + Realtime sync) |
| Queries | TanStack Query, TanStack Virtual |
| Animation | Motion (framer-motion successor) |
| AI | Claude Haiku (entry analysis pipeline), OpenAI Realtime (voice transcription) |
| Search | Fuse.js (fuzzy), HuggingFace Transformers (embeddings) |
| Testing | Vitest + Testing Library + MSW, Playwright (E2E) |
| Formatting | Prettier (single quotes, no semis, trailing commas, tailwind plugin) |
| Linting | ESLint (next/core-web-vitals) |
| Git hooks | Husky + lint-staged (currently disabled, exit 0) |
| Package manager | pnpm 10.26.2 |
| Fonts | Geist Sans (primary), Space Grotesk (logo), Instrument Serif (accents) |

## Project Structure

```
src/
  actions/        Server actions with withAuth() helper
    helpers.ts      Auth helper
    people.ts       People CRUD
    profile.ts      User profile
    social-*.ts     Social graph (links, profile)
    sharing.ts      Entry sharing
    inbox.ts        Notifications
    relay.ts        Offline sync relay
    api-keys.ts     External API keys
  app/            Next.js app router
    app/            Authenticated pages (home, capture, upcoming, inbox, library, settings)
    u/[handle]/     Public profile pages
    s/[token]/      Public share pages (24h expiry)
    api/            API routes (capture, analyze-entry, pending-entries)
  automerge/      CRDT repo, sync, document schema
  components/
    ui/             Shadcn base + custom components (34 files)
    dashboard/      Dashboard views
    entry-form/     Entry creation
    filters/        Filter UI
    inbox/          Inbox list and cards
    journal/        Journal entries
    landing/        Landing page
    layout/         App layout
    library/        Media library
    login-form.tsx  Auth forms
    people/         Person dialogs, handle search, trust toggle
    projects/       Project views
    search/         Search UI
    settings/       Profile form, API keys, storage management
    sharing/        Share dialogs
    topics/         Topic management
    unified/        Unified entry views
    upcoming/       Timeline/calendar views
  hooks/            TanStack Query hooks + custom hooks
    queries/        Read hooks
    mutations/      Write hooks
    useAutomergeAdapter.ts
    useDebounce.ts
    useEntryAnalysis.ts
    useIsMobile.ts
    useMediaEnrichment.ts
    usePaginatedFeed.ts
    usePeople.ts
    useStreamingVoiceRecorder.ts
    useSyncStatus.ts
    useVirtualList.ts
  lib/              Business logic
    entry-analyzer.ts      AI analysis pipeline
    media-enrichment.ts    External media API integration
    hybrid-search.ts       Fuzzy + vector search
    vector-store.ts        Embedding storage
    share-sync.ts          Share synchronization
    backup.ts              Data backup
    pending-entries.ts     Offline capture resilience
  providers/        React context providers
    EmbeddingProvider.tsx
    EntryUpdateProvider.tsx
    InboxProvider.tsx
    ReactQueryProvider.tsx
  storage/          Automerge adapter + schema definitions
    schema/           CRDT document schema, shared types
    migration/        Data migrations
    supabase/         Supabase storage integration
  utils/            Utility functions
    tailwind.ts       cn() class merging
    date.ts           Date formatting (no toISOString for date-only!)
    date-grouping.ts  Temporal grouping
    env.ts            Environment config
    errors.ts         Error types
    error-reporting.ts Error tracking
    fuzzyMatch.ts     Fuzzy matching
    media-helpers.ts  Media utilities
    topic-utils.ts    Topic helpers
    type-guards.ts    TypeScript guards
```

## Key Patterns and Conventions

### Code Style
- TypeScript strict mode, server components by default
- `'use client'` only when needed
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- 500-line file size limit
- No emojis in code or UI
- Force dark mode only (no theme toggle)
- `cn()` utility from `@/utils/tailwind` for className merging
- Path alias: `@/*` maps to `./src/*`

### Formatting (Prettier)
- Single quotes, no semicolons, trailing commas
- 2-space tabs, 80 char print width
- Tailwind class sorting plugin

### Automerge-Specific Rules
- Never assign `undefined` to Automerge fields (use conditional spread or `null`)
- To clear optional fields, use `delete entry.field` (not `= undefined`)
- In-place mutations only (no object spread)

### Date Handling
- Never use `toISOString()` for date-only strings -- use `formatDateString()` from `@/utils/date`

### Auth Pattern
- Server actions use `withAuth()` helper from `@/actions/helpers`
- Supabase server client: `import { createClient } from '@/supabase/server'` (async)
- Supabase client: `import { createClient } from '@/supabase/client'` (sync)
- Never store client globally; create fresh per function

### Next.js 16 Specifics
- Uses `proxy.ts` (not middleware.ts) for auth session updates
- `cookies()`, `headers()`, `params` must be awaited
- Turbopack as default dev bundler

### Testing
- TDD discipline: tests before implementation
- Vitest + Testing Library + MSW for unit/integration
- Playwright for E2E (auth via TEST_USER_EMAIL/TEST_USER_PASSWORD)
- Run `pnpm type-check` after cross-file refactors

### Quality Gates
- Verification-before-completion: require evidence, not assertions
- `/fh:critique` after frontend work

## Dependencies (Highlights)

### Production
- `next` ^16.1.6, `react` 19.2.3
- `@automerge/automerge` ^3.2.4 + repo + react-hooks + indexeddb storage
- `@supabase/supabase-js` ^2.98.0, `@supabase/ssr` ^0.8.0
- `@tanstack/react-query` ^5.90.21, `@tanstack/react-virtual` ^3.13.21
- `@phosphor-icons/react` ^2.1.10
- `@huggingface/transformers` 4.0.0-next.7 (client-side embeddings)
- `motion` ^12.35.1
- `date-fns` ^4.1.0
- `fuse.js` ^7.1.0 (fuzzy search)
- `sonner` ^2.0.7 (toasts)
- `vaul` ^1.1.2 (drawer)
- `react-markdown` + `remark-gfm`
- `geist` ^1.7.0 (font)
- `@vercel/analytics`, `@vercel/blob`
- Radix primitives: alert-dialog, checkbox, dialog, dropdown-menu, label, popover, progress, select, slot

### Dev
- `typescript` 5.9.3
- `tailwindcss` 4.1.18
- `eslint` 9.39.2, `eslint-config-next` 16.1.6
- `prettier` ^3.8.1 + tailwind plugin
- `vitest` ^2.1.9 + coverage-v8 + ui
- `@playwright/test` ^1.58.2
- `@testing-library/react` ^16.3.2, `@testing-library/dom`, `@testing-library/user-event`
- `msw` ^2.12.10
- `husky` ^9.1.7, `lint-staged` ^16.3.2
- `shadcn` ^3.8.5 (CLI)
- `jsdom` ^25.0.1

## Shadcn Configuration
- Style: new-york
- Base color: neutral
- CSS variables: enabled
- RSC: true
- Icon library: lucide (default, but Phosphor used in practice)
- Utils alias: `@/utils/tailwind`

## UI Components (src/components/ui/)

Shadcn base: alert-dialog, alert, badge, button, calendar, card, checkbox, dialog, drawer, dropdown-menu, input, label, popover, select, skeleton, table, textarea

Custom extensions: animated-section, compact-tag, delete-button, design-tokens, edit-button, filter-chips, markdown-content, media-image, responsive-selector, section-header, status-colors, task-checklist, thinking-indicator, type-indicator, view-switcher, voice-input-button

## Design System

- Dark mode only, OKLCH color space
- Petrol-tinted dark minimalism (subtle blue-teal hue ~220)
- "Ink on dark paper" aesthetic
- Brand accent: `oklch(0.55 0.09 210)` (deep petrol)
- 16px base type, 14px minimum, 1.5 line-height
- 8px spacing rhythm, 44px min touch targets
- Motion: reduced by default, functional only
- SVG noise texture on landing/auth pages only
- References: Linear, Arc, Things 3, Superhuman, By Parra

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SECRET_KEY
OPENAI_API_KEY
BLOB_READ_WRITE_TOKEN
```

## Database (Supabase)

- `profiles` -- user identity (handle, display_name, bio)
- `user_api_keys` -- external capture API keys
- `social_links` -- person-to-identity connections
- `share_grants` -- revocable share permissions
- `relay_queue` -- buffered Automerge sync messages (24h TTL)
- `inbox_items` -- notifications (7d expiry)
- `share_tokens` -- one-time share URLs (24h expiry)

## Planning Structure

```
.planning/
  STATE.md        Current position, decisions, session continuity
  PROJECT.md      Architecture, requirements, key decisions
  DESIGN.md       Brand, aesthetic, color system, typography
  MILESTONES.md   Project milestones
  ROADMAP.md      Feature roadmap
  config.json     Planning configuration
  archive/        Historical plans
  codebase/       Codebase analysis
  milestones/     Milestone details
  phases/         Phase breakdowns
  quick/          Quick references
  research/       Research notes
  todos/          Task tracking
```

## Key Differences from fh-starter-project

| Aspect | konstantout | fh-starter-project |
|--------|------------|-------------------|
| Linting | ESLint + Prettier | Biome |
| Data layer | Automerge CRDT + IndexedDB | Supabase (direct) |
| Error tracking | Custom error-reporting utils | Sentry |
| State mgmt | TanStack Query + Automerge | TBD |
| Animation | Motion | None yet |
| Search | Fuse.js + HuggingFace embeddings | None yet |
| AI | Claude Haiku + OpenAI Realtime | None yet |
| Voice | OpenAI Realtime API | None |
| Social | Full social graph layer | None |
| Git hooks | Husky + lint-staged (disabled) | Husky (TBD) |
