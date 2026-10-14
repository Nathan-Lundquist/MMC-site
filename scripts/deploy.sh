#!/usr/bin/env bash
#
# Manual production deploy for mmc-next.
#
# This app is self-hosted via PM2 on this same server using a capistrano-style
# release layout (/home/nathan/apps/mmc-site/{releases,current,shared}) — not
# Vercel. There is no CI/CD; this script is the deploy mechanism. See
# docs/solutions/ or Claude's project memory for how this was figured out
# (2026-10-14) and the gotchas baked into the steps below.
#
# Usage:
#   scripts/deploy.sh            # deploys origin/main's current HEAD
#   scripts/deploy.sh <ref>      # deploys an arbitrary ref (branch, tag, SHA)
#
# On any failure after the symlink cutover, the previous release is restored
# automatically and PM2 is reloaded back onto it.

set -euo pipefail

APPS_DIR="/home/nathan/apps/mmc-site"
PM2_APP="mmc-site"
PORT=3000
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REF="${1:-origin/main}"

log() { echo "[deploy] $*"; }
fail() { echo "[deploy] ERROR: $*" >&2; exit 1; }

cd "$REPO_DIR"

if [[ -n "$(git status --porcelain)" ]]; then
  fail "working tree has uncommitted changes — commit, stash, or discard before deploying."
fi

log "Fetching..."
git fetch origin --quiet

RESOLVED_SHA="$(git rev-parse --short "$REF")"
TS="$(date +%Y%m%d%H%M%S)"
RELEASE_DIR="$APPS_DIR/releases/${RESOLVED_SHA}-${TS}"
CURRENT_LINK="$APPS_DIR/current"
PREVIOUS_RELEASE="$(readlink -f "$CURRENT_LINK" 2>/dev/null || true)"

log "Deploying $REF ($RESOLVED_SHA) to $RELEASE_DIR"
[[ -n "$PREVIOUS_RELEASE" ]] && log "Previous release (rollback target): $PREVIOUS_RELEASE"

mkdir -p "$RELEASE_DIR"
git archive "$REF" | tar -x -C "$RELEASE_DIR"
echo "$RESOLVED_SHA" > "$RELEASE_DIR/RELEASE_COMMIT"

if [[ -z "$PREVIOUS_RELEASE" || ! -f "$PREVIOUS_RELEASE/.env.local" ]]; then
  fail "no previous release with .env/.env.local found to copy secrets from. First-ever deploy needs these seeded manually into the new release dir before rerunning."
fi

log "Copying secrets forward from previous release"
cp "$PREVIOUS_RELEASE/.env" "$RELEASE_DIR/.env"
cp "$PREVIOUS_RELEASE/.env.local" "$RELEASE_DIR/.env.local"
chmod 600 "$RELEASE_DIR/.env" "$RELEASE_DIR/.env.local"

# Prisma's CLI only reads .env, never .env.local (that layering is Next.js-only).
# DIRECT_URL living only in .env would point migrate commands at the local dev DB.
# Make sure .env.local carries a real DIRECT_URL so every `export ... && npx prisma`
# below actually targets production.
if ! grep -q "^DIRECT_URL=" "$RELEASE_DIR/.env.local"; then
  UNPOOLED="$(grep '^DATABASE_URL_UNPOOLED=' "$RELEASE_DIR/.env.local" | cut -d'=' -f2-)"
  [[ -n "$UNPOOLED" ]] || fail ".env.local has no DIRECT_URL and no DATABASE_URL_UNPOOLED to derive it from — fix manually."
  log "Adding missing DIRECT_URL to .env.local (from DATABASE_URL_UNPOOLED)"
  printf 'DIRECT_URL=%s\n' "$UNPOOLED" >> "$RELEASE_DIR/.env.local"
fi

ln -s "$APPS_DIR/shared/uploads" "$RELEASE_DIR/uploads"

cd "$RELEASE_DIR"

log "Installing dependencies..."
npm ci --no-audit --no-fund

export DATABASE_URL
export DIRECT_URL
DATABASE_URL="$(grep '^DATABASE_URL=' .env.local | head -1 | cut -d'=' -f2- | tr -d '"')"
DIRECT_URL="$(grep '^DIRECT_URL=' .env.local | cut -d'=' -f2- | tr -d '"')"
[[ "$DATABASE_URL" == *neon.tech* ]] || fail "resolved DATABASE_URL doesn't look like production Neon — refusing to run migrations. Got: ${DATABASE_URL//:*@/:***@}"

log "Checking migration status against production..."
npx prisma migrate status || true

log "Applying migrations..."
if ! npx prisma migrate deploy; then
  fail "migrate deploy failed. If this is P3009 (a stuck failed migration), diagnose and resolve manually before rerunning this script — do NOT retry blindly. See project memory (mmc-deploy-procedure) for the recovery steps used on 2026-10-14. Nothing has been cut over; production is still serving the previous release."
fi

log "Generating client and building (webpack — Turbopack breaks on the uploads symlink, see package.json build script)..."
npm run build

log "Cutting over: $CURRENT_LINK -> $RELEASE_DIR"
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK"

log "Reloading PM2..."
pm2 reload "$PM2_APP" --update-env

log "Waiting for app to settle..."
sleep 3

rollback() {
  log "SMOKE TEST FAILED — rolling back to $PREVIOUS_RELEASE"
  ln -sfn "$PREVIOUS_RELEASE" "$CURRENT_LINK"
  pm2 reload "$PM2_APP" --update-env
  fail "deploy of $RESOLVED_SHA rolled back. New release left at $RELEASE_DIR for investigation."
}

check() {
  local path="$1" expected="$2"
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:${PORT}${path}")"
  log "  $path -> $code (expected $expected)"
  [[ "$code" == "$expected" ]] || rollback
}

log "Smoke testing..."
check "/" 200
check "/login" 200
check "/portal/board" 307

log "Deploy of $RESOLVED_SHA complete. Previous release kept at $PREVIOUS_RELEASE for rollback."
log "To roll back manually: ln -sfn $PREVIOUS_RELEASE $CURRENT_LINK && pm2 reload $PM2_APP --update-env"
