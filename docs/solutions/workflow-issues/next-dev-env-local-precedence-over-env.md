---
title: "Next.js .env.local silently overrides .env for next dev, risking production during local testing"
date: 2026-10-15
category: docs/solutions/workflow-issues
module: local-dev-environment-config
problem_type: workflow_issue
component: development_workflow
severity: high
applies_when:
  - "Starting npx next dev, next build, or next start in this repo for manual testing, Playwright verification, or debugging"
  - "A project has both .env (local-only config) and .env.local (or similar) coexisting, with only one meant to be active"
  - "Running any verification pass that touches the database layer, especially a post-code-review sanity check"
tags: [nextjs, env-files, env-local, production-safety, dev-server, playwright]
---

# Next.js .env.local silently overrides .env for next dev, risking production during local testing

## Context

mmc-next keeps two env files side by side: `.env` points at the local docker-compose Postgres (port 5434, safe to mutate/seed/wipe), and `.env.local` holds the real production Neon database credentials. Next.js's env-loading order layers `.env.local` *on top of* `.env` for any `next dev`/`next build`/`next start` invocation — `.env.local` wins for every overlapping key, silently.

During post-code-review Playwright verification on the portal-sidebar-reorg feature, a plain `npx next dev --port <port>` was started expecting the local DB (because `.env` was deliberately configured for local-only work). The actual running server picked up production credentials from `.env.local` instead. This was only caught because a test account's login failed — the account existed in the local DB fixture set, not in production. Had the test account also existed in production, or had the test been a write instead of a login, this would have silently exercised or mutated production data during routine dev verification.

## Guidance

Never trust that `.env` alone governs a `next dev` process in this repo. Before running Playwright (or any) verification against `npx next dev`, explicitly export the local-DB overrides in the shell so they take precedence over whatever `.env.local` would otherwise inject, and then verify the *actual running process's* environment — not the static file contents.

Wrong (relies on `.env`, actually gets production):

```bash
npx next dev --port 3010
# Next.js loads .env.local OVER .env — DATABASE_URL/DIRECT_URL etc. silently
# resolve to the production Neon database despite .env being local-only.
```

Right (explicit override + verify the real process):

```bash
export DATABASE_URL="postgresql://mmc:mmc_dev_2025@localhost:5434/mmc?schema=public"
export DIRECT_URL="postgresql://mmc:mmc_dev_2025@localhost:5434/mmc?schema=public"
npx next dev --port 3010

# Find the REAL next-server PID (not the npx wrapper's PID):
ss -ltnp | grep 3010

# Verify the env that process actually has loaded:
cat /proc/<real_pid>/environ | tr '\0' '\n' | grep -E 'DATABASE_URL|DIRECT_URL'
```

Reading `.env`'s file contents is not verification — it tells you nothing about what `.env.local` overrode at process start. Only inspecting `/proc/<pid>/environ` of the actual `next-server` process (found via `ss -ltnp`, since `npx`'s own PID is a wrapper, not the server) confirms what the running process is really connected to.

Notably, this risk is specific to `next dev`/`next build`/`next start`. Ad-hoc one-off scripts run as plain `node script.mjs` using bare `@prisma/client` only auto-load `.env` — they never pick up `.env.local`. Seed/cleanup scripts run this way are safe either way; the exposure is isolated to the Next.js dev/build server process itself.

## Why This Matters

A silent production-credential override during what's assumed to be safe local testing can cause a verification run to read or write real customer/production data without any error or warning — the process starts fine, the app behaves normally, and nothing fails until a test account happens to not exist in production (as happened here) or until a destructive test runs and actually mutates production rows. The failure mode is non-obvious precisely because it looks identical to the safe case: the server starts, the UI loads, routes resolve — the only signal is data-shape divergence, which is easy to miss if the test doesn't happen to probe something environment-specific.

## When to Apply

- Any time starting `npx next dev` (or `next build`/`next start`) in this repo for manual testing, Playwright verification, or debugging.
- Any time `.env` and `.env.local` (or an equivalent local-vs-production pair) coexist and only one is meant to be active for a given run.
- Before running any test suite or verification pass that touches the database layer, especially post-code-review sanity checks where the goal is to confirm "did this work," not to re-discover environment plumbing.
- Not needed for plain `node` scripts using bare `@prisma/client` against this repo's env setup — those only read `.env`.

## Examples

Before (what almost went wrong):

```bash
# Assumed .env's local Postgres would be used since it's dev-only config
npx next dev --port 3010
# Playwright test logs in with a local-only test account -> login fails
# Root cause: server was actually connected to production Neon DB via .env.local
```

After (the established safety ritual):

```bash
export DATABASE_URL="postgresql://mmc:mmc_dev_2025@localhost:5434/mmc?schema=public"
export DIRECT_URL="postgresql://mmc:mmc_dev_2025@localhost:5434/mmc?schema=public"
npx next dev --port 3010
ss -ltnp | grep 3010                     # find the real next-server PID
cat /proc/<pid>/environ | tr '\0' '\n' | grep DATABASE_URL   # confirm local DB is actually active
```

## Related

- None yet — first entry in this repo's docs/solutions/.
