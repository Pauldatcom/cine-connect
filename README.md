# CinéConnect

A collaborative platform to discover, filter, rate, and discuss movies with friends.

## Project Structure

```
cine-connect/
├── frontend/              # React + Vite + TanStack Router/Query
├── backend/               # Express + Drizzle ORM + Socket.io
├── shared/                # Shared types and constants
├── docs/                  # Documentation
├── docker-compose.yml     # PostgreSQL setup
├── pnpm-workspace.yaml    # pnpm monorepo config
└── package.json           # Root package.json
```

## Tech Stack

**Frontend:** React 18, TypeScript, TanStack Router, TanStack Query, TailwindCSS, Vite

**Backend:** Node.js, Express, Drizzle ORM, Socket.io, JWT, Swagger

**Database:** PostgreSQL 16

## Prerequisites

- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0
- **Docker** (for PostgreSQL)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/cine-connect.git
cd cine-connect
```

### 2. Install dependencies

pnpm install

### 3. Start PostgreSQL

docker-compose up -d

### 4. Setup environment variables

Create `.env` files for each package:

**backend/.env**

NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cineconnect
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:5173

**frontend/.env**

VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_API_URL=http://localhost:3000

> Get your free TMDb API key at https://www.themoviedb.org/settings/api

### 5. Run database migrations

pnpm db:generate
pnpm db:migrate

### 6. Start development servers

pnpm dev

This will start:

- Frontend at http://localhost:5173
- Backend at http://localhost:3000
- API Docs at http://localhost:3000/api-docs

## Scripts

| Command             | Description                    |
| ------------------- | ------------------------------ |
| `pnpm dev`          | Start all packages in dev mode |
| `pnpm dev:frontend` | Start frontend only            |
| `pnpm dev:backend`  | Start backend only             |
| `pnpm build`        | Build all packages             |
| `pnpm test`         | Run all tests                  |
| `pnpm lint`         | Lint all packages              |
| `pnpm db:generate`  | Generate Drizzle migrations    |
| `pnpm db:migrate`   | Run database migrations        |
| `pnpm db:studio`    | Open Drizzle Studio            |

## Database Schema

```
users
├── id (uuid, pk)
├── email (unique)
├── username (unique)
├── password_hash
├── avatar_url
├── created_at
└── updated_at

films
├── id (uuid, pk)
├── imdb_id (unique)
├── title
├── year
├── poster
├── plot
├── director
├── actors
├── genre
├── runtime
├── imdb_rating
├── created_at
└── updated_at

categories
├── id (uuid, pk)
├── name (unique)
└── slug (unique)

reviews
├── id (uuid, pk)
├── user_id (fk -> users)
├── film_id (fk -> films)
├── rating (1-5)
├── comment
├── created_at
└── updated_at

messages
├── id (uuid, pk)
├── sender_id (fk -> users)
├── receiver_id (fk -> users)
├── content
├── read
└── created_at

friends
├── id (uuid, pk)
├── sender_id (fk -> users)
├── receiver_id (fk -> users)
├── status (pending/accepted/rejected)
├── created_at
└── updated_at
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token

### Users

- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/me` - Update profile

### Films

- `GET /api/v1/films` - List films
- `GET /api/v1/films/:id` - Get film details
- `GET /api/v1/films/imdb/:imdbId` - Get by IMDb ID

### Reviews

- `POST /api/v1/reviews` - Create review
- `GET /api/v1/reviews/film/:filmId` - Get film reviews
- `GET /api/v1/reviews/user/:userId` - Get user reviews
- `PATCH /api/v1/reviews/:id` - Update review
- `DELETE /api/v1/reviews/:id` - Delete review

### Messages

- `GET /api/v1/messages` - Get conversations
- `GET /api/v1/messages/:userId` - Get messages with user
- `POST /api/v1/messages` - Send message

### Friends

- `GET /api/v1/friends` - Get friends list
- `GET /api/v1/friends/requests` - Get pending requests
- `POST /api/v1/friends/request` - Send friend request
- `PATCH /api/v1/friends/requests/:id` - Accept/reject request
- `DELETE /api/v1/friends/:id` - Remove friend

## WebSocket Events

| Event        | Description        |
| ------------ | ------------------ |
| `connect`    | User connected     |
| `disconnect` | User disconnected  |
| `message`    | New message        |
| `typing`     | Typing indicator   |
| `online`     | User online status |
| `join_room`  | Join conversation  |
| `leave_room` | Leave conversation |

## Testing

pnpm test

pnpm test:frontend

pnpm test:backend

pnpm test:coverage

## Routes (Frontend)

| Route               | Description         |
| ------------------- | ------------------- |
| `/`                 | Home page           |
| `/films`            | Films listing       |
| `/films/:categorie` | Films by category   |
| `/film/:id`         | Film details        |
| `/profil`           | User profile / Auth |
| `/discussion`       | Chat with friends   |

## Documentation

| Document                                                   | Description                  |
| ---------------------------------------------------------- | ---------------------------- |
| [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)               | Developer onboarding guide   |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               | System architecture & design |
| [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)           | What's done, what's left     |
| [docs/CLEAN_CODE_ANALYSIS.md](docs/CLEAN_CODE_ANALYSIS.md) | Code quality assessment      |

## License

MIT
