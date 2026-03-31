# Commit message conventions

Use **clear, imperative** subject lines so history and `git log` stay readable. Prefer a scope when it helps.

## Format

```
<type>: <short description in imperative mood>

Optional body explaining why, not only what.
```

## Common types

| Type       | When                            |
| ---------- | ------------------------------- |
| `feat`     | New user-facing feature         |
| `fix`      | Bug fix                         |
| `docs`     | Documentation only              |
| `test`     | Tests only                      |
| `refactor` | Behavior-preserving code change |
| `chore`    | Tooling, deps, config           |
| `perf`     | Performance improvement         |

## Examples

```text
feat(infra): add watchlist toggle on film page
fix(application): validate UUID on friends request route
docs: link guidelines from INDEX
test: cover password reset use case
```

## Rules

- **One logical change** per commit when possible.
- Reference issues/PRs in the body if applicable (`Closes #12`).

More workflow detail: [CONTRIBUTING.md](../CONTRIBUTING.md#git-workflow).
