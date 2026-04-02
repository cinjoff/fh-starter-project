# Vitest — Testing Rules

## Server Action Tests

### Required Mock Chain

Every server action test MUST mock the full auth chain, even if the action doesn't currently use all layers. Actions gain role checks over time — defensive mocks prevent silent breakage.

At minimum, mock:
- `@/lib/auth` (session)
- Any role/permission utilities used by the action layer

### Required Test Paths

Every server action test MUST cover:
1. **Success path** — valid input, authorized caller
2. **Auth rejection** — no session
3. **Role rejection** — caller lacks required role (returns error, not crash)
4. **Validation rejection** — invalid/missing input via Zod

### ActionState

Import `ActionState` from `@/lib/action-utils` — never redefine the type locally. For `useActionState` hooks that need `null` as initial state, use `ActionState | null` inline.

## Assertion Anchoring

When testing UI that renders from a data array (nav items, table columns, settings groups), add a comment linking assertions to the source:

```typescript
// Must match navItems in src/components/sidebar.tsx
expect(screen.getByText("Dashboard")).toBeDefined();
```

This prevents tests from silently drifting when the source array changes.

## Organization/Entity ID Types

Better Auth organization IDs are `text` (not UUID). Use `z.string().min(1)` for org IDs in schemas and `"org-123"` style strings in test fixtures. Entity IDs that use `gen_random_uuid()` in the database ARE UUIDs — use valid UUID format in those fixtures.
