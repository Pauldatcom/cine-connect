# CinéConnect documentation

Browse this folder on GitHub: this file is the **entry point** — use the tables below to jump to each guide.

|                      |                                                                        |
| -------------------- | ---------------------------------------------------------------------- |
| **Repository root**  | [../README.md](../README.md) — monorepo overview, quick start          |
| **Frontend package** | [../frontend/README.md](../frontend/README.md) — Vite app, routes, env |
| **Backend package**  | [../backend/README.md](../backend/README.md) — API, Drizzle, scripts   |
| **Contributing**     | [CONTRIBUTING.md](./CONTRIBUTING.md) — conventions & PR checklist      |

---

## Documentation

| Topic                    | Document                                           |
| ------------------------ | -------------------------------------------------- |
| Computer & tool setup    | [setup.md](./setup.md)                             |
| Windows setup            | [setup-windows.md](./setup-windows.md)             |
| WSL 2 + VS Code / Cursor | [setup-wsl.md](./setup-wsl.md)                     |
| Database & Docker        | [DOCKER_AND_DATABASE.md](./DOCKER_AND_DATABASE.md) |
| System architecture      | [ARCHITECTURE.md](./ARCHITECTURE.md)               |
| Technical specification  | [SPECIFICATION.md](./SPECIFICATION.md)             |
| Project status           | [PROJECT_STATUS.md](./PROJECT_STATUS.md)           |
| Clean code analysis      | [CLEAN_CODE_ANALYSIS.md](./CLEAN_CODE_ANALYSIS.md) |

---

## Guidelines

| Topic                             | Document                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Contributing & daily workflow     | [CONTRIBUTING.md](./CONTRIBUTING.md)                                                                           |
| Commit messages                   | [guidelines/commit-messages.md](./guidelines/commit-messages.md)                                               |
| Testing                           | [guidelines/testing.md](./guidelines/testing.md)                                                               |
| Bug reports                       | [guidelines/bug-reports.md](./guidelines/bug-reports.md)                                                       |
| Creating a new API module         | [guidelines/new-api-module.md](./guidelines/new-api-module.md)                                                 |
| Database keys (PK, FK, secondary) | [DOCKER_AND_DATABASE.md#keys-pk-fk-and-secondary-keys](./DOCKER_AND_DATABASE.md#keys-pk-fk-and-secondary-keys) |

---

## Quick links

| Resource       | URL / command                    |
| -------------- | -------------------------------- |
| API (Swagger)  | `http://localhost:3000/api-docs` |
| Drizzle Studio | `pnpm db:studio`                 |
| Test coverage  | `pnpm test:coverage`             |

---

## Suggested order

1. [setup.md](./setup.md) — run the stack locally
2. [CONTRIBUTING.md](./CONTRIBUTING.md) — conventions and PR checklist
3. [ARCHITECTURE.md](./ARCHITECTURE.md) — how the app is structured
4. [SPECIFICATION.md](./SPECIFICATION.md) — product scope (English summary)

---

## Also available

| File                   | Role                                               |
| ---------------------- | -------------------------------------------------- |
| [INDEX.md](./INDEX.md) | Short alias → points here for backwards navigation |
