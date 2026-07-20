# SvelteKit + Convex + Better Auth Template

Production-leaning starter combining:

- **SvelteKit 5** (Svelte runes) + Tailwind + shadcn-svelte
- **Convex** as the database / backend, with `@convex-dev/better-auth` in **local-install** mode (auth tables live in your schema; you control fields and indexes)
- **Better Auth**: email/password + email OTP + Google OAuth + account linking
- **Paraglide** for i18n (`messages/en.json`)
- **Resend** for transactional email (OTP, contact form)
- Unified rate limiting via `@convex-dev/rate-limiter` (app mutations + Better Auth HTTP routes)
- Audit log scaffolding (off by default — see `src/convex/features.ts`)

## Prerequisites

- [Bun](https://bun.sh) (or swap `bunx`/`bun` for `npx`/`npm`)
- A Convex account ([convex.dev](https://convex.dev))
- A Google Cloud project with an OAuth 2.0 Client ID
- A Resend account + API key

## Setup

1. **Install deps**
    ```bash
    bun install
    ```

2. **Copy env vars**
    ```bash
    cp .env.example .env.local
    ```
    Fill in `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `RESEND_API_KEY`. `CONVEX_DEPLOYMENT` and `PUBLIC_CONVEX_URL` are populated by the next step.

3. **Boot Convex** (creates a dev deployment, populates `.env.local`, watches functions)
    ```bash
    bunx convex dev
    ```
    Leave this running. On first start it prompts to create/link a deployment.

4. **Push Better Auth env vars to Convex** — Convex functions don't read your `.env.local`; they have their own env:
    ```bash
    bunx convex env set BETTER_AUTH_SECRET <value>
    bunx convex env set GOOGLE_CLIENT_ID <value>
    bunx convex env set GOOGLE_CLIENT_SECRET <value>
    bunx convex env set RESEND_API_KEY <value>
    bunx convex env set SITE_URL http://localhost:5173
    ```

5. **Configure Google OAuth**
    Authorized redirect URI: `${SITE_URL}/api/auth/callback/google` (e.g. `http://localhost:5173/api/auth/callback/google`).

6. **Run the dev server** (in a second terminal)
    ```bash
    bun run dev
    ```
    App at http://localhost:5173.

## Customizing

- **Branding** — edit `src/shared/config.ts` (`CONVEX_PROJECT_SETTINGS`: company name, contact email, sender domain).
- **Roles** — `role` is an `additionalField` on the BA `user` table (`src/convex/auth.ts`). Default `'user'`. Promote to `'admin'` via Convex dashboard or a server-only mutation. `requireAdmin` (`src/convex/auth/helpers/requireAdmin.ts`) gates admin endpoints.
- **Feature flags** — `src/shared/config.ts` (`FEATURES`, e.g. enable audit logging / rewards).

## Regenerating the Better Auth schema

After enabling/removing a BA plugin (admin, organization, two-factor, etc.) or changing `additionalFields`, regenerate:

```bash
bunx @better-auth/cli@latest generate \
  --config src/convex/auth/component/auth.ts \
  --output src/convex/auth/component/schema.ts -y
```

Then `bunx convex dev` will push the updated tables.

## Project structure

```
src/
  convex/                    Convex functions + schema
    auth/                    everything auth-related (single copy/paste folder)
      auth.ts                createAuth / createAuthOptions / authComponent
      auth.config.ts         Convex JWT verification config
      component/             local-install BA component (schema, adapter, config)
      emails/                OTP email rendering + sender
      helpers/               requireAdmin, getAuthUserId
      middleware/            authMutation / authAction wrappers
      queries/               getCurrentUser, etc.
      component/crons/       cron handlers that touch BA tables (rate-limit GC)
                             (scheduled from convex/crons.ts via a parent wrapper)
    helpers/                 createDeleteMutation, convexGetRateLimitedUserId
    crons.ts                 cron registry (entry; references handlers)
    schema.ts                app tables (auditLogs, uploadedFiles)
  features/                  feature-scoped UI + actions (auth, contact, ...)
  routes/
    (protected)/             gated by locals.token + currentUser
    (unprotected)/           public pages
    api/                     BA HTTP routes (mounted via convex.config)
  shared/                    UI kit, utils, paraglide messages
hooks.server.ts              paraglide → convex auth → security headers
```

## Production checklist

Before deploying:

- [ ] Tighten CSP in `src/utils/securityHeaders.ts` — current config allows `'unsafe-inline'` / `'unsafe-eval'`. Migrate to SvelteKit's `kit.csp` nonce mode.
- [ ] Set `SITE_URL` to your production URL (and update Google redirect URI).
- [ ] Use a verified sender domain in Resend (`onboarding@resend.dev` only delivers to the account owner).
- [ ] Tighten per-endpoint auth limits in `src/convex/rateLimits/registry.ts` if prod traffic patterns differ from defaults.
- [ ] Enable `FEATURES.AUDIT_LOGS` and wire `logAudit` into admin / destructive paths.

## Scripts

```bash
bun run dev          # SvelteKit dev server
bunx convex dev      # Convex functions (run in parallel)
bun run build        # Production build
bun run check        # svelte-check (types)
bun run lint         # eslint
```
