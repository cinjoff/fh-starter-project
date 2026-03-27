# Coding Conventions

**Analysis Date:** 2026-03-27

## Naming Patterns

**Files:**
- Components: PascalCase with `.tsx` extension for React components (e.g., `LoginForm`, `ErrorBoundary`)
- Utilities: camelCase with `.ts` extension (e.g., `auth.ts`, `logger.ts`, `email.ts`)
- Pages: kebab-case matching URL structure in app router (e.g., `login/`, `dashboard/`)
- Server/API routes: kebab-case (e.g., `[...all]`, `sentry-local`)

**Functions:**
- camelCase for all functions (e.g., `handleSubmit`, `escapeHtml`, `sendEmail`, `formatDate`)
- Event handlers prefixed with `handle` (e.g., `handleSignOut`, `handleSubmit`)
- Query/getter functions may use `get` prefix (e.g., `getSession`, `getTestHelpers`)
- Boolean predicates may use `is` or `has` prefix (e.g., `authEnabled`)

**Variables:**
- camelCase for all variables and state
- State variables follow `[name, setName]` pattern (e.g., `const [mode, setMode] = useState(...)`)
- Constants in UPPER_SNAKE_CASE only when truly immutable (e.g., `LOCAL_DEV_SECRET`)
- Prefixes like `raw` or `safe` for data transformations (e.g., `rawRedirect`, `safeUrl`)

**Types:**
- PascalCase for all types and interfaces (e.g., `ErrorBoundaryProps`, `ErrorBoundaryState`, `Mode`, `LogAttributes`)
- Type aliases match capitalization (e.g., `type Mode = "sign-in" | "sign-up"`)
- Exported type names prefixed with `Session` for auth types (e.g., `Session`)

**Database/API:**
- Column names in snake_case in migrations/SQL but accessed as properties in JavaScript
- Example: `"organizationId"` (quoted in SQL, accessed as `orgId` in camelCase)

## Code Style

**Formatting:**
- Biome formatter enforces all formatting
- 2-space indentation
- 100-character line width
- LF line endings
- Command: `pnpm check` validates; `pnpm format` auto-fixes

**Linting:**
- Biome linter with recommended rules enabled
- `noUnusedVariables: "error"` - all unused vars must be removed
- `noUnusedImports: "error"` - all unused imports must be removed
- Tailwind CSS linting enabled via Biome CSS linter
- ESLint installed (v9) but Biome is primary tool

**Key Rules Enforced:**
- `correctness.noUnusedVariables` - fail on unused variables
- `correctness.noUnusedImports` - fail on unused imports
- `a11y.noLabelWithoutControl: off` - disabled for flexibility with shadcn labels

## Import Organization

**Order:**
1. External libraries (React, Next.js, third-party)
2. Type imports from external libraries
3. Path aliases starting with `@/` (absolute imports)
4. Relative imports (rare; prefer `@/` aliases)

**Example from `src/app/(auth)/login/login-form.tsx`:**
```typescript
import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
```

**Path Aliases:**
- `@/*` → `./src/*` (configured in `tsconfig.json`)
- Use absolute imports via `@/` for all application code
- Never use relative imports like `../../../lib`

## Error Handling

**Patterns:**
- Try/catch blocks wrap async operations (e.g., in `LoginForm.handleSubmit`)
- Errors are caught and user-friendly messages set to state or shown via toast
- Sentry captures exceptions: `Sentry.captureException(err)`
- Logger calls on error paths: `logger.error("Email send failed", { to, subject })`

**Example from `src/app/(auth)/login/login-form.tsx`:**
```typescript
try {
  // attempt sign-in or sign-up
} catch {
  toast.error("Something went wrong. Please try again.");
} finally {
  setLoading(false);
}
```

**Server-side:**
- Errors in auth hooks/layouts cause `redirect()` calls to public pages
- Email send errors call `Sentry.captureException()` and log via `logger.error()`

## Logging

**Framework:** Sentry logger (`@sentry/nextjs`)

**Import:**
```typescript
import { logger } from "@/lib/logger";
```

**Levels:** `trace`, `debug`, `info`, `warn`, `error`, `fatal`

**Patterns:**
- All application logging uses `logger.*()` instead of `console.log`
- Each log call sends to Sentry logs + breadcrumbs simultaneously
- Attributes must be `string | number | boolean` only — no objects, arrays, or undefined
- No console.log in production code (acceptable only in tests and sentry-local internals)

**Examples:**
```typescript
// Simple message
logger.info("Email sent (dev mode)", { to, subject });

// Error with context
logger.error("Email send failed", { to, subject });

// Auth events
Sentry.addBreadcrumb({ category: "auth", message: "User signed in", level: "info" });
```

**Sentry Context Management:**
- After successful auth: `Sentry.setUser({ id: session.user.id, email: session.user.email })`
- On sign-out: `Sentry.setUser(null)`
- Manual breadcrumbs for key events: `Sentry.addBreadcrumb({ category, message, level, data })`

## Comments

**When to Comment:**
- Complex logic requiring explanation
- Non-obvious algorithm choices
- Business rule justifications
- Workarounds or temporary solutions

**Avoided:**
- Self-explanatory code does not need comments
- Function signatures are type-safe and self-documenting

**JSDoc/TSDoc:**
- Used sparingly for public functions
- Example from `src/lib/email.ts`:
```typescript
/** Escape HTML special characters to prevent XSS in email templates. */
export function escapeHtml(str: string): string { ... }

/** Fire-and-forget email send. Logs to console in development when no RESEND_API_KEY. */
export function sendEmail({ to, subject, html }: { ... }): Promise<void> { ... }
```

## Function Design

**Size:**
- Functions kept under ~100 lines when possible
- Complex flows (like `handleSubmit` in forms) may be longer but remain readable
- Extracted utilities placed in `src/lib/`

**Parameters:**
- Destructured parameters with type annotations (e.g., `{ localAuthMode = false }: { localAuthMode?: boolean }`)
- Optional parameters use defaults (e.g., `localAuthMode = false`)

**Return Values:**
- Explicit return types on exported functions
- Arrow functions used for simple callbacks
- Async functions always return `Promise<T>`

**Example from `src/lib/auth.ts`:**
```typescript
function createAuth() {
  const isProduction = process.env.NODE_ENV === "production";
  // ... logic
  return instance; // Returns instance or null
}

export const auth = createAuth();
```

## Module Design

**Exports:**
- Named exports for utilities and functions (e.g., `export function escapeHtml`)
- Default exports for React components when only one per file
- Example from `src/components/error-boundary.tsx`:
```typescript
export class ErrorBoundary extends React.Component { ... }
export default ErrorBoundary;
```

**Barrel Files:**
- No barrel files (`index.ts` re-exports) in library modules
- Import directly from specific files: `import { logger } from "@/lib/logger"`
- Simpler for tree-shaking and understanding dependencies

**Single Responsibility:**
- One main export per file (e.g., `error-boundary.tsx` exports `ErrorBoundary`)
- Related utilities grouped (e.g., `email.ts` exports `escapeHtml` + `sendEmail`)

## React/Server Component Patterns

**Default: Server Components**
- Pages and layouts are server components by default
- Async layouts perform auth checks and redirect if needed
- Example from `src/app/(app)/layout.tsx`:
```typescript
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // Can use await on headers(), params, etc.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login?redirect=/dashboard");
}
```

**Client Components:**
- Marked with `"use client"` at top of file (e.g., `sign-out-button.tsx`, `login-form.tsx`)
- Used only when state, hooks, or interactivity needed
- Form components use React state for form data and error messages

**Zod Validation:**
- All external data validated with Zod schemas
- Environment variables defined in `src/lib/env.ts` with Zod
- Server action FormData parsed with Zod before use (not `as string` casts)
- Example from `src/lib/env.ts`:
```typescript
export const env = createEnv({
  server: {
    BETTER_AUTH_SECRET: z.string().min(32).optional(),
    DATABASE_URL: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().optional().default("http://localhost:3000"),
  },
});
```

---

*Convention analysis: 2026-03-27*
