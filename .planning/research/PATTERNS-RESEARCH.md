# Starter Template Patterns Research

**Researched:** 2026-03-20
**Domain:** Production Next.js 16 starter template -- reusable patterns and components
**Confidence:** HIGH (verified via Next.js 16 local docs, shadcn/ui official docs, multiple web sources)

## Summary

This research covers the 10 most commonly needed "complex" patterns for a production Next.js starter template in 2026. The ecosystem has matured significantly: shadcn/ui's October 2025 release introduced a form-library-agnostic `<Field>` component, React 19's `useActionState` is the standard for server action forms, Sonner is the undisputed toast library, and `nuqs` has become the standard for URL state management (used by Sentry, Supabase, Vercel, Clerk).

The key architectural principle: a starter template should provide **patterns and examples**, not pre-built abstractions. Include the minimal reusable pieces (a form action helper, a toast wrapper, skeleton components) and documented examples showing how to compose them. Over-abstracting in a starter template creates friction -- teams will rip out opinionated wrappers.

**Primary recommendation:** Include patterns 1-6 and 10 in the starter template. Patterns 7-9 are best documented as examples in a cookbook/guide rather than as shipped code, since they are too app-specific.

---

## 1. Form Handling

**Recommendation:** React Hook Form + Zod + shadcn `<Field>` + `useActionState`
**Confidence:** HIGH

### Why This Stack

- **shadcn/ui shifted** (Oct 2025) from a tightly-coupled `<Form>` component to a form-library-agnostic `<Field>` layout primitive. The new `<Field>` handles labels, descriptions, errors, and orientation -- you bring your own form library.
- **React Hook Form** remains the dominant choice (30M+ weekly npm downloads) and shadcn/ui provides first-class integration guides for it.
- **TanStack Form** is the emerging alternative that shadcn also supports, but React Hook Form has a larger ecosystem, more community patterns, and is more battle-tested.
- **`useActionState`** (React 19) is the native way to handle server action form state, including pending states and error return values.

### Architecture Pattern

```
src/
  lib/
    actions/           # Server actions with Zod validation
      types.ts         # ActionState<T> type for consistent action responses
  components/
    ui/
      field.tsx        # shadcn Field component (layout primitive)
      input.tsx        # shadcn Input
      button.tsx       # shadcn Button with loading state
    forms/
      submit-button.tsx  # Reusable submit button with useFormStatus
```

### Key Patterns

**Server Action with Zod validation (from Next.js 16 docs):**
```typescript
'use server'
import { z } from 'zod'

// Consistent action response type
type ActionState<T = void> = {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  data?: T
}

const schema = z.object({
  email: z.string().email('Invalid email'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
})

export async function createUser(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const validated = schema.safeParse({
    email: formData.get('email'),
    name: formData.get('name'),
  })

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    }
  }

  // mutate data, revalidate cache
  return { success: true, message: 'User created' }
}
```

**Client form with useActionState (from Next.js 16 docs):**
```tsx
'use client'
import { useActionState } from 'react'
import { createUser } from '@/lib/actions/create-user'

export function CreateUserForm() {
  const [state, formAction, pending] = useActionState(createUser, { success: false })

  return (
    <form action={formAction}>
      <Field label="Email" error={state.errors?.email?.[0]}>
        <Input name="email" type="email" required />
      </Field>
      <SubmitButton pending={pending}>Create User</SubmitButton>
      {state.message && <p aria-live="polite">{state.message}</p>}
    </form>
  )
}
```

**When to add React Hook Form:** For complex multi-step forms, forms with dynamic fields, or when you need client-side validation before submission. For simple server action forms, native `useActionState` is sufficient.

### What to Include in Starter

- `ActionState<T>` type definition for consistent server action responses
- `SubmitButton` component using `useFormStatus`
- shadcn `<Field>` component (installed via shadcn CLI)
- One example: simple server action form with Zod validation
- One example: React Hook Form + shadcn Field for a more complex form

### Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| react-hook-form | ^7 | Client-side form state management |
| @hookform/resolvers | ^3 | Zod resolver for RHF |
| zod | (already in stack) | Schema validation |

```bash
pnpm add react-hook-form @hookform/resolvers
```

---

## 2. Toast / Notification System

**Recommendation:** Sonner
**Confidence:** HIGH

### Why Sonner

- 11,500+ GitHub stars, 7M+ weekly npm downloads
- **First-class shadcn/ui integration** -- shadcn provides a `<Sonner>` wrapper component
- 2-3KB gzipped, zero dependencies
- Can trigger toasts from anywhere (no hooks/context required): just call `toast('message')`
- Supports promise toasts (loading -> success/error), action buttons, custom JSX
- Accessible by default (ARIA live regions, keyboard navigation)

### Architecture Pattern

```
src/
  components/
    ui/
      sonner.tsx       # shadcn Sonner wrapper (from CLI)
  app/
    layout.tsx         # <Toaster /> placed here
```

### Key Pattern

```tsx
// In root layout
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster richColors closeButton />
      </body>
    </html>
  )
}

// Anywhere in your app (client components)
import { toast } from 'sonner'

// Simple
toast.success('Profile updated')
toast.error('Something went wrong')

// With server action
const handleSubmit = async (formData: FormData) => {
  const result = await createUser(formData)
  if (result.success) {
    toast.success(result.message)
  } else {
    toast.error(result.message)
  }
}

// Promise pattern
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save',
})
```

### What to Include in Starter

- Install sonner via shadcn CLI (`npx shadcn@latest add sonner`)
- `<Toaster>` in root layout
- Brief comment showing toast usage patterns

### Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| sonner | ^2 | Toast notifications |

```bash
npx shadcn@latest add sonner
```

---

## 3. Data Tables

**Recommendation:** @tanstack/table + shadcn Table -- provide a GUIDE, not a component
**Confidence:** HIGH

### Why This Approach

shadcn/ui's official position (from their docs): "Every data table is unique with specific sorting and filtering requirements. It doesn't make sense to combine all variations into a single component. Instead, we provide a guide on how to build your own."

A starter template should follow this philosophy. Include the shadcn `<Table>` primitives and a documented example, not a pre-built `<DataTable>` abstraction.

### Architecture Pattern

```
src/
  components/
    ui/
      table.tsx         # shadcn Table primitives (from CLI)
  app/
    examples/
      data-table/       # Example implementation
        columns.tsx     # Column definitions
        data-table.tsx  # Table component with TanStack Table
        page.tsx        # Page using the table
```

### Key Features to Demonstrate

- Column definitions with TypeScript
- Client-side sorting
- Client-side filtering
- Pagination
- Row selection (checkbox column)

### What to Include in Starter

- shadcn `<Table>` component (via CLI)
- **Optional:** One example data table in an examples section
- Do NOT create a generic `<DataTable>` wrapper component

### Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| @tanstack/react-table | ^8 | Headless table logic |

```bash
pnpm add @tanstack/react-table
npx shadcn@latest add table
```

---

## 4. Loading / Skeleton States

**Recommendation:** React Suspense + loading.tsx + shadcn Skeleton
**Confidence:** HIGH (verified against Next.js 16 local docs)

### Architecture Pattern

Next.js App Router has first-class support:

1. **`loading.tsx`** -- automatic Suspense boundary for route segments
2. **`<Suspense>`** -- granular boundaries for individual components
3. **shadcn `<Skeleton>`** -- visual placeholder components

```
src/
  app/
    dashboard/
      loading.tsx        # Route-level skeleton
      page.tsx           # Server component with data fetching
  components/
    ui/
      skeleton.tsx       # shadcn Skeleton primitive
    skeletons/
      card-skeleton.tsx  # Reusable skeleton compositions
```

### Key Patterns

**Route-level loading (loading.tsx):**
```tsx
// app/dashboard/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-[250px]" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  )
}
```

**Granular Suspense with async Server Components:**
```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { CardSkeleton } from '@/components/skeletons/card-skeleton'

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<CardSkeleton />}>
        <RevenueChart />  {/* async server component */}
      </Suspense>
      <Suspense fallback={<CardSkeleton />}>
        <RecentActivity />  {/* independent async component */}
      </Suspense>
    </div>
  )
}
```

### Best Practices (from Next.js 16 docs)

- Match skeleton shapes to actual content layout
- Each `<Suspense>` boundary streams independently -- sibling components don't block each other
- Use `loading.tsx` for full-page loading states, `<Suspense>` for granular component-level loading
- Prefer multiple small Suspense boundaries over one large one

### What to Include in Starter

- shadcn `<Skeleton>` component
- 2-3 reusable skeleton compositions (CardSkeleton, TableSkeleton)
- One `loading.tsx` example
- One Suspense boundary example in a page

```bash
npx shadcn@latest add skeleton
```

---

## 5. Modal / Dialog Patterns

**Recommendation:** shadcn Dialog + intercepting routes for URL-synced modals
**Confidence:** HIGH

### Two Patterns

**Pattern A: Simple Dialog (no URL state)**
For confirmations, small forms, settings. Use shadcn `<Dialog>`.

**Pattern B: URL-synced Modal (intercepting routes)**
For content that should be shareable/bookmarkable. Use Next.js parallel routes + intercepting routes.

### Architecture Pattern for URL-synced Modals

```
src/
  app/
    @modal/                    # Parallel route slot
      (.)items/[id]/           # Intercepts /items/[id]
        page.tsx               # Renders as modal overlay
      default.tsx              # Returns null (no modal by default)
    items/
      [id]/
        page.tsx               # Full page (direct navigation / refresh)
    layout.tsx                 # Renders {children} and {modal}
```

### Key Pattern

```tsx
// app/layout.tsx
export default function Layout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}

// app/@modal/default.tsx
export default function Default() {
  return null
}

// app/@modal/(.)items/[id]/page.tsx
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

export default function ItemModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const router = useRouter()
  return (
    <Dialog open onOpenChange={() => router.back()}>
      <DialogContent>
        <ItemDetail id={id} />
      </DialogContent>
    </Dialog>
  )
}
```

### What to Include in Starter

- shadcn `<Dialog>` component
- One example of simple dialog usage
- **Optional:** One example of intercepting route modal (can be complex for a starter)

```bash
npx shadcn@latest add dialog
```

---

## 6. Error Handling Patterns

**Recommendation:** Layered error handling with error.tsx + useActionState + Sonner
**Confidence:** HIGH (verified against Next.js 16 local docs)

### Three Error Layers

| Layer | Mechanism | Use Case |
|-------|-----------|----------|
| Route-level | `error.tsx` | Uncaught rendering errors, crashes |
| Form/action | `useActionState` return values | Validation errors, expected failures |
| Event handler | try/catch + `toast.error()` | Client-side operation failures |
| Global | `global-error.tsx` | Root layout crashes |

### Key Patterns from Next.js 16

**error.tsx (route-level boundary):**
```tsx
'use client'
import { useEffect } from 'react'

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    // Report to Sentry
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => unstable_retry()}>Try again</button>
    </div>
  )
}
```

**Component-level error boundary (Next.js 16 new API):**
```tsx
'use client'
import { unstable_catchError as catchError, type ErrorInfo } from 'next/error'

function ErrorFallback(
  props: { title: string },
  { error, unstable_retry: retry }: ErrorInfo
) {
  return (
    <div>
      <h2>{props.title}</h2>
      <p>{error.message}</p>
      <button onClick={() => retry()}>Try again</button>
    </div>
  )
}

export default catchError(ErrorFallback)
```

**Server action errors (return, don't throw):**
```typescript
// Expected errors: RETURN them
if (!validated.success) {
  return { success: false, errors: validated.error.flatten().fieldErrors }
}

// Unexpected errors: let them bubble to error boundary
// (or catch and report to Sentry)
```

**Event handler errors (toast):**
```tsx
const handleDelete = async () => {
  try {
    await deleteItem(id)
    toast.success('Item deleted')
  } catch (error) {
    toast.error('Failed to delete item')
    // Report to Sentry
  }
}
```

### What to Include in Starter

- Root `error.tsx` with Sentry reporting
- `global-error.tsx` for root layout crashes
- `ActionState<T>` type (shared with forms)
- Toast error pattern documented in an example

---

## 7. Date Handling

**Recommendation:** date-fns
**Confidence:** HIGH

### Why date-fns

- **Tree-shakeable**: Import only the functions you use (unlike Day.js which loads the whole library even if small)
- **TypeScript-first**: Better types than Day.js
- **Functional/immutable**: Every function takes a Date and returns a new Date -- aligns with React's immutability principles
- **Larger ecosystem**: More helper functions out of the box
- Bundle impact: Only ~2-5KB for typical usage (format, parseISO, differenceInDays, etc.)
- Day.js full bundle is 2KB, but once you add plugins (timezone, relative time, etc.) it grows

### What to Include in Starter

- Install date-fns as a dependency
- One utility file with common date formatting functions
- Do NOT create a date wrapper abstraction

```bash
pnpm add date-fns
```

### Example Utility

```typescript
// src/lib/dates.ts
import { format, formatDistanceToNow, parseISO } from 'date-fns'

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMM d, yyyy')
}

export function formatRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}
```

---

## 8. File Upload Patterns

**Recommendation:** Document the pattern, don't ship upload infrastructure
**Confidence:** MEDIUM

### Why Not in Starter

File upload is highly app-specific: Where do files go? S3? Supabase Storage? Cloudflare R2? UploadThing? The starter template cannot make this decision.

### What to Include

- **shadcn Input with type="file"** -- already covered by the Input component
- **Optional:** A drag-and-drop zone component using `react-dropzone` as an example
- Documentation pointing to UploadThing (full-stack upload service) and Supabase Storage (since Supabase is in the stack)

### If Including an Example

| Library | Purpose |
|---------|---------|
| react-dropzone | Headless drag-and-drop file input |

```bash
pnpm add react-dropzone
```

---

## 9. Pagination / Infinite Scroll

**Recommendation:** Document patterns, don't abstract
**Confidence:** MEDIUM

### Two Patterns

**Pattern A: Offset Pagination (most common for tables)**
Use URL search params with `nuqs` for page/limit state. Server component fetches data based on params.

**Pattern B: Cursor-based Infinite Scroll**
Use `@tanstack/react-query` with `useInfiniteQuery` + `react-intersection-observer`.

### Why nuqs for Pagination State

`nuqs` (Type-safe URL search params) is the standard for URL state in Next.js:
- Used by Sentry, Supabase, Vercel, Clerk
- Featured at Next.js Conf 2025
- Type-safe parsers (integers, booleans, dates)
- Works with both App Router and Pages Router
- Supports throttling/debouncing for search inputs

```bash
pnpm add nuqs
```

### Key Pattern (URL-based pagination)

```tsx
// app/items/page.tsx (server component)
import { searchParams } from 'nuqs/server'
import { parseAsInteger } from 'nuqs'

const pageParser = parseAsInteger.withDefault(1)
const limitParser = parseAsInteger.withDefault(10)

export default async function ItemsPage({
  searchParams: params,
}: {
  searchParams: Promise<Record<string, string | string[]>>
}) {
  const resolvedParams = await params
  const page = pageParser.parseServerSide(resolvedParams.page)
  const limit = limitParser.parseServerSide(resolvedParams.limit)

  const { items, total } = await getItems({ page, limit })

  return (
    <div>
      <ItemList items={items} />
      <Pagination page={page} total={total} limit={limit} />
    </div>
  )
}
```

### What to Include in Starter

- Install `nuqs` as a dependency (useful for any URL state, not just pagination)
- One pagination example in the examples section
- Do NOT build a generic pagination component -- too app-specific

---

## 10. SEO / Metadata

**Recommendation:** Next.js Metadata API (built-in) with template pattern
**Confidence:** HIGH (verified against Next.js 16 local docs)

### Architecture Pattern

```
src/
  app/
    layout.tsx           # Root metadata with template
    blog/
      layout.tsx         # Section-level metadata override
      [slug]/
        page.tsx         # Dynamic generateMetadata
        opengraph-image.tsx  # Dynamic OG image
  lib/
    metadata.ts          # Shared metadata helpers
```

### Key Patterns

**Root layout metadata template:**
```tsx
// app/layout.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL('https://example.com'),
  title: {
    default: 'My App',
    template: '%s | My App',  // Child pages: "Blog | My App"
  },
  description: 'Production-ready Next.js starter',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'My App',
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

**Dynamic metadata with generateMetadata (params must be awaited in Next.js 16):**
```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
    },
  }
}
```

**Streaming metadata (Next.js 16 feature):**
Metadata is streamed separately from UI content. For bots/crawlers, Next.js waits for metadata before sending HTML. For regular users, visual content streams first.

### What to Include in Starter

- Root layout with metadata template pattern
- `metadataBase` set (required for OG images to work)
- robots.txt and sitemap.xml file conventions
- favicon.ico in app root
- One `generateMetadata` example
- A `src/lib/metadata.ts` helper with site config constants

### Important Next.js 16 Notes

- `generateMetadata` only works in Server Components
- `params` and `searchParams` must be awaited (Promise types)
- Use `React.cache()` to memoize data fetched in both `generateMetadata` and the page component
- `metadataBase` in root layout ensures relative OG image URLs resolve correctly

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast system | Sonner | Accessible, 2KB, works everywhere |
| Form validation | Manual validation | Zod schemas | Type-safe, works server + client |
| Form state | Custom form state hooks | useActionState (simple) / RHF (complex) | React 19 native / battle-tested |
| URL state | Manual searchParams parsing | nuqs | Type-safe, framework-aware, throttling |
| Data tables | Generic DataTable wrapper | TanStack Table + shadcn Table primitives | Every table is unique |
| Loading states | Custom loading logic | Suspense + loading.tsx | Framework-native streaming |
| Error boundaries | Class component ErrorBoundary | error.tsx + catchError | Next.js 16 native |
| OG images | Manual meta tags | Metadata API + ImageResponse | Framework handles merging, streaming |

---

## Common Pitfalls

### Pitfall 1: Over-abstracting in a Starter Template
**What goes wrong:** Building generic `<DataTable>`, `<FormField>`, `<Modal>` wrappers that teams immediately need to customize or rip out.
**How to avoid:** Provide patterns and examples, not abstractions. shadcn's philosophy is copy-paste components you own.

### Pitfall 2: Throwing Errors in Server Actions
**What goes wrong:** Using `throw` for expected errors (validation failures, not-found). This triggers error boundaries instead of showing inline form errors.
**How to avoid:** Return error state from server actions. Only throw for truly unexpected errors. Next.js 16 docs are explicit: "model expected errors as return values."

### Pitfall 3: Forgetting to Await params in Next.js 16
**What goes wrong:** `params`, `cookies()`, `headers()`, and `searchParams` are all Promises in Next.js 16. Using them without `await` causes TypeScript errors or runtime issues.
**How to avoid:** Always `const { slug } = await params`

### Pitfall 4: Missing metadataBase
**What goes wrong:** OG images and canonical URLs use relative paths that don't resolve correctly without `metadataBase`.
**How to avoid:** Set `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL!)` in root layout metadata.

### Pitfall 5: Single Giant Suspense Boundary
**What goes wrong:** Wrapping everything in one Suspense boundary means the entire page waits for the slowest component.
**How to avoid:** Use multiple sibling Suspense boundaries. Each resolves and streams independently.

### Pitfall 6: Not Using unstable_catchError for Component-Level Errors
**What goes wrong:** Using old class-based React ErrorBoundary components when Next.js 16 provides `unstable_catchError` from `next/error` which integrates with the framework's retry mechanism.
**How to avoid:** Use `unstable_catchError` for component-level error boundaries.

---

## Recommended Starter Template Scope

### Include (ship as code)

| Pattern | What to Ship |
|---------|-------------|
| Forms | ActionState type, SubmitButton, one simple + one RHF example |
| Toasts | Sonner installed, Toaster in layout |
| Skeletons | Skeleton component, 2-3 compositions, loading.tsx example |
| Dialogs | shadcn Dialog, one example |
| Error handling | error.tsx, global-error.tsx, ActionState pattern |
| Metadata | Root layout template, generateMetadata example, metadata helper |

### Include (install but don't build examples unless time allows)

| Library | Why |
|---------|-----|
| @tanstack/react-table | Needed by most apps, complex to set up |
| nuqs | URL state is needed everywhere |
| date-fns | Universal date formatting need |
| react-hook-form + @hookform/resolvers | Complex form handling |

### Do NOT Include

| Thing | Why |
|-------|-----|
| File upload service integration | Too app-specific (S3? R2? Supabase Storage?) |
| Infinite scroll component | App-specific, needs @tanstack/react-query which adds complexity |
| Email templates | Out of scope |
| Payment integration | Out of scope |

---

## Full Dependency List

### Production Dependencies to Add

```bash
pnpm add sonner react-hook-form @hookform/resolvers date-fns nuqs @tanstack/react-table
```

### shadcn Components to Install

```bash
npx shadcn@latest add skeleton dialog table sonner
# Field component comes with the form setup
```

---

## Sources

### Primary (HIGH confidence)
- Next.js 16 local docs (`node_modules/next/dist/docs/`) -- forms, error handling, metadata, streaming
- [shadcn/ui Forms documentation](https://ui.shadcn.com/docs/forms) -- Field component, RHF integration
- [shadcn/ui React Hook Form](https://ui.shadcn.com/docs/forms/react-hook-form) -- integration guide
- [shadcn/ui TanStack Form](https://ui.shadcn.com/docs/forms/tanstack-form) -- integration guide
- [shadcn/ui Data Table](https://ui.shadcn.com/docs/components/radix/data-table) -- official guide
- [shadcn/ui October 2025 changelog](https://ui.shadcn.com/docs/changelog/2025-10-new-components) -- Field component introduction
- [TanStack Table docs](https://tanstack.com/table/latest) -- official API reference
- [Sonner GitHub](https://github.com/emilkowalski/sonner) -- API and features
- [nuqs official site](https://nuqs.dev) -- API reference
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) -- official reference

### Secondary (MEDIUM confidence)
- [shadcn/ui Discussion #9505](https://github.com/shadcn-ui/ui/discussions/9505) -- why shadcn moved away from Form to Field
- [React Advanced 2025 / nuqs presentation (InfoQ)](https://www.infoq.com/news/2025/12/nuqs-react-advanced/) -- nuqs adoption by Vercel, Sentry, Supabase
- [Next.js Conf 2025 / nuqs session](https://nextjs.org/conf/session/type-safe-url-state-in-nextjs-with-nuqs) -- official Next.js conference
- [LogRocket React Toast comparison 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) -- Sonner as top choice
- [PkgPulse Best JS Date Libraries 2026](https://www.pkgpulse.com/blog/best-javascript-date-libraries-2026) -- date-fns vs dayjs
- [How to Configure SEO in Next.js 16](https://jsdevspace.substack.com/p/how-to-configure-seo-in-nextjs-16) -- metadata patterns

### Tertiary (LOW confidence)
- Various Medium articles on form patterns (used for pattern validation, not as primary source)

---

## Metadata

**Confidence breakdown:**
- Forms (RHF + Zod + useActionState): HIGH -- verified via Next.js 16 docs + shadcn official docs
- Toast (Sonner): HIGH -- shadcn first-class integration, massive adoption
- Data Tables (TanStack Table): HIGH -- shadcn official guide
- Loading/Skeletons: HIGH -- verified via Next.js 16 local docs
- Modals/Dialogs: HIGH -- verified via Next.js 16 intercepting routes docs
- Error Handling: HIGH -- verified via Next.js 16 local docs (error.tsx, catchError)
- Date Handling (date-fns): HIGH -- well-established, multiple sources agree
- File Upload: MEDIUM -- pattern is clear but implementation is app-specific
- Pagination: MEDIUM -- nuqs is clearly the standard, but pagination patterns vary
- Metadata: HIGH -- verified via Next.js 16 local docs

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable ecosystem, 30-day window)
