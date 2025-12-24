# Docker & Database Guide

This guide explains how Docker and the database work in CinéConnect. It's designed for developers joining the project.

---

## Table of Contents

1. [What is Docker?](#1-what-is-docker)
2. [Our Docker Setup](#2-our-docker-setup)
3. [Starting the Database](#3-starting-the-database)
4. [What is Drizzle ORM?](#4-what-is-drizzle-orm)
5. [Understanding the Schema](#5-understanding-the-schema)
6. [Migrations](#6-migrations)
7. [Drizzle Studio](#7-drizzle-studio)
8. [Common Commands](#8-common-commands)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. What is Docker?

Docker is a tool that runs applications in **containers**. Think of a container as a lightweight virtual machine that:

- Contains everything an app needs to run (OS, libraries, config)
- Is isolated from your computer
- Works the same on any machine

**Why we use Docker:**

- Everyone gets the exact same PostgreSQL version (16)
- No need to install PostgreSQL on your machine
- Easy to start/stop/reset the database
- Works on Windows, Mac, and Linux identically

---

## 2. Our Docker Setup

Our Docker configuration is in `docker-compose.yml` at the project root:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine # PostgreSQL 16 (lightweight Alpine Linux)
    container_name: cineconnect-db # Name of the container
    restart: unless-stopped # Auto-restart if it crashes
    environment:
      POSTGRES_USER: postgres # Database username
      POSTGRES_PASSWORD: postgres # Database password
      POSTGRES_DB: cineconnect # Database name
    ports:
      - '5432:5432' # Map container port to your machine
    volumes:
      - postgres_data:/var/lib/postgresql/data # Persist data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data: # Named volume for data persistence
```

### What each part does:

| Configuration               | Purpose                                          |
| --------------------------- | ------------------------------------------------ |
| `image: postgres:16-alpine` | Uses PostgreSQL 16 on Alpine Linux (small image) |
| `container_name`            | Gives the container a friendly name              |
| `environment`               | Sets username, password, and database name       |
| `ports: '5432:5432'`        | Makes PostgreSQL accessible on localhost:5432    |
| `volumes`                   | Keeps data even when container is stopped        |
| `healthcheck`               | Docker monitors if PostgreSQL is healthy         |

---

## 3. Starting the Database

### Prerequisites

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
2. Make sure Docker is running (check the whale icon in your taskbar)

### Commands

```bash
# Start PostgreSQL in the background
docker-compose up -d

# Check if it's running
docker ps

# You should see something like:
# CONTAINER ID   IMAGE                  STATUS         PORTS                    NAMES
# abc123...      postgres:16-alpine     Up 5 minutes   0.0.0.0:5432->5432/tcp   cineconnect-db

# View logs (useful for debugging)
docker-compose logs postgres

# Stop the database
docker-compose down

# Stop AND delete all data (fresh start)
docker-compose down -v
```

### How to know it's working:

```bash
# Test connection
docker exec -it cineconnect-db psql -U postgres -d cineconnect -c "SELECT 1"

# Should output:
# ?column?
# ----------
#        1
```

---

## 4. What is Drizzle ORM?

**ORM** = Object-Relational Mapping. It lets you:

- Write database queries in TypeScript instead of raw SQL
- Get full type safety (TypeScript knows your table columns)
- Generate migrations automatically

**Drizzle** is our ORM choice because:

- It's lightweight and fast
- Great TypeScript support
- SQL-like syntax (easy to understand)
- Built-in migration tools

### Example: Drizzle vs Raw SQL

```typescript
// Raw SQL (no type safety)
const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// Drizzle (full type safety)
const user = await db.select().from(users).where(eq(users.email, email));
// TypeScript knows `user` has: id, email, username, passwordHash, etc.
```

---

## 5. Understanding the Schema

Our database schema is in `backend/src/db/schema/index.ts`. Let's break down each table:

### Users Table

```typescript
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(), // UUID auto-generated
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('users_email_idx').on(table.email), // Index for faster email lookups
    index('users_username_idx').on(table.username),
  ]
);
```

**What this creates:**

| Column        | Type         | Constraints                 |
| ------------- | ------------ | --------------------------- |
| id            | UUID         | Primary key, auto-generated |
| email         | VARCHAR(255) | Required, unique            |
| username      | VARCHAR(50)  | Required, unique            |
| password_hash | VARCHAR(255) | Required (bcrypt hash)      |
| avatar_url    | TEXT         | Optional                    |
| created_at    | TIMESTAMP    | Auto-set on creation        |
| updated_at    | TIMESTAMP    | Auto-set on update          |

### Films Table

```typescript
export const films = pgTable('films', {
  id: uuid('id').primaryKey().defaultRandom(),
  imdbId: varchar('imdb_id', { length: 20 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  year: varchar('year', { length: 10 }),
  poster: text('poster'),
  plot: text('plot'),
  director: varchar('director', { length: 500 }),
  actors: text('actors'),
  genre: varchar('genre', { length: 500 }),
  runtime: varchar('runtime', { length: 50 }),
  imdbRating: varchar('imdb_rating', { length: 10 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Purpose:** Stores film data from TMDb/IMDb for caching and associating with reviews.

### Reviews Table

```typescript
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  filmId: uuid('film_id')
    .notNull()
    .references(() => films.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5 stars
  comment: text('comment'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Key concepts:**

- `references(() => users.id)` = Foreign key to users table
- `onDelete: 'cascade'` = If user is deleted, their reviews are deleted too
- `rating` = 1-5 integer for star rating

### Messages Table (for Chat)

```typescript
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id),
  receiverId: uuid('receiver_id')
    .notNull()
    .references(() => users.id),
  content: text('content').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Purpose:** Stores chat messages between users. Used with Socket.io for real-time chat.

### Friends Table

```typescript
export const friends = pgTable('friends', {
  id: uuid('id').primaryKey().defaultRandom(),
  senderId: uuid('sender_id')
    .notNull()
    .references(() => users.id),
  receiverId: uuid('receiver_id')
    .notNull()
    .references(() => users.id),
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**Status values:** `pending`, `accepted`, `rejected`

### Relations (Drizzle ORM Feature)

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  reviews: many(reviews),
  sentMessages: many(messages, { relationName: 'sender' }),
  receivedMessages: many(messages, { relationName: 'receiver' }),
}));
```

**What this does:** Tells Drizzle how tables are connected so you can do:

```typescript
// Get user with all their reviews
const userWithReviews = await db.query.users.findFirst({
  where: eq(users.id, userId),
  with: { reviews: true },
});
```

---

## 6. Migrations

Migrations are SQL files that modify your database schema. They track changes over time.

### Why Migrations?

- **Version control for database** - Know exactly what changed and when
- **Team collaboration** - Everyone applies the same changes
- **Rollback capability** - Can undo changes if needed
- **Production safety** - Apply tested changes to production

### Drizzle Migration Workflow

```bash
# Step 1: Make changes to schema/index.ts

# Step 2: Generate migration
pnpm db:generate

# This creates a SQL file in backend/src/db/migrations/
# Example: 0001_initial_schema.sql

# Step 3: Apply migration to database
pnpm db:migrate

# Step 4: Verify with Drizzle Studio
pnpm db:studio
```

### What `pnpm db:generate` Does

1. Reads your schema in `backend/src/db/schema/index.ts`
2. Compares it to the current database state
3. Generates SQL to transform current → new schema
4. Saves SQL file in `backend/src/db/migrations/`

### Example Generated Migration

```sql
-- 0001_initial_schema.sql
CREATE TABLE "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" varchar(255) NOT NULL UNIQUE,
  "username" varchar(50) NOT NULL UNIQUE,
  "password_hash" varchar(255) NOT NULL,
  "avatar_url" text,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "users_email_idx" ON "users" ("email");
CREATE INDEX "users_username_idx" ON "users" ("username");
```

---

## 7. Drizzle Studio

Drizzle Studio is a visual database browser. Think of it like phpMyAdmin but modern.

```bash
# Start Drizzle Studio
pnpm db:studio

# Opens at http://localhost:4983
```

**What you can do:**

- Browse all tables and data
- Run queries
- Edit data directly
- See table relationships

---

## 8. Common Commands

```bash
# Docker commands
docker-compose up -d          # Start PostgreSQL
docker-compose down           # Stop PostgreSQL
docker-compose down -v        # Stop + delete all data
docker-compose logs postgres  # View logs
docker ps                     # List running containers

# Database commands
pnpm db:generate              # Generate migrations from schema
pnpm db:migrate               # Apply migrations
pnpm db:studio                # Open visual database browser
pnpm db:push                  # Push schema directly (dev only, no migration)

# Backend development
pnpm dev:backend              # Start backend server
pnpm --filter @cine-connect/backend test  # Run backend tests
```

---

## 9. Troubleshooting

### "Connection refused" error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Docker isn't running or container stopped.

```bash
docker-compose up -d
docker ps  # Verify it's running
```

### "Database does not exist" error

```
error: database "cineconnect" does not exist
```

**Solution:** Container was created but database wasn't initialized.

```bash
docker-compose down -v  # Remove old container + data
docker-compose up -d    # Fresh start
```

### "Port 5432 already in use"

```
Error: Bind for 0.0.0.0:5432 failed: port is already allocated
```

**Solution:** Another PostgreSQL is running on your machine.

```bash
# Option 1: Stop the other PostgreSQL
# Option 2: Change port in docker-compose.yml
ports:
  - '5433:5432'  # Use 5433 instead

# Then update DATABASE_URL in backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/cineconnect
```

### "Permission denied" on Docker

**macOS/Linux:**

```bash
sudo docker-compose up -d
# Or add yourself to docker group
```

**Windows:** Run Docker Desktop as Administrator

### Migrations won't generate

```
No schema changes detected
```

**Solution:** You haven't changed `schema/index.ts`, or changes match what's already in DB.

```bash
# Force regenerate
pnpm db:push  # This pushes schema directly (bypasses migrations)
```

### Reset everything

Nuclear option - start completely fresh:

```bash
docker-compose down -v              # Delete container + data
rm -rf backend/src/db/migrations/*  # Delete migrations
docker-compose up -d                # Fresh database
pnpm db:generate                    # New migrations
pnpm db:migrate                     # Apply
```

---

## Database Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   users     │       │   reviews   │       │   films     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ user_id (FK)│       │ id (PK)     │
│ email       │       │ film_id (FK)│──────►│ imdb_id     │
│ username    │       │ rating      │       │ title       │
│ password    │       │ comment     │       │ year        │
│ avatar_url  │       │ created_at  │       │ poster      │
│ created_at  │       │ updated_at  │       │ ...         │
│ updated_at  │       └─────────────┘       └─────────────┘
└─────────────┘
       │
       │ ┌─────────────┐       ┌─────────────┐
       │ │  messages   │       │   friends   │
       │ ├─────────────┤       ├─────────────┤
       ├─│ sender_id   │       │ sender_id   │─┐
       └─│ receiver_id │       │ receiver_id │─┘
         │ content     │       │ status      │
         │ read        │       │ created_at  │
         │ created_at  │       │ updated_at  │
         └─────────────┘       └─────────────┘

┌─────────────┐       ┌────────────────┐
│ categories  │       │ film_categories│ (junction table)
├─────────────┤       ├────────────────┤
│ id (PK)     │◄──────│ category_id    │
│ name        │       │ film_id        │───► films.id
│ slug        │       └────────────────┘
└─────────────┘
```

---

## Quick Start Checklist

1. [ ] Install Docker Desktop
2. [ ] Run `docker-compose up -d`
3. [ ] Copy `backend/.env.example` to `backend/.env`
4. [ ] Run `pnpm db:generate`
5. [ ] Run `pnpm db:migrate`
6. [ ] Run `pnpm db:studio` to verify
7. [ ] Run `pnpm dev` to start the app

---

## Need Help?

- Check Docker logs: `docker-compose logs postgres`
- Check backend logs: Look at terminal running `pnpm dev:backend`
- Open Drizzle Studio: `pnpm db:studio`
