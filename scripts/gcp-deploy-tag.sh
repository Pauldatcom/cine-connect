#!/usr/bin/env bash
# Create and push a git tag so Cloud Build (GitHub trigger) builds the backend image
# with the right _DEPLOY_ENV (configure two triggers: dev/* → dev, v* → prod).
#
# Usage — script is "gcp-tag" because pnpm's built-in `pnpm deploy` shadows a "deploy" script:
#   pnpm gcp-tag dev
#   pnpm gcp-tag prod              → next patch after latest v* on origin (e.g. v1.0.0 → v1.0.1)
#   pnpm gcp-tag prod minor        → bump minor (v1.0.5 → v1.1.0)
#   pnpm gcp-tag prod major        → bump major (v1.2.0 → v2.0.0)
#   pnpm gcp-tag prod 1.2.3        → explicit tag v1.2.3 (override)
#
# Requires: git, remote "origin"; gcloud not required for tag-only flow.

set -euo pipefail

# Latest strict semver tag vX.Y.Z (local + origin after fetch), highest version wins.
latest_prod_semver_tag() {
  git tag -l | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -1
}

# Next version string MAJOR.MINOR.PATCH (no v prefix).
next_version() {
  local bump_kind="$1"
  local latest="${2:-}"

  if [ -z "${latest}" ]; then
    echo "1.0.0"
    return
  fi
  latest="${latest#v}"
  local ma mi pa
  IFS=. read -r ma mi pa <<< "${latest}"
  case "${bump_kind}" in
    major) echo "$((ma + 1)).0.0" ;;
    minor) echo "${ma}.$((mi + 1)).0" ;;
    patch) echo "${ma}.${mi}.$((pa + 1))" ;;
    *)
      echo "next_version: invalid bump_kind=${bump_kind}" >&2
      exit 1
      ;;
  esac
}

ENV="${1:-}"
shift || true

case "${ENV}" in
  dev) ;;
  prod) ;;
  *)
    echo "Usage: pnpm gcp-tag <dev|prod> [args]"
    echo "  pnpm gcp-tag dev                 → tag dev/YYYYMMDD-HHMMSS (UTC)"
    echo "  pnpm gcp-tag prod                → auto patch bump from latest vX.Y.Z tag"
    echo "  pnpm gcp-tag prod <major|minor|patch>  → bump that segment"
    echo "  pnpm gcp-tag prod X.Y.Z          → explicit tag vX.Y.Z"
    exit 1
    ;;
esac

if [ "${ENV}" = dev ]; then
  TAG="dev/$(date -u +%Y%m%d-%H%M%S)"
  MSG="Deploy dev backend (GCP Cloud Build)"
else
  ARG="${1:-}"
  [ -n "${1:-}" ] && shift || true

  if [ -z "${ARG}" ]; then
    echo "Fetching tags from origin..."
    git fetch origin --tags 2>/dev/null || true
    LATEST="$(latest_prod_semver_tag)"
    if [ -z "${LATEST}" ]; then
      VER="1.0.0"
      echo "No vX.Y.Z tag found; using first release ${VER}"
    else
      VER="$(next_version patch "${LATEST}")"
      echo "Latest prod tag: ${LATEST}  →  next patch: v${VER}"
    fi
  elif [[ "${ARG}" =~ ^(major|minor|patch)$ ]]; then
    echo "Fetching tags from origin..."
    git fetch origin --tags 2>/dev/null || true
    LATEST="$(latest_prod_semver_tag)"
    if [ -z "${LATEST}" ]; then
      echo "No vX.Y.Z tag found; cannot bump ${ARG}. Create v1.0.0 first or pass an explicit X.Y.Z."
      exit 1
    fi
    VER="$(next_version "${ARG}" "${LATEST}")"
    echo "Latest prod tag: ${LATEST}  →  next ${ARG}: v${VER}"
  elif [[ "${ARG}" =~ ^v?[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    VER="${ARG#v}"
    echo "Using explicit version v${VER}"
  else
    echo "Invalid prod argument: ${ARG}"
    echo "Use: pnpm gcp-tag prod  |  pnpm gcp-tag prod major|minor|patch  |  pnpm gcp-tag prod X.Y.Z"
    exit 1
  fi

  TAG="v${VER}"
  MSG="Deploy prod backend v${VER} (GCP Cloud Build)"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Warning: you have uncommitted changes. Tag will still point at current HEAD."
fi

if git rev-parse "${TAG}" >/dev/null 2>&1; then
  echo "Error: tag ${TAG} already exists locally. Bump version or delete the tag."
  exit 1
fi

git tag -a "${TAG}" -m "${MSG}"

echo "Created tag: ${TAG}"
echo "Pushing to origin..."
git push origin "${TAG}"

echo ""
echo "Done. If Cloud Build triggers are set for pattern matching this tag,"
echo "a build will start with cloudbuild.yaml (set _DEPLOY_ENV on each trigger)."
echo "Then point Cloud Run at image:"
echo "  .../backend:${ENV}-latest (or :${ENV}-<commit-sha>)"
