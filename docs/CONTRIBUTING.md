# Contributing

## Quick Start

```bash
git clone <repo-url>
cd cine-connect
pnpm install
docker-compose up -d
pnpm db:push
pnpm dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:3000  
API Docs: http://localhost:3000/api-docs

---

## Project Structure

| Need to...           | Go to                           |
| -------------------- | ------------------------------- |
| Add a page           | `frontend/src/routes/`          |
| Add a UI component   | `frontend/src/components/ui/`   |
| Add an API endpoint  | `backend/src/routes/`           |
| Add a database table | `backend/src/db/schema/`        |
| Add shared types     | `shared/src/types/index.ts`     |
| Add shared constants | `shared/src/constants/index.ts` |

---

## Naming

```typescript
// Components: PascalCase
function FilmPoster() { ... }

// Functions: camelCase, verb + noun
function getMovieDetails() { ... }
function handleSubmit() { ... }

// Constants: SCREAMING_SNAKE_CASE
const MAX_RATING = 5;

// Types: PascalCase
interface User { ... }

// Files: PascalCase.tsx for components, camelCase.ts otherwise
```

---

## Import Order

```typescript
// 1. External
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Shared
import { User } from '@cine-connect/shared';

// 3. Local
import { FilmPoster } from '@/components/FilmPoster';
```

---

## Testing

Every file needs tests.

```bash
pnpm test              # Run all
pnpm test:coverage     # With coverage
```

Test file naming:

- `FilmPoster.tsx` → `FilmPoster.test.tsx`
- `auth.ts` → `auth.test.ts`

---

## Git Workflow

```bash
# Create branch
git checkout -b feature/your-feature

# Commit with clear message
git commit -m "feat: add star rating component"
git commit -m "fix: resolve auth token issue"

# Push and create PR
git push origin feature/your-feature
```

---

## Scripts

| Command              | Description             |
| -------------------- | ----------------------- |
| `pnpm dev`           | Start all services      |
| `pnpm build`         | Build for production    |
| `pnpm test`          | Run tests               |
| `pnpm test:coverage` | Tests with coverage     |
| `pnpm lint`          | Check code style        |
| `pnpm lint:fix`      | Fix code style          |
| `pnpm format`        | Format with Prettier    |
| `pnpm db:push`       | Push schema to database |
| `pnpm db:studio`     | Open Drizzle Studio     |

---

## Checklist Before PR

- [ ] Code follows naming conventions
- [ ] TypeScript types defined (no `any`)
- [ ] Tests written and passing
- [ ] Swagger docs for API endpoints
- [ ] No console.log in code
- [ ] Linting passes
