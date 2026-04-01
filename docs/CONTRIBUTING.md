# Contributing

How we work on CinéConnect: setup, conventions, and PR expectations.

## Where to read first

| Doc                                         | Purpose                                                         |
| ------------------------------------------- | --------------------------------------------------------------- |
| [README.md](../README.md)                   | Monorepo overview, quick start, root scripts                    |
| [frontend/README.md](../frontend/README.md) | Frontend stack, folders, env, commands                          |
| [backend/README.md](../backend/README.md)   | API stack, Clean Architecture, DB commands                      |
| **[README.md](./README.md)**                | Full documentation map (guidelines, setup guides, architecture) |

---

## Quick start

```bash
git clone <repo-url>
cd cine-connect
pnpm install
docker-compose up -d          # or use Supabase / remote DATABASE_URL only
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
pnpm db:migrate               # apply migrations (from repo root)
pnpm dev
```

| URL                            | Service     |
| ------------------------------ | ----------- |
| http://localhost:5173          | Frontend    |
| http://localhost:3000          | Backend API |
| http://localhost:3000/api-docs | Swagger     |

For Windows / WSL or detailed env notes: [setup.md](./setup.md), [setup-windows.md](./setup-windows.md), [setup-wsl.md](./setup-wsl.md).

---

## Project structure (where to change what)

| Need to…           | Location                                                   |
| ------------------ | ---------------------------------------------------------- |
| Add a page / route | `frontend/src/routes/`                                     |
| Add a UI primitive | `frontend/src/components/ui/`                              |
| Add an API route   | `backend/src/routes/` (thin handlers → use cases)          |
| Add a DB table     | `backend/src/db/schema/` then `pnpm db:generate` / migrate |
| Add shared types   | `shared/src/types/index.ts`                                |

See [new-api-module.md](./guidelines/new-api-module.md) for backend feature work.

---

## Naming

```typescript
// Components: PascalCase
function FilmPoster() { ... }

// Functions: camelCase, verb + noun
function getMovieDetails() { ... }

// Constants: SCREAMING_SNAKE_CASE
const MAX_RATING = 5;

// Types / interfaces: PascalCase
interface User { ... }

// Files: PascalCase.tsx for components, camelCase.ts otherwise
```

---

## Import order

```typescript
// 1. External
import { useState } from 'react';

// 2. Shared
import { User } from '@cine-connect/shared';

// 3. Local
import { FilmPoster } from '@/components/FilmPoster';
```

---

## Testing

New behaviour should include tests. See [guidelines/testing.md](./guidelines/testing.md).

```bash
pnpm test
pnpm test:coverage
```

Naming: `FilmPoster.tsx` → `FilmPoster.test.tsx`, `auth.ts` → `auth.test.ts`.

---

## Git workflow

```bash
git checkout -b feature/your-feature
git commit -m "feat: short imperative description"
git push origin feature/your-feature
```

Commit style: [guidelines/commit-messages.md](./guidelines/commit-messages.md).

---

## Scripts (root)

| Command                            | Description                                      |
| ---------------------------------- | ------------------------------------------------ |
| `pnpm dev`                         | Frontend + backend                               |
| `pnpm build`                       | Production build                                 |
| `pnpm test` / `pnpm test:coverage` | Vitest                                           |
| `pnpm lint` / `pnpm lint:fix`      | ESLint                                           |
| `pnpm format`                      | Prettier                                         |
| `pnpm db:migrate`                  | Apply Drizzle migrations                         |
| `pnpm db:push`                     | Dev-only schema sync (avoid for shared prod DBs) |
| `pnpm db:studio`                   | Drizzle Studio                                   |

---

## Checklist before opening a PR

- [ ] Naming and structure match this doc and package READMEs
- [ ] No unnecessary `any`; types updated
- [ ] Tests added/updated and passing
- [ ] New or changed HTTP endpoints documented in Swagger (backend)
- [ ] No stray `console.log` in production paths
- [ ] `pnpm lint` passes

For bug reports: [guidelines/bug-reports.md](./guidelines/bug-reports.md).
