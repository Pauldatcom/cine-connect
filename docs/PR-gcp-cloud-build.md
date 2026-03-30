# PR: GCP Cloud Build & tag-based backend deploy

## Summary

Adds a **root `cloudbuild.yaml`** so Google Cloud Build builds the backend Docker image from the **monorepo root** using `backend/Dockerfile` (required for `pnpm` + `shared/`). Introduces **environment-scoped image tags** (`dev` / `prod` via `_DEPLOY_ENV`) and a **git tag + push** workflow exposed as **`pnpm deploy`**.

## Motivation

- Default Cloud Build / Docker flows often assume a `Dockerfile` at the repo root; this project’s image must be built with `docker build -f backend/Dockerfile .` from the root.
- Dev and prod should use **distinct image tags** (and typically separate Cloud Run services + secrets), without duplicating the build definition.

## Changes

| Item                        | Description                                                                                                                               |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `cloudbuild.yaml`           | Builds and pushes `backend` images to Artifact Registry with tags `backend:{_DEPLOY_ENV}-{SHORT_SHA}` and `backend:{_DEPLOY_ENV}-latest`. |
| `scripts/gcp-deploy-tag.sh` | Creates and pushes an annotated git tag (`dev/*` or `v*`) to trigger Cloud Build when GitHub triggers are configured.                     |
| `package.json`              | Root script `deploy` → runs the shell script (`pnpm deploy dev` / `pnpm deploy prod <version>`).                                          |

## GCP setup (post-merge)

**Artifact Registry (this project):** Docker repo **`cine-connect-ar`** in **`europe-west4`** (Artifact Registry in `europe-west1` was unreliable for project `cine-connect-1`; do not override `_REGION` to `europe-west1` on triggers).

**Cloud Build triggers** (GitHub), both using **Cloud Build configuration file** → **`/cloudbuild.yaml`** (repo root):

| Trigger  | Event                   | Substitutions (minimum) |
| -------- | ----------------------- | ----------------------- |
| **Dev**  | Tag pattern **`dev/*`** | `_DEPLOY_ENV=dev`       |
| **Prod** | Tag pattern **`v*`**    | `_DEPLOY_ENV=prod`      |

On **each** trigger, under advanced substitutions, set (or rely on `cloudbuild.yaml` defaults):

- **`_REGION`** = **`europe-west4`** (required — if you leave `europe-west1`, pushes fail for this project).
- **`_AR_REPO`** = **`cine-connect-ar`**.

**Cloud Run:** two services (recommended): **dev** uses image `…/backend:dev-latest`, **prod** uses `…/backend:prod-latest`. Use **Secret Manager** / env vars for **Supabase dev** vs **prod** (separate URLs and keys).

### Backend dev — checklist (GCP Console)

1. **Cloud Build → Triggers → Create trigger** (e.g. name `cine-connect-dev-deploy`).
   - Source: your GitHub repo, same as prod.
   - Event: **Push new tag** (or **Push to branch** `develop` if you prefer branch deploys; then use branch trigger and still set `_DEPLOY_ENV=dev`).
   - Tag pattern: **`dev/*`**.
   - Configuration: **Cloud Build configuration file**, location **`/cloudbuild.yaml`**.
   - Substitutions: **`_DEPLOY_ENV`** = **`dev`**, **`_REGION`** = **`europe-west4`**, **`_AR_REPO`** = **`cine-connect-ar`**.
2. **Cloud Run → Create service** (e.g. `cine-connect-backend-dev`) in **`europe-west4`** (same region as the registry).
   - Container image:  
     `europe-west4-docker.pkg.dev/cine-connect-1/cine-connect-ar/backend:dev-latest`  
     (after the first successful dev build; until then pick any placeholder and **Edit & deploy new revision** once the image exists).
   - Env / secrets: point to your **Supabase dev** project (and any other dev-only vars).
   - Allow unauthenticated or IAM as you did for prod, depending on how the frontend calls the API.
3. **From your machine**, ship a dev image: **`pnpm deploy dev`** (creates and pushes tag `dev/<timestamp>`). Confirm **Cloud Build** succeeds and the image appears in Artifact Registry with tag **`dev-<sha>`** and **`dev-latest`**.
4. **Cloud Run (dev service)** → deploy new revision using **`dev-latest`** (or pin `:dev-<sha>` for reproducibility).

**One-shot deploy from CLI** (after an image exists), adjust service name:

```bash
gcloud run deploy cine-connect-backend-dev \
  --project=cine-connect-1 \
  --region=europe-west4 \
  --image=europe-west4-docker.pkg.dev/cine-connect-1/cine-connect-ar/backend:dev-latest
```

## Usage

```bash
# Dev: creates tag dev/YYYYMMDD-HHMMSS (UTC) and pushes to origin
pnpm deploy dev

# Prod: creates tag v1.2.0 and pushes to origin
pnpm deploy prod 1.2.0
```

Requires `git` remote `origin` and permission to push tags. Cloud Build runs only after triggers exist and the push reaches GitHub.

## How to test locally

- **Not required for merge:** image build can be validated with Cloud Build history after a tag push, or with `gcloud builds submit` + substitutions (documented in `cloudbuild.yaml` comments).
- **Script only:** run `bash scripts/gcp-deploy-tag.sh` with `dev` / `prod` on a branch that allows tag pushes (dry-run not implemented; use a throwaway tag if needed).

## Checklist

- [ ] `cloudbuild.yaml` path in GCP trigger is **repository root** `/cloudbuild.yaml`.
- [ ] Substitutions `_DEPLOY_ENV` match each trigger (`dev` vs `prod`).
- [ ] **`_REGION=europe-west4`** and **`_AR_REPO=cine-connect-ar`** on every trigger (or defaults only — no override to `europe-west1`).

## Follow-ups (out of scope)

- Cloud Build step to **deploy** to Cloud Run automatically after image push.
- Vercel env vars pointing at prod/dev API URLs once frontends are wired.
