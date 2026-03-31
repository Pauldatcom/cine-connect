# Computer & tool setup

How to run CinéConnect on macOS or Linux. For Windows-native or WSL, see the linked guides below.

## Requirements

| Tool    | Version (minimum)               |
| ------- | ------------------------------- |
| Node.js | 20                              |
| pnpm    | 9                               |
| Docker  | Current stable (for PostgreSQL) |
| Git     | Any recent version              |

## Clone and install

```bash
git clone <repository-url>
cd cine-connect
pnpm install
```

## Database

Start PostgreSQL:

```bash
pnpm db:up
# or: docker-compose up -d
```

Apply schema (pick one workflow):

- **Migrations** (closer to production): `pnpm db:generate` then `pnpm db:migrate` when schema changes; see [DOCKER_AND_DATABASE.md](./DOCKER_AND_DATABASE.md).
- **Quick dev push**: `pnpm db:push` (syncs Drizzle schema without migration files — useful for local iteration only).

## Environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill `DATABASE_URL`, `JWT_*`, `FRONTEND_URL`, and `VITE_*` as described in the root [README.md](../README.md#4-setup-environment-variables).

## Run

```bash
pnpm dev
```

| Service     | URL                            |
| ----------- | ------------------------------ |
| Frontend    | http://localhost:5173          |
| Backend API | http://localhost:3000          |
| Swagger     | http://localhost:3000/api-docs |

## Platform-specific

| Topic                                   | Document                               |
| --------------------------------------- | -------------------------------------- |
| Windows (Docker Desktop, paths, shells) | [setup-windows.md](./setup-windows.md) |
| WSL 2 + VS Code                         | [setup-wsl.md](./setup-wsl.md)         |

## See also

- [CONTRIBUTING.md](./CONTRIBUTING.md) — structure, naming, PR checklist
- [DOCKER_AND_DATABASE.md](./DOCKER_AND_DATABASE.md) — Drizzle, migrations, troubleshooting
