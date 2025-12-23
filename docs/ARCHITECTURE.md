# CinéConnect Architecture

## Overview

CinéConnect is a monorepo with 3 packages sharing a common type system.

```
cine-connect/
├── frontend/       # React SPA
├── backend/        # Express API
├── shared/         # Shared types & constants
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
│   ├── ui/              # Reusable components
│   └── index.ts         # Barrel exports
├── lib/
│   ├── api/             # API clients
│   └── utils.ts         # Utilities
├── routes/              # TanStack Router pages
├── styles/              # Global CSS
└── test/                # Test setup
```

Stack: TanStack Router, TanStack Query, TailwindCSS, Lucide React

### Backend

```
src/
├── config/              # Environment, Swagger
├── db/                  # Drizzle schema
├── middleware/          # Auth, errors, logging
├── routes/              # API endpoints
├── socket/              # WebSocket handlers
├── app.ts               # Express setup
└── index.ts             # Entry point
```

Stack: Express, Drizzle ORM, Socket.io, Zod, Swagger

### Shared

```
src/
├── types/index.ts       # TypeScript interfaces
├── constants/index.ts   # Shared constants
└── index.ts             # Exports
```

---

## Data Flow

```
Frontend (React) → Backend (Express) → Database (PostgreSQL)
       ↓                  ↓
     TMDb API          Socket.io (real-time)
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

**Register:**

1. Validate input (Zod)
2. Check existing user
3. Hash password (bcrypt, 12 rounds)
4. Insert user
5. Generate tokens
6. Return user + tokens

**Login:**

1. Validate input
2. Find user by email
3. Compare password
4. Generate tokens
5. Return user + tokens

**Protected routes:**

1. Extract token from header
2. Verify JWT
3. Check expiration
4. Attach user to request
5. Continue

---

## Database Schema

```
users (id, email, username, password_hash, avatar_url, timestamps)
  ├── reviews (user_id, film_id, rating, comment)
  ├── messages (sender_id, receiver_id, content, read)
  └── friends (sender_id, receiver_id, status)

films (id, imdb_id, title, year, poster, plot, etc.)
  └── reviews

categories (id, name, slug)
  └── film_categories (film_id, category_id)
```

---

## WebSocket Events

```typescript
// Client
socket.emit('join_room', roomId);
socket.emit('message', { receiverId, content });
socket.emit('typing', { receiverId, isTyping });

// Server → Client
socket.on('message', (data) => { ... });
socket.on('typing', (data) => { ... });
socket.on('online', (data) => { ... });
```

---

## Testing

| Package  | Library                        |
| -------- | ------------------------------ |
| Frontend | Vitest + React Testing Library |
| Backend  | Vitest + Supertest             |

Tests are co-located with source files.

---

## API Documentation

Available at `http://localhost:3000/api-docs` when running.
