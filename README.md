# Trends Bird E-commerce Admin

A production-minded administration API and dashboard for the Trends Bird Limited backend internship assignment. The implementation prioritises the grading criteria: API-enforced access control, rotating authentication, transactional catalog writes, predictable validation, and a runnable PostgreSQL setup.

## Stack

- Node.js 22 LTS and TypeScript
- NestJS 11 REST API
- PostgreSQL 16 with Prisma ORM and committed SQL migration
- Next.js 16 App Router, React 19, and Material UI
- JWT access tokens plus rotating HttpOnly refresh cookies
- Swagger/OpenAPI at `/api/docs`
- Jest, ESLint, Docker Compose, Cloudinary media storage

Node 22 or newer is supported. Node 22 remains a suitable baseline for local development.

## Quick start

Requirements: Node.js 22, npm 10+, and Docker.

```bash
cp .env.example .env
npm install
docker compose up -d postgres
npm run prisma:generate -w @trends-bird/api
npm run db:migrate
npm run db:seed
npm run dev
```

Supabase is also supported as the managed PostgreSQL provider. In that case, replace
`DATABASE_URL` with the full URI from the Supabase **Connect** dialog. Use the direct
connection for migrations when it is reachable; if your network is IPv4-only, use the
Supabase session pooler URI on port `5432`. Do not use the transaction pooler on port
`6543` for Prisma migrations. URL-encode special characters in the database password.

If a PostgreSQL connection is unavailable, the same setup can be applied through the
Supabase SQL Editor: run `apps/api/prisma/migrations/20260726000000_init/migration.sql`
first, followed by `apps/api/prisma/supabase-seed.sql`. The second script is idempotent,
creates the reviewer accounts, and records the initial Prisma migration as applied.

Open:

- Dashboard: <http://localhost:3000>
- API: <http://localhost:4000/api>
- Swagger collection: <http://localhost:4000/api/docs>

Production builds:

```bash
npm run build
npm test
npm run lint
```

## Seeded reviewer accounts

| Account | Email | Password | Access |
|---|---|---|---|
| Super Administrator | `admin@trendsbird.test` | `Admin@12345` | Every permission |
| Catalog Manager | `catalog@trendsbird.test` | `Catalog@12345` | Dashboard and catalog only; no permission, role, or user access |

Change these passwords outside an assessment/demo environment.

## Authentication and access-control design

The API registers its authentication guard globally. Every newly added route is protected unless it is deliberately decorated public. Login, refresh, and logout are the only public routes.

The short-lived access token is returned to the SPA and kept only in memory. It is sent as `Authorization: Bearer <token>`. The seven-day refresh token is stored as an opaque, `HttpOnly`, `SameSite=Strict` cookie. Only a SHA-256 digest is stored in PostgreSQL.

Every refresh rotates the token in one transaction. Reuse of a revoked token revokes its entire token family. Logout revokes the matching database session before clearing the cookie. Access requests reload the user and role permission set, so deactivation, role changes, and permission revocation take effect on the next request rather than waiting for token refresh.

The dashboard uses one shared in-flight refresh promise. Concurrent `401` responses therefore cause one rotation, after which requests retry once. A failed refresh clears the local session.

Route permissions use lower-case `module:action` names. A valid token without the required capability returns `403`; missing, invalid, expired, or inactive identity returns `401`. The limited seed account is intended for direct verification through Swagger or Postman.

## Important domain decisions

- Permission removal cascades only role-permission links. It does not delete roles.
- A role with assigned users cannot be deleted. A role change that would leave no active holder of `role:update` is rejected.
- Users are hard-deleted. Self-role changes and self-deletion are rejected.
- Media deletion is refused while any user, category, brand, attribute value, product, or variant still references it. Stored originals and thumbnails are removed after the database record.
- Category deletion is refused while it has children or products. Parent updates walk the ancestor chain and reject cycles.
- Brand deletion is refused while products reference it.
- Attribute/value deletion is refused once used by a variant.
- Product deletion cascades variants and attachment rows, but shared media assets survive.
- Product create and update replace all category, product-media, variant, value, and variant-media links inside a database transaction. A validation or database failure leaves the previous state intact.
- Stock status is derived from stock. Variable products cannot hold product-level price/stock; simple products cannot hold variants.
- Long descriptions accept a conservative HTML allow-list. Scripts, event attributes, and unknown elements are removed.
- A product or variant accepts at most one thumbnail. Duplicate variant combinations, invalid attribute values, duplicate SKUs, negative values, and sale prices above regular prices are rejected.

## API overview

All URLs are beneath `/api`.

| Module | Routes |
|---|---|
| Authentication | `POST /auth/login`, `/auth/refresh`, `/auth/logout`; `GET /auth/session` |
| Permission | `GET/POST /permissions`, `GET/PATCH/DELETE /permissions/:id` |
| Role | `GET/POST /roles`, `GET /roles/options`, `GET/PATCH/DELETE /roles/:id` |
| User | `GET/POST /users`, `GET/PATCH/DELETE /users/:id` |
| Media | `GET /media`, `POST /media/upload`, `GET/PATCH/DELETE /media/:id` |
| Category | `GET /categories`, `GET /categories/tree`, `POST /categories`, `GET/PATCH/DELETE /categories/:id` |
| Brand | `GET/POST /brands`, `GET/PATCH/DELETE /brands/:id` |
| Attribute | `GET/POST /attributes`, `GET/PATCH/DELETE /attributes/:id`, nested value create/update/delete |
| Product | `GET/POST /products`, `GET/PATCH/DELETE /products/:id` |
| Dashboard | `GET /dashboard/summary` |

Swagger documents the DTO-derived request schemas and lets reviewers authorise with an access token. Refresh/logout are browser-cookie based and should be called with credentials enabled.

Success responses have one shape:

```json
{
  "success": true,
  "data": {},
  "path": "/api/example",
  "timestamp": "2026-07-26T00:00:00.000Z"
}
```

Errors have one safe shape and never expose stack traces, database messages, or local paths:

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Missing required permission: product:delete"
  },
  "path": "/api/products/id",
  "timestamp": "2026-07-26T00:00:00.000Z"
}
```

## Module status

| Module | API | Dashboard |
|---|---|---|
| Authentication | Complete | Complete |
| Permission | Complete | Complete; searchable permission matrix and action editor |
| Role | Complete | Complete; visual module-by-action permission assignment |
| User | Complete | Complete; account, status, contact, and role forms |
| Media | Complete | Complete; browse, upload, metadata edit, and delete |
| Category | Complete | Complete; hierarchy listing and parent-aware editor |
| Brand | Complete | Complete |
| Attribute | Complete, including nested value routes | Complete for attribute create/edit and adding values |
| Product | Complete | Complete; structured simple and variable product editor |

The dashboard uses dedicated, validated forms rather than exposing raw JSON payloads to reviewers.

## Testing

The repository includes focused tests for the permission guard’s allow/deny/public behaviour and core product pricing/combination rules.

```bash
npm test
```

For manual access-control verification:

1. Sign in as the catalog user.
2. Copy the returned access token.
3. Authorise Swagger.
4. Confirm `GET /api/products` succeeds.
5. Confirm `GET /api/users` or `DELETE /api/roles/:id` returns `403`.

## Environment variables

See [.env.example](./.env.example). No live secret or database URL is committed.

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection |
| `JWT_ACCESS_SECRET` | Access-token signing secret, at least 32 random characters |
| `JWT_ACCESS_TTL` | Access lifetime, default `15m` |
| `REFRESH_TOKEN_TTL_DAYS` | Refresh lifetime, default `7` |
| `PORT` | API port |
| `WEB_ORIGIN` | The one allowed browser origin |
| `PUBLIC_API_URL` | Base used in stored media URLs |
| `MAX_UPLOAD_BYTES` | Per-file upload limit |
| `NEXT_PUBLIC_API_URL` | Browser API base |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

## Known issues and deployment notes

- The included Vercel deployment uses Supabase PostgreSQL. Set `NEXT_PUBLIC_API_URL` on the web project and the server-only API variables on the API project.
- In-memory login throttling is suitable for one process. A horizontally scaled deployment should use Redis-backed throttling.
- Local filesystem media is intentional for the assignment. Vercel filesystem writes are ephemeral, so production media should use Supabase Storage or another S3-compatible object store.
- Next.js provides route-level code splitting and static optimization for every dashboard route.

## Repository layout

```text
apps/
  api/
    prisma/              schema, SQL migration, seed
    src/
      auth/              login, rotation, session, logout
      common/            global guards, errors, response shape
      permissions/       capability groups
      roles/ users/      access administration
      media/             shared uploads and thumbnails
      categories/ brands/ attributes/
      products/          atomic aggregate writes
  web/
    app/                 Next.js App Router pages and layouts
    src/                 shared dashboard components and API client
```
