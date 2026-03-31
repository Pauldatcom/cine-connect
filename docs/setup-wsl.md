# WSL 2 + VS Code (or Cursor)

Run the monorepo from Linux on WSL 2 so Node, pnpm, and Docker behave like macOS/Linux.

## Prerequisites

- Windows 10/11 with **WSL 2** and a distro (Ubuntu is fine).
- **Docker Desktop** with “Use the WSL 2 based engine” and your distro enabled under **Settings → Resources → WSL integration**.
- [VS Code](https://code.visualstudio.com/) or Cursor with the **WSL** / remote extension so you open the folder **inside** the Linux filesystem (`\\wsl$\...`), not `/mnt/c/...` (better I/O for `node_modules`).

## Open the project in WSL

```bash
cd ~
git clone <repository-url> cine-connect
cd cine-connect
```

From VS Code / Cursor: **Remote-WSL: Open Folder in WSL** → select `~/cine-connect`.

## Docker from WSL

With Docker Desktop integration, `docker` and `docker-compose` in the WSL shell should talk to the same engine. Verify:

```bash
docker ps
pnpm db:up
```

## Follow the standard setup

Continue with [setup.md](./setup.md) (install, env, `pnpm dev`).

## Troubleshooting

- **“Cannot connect to the Docker daemon”** — Docker Desktop not running or WSL integration disabled for your distro.
- **Slow `pnpm install`** — ensure the project lives under `~` in WSL, not on `C:` mounted as `/mnt/c`.
