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

## Architecture

### Backend - Clean Architecture

The backend follows Clean Architecture principles for maintainability and testability:

```
backend/src/
├── domain/              # Core business logic (no framework dependencies)
│   ├── entities/        # User, Film, Review, ReviewLike, ReviewComment
│   └── repositories/    # Interface contracts (IUserRepository, IFilmRepository, etc.)
│
├── application/         # Use cases - orchestrate business logic
│   └── use-cases/       # CreateReviewUseCase, LikeReviewUseCase, CommentOnReviewUseCase, etc.
│
├── infrastructure/      # External implementations
│   ├── repositories/    # Drizzle ORM implementations (DrizzleUserRepository, etc.)
│   └── container.ts     # tsyringe dependency injection setup
│
└── routes/              # Express HTTP handlers (presentation layer)
```

**Key Principles:**

- Business logic lives in use cases, NOT in routes
- Routes only handle HTTP concerns (parse request, call use case, format response)
- Repository interfaces define contracts, implementations handle database
- Dependency injection via tsyringe enables easy testing and swapping implementations
- Domain entities are framework-agnostic pure TypeScript classes

### Frontend

- File-based routing with TanStack Router
- API state management with TanStack Query
- Component-based architecture with React
- Type-safe API clients in `src/lib/api/`

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

Copy the example files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**backend/.env**

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/cineconnect
JWT_SECRET=your-super-secret-jwt-key-at-least-32-chars-long
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
FRONTEND_URL=http://localhost:5173
```

**frontend/.env**

```
VITE_TMDB_API_KEY=your_tmdb_api_key
VITE_API_URL=http://localhost:3000
```

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
├── tmdb_id (unique, not null)
├── title
├── year
├── poster
├── plot
├── director
├── actors
├── genre
├── runtime
├── tmdb_rating
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
- `GET /api/v1/films/tmdb/:tmdbId` - Get by TMDb ID
- `POST /api/v1/films/tmdb` - Register film from TMDb (get or create)

### Reviews

- `POST /api/v1/reviews` - Create review
- `GET /api/v1/reviews/:id` - Get single review
- `GET /api/v1/reviews/film/:filmId` - Get film reviews
- `GET /api/v1/reviews/user/:userId` - Get user reviews
- `PATCH /api/v1/reviews/:id` - Update review
- `DELETE /api/v1/reviews/:id` - Delete review

### Review Interactions

- `POST /api/v1/reviews/:id/like` - Like a review
- `DELETE /api/v1/reviews/:id/like` - Unlike a review
- `GET /api/v1/reviews/:id/likes` - Get review likes
- `POST /api/v1/reviews/:id/comments` - Comment on a review
- `GET /api/v1/reviews/:id/comments` - Get review comments
- `DELETE /api/v1/reviews/:reviewId/comments/:commentId` - Delete comment

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

## Authentication

The app uses JWT-based authentication:

- **Access Token**: Short-lived, stored in localStorage
- **Refresh Token**: Long-lived for session renewal
- Login/Register at `/profil`
- Protected routes redirect to `/profil` if not authenticated

### Frontend Auth Flow

1. User submits login/register form
2. Backend returns JWT tokens
3. Tokens stored in localStorage
4. API client automatically attaches Bearer token to requests
5. AuthContext provides `isAuthenticated`, `user`, `login()`, `logout()`

## CI/CD

GitHub Actions runs on every push/PR:

- **Lint**: ESLint check
- **Typecheck**: TypeScript strict mode
- **Test**: Vitest with 100% coverage requirement
- **Build**: Production build verification

Branch protection is enabled on `main` - all checks must pass before merge.

## Testing

```bash
pnpm test              # Run all tests
pnpm test:frontend     # Frontend tests only
pnpm test:backend      # Backend tests only
pnpm test:coverage     # Run with coverage report
```

**Coverage requirement: 100%** - CI will fail if coverage drops below threshold.

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

## Recent Changes

### Architecture Refactoring

The backend has been refactored to follow **Clean Architecture** principles:

- **Use Cases Pattern**: Business logic extracted from routes into dedicated use case classes
- **Repository Interfaces**: Data access abstracted behind interfaces in the domain layer
- **Dependency Injection**: tsyringe container manages all dependencies
- **Separation of Concerns**: Routes only handle HTTP, use cases handle business logic

### New Review System Features

- **Review Likes**: Users can like/unlike reviews
- **Review Comments**: Users can comment on reviews and delete their own comments
- **Enhanced Review API**: New endpoints for interactions and single review retrieval

### Code Quality

- 100% test coverage for frontend and backend
- Comprehensive unit tests for use cases, routes, and components
- Proper mocking strategy with repository interfaces

## License

MIT
