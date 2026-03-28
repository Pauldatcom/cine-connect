# Project Status

Last updated: March 2026

---

## Infrastructure ✅ 100%

| Component           | Status  | Notes                               |
| ------------------- | ------- | ----------------------------------- |
| Monorepo (pnpm)     | ✅ Done | pnpm workspaces with shared package |
| TypeScript config   | ✅ Done | Strict mode, project references     |
| ESLint + Prettier   | ✅ Done | Lint-staged on pre-commit           |
| Husky hooks         | ✅ Done | Pre-commit runs lint + prettier     |
| GitHub Actions      | ✅ Done | Lint, typecheck, test, build        |
| Docker (PostgreSQL) | ✅ Done | PostgreSQL 16 Alpine                |
| Environment setup   | ✅ Done | .env.example files provided         |
| Branch protection   | ✅ Done | PRs required, checks must pass      |

---

## Backend ✅ 100%

| Feature         | Status  | Notes                              |
| --------------- | ------- | ---------------------------------- |
| Express setup   | ✅ Done | CORS, JSON parsing, error handling |
| Drizzle ORM     | ✅ Done | 6 tables with relations            |
| JWT auth        | ✅ Done | Access + refresh tokens            |
| Google OAuth    | ✅ Done | Passport.js + Google strategy      |
| Error handling  | ✅ Done | Centralized middleware             |
| Request logging | ✅ Done | Dev-friendly logs                  |
| Swagger docs    | ✅ Done | /api-docs endpoint                 |
| Auth routes     | ✅ Done | Register, login, refresh, Google   |
| User routes     | ✅ Done | CRUD + profile                     |
| Film routes     | ✅ Done | List, detail, by TMDb ID           |
| Review routes   | ✅ Done | CRUD with user/film relations      |
| Message routes  | ✅ Done | Send, list conversations           |
| Friend routes   | ✅ Done | Request, accept, reject, list      |
| Socket.io       | ✅ Done | Real-time events, auth middleware  |
| Test coverage   | ✅ Done | 100% coverage                      |

---

## Frontend ✅ ~95%

| Feature               | Status     | Notes                                     |
| --------------------- | ---------- | ----------------------------------------- |
| TanStack Router       | ✅ Done    | 18 routes — file-based routing            |
| TanStack Query        | ✅ Done    | Caching, refetch, devtools                |
| TMDb Integration      | ✅ Done    | Movies, search, categories                |
| Letterboxd theme      | ✅ Done    | Dark mode default                         |
| Navbar                | ✅ Done    | Auth state, Google avatar                 |
| Footer                | ✅ Done    | All links functional                      |
| Film components       | ✅ Done    | Poster, Card, Strip, Rating               |
| Filter Panel          | ✅ Done    | Genre, year, rating filters               |
| Review Card           | ✅ Done    |                                           |
| Home Page             | ✅ Done    | Hero + trending films                     |
| Films List            | ✅ Done    | Grid with filters                         |
| Film Detail           | ✅ Done    | Full info + reviews + share button        |
| Category Filter       | ✅ Done    | /films/:categorie                         |
| Auth Context          | ✅ Done    | JWT token management                      |
| API Client            | ✅ Done    | Fetch wrapper with auth, correct base URL |
| Login / Register      | ✅ Done    | Forms on /profil                          |
| Google OAuth callback | ✅ Done    | /auth/callback — token storage + redirect |
| Profile page          | ✅ Done    | Reviews, watchlist, friends, stats        |
| Person detail page    | ✅ Done    | Bio, filmography, "Show more" pagination  |
| About page            | ✅ Done    | Team, tech stack, features                |
| Help page             | ✅ Done    | FAQ accordion                             |
| API docs page         | ✅ Done    | Endpoint list + Swagger link              |
| Contact page          | ✅ Done    | Form with mailto fallback                 |
| Terms of Use          | ✅ Done    | Legal content                             |
| Privacy Policy        | ✅ Done    | GDPR-style content                        |
| Cookie Policy         | ✅ Done    | Cookie table + management info            |
| Socket.io connection  | ✅ Done    | Fixed namespace — connects to origin only |
| Lists Page            | ⚠️ Partial | UI exists, watchlist connected            |
| Discussion / Chat     | ⚠️ Partial | Socket.io ready, UI in progress           |
| Light mode toggle     | ❌ TODO    | Optional                                  |
| Test coverage         | ✅ Done    | Unit + E2E                                |

---

## Database Schema ✅

```
users ──┬── reviews ──── films ──── film_categories ──── categories
        ├── messages (sender/receiver)
        └── friends (sender/receiver, status: pending/accepted/rejected)
```

6 tables defined in `backend/src/db/schema/index.ts`

---

## Tests

### Backend (11 test files)

- `middleware/auth.test.ts`
- `middleware/errorHandler.test.ts`
- `middleware/requestLogger.test.ts`
- `routes/auth.test.ts`
- `routes/users.test.ts`
- `routes/films.test.ts`
- `routes/reviews.test.ts`
- `routes/messages.test.ts`
- `routes/friends.test.ts`
- `socket/index.test.ts`
- `config/env.test.ts`

### Frontend (unit — 16 test files)

- `components/FilmPoster.test.tsx`
- `components/layout/Navbar.test.tsx`
- `components/layout/Footer.test.tsx`
- `components/ui/StarRating.test.tsx`
- `components/ui/FilmStrip.test.tsx`
- `components/ui/FilmCard.test.tsx`
- `components/ui/FilterPanel.test.tsx`
- `components/ui/ReviewCard.test.tsx`
- `contexts/AuthContext.test.tsx`
- `lib/api/tmdb.test.ts`
- `lib/api/client.test.ts`
- `lib/api/auth.test.ts`
- `lib/api/films.test.ts`
- `lib/api/friends.test.ts`
- `lib/api/reviews.test.ts`
- `routes/profil.test.tsx`

### E2E — Playwright (10 spec files)

| File                          | Coverage                                                                |
| ----------------------------- | ----------------------------------------------------------------------- |
| `auth.spec.ts`                | Register, login, logout, session persistence                            |
| `films.spec.ts`               | Browse, search, detail, watchlist toggle                                |
| `reviews.spec.ts`             | Create, edit, delete, like reviews                                      |
| `settings.spec.ts`            | Update profile, change password                                         |
| `user-profile.spec.ts`        | Profile data — reviews, watchlist, stats                                |
| `user-public-profile.spec.ts` | Public profile view, friend request                                     |
| `user-journey.spec.ts`        | Full user journey end-to-end                                            |
| `chat.spec.ts`                | Send messages, conversations                                            |
| `static-pages.spec.ts`        | About, Help, API docs, Contact, Terms, Privacy, Cookies, /auth/callback |
| `person.spec.ts`              | Person detail, filmography, "Show more" pagination                      |

---

## Bug Fixes Applied

| Bug                                             | Fix                                                                                                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `z is not defined` on `/profil`                 | Added `import { z } from 'zod'` (later replaced with plain function)                                                                   |
| `search` prop required on `<Link to="/profil">` | Made `mode` optional in `validateSearch` return type                                                                                   |
| `/api/v1/api/v1/...` doubled URLs               | Removed `/api/v1` prefix from all endpoint strings in `films.ts`, `reviews.ts`, `friends.ts`, `useWatchlist.ts`, `useConversations.ts` |
| Socket.io `Invalid namespace` error             | Strip path from `VITE_API_URL` using `new URL(rawUrl).origin` before connecting                                                        |
| Google avatar not displaying in navbar          | Added `referrerPolicy="no-referrer"` to `<img>`                                                                                        |
| `/auth/callback` showing placeholder            | Implemented token extraction, storage, and redirect                                                                                    |

---

## Remaining Work

### Priority 1 🔥

| Task              | Effort | Description                                     |
| ----------------- | ------ | ----------------------------------------------- |
| Discussion page   | Medium | Complete chat UI using existing Socket.io setup |
| Light mode toggle | Low    | Theme switcher in Navbar                        |

### Priority 2

| Task              | Effort | Description             |
| ----------------- | ------ | ----------------------- |
| Loading skeletons | Low    | Better loading states   |
| Error boundaries  | Low    | Graceful error handling |
| Final report      | Medium | 2-3 pages PDF           |

---

## Evaluation Checklist

### React Module (25 pts)

- [x] TanStack Router with 18 routes
- [x] TanStack Query for API calls
- [x] Film cards, navigation, filters
- [x] Clean component structure
- [x] Unit + E2E test coverage

### UI Module (10 pts)

- [x] TailwindCSS styling
- [x] Responsive design
- [x] Dark mode (default)
- [ ] Light mode toggle
- [x] Consistent typography

### Database Module (15 pts)

- [x] PostgreSQL with Docker
- [x] Drizzle schema with relations
- [x] All 6 tables defined

### Backend Module (35 pts)

- [x] Express REST API
- [x] JWT auth (register/login/refresh)
- [x] Google OAuth (Passport.js)
- [x] Socket.io for chat
- [x] Swagger documentation
- [x] 100% test coverage

### Collaboration (10 pts)

- [x] GitHub workflow
- [x] Feature branches + PRs
- [x] CI/CD pipeline
- [x] Documentation

### Writing (5 pts)

- [x] README with setup instructions
- [x] Architecture documentation
- [ ] Final report (2-3 pages)

---

## Next Steps

1. ⬜ Complete Discussion / Chat UI
2. ⬜ Add light mode toggle
3. ⬜ Write final report
4. ⬜ Deploy MVP
