#!/usr/bin/env bash
# Create and push a git tag so Cloud Build (GitHub trigger) builds the backend image
# with the right _DEPLOY_ENV (configure two triggers: dev/* → dev, v* → prod).
#
# Usage:
#   pnpm deploy dev
#   pnpm deploy prod [version]     e.g. pnpm deploy prod 1.2.0  → tag v1.2.0
#
# Requires: git, remote "origin", clean desire to push tags; gcloud not required for tag-only flow.

set -euo pipefail

ENV="${1:-}"
shift || true

case "${ENV}" in
  dev) ;;
  prod) ;;
  *)
    echo "Usage: pnpm deploy <dev|prod> [version]"
    echo "  pnpm deploy dev              → tag dev/YYYYMMDD-HHMMSS (UTC)"
    echo "  pnpm deploy prod 1.2.0       → tag v1.2.0"
    exit 1
    ;;
esac

if [ "${ENV}" = dev ]; then
  TAG="dev/$(date -u +%Y%m%d-%H%M%S)"
  MSG="Deploy dev backend (GCP Cloud Build)"
else
  VER="${1:-${DEPLOY_VERSION:-}}"
  if [ -z "${VER}" ]; then
    echo "For prod, pass a semver: pnpm deploy prod 1.2.0"
    exit 1
  fi
  VER="${VER#v}"
  TAG="v${VER}"
  MSG="Deploy prod backend v${VER} (GCP Cloud Build)"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Warning: you have uncommitted changes. Tag will still point at current HEAD."
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
