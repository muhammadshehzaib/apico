# Apico

> An open-source REST API testing tool — built as a full-stack TypeScript project to demonstrate production-grade engineering practices.

<!-- Add a GIF/screenshot of the app here -->
<!-- ![Apico Demo](docs/demo.gif) -->

## Why I Built This

Postman is great, but it's closed-source, increasingly bloated, and requires a cloud account for basic features. I built Apico to solve that — a self-hostable, keyboard-friendly API client where your data stays on your own infrastructure.

Beyond the product goal, this project was a deliberate exercise in building production-quality software: proper error handling, structured logging, rate limiting, database indexing, CI/CD, and test coverage across both frontend and backend.

## Features

- **Request Builder** — HTTP methods, params, headers, body (JSON/form-data/raw), auth (Bearer, Basic, API Key)
- **Response Viewer** — Syntax-highlighted JSON, headers, response diff across history
- **Collections & Folders** — Hierarchical organisation with drag-and-drop reordering
- **Environment Variables** — `{{VARIABLE}}` syntax with per-workspace environments and secret masking
- **Request History** — Auto-saved execution history per user
- **Workspaces** — Multi-tenant with Owner / Editor / Viewer RBAC
- **Invite System** — Email invites with token-based acceptance, 7-day expiry
- **Sharing** — Public share links for individual requests and collections (with optional expiry)
- **Import** — Import collections from `.apico` export format

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│   Next.js 16 (App Router) · Redux · Zustand · Tailwind  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS  /api/v1
┌────────────────────────▼────────────────────────────────┐
│                    Express API (v1)                      │
│  Auth · Workspaces · Collections · Requests · History   │
│  Pino logging · Rate limiting · JWT · Zod validation    │
│  Swagger docs at /api-docs                              │
└────────────────────────┬────────────────────────────────┘
                         │ Prisma ORM
┌────────────────────────▼────────────────────────────────┐
│                      MySQL 8.0                          │
│  Indexed on: collectionId, userId, workspaceId,         │
│  environmentId — optimised for workspace-scoped queries │
└─────────────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 18, TypeScript, Tailwind CSS |
| State | Redux Toolkit + Zustand |
| Backend | Express.js, TypeScript |
| ORM | Prisma 5 |
| Database | MySQL 8.0 |
| Auth | JWT (access + refresh tokens), bcrypt |
| Validation | Zod (frontend + backend) |
| Logging | Pino (structured JSON, pino-pretty in dev) |
| API Docs | Swagger / OpenAPI 3.0 |
| Testing (API) | Vitest + Supertest — 12 test suites |
| Testing (UI) | Vitest + Testing Library + MSW |
| E2E | Playwright |
| Containers | Docker + docker-compose |

## Quick Start

### Docker (recommended — 2 minutes)

```bash
git clone https://github.com/yourusername/apico.git
cd apico

# Copy env template and set your JWT secrets
cp .env.docker .env
# Edit .env — set JWT_SECRET and JWT_REFRESH_SECRET

docker compose up --build
```

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:5000/api/v1 |
| API docs | http://localhost:5000/api-docs |

### Manual Setup

**Backend**
```bash
cd api
cp .env.example .env        # fill in DATABASE_URL, JWT secrets
npm install
npm run db:generate
npm run db:migrate
npm run dev                 # http://localhost:5000
```

**Frontend**
```bash
cd apps/web
cp .env.example .env.local  # set NEXT_PUBLIC_API_BASE_URL
npm install
npm run dev                 # http://localhost:3000
```

## Running Tests

```bash
# Backend — unit + integration (requires a test DB)
cd api
npm test

# Backend — with coverage report
npm run test:coverage

# Frontend — component tests
cd apps/web
npm test

# E2E
npm run test:e2e
```

## Environment Variables

### Backend (`api/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string |
| `JWT_SECRET` | ✅ | Access token secret (min 32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token secret (min 32 chars) |
| `JWT_EXPIRES_IN` | ✅ | Access token TTL (e.g. `15m`) |
| `JWT_REFRESH_EXPIRES_IN` | ✅ | Refresh token TTL (e.g. `7d`) |
| `PORT` | ✅ | Server port (default `5000`) |
| `CORS_ORIGIN` | ✅ | Frontend origin for CORS |
| `NODE_ENV` | ✅ | `development` / `production` / `test` |
| `WEB_APP_URL` | — | Used in invite email links |
| `LOG_LEVEL` | — | Pino log level (default `info`) |
| `SMTP_*` | — | Email delivery for workspace invites |

### Frontend (`apps/web/.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Backend API base URL (e.g. `http://localhost:5000/api/v1`) |

## Technical Decisions

**Why MySQL over PostgreSQL?**
The target self-hosting audience is more likely to have MySQL available. Prisma abstracts the differences; switching is a one-line change in `schema.prisma`.

**Why JWT with refresh tokens instead of sessions?**
Stateless auth scales horizontally without a shared session store. Short-lived access tokens (15m) limit the blast radius of a leaked token; refresh tokens allow silent renewal without re-login.

**Why Pino over Winston?**
Pino is 5–10× faster than Winston in benchmarks, outputs structured JSON by default (important for log aggregation tools like Datadog/Loki), and has a clean API. `pino-pretty` gives readable dev output with zero config changes.

**Why not decouple request execution into a worker queue?**
For a Postman-style tool, request execution is I/O-bound (waiting for network), not CPU-bound. Node.js handles thousands of concurrent I/O waits natively. A BullMQ/Redis worker fleet would add infrastructure complexity and make the UX worse (polling instead of immediate response) for no real concurrency gain at this scale.

**API versioning from day one (`/api/v1/`)**
Breaking API changes are inevitable. Versioning from the start means consumers (including the frontend) can pin to a version while a new one is developed in parallel.

## Project Structure

```
apico/
├── api/                        # Express backend
│   ├── prisma/                 # Schema, migrations, seed
│   └── src/
│       ├── config/             # Env, Prisma, Swagger
│       ├── controllers/        # Request handlers
│       ├── errors/             # Typed error classes (AppError hierarchy)
│       ├── middleware/         # Auth, rate limiting, request ID, errors
│       ├── proxy/              # HTTP request executor (axios)
│       ├── queries/            # Prisma data access layer
│       ├── routes/             # Express routers
│       ├── services/           # Business logic
│       ├── tests/              # Integration test suites
│       ├── utils/              # Logger, JWT, response helpers
│       └── validations/        # Zod schemas
│
├── apps/
│   └── web/                    # Next.js frontend
│       └── src/
│           ├── app/            # App Router pages
│           ├── components/     # UI components (+ __tests__)
│           ├── hooks/          # Custom React hooks
│           ├── services/       # API client layer
│           ├── store/          # Redux slices
│           └── tests/          # MSW mocks, setup
│
├── docs/                       # Self-hosting guide
├── docker-compose.yml
└── .env.docker                 # Docker env template
```

## Self-Hosting

See [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) for deployment guides covering Docker Compose, Railway, and manual VPS setup.

## Contributing

1. Fork the repo and create a feature branch
2. Run `npm test` in both `api/` and `apps/web/` — all tests must pass
3. Open a PR with a clear description of what changed and why

## License

MIT
