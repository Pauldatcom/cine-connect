# CinéConnect

A collaborative platform to discover, filter, rate, and discuss movies with friends. Users can browse and search films powered by **TMDb**, manage a **watchlist**, write **reviews**, connect with **friends**, and **chat** in real time.

Built as a **TypeScript monorepo** with an **Express** API, a **React** SPA (Vite), a **shared** package, and **Playwright** E2E tests.

---

## Monorepo structure

**Applications**

| Path                     | Description                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| [`frontend/`](frontend/) | React 18 + Vite · TanStack Router & Query · TailwindCSS · [README](frontend/README.md)                 |
| [`backend/`](backend/)   | Express REST API · Drizzle ORM · Socket.io · JWT & optional Google OAuth · [README](backend/README.md) |

**Libraries & docs**

| Path                 | Description                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------- |
| [`shared/`](shared/) | Shared types and constants for frontend and backend                                      |
| [`docs/`](docs/)     | Technical documentation (Markdown — browse [`docs/README.md`](docs/README.md) on GitHub) |

---

## Quick start

> **Prerequisites:** Node.js 20+, pnpm 9+, PostgreSQL (e.g. `docker-compose` or Supabase). Copy `backend/.env.example` and `frontend/.env.example` and set `DATABASE_URL`, JWT secrets, `VITE_TMDB_API_KEY`, `VITE_API_URL`.

```bash
git clone <repo-url>
cd cine-connect
pnpm install
docker-compose up -d          # optional if DATABASE_URL points to a remote DB
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
pnpm db:migrate
pnpm dev
```

| Service            | URL                            |
| ------------------ | ------------------------------ |
| Frontend           | http://localhost:5173          |
| API                | http://localhost:3000          |
| API docs (Swagger) | http://localhost:3000/api-docs |

More detail: [docs/setup.md](docs/setup.md) · [backend/README.md](backend/README.md) · [frontend/README.md](frontend/README.md)

---

## Features

| Emoji | Meaning                   |
| ----- | ------------------------- |
| ✅    | Implemented               |
| 🚧    | In progress / partial     |
| ❌    | Not planned / not started |

### Web app

| Feature                                           | Status |
| ------------------------------------------------- | ------ |
| Auth — email / password                           | ✅     |
| Auth — Google OAuth                               | ✅     |
| User profile & avatar                             | ✅     |
| Films — list, detail, categories, TMDb data       | ✅     |
| Search & filters (genre, year, rating)            | ✅     |
| Ratings & reviews (create, edit, likes, comments) | ✅     |
| Watchlist                                         | ✅     |
| Friendships (request / accept / reject)           | ✅     |
| Direct messaging (real-time, Socket.io)           | 🚧     |
| Public pages (about, help, legal)                 | ✅     |
| PWA (Vite plugin)                                 | 🚧     |
| Light mode toggle                                 | ❌     |
| Email / push notifications                        | ❌     |

### Tooling & quality

| Area                        | Status |
| --------------------------- | ------ |
| Vitest (unit / integration) | ✅     |
| Playwright E2E              | ✅     |
| GitHub Actions CI           | ✅     |
| Swagger API docs            | ✅     |

---

## Documentation

Full technical documentation lives in [`docs/`](docs/) (in-repo; no separate GitBook site).

| Topic                         | Link                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| Documentation hub (all pages) | [docs/README.md](docs/README.md)                           |
| Computer & tool setup         | [docs/setup.md](docs/setup.md)                             |
| Windows setup                 | [docs/setup-windows.md](docs/setup-windows.md)             |
| WSL + VS Code / Cursor        | [docs/setup-wsl.md](docs/setup-wsl.md)                     |
| Database & Docker             | [docs/DOCKER_AND_DATABASE.md](docs/DOCKER_AND_DATABASE.md) |
| Technical specification       | [docs/SPECIFICATION.md](docs/SPECIFICATION.md)             |
| Architecture                  | [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)               |
| Project status (detailed)     | [docs/PROJECT_STATUS.md](docs/PROJECT_STATUS.md)           |

---

## Guidelines

| Topic                             | Link                                                                                                                   |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Contributing                      | [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md)                                                                           |
| Commit messages                   | [docs/guidelines/commit-messages.md](docs/guidelines/commit-messages.md)                                               |
| Testing                           | [docs/guidelines/testing.md](docs/guidelines/testing.md)                                                               |
| Bug reports                       | [docs/guidelines/bug-reports.md](docs/guidelines/bug-reports.md)                                                       |
| Creating a new API module         | [docs/guidelines/new-api-module.md](docs/guidelines/new-api-module.md)                                                 |
| Database keys (PK, FK, secondary) | [docs/DOCKER_AND_DATABASE.md#keys-pk-fk-and-secondary-keys](docs/DOCKER_AND_DATABASE.md#keys-pk-fk-and-secondary-keys) |

---

## Root scripts (reference)

| Command                              | Description                 |
| ------------------------------------ | --------------------------- |
| `pnpm dev`                           | Frontend + backend (dev)    |
| `pnpm build`                         | Build all packages          |
| `pnpm test` / `pnpm test:coverage`   | Tests                       |
| `pnpm db:migrate` / `pnpm db:studio` | Drizzle migrations / Studio |
| `pnpm test:e2e`                      | Playwright (DB required)    |

---

## License

MIT
