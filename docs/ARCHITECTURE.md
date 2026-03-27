# CinéConnect Architecture

## Overview

CinéConnect is a monorepo with 3 packages sharing a common type system.

```
cine-connect/
├── frontend/       # React SPA
├── backend/        # Express API
├── shared/         # Shared types & constants
├── e2e/            # Playwright end-to-end tests
└── docs/           # Documentation
```

---

## Design Principles

### Single Responsibility

Each module has one job:

| Module                       | Responsibility           |
| ---------------------------- | ------------------------ |
| `middleware/auth.ts`         | JWT validation           |
| `middleware/errorHandler.ts` | Error formatting         |
| `routes/auth.ts`             | Authentication endpoints |
| `components/StarRating.tsx`  | Rating display/input     |

### Naming Conventions

```typescript
// Functions reveal intent
async function createReview(userId, filmId, rating, comment) { ... }
function getOnlineUsers(): string[] { ... }
function formatRelativeTime(date: Date): string { ... }

// Constants use SCREAMING_SNAKE_CASE
const MIN_RATING = 1;
const MAX_RATING = 5;
const JWT_EXPIRES_IN = '7d';
```

### DRY

Shared code is centralized:

- Types in `shared/src/types/`
- Constants in `shared/src/constants/`
- UI components in `frontend/src/components/ui/`
- Error handling in `backend/src/middleware/errorHandler.ts`

---

## Package Structure

### Frontend

```
src/
├── components/
│   ├── layout/          # Navbar, Footer
│   ├── features/        # FilmPoster, ReviewCard, ReviewForm
│   ├── ui/              # Reusable components
│   └── index.ts         # Barrel exports
├── contexts/
│   ├── AuthContext.tsx  # JWT + user state
│   └── SocketContext.tsx # Socket.io connection
├── hooks/               # TanStack Query hooks
├── lib/
│   ├── api/             # API clients (auth, films, reviews, friends, watchlist)
│   └── utils.ts         # Utilities
├── routes/              # TanStack Router pages (18 routes)
└── __tests__/           # Unit tests
```

**Routes:**

| Path                | Description                     |
| ------------------- | ------------------------------- |
| `/`                 | Home — hero + trending films    |
| `/films`            | Browse films with filters       |
| `/films/:categorie` | Films by category               |
| `/film/:id`         | Film detail + reviews + share   |
| `/person/:id`       | Actor/crew detail + filmography |
| `/profil`           | Login / register / user profile |
| `/settings`         | Account settings                |
| `/members`          | Find other users                |
| `/discussion`       | Real-time chat                  |
| `/lists`            | Watchlist management            |
| `/auth/callback`    | Google OAuth token handler      |
| `/about`            | Project info + team             |
| `/help`             | FAQ accordion                   |
| `/api-docs`         | API reference                   |
| `/contact`          | Contact form                    |
| `/terms`            | Terms of use                    |
| `/privacy`          | Privacy policy                  |
| `/cookies`          | Cookie policy                   |

Stack: TanStack Router, TanStack Query, TailwindCSS, Lucide React, Socket.io-client

### Backend

```
src/
├── config/              # Environment, Swagger
├── db/                  # Drizzle schema
├── infrastructure/
│   ├── auth/            # Passport.js (Google OAuth)
│   └── container.ts     # DI container
├── middleware/          # Auth, errors, logging
├── routes/              # API endpoints
├── socket/              # WebSocket handlers
├── app.ts               # Express setup
└── index.ts             # Entry point (HTTP + Socket.io)
```

Stack: Express, Drizzle ORM, Socket.io, Zod, Swagger, Passport.js

### Shared

```
src/
├── types/index.ts       # TypeScript interfaces
├── constants/index.ts   # Shared constants (WS_EVENTS, etc.)
└── index.ts             # Exports
```

---

## Data Flow

```
Frontend (React) → Backend (Express) → Database (PostgreSQL)
       ↓                  ↓
     TMDb API          Socket.io (real-time)
     OMDB API
```

Request lifecycle:

1. Frontend calls API via TanStack Query
2. Backend validates with Zod
3. Middleware authenticates (JWT)
4. Route handler processes logic
5. Drizzle executes query
6. Response returned
7. Errors caught by global handler

---

## Authentication

### Email / Password

1. Validate input (Zod)
2. Check existing user
3. Hash password (bcrypt, 12 rounds)
4. Insert user
5. Generate access token (memory) + refresh token (httpOnly cookie)
6. Return user + access token

### Google OAuth

1. User clicks "Continue with Google" → redirected to `/api/v1/auth/google`
2. Passport.js handles Google OAuth flow
3. On success → backend generates JWT and redirects to `FRONTEND_URL/auth/callback?token=<jwt>`
4. Frontend `/auth/callback` route stores the token via `tokenStorage.setAccessToken()`
5. `getCurrentUser()` is called to validate → redirect to `/`
6. On failure → redirect to `/profil?googleAuth=failed`

### Protected routes

1. Extract token from `Authorization: Bearer` header
2. Verify JWT signature
3. Check expiration
4. Attach user to request
5. Continue

---

## Socket.io

The Socket.io server is initialized on the same HTTP server as Express (port 3000), using the default `/` namespace.

**Important:** the frontend must connect to the server **origin only** (e.g. `http://localhost:3000`), not to `VITE_API_URL` which includes `/api/v1`. The `SocketContext` extracts the origin via `new URL(rawUrl).origin`.

### Authentication middleware

Every socket connection must provide a valid JWT in `handshake.auth.token`. Unauthenticated connections are rejected.

### Events

```typescript
// Client → Server
socket.emit('JOIN_ROOM',  { roomId });
socket.emit('LEAVE_ROOM', { roomId });
socket.emit('MESSAGE',    { receiverId, content });
socket.emit('TYPING',     { receiverId, isTyping });

// Server → Client
socket.on('MESSAGE',  (data) => { ... });
socket.on('TYPING',   (data) => { ... });
socket.on('ONLINE',   ({ userId, online }) => { ... });
```

---

## Database Schema

```
users (id, email, username, password_hash, google_id, auth_provider, avatar_url, timestamps)
  ├── reviews (user_id, film_id, rating, comment)
  ├── messages (sender_id, receiver_id, content, read)
  └── friends (sender_id, receiver_id, status: pending/accepted/rejected)

films (id, tmdb_id, title, year, poster, plot, director, genre, runtime, tmdb_rating)
  └── reviews

categories (id, name, slug)
  └── film_categories (film_id, category_id)
```

---

## API Base URL

`VITE_API_URL` in the frontend `.env` is the full base including `/api/v1` (e.g. `http://localhost:3000/api/v1`). All endpoint strings in `src/lib/api/` and hooks use paths **without** the `/api/v1` prefix (e.g. `/films/tmdb`, `/watchlist`).

**Do not** add `/api/v1` to individual endpoint strings — the base URL already includes it.

---

## Testing

| Package  | Library                        | Command     |
| -------- | ------------------------------ | ----------- |
| Frontend | Vitest + React Testing Library | `pnpm test` |
| Backend  | Vitest + Supertest             | `pnpm test` |
| E2E      | Playwright                     | `pnpm e2e`  |

Unit tests are co-located with source files. E2E tests live in `/e2e`.

---

## API Documentation

Available at `http://localhost:3000/api-docs` when running (Swagger UI).
Also accessible in the frontend at `/api-docs`.
