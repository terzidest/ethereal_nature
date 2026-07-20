# Deploying to Railway

The whole demo runs on Railway: **Postgres** plus three Docker services —
`backend` (Ktor), `storefront` (TanStack Start SSR), and `admin` (TanStack Start
SPA). Everything is driven from the dashboard; there is intentionally no
`railway.json` (three one-time service setups don't justify config-as-code).

## Images

| Service | Root directory | Dockerfile | Build context |
|---------|----------------|------------|---------------|
| backend | `apps/backend` | `apps/backend/Dockerfile` (auto-detected) | `apps/backend` |
| storefront | `/` (repo root) | `Dockerfile.frontend` via `RAILWAY_DOCKERFILE_PATH` | repo root |
| admin | `/` (repo root) | `Dockerfile.frontend` via `RAILWAY_DOCKERFILE_PATH` | repo root |

Both frontends share one parameterized `Dockerfile.frontend`; the `APP` build
arg selects which app to build. Because their root directory is the repo root
(the pnpm workspace needs `packages/*` and the lockfile), set
`RAILWAY_DOCKERFILE_PATH=Dockerfile.frontend` on each so Railway finds it.

## Environment variables

### backend

Railway's Postgres plugin exposes reference variables but its own `DATABASE_URL`
is `postgresql://…`, while Ktor needs a **JDBC** URL. Compose it from the
Postgres service's private networking:

```
DATABASE_URL=jdbc:postgresql://${{Postgres.RAILWAY_PRIVATE_DOMAIN}}:5432/${{Postgres.PGDATABASE}}
DATABASE_USER=${{Postgres.PGUSER}}
DATABASE_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<openssl rand -base64 48>
ADMIN_EMAIL=<your admin login email>
ADMIN_PASSWORD=<generated, strong>
PAYMENTS_WEBHOOK_SECRET=<openssl rand -base64 32>
MOCK_PSP_ENABLED=true
CORS_ALLOWED_ORIGINS=https://<storefront-domain>,https://<admin-domain>
```

Notes:
- `MOCK_PSP_ENABLED=true` is deliberate — the mock PSP **is** the demo's payment
  flow. Disabling it removes the only way to pay.
- If private networking misbehaves, fall back to the public proxy:
  `jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}`.
- `PORT` is injected by Railway; the app already reads it. Netty binds `0.0.0.0`.

### storefront

```
APP=storefront
RAILWAY_DOCKERFILE_PATH=Dockerfile.frontend
VITE_API_URL=https://<backend-domain>
```

### admin

```
APP=admin
RAILWAY_DOCKERFILE_PATH=Dockerfile.frontend
VITE_API_URL=https://<backend-domain>
```

> **`VITE_API_URL` is baked in at build time** (it is `import.meta.env`, inlined
> into the bundle). Changing the backend domain means **rebuilding** the
> frontends, not just restarting them. Railway forwards service variables to the
> build only for the `ARG`s declared in the Dockerfile (`APP`, `VITE_API_URL`).

## Deploy order

1. **Postgres** — add the Railway Postgres plugin.
2. **backend** — create the service (root `apps/backend`), set its variables
   (the `CORS_ALLOWED_ORIGINS` value can wait — the localhost dev fallback is
   harmless until the frontends exist), generate a public domain, deploy. Set
   the healthcheck path to `/health` with a generous timeout (~300s): the first
   boot runs Flyway against an empty database, and `/health` only reports OK once
   the DB is reachable — so a healthy backend implies migrations ran and the
   admin user was bootstrapped.
3. **storefront** and **admin** — create both with `VITE_API_URL` pointing at the
   backend's public domain, generate their domains, deploy.
4. **Close the CORS loop** — set `CORS_ALLOWED_ORIGINS` on the backend to the two
   frontend `https://` origins and redeploy the backend.
5. **Smoke test** — storefront: browse → cart → checkout → mock-PSP pay → order
   shows PAID. admin: log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`, confirm the
   order is visible and PAID, advance it PACKED → SHIPPED.

## Local container check (optional, needs Docker)

```bash
docker build -t en-backend apps/backend
docker build -t en-storefront --build-arg APP=storefront \
  --build-arg VITE_API_URL=http://localhost:8080 -f Dockerfile.frontend .
docker build -t en-admin --build-arg APP=admin \
  --build-arg VITE_API_URL=http://localhost:8080 -f Dockerfile.frontend .

docker run --rm -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://host.docker.internal:5432/ethereal_nature \
  -e DATABASE_USER=$USER -e DATABASE_PASSWORD= \
  -e CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001 \
  en-backend
docker run --rm -p 3000:3000 -e PORT=3000 en-storefront
docker run --rm -p 3001:3000 -e PORT=3000 en-admin
```

`curl localhost:8080/health` should return `{"status":"ok","database":"up"}`.
