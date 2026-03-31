# Windows setup

CinéConnect expects **Node**, **pnpm**, **Git**, and **Docker** (for PostgreSQL). The app itself is developed like any Node monorepo; the main Windows-specific points are Docker and line endings.

## Docker

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) with WSL 2 backend enabled (recommended).
2. Start Docker Desktop before `pnpm db:up` or `docker-compose up -d`.
3. If containers fail to start, ensure virtualization is enabled in BIOS and WSL 2 is updated (`wsl --update`).

## Shell and Git

- Use **PowerShell**, **cmd**, or **Git Bash** consistently for `pnpm` commands.
- Set `git config core.autocrlf input` if you see noisy diffs on shell scripts; the repo should use LF for cross-platform scripts.

## Paths and env files

- Copy `.env.example` files as documented in [setup.md](./setup.md). Use forward slashes in `DATABASE_URL` inside `.env` if you paste paths (PostgreSQL URLs normally stay as `localhost`).

## Optional: develop inside WSL

If you hit path or performance issues on native Windows, use [setup-wsl.md](./setup-wsl.md) and run the whole toolchain from Ubuntu on WSL 2.

## Next steps

Continue with [setup.md](./setup.md) from “Clone and install” onward.
