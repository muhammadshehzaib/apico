# Apico ⚡

> A privacy-first, open-source API workspace built for developer velocity. Self-hostable, keyboard-centric, and engineered with absolute production-grade full-stack standards.

<p align="center">
  <a href="https://apicomain.netlify.app/"><img src="https://img.shields.io/badge/Live%20Demo-Visit-2ea44f?style=for-the-badge&logo=netlify&logoColor=white" alt="Live Demo"></a>
  <a href="https://github.com/muhammadshehzaib/apico"><img src="https://img.shields.io/badge/Source-GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js%2016-000000?logo=nextdotjs&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma">
  <img src="https://img.shields.io/badge/MySQL-4479A1?logo=mysql&logoColor=white" alt="MySQL">
  <img src="https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white" alt="Playwright">
</p>

## 🚀 Why Apico Exists

Modern API clients are becoming increasingly bloated, slow, and cloud-locked—often forcing users to register accounts just to run a basic request, and silently syncing sensitive client payloads or authentication headers to third-party servers.

**Apico solves this.** It is a lightweight, secure, and keyboard-friendly alternative where your environment secrets and API data stay completely under your control. 

Beyond its utility, Apico was designed to showcase **elite systems engineering practices**: strict database indexing, stateless authentication scaling, secure backend request proxying, and thorough automated test suites across both frontend and backend.

## ✨ High-Impact Features

* **⚡ Advanced HTTP Client:** Complete support for REST methods, headers, query parameters, and raw, JSON, or form-data payloads.
* **🔒 Dynamic Environment Interpolation:** Securely scope, mask, and inject variable values using clean `{{VARIABLE}}` syntax, isolating local, staging, and production states.
* **👥 Multi-Tenant Team Workspaces:** Secure collaboration with granular Role-Based Access Control (RBAC) (Owner, Editor, Viewer) and secure token-based email invite flows.
* **🌐 Secure Backend Proxying:** Integrated Node.js proxy to handle client request execution, bypassing CORS restrictions safely and isolating sensitive request contexts.
* **🧪 Zero-Auth Sandbox:** A fast guest playground mode that lets developers instantly test requests without committing to database overhead.

### Additional protocol clients

Open **Request** and choose **GraphQL**, **gRPC**, or **WebSocket** from the protocol bar.

- **GraphQL:** Enter an HTTP(S) endpoint, query or mutation, JSON variables, and optional JSON headers. The existing Apico request proxy sends the POST request and shows the full HTTP response, including GraphQL errors in its body.
- **gRPC:** Paste a self-contained `.proto` definition, enter a `host:port`, package-qualified service name, unary method, JSON message, and optional string metadata. The Apico backend makes the call with a 10-second deadline. Enable TLS for secure endpoints. This client currently supports unary calls; imported `.proto` files, server reflection, and streaming RPCs are not supported.
- **WebSocket:** Enter a `ws://` or `wss://` URL, connect, send text messages, and inspect a live transcript. The browser opens the connection directly, so browser restrictions apply and custom handshake headers are unavailable.

GraphQL and WebSocket need no extra server setup. gRPC requires the API server to be able to reach the target host, and the gRPC endpoint requires an authenticated Apico user.

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

### Run everything in Docker

Install Docker Desktop and Node.js 22, then run these commands from the repository root:

```powershell
# Generate local environment files (existing files are preserved).
node scripts/dev.mjs env

# Build and start MySQL, the API, and the frontend.
docker compose --env-file .env.local up -d --build

# Follow logs, or stop the stack while keeping database data.
docker compose --env-file .env.local logs -f
docker compose --env-file .env.local down
```

The API container automatically applies database migrations, including the request body fix.
Rebuild the images after source changes. The generated root `.env.local` uses localhost URLs;
`.env.docker` remains the deployment template.

| Service | URL |
|---|---|
| Web app | http://localhost:3000 |
| API | http://localhost:5000/api/v1 |
| API docs | http://localhost:5000/api-docs |

### Develop locally with hot reload

Use Docker Desktop for MySQL and Node.js 22 for the frontend and backend.
Run from the repository root:

```powershell
# First run: create env files, start MySQL, install dependencies, generate Prisma,
# and apply committed migrations.
node scripts/dev.mjs setup

# Start frontend and backend together. Ctrl+C stops both app servers.
node scripts/dev.mjs
```

The URLs are the same as above. The development database is separate from the full Docker
stack and uses `127.0.0.1:3307`. Stop the full Docker stack before starting local app servers
because both use ports 3000 and 5000.

For separate terminals:

```powershell
# Terminal 1
node scripts/dev.mjs backend

# Terminal 2
node scripts/dev.mjs frontend
```

On later runs, start the database and then the apps:

```powershell
docker compose -f docker-compose.dev.yml up -d --wait
node scripts/dev.mjs
```

After pulling new database migrations:

```powershell
cd api
npx.cmd prisma generate
npx.cmd prisma migrate deploy
```

To stop the development database while preserving its data:

```powershell
docker compose -f docker-compose.dev.yml down
```

The script preserves existing environment files. If you already have `api/.env` or
`apps/web/.env.local`, check their database connection and API URL against the values above.
You can also run `npm.cmd run dev` directly inside `api` and `apps/web` after setup.
On macOS/Linux, use `npm` and `npx` in place of `npm.cmd` and `npx.cmd`.

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
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api/v1`) |

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
