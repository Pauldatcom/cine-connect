# Testing guidelines

## Expectations

- New or changed behavior should ship with **tests** at the appropriate level (unit, integration, or E2E).
- CI enforces **coverage thresholds**; do not merge with failing tests or broken coverage gates.

## Stacks

| Layer                       | Tool       | Location (typical)        |
| --------------------------- | ---------- | ------------------------- |
| Backend unit / integration  | Vitest     | `backend/src/__tests__/`  |
| Frontend unit / integration | Vitest     | `frontend/src/__tests__/` |
| End-to-end                  | Playwright | `e2e/`                    |

## Commands

```bash
pnpm test              # All package tests
pnpm test:backend      # Backend only
pnpm test:frontend     # Frontend only
pnpm test:coverage     # Coverage reports
pnpm test:e2e          # Playwright (needs DB / Docker per root README)
```

## Naming

- Component `FilmCard.tsx` → `FilmCard.test.tsx`
- Module `auth.ts` → `auth.test.ts`

## Integration tests

- Use the existing patterns in `backend/src/__tests__/integration/` (supertest against the real `createApp()`).
- Prefer stable fixtures and explicit assertions on status codes and payload shape.

## E2E

- See root [README.md](../../README.md#e2e-tests-playwright) for prerequisites and scripts.
- Cover critical journeys (auth, core domain flows); avoid duplicating every API test in E2E.

## Before you open a PR

- [ ] `pnpm test` passes locally
- [ ] New code paths covered or justified in review
- [ ] Swagger updated if public API changed
