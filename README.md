# Apico

Open-source REST API testing tool. Test, debug, and document your APIs with ease.

## Features

- **REST API Testing** - Send HTTP requests with support for common HTTP methods
- **Request Builder** - Params, headers, body, and authentication
- **Response Viewer** - Syntax-highlighted response viewing + headers
- **Request History** - Auto-saved request history
- **Collections** - Organize requests into collections and folders
- **Environment Variables** - Use variables with `{{VARIABLE}}` syntax
- **Workspaces** - Isolated workspaces with members and roles
- **Request Sharing** - Share requests/collections via links
- **Scripts & Tests** - Pre-request scripts and post-response test scripts

## Tech Stack

### Frontend
- **Next.js 16**
- **React 18**
- **TypeScript**
- **Tailwind CSS**
- **Redux Toolkit**
- **Zod**

### Backend
- **Express.js**
- **TypeScript**
- **Prisma**
- **MySQL**
- **JWT**

## Quick Start

### Prerequisites
- Node.js 20+
- Docker and Docker Compose (recommended)
- MySQL (manual setup)

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/yourusername/apico.git
cd apico

# Build and start services
docker-compose up --build

# Web: http://localhost:3000
# API: http://localhost:5000/api
```

### Manual Setup

#### 1. Backend Setup

```bash
cd api

npm install
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Start the server
npm run dev
```

#### 2. Frontend Setup

```bash
cd apps/web

npm install
cp .env.example .env.local

# Example:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api

npm run dev
```

## Project Structure

```text
apico/
|-- api/                       # Express backend
|   |-- prisma/                # Prisma schema/migrations/seed
|   `-- src/                   # API source
|
|-- apps/
|   `-- web/                   # Next.js frontend
|
|-- docs/                      # Guides (self-hosting, etc.)
`-- docker-compose.yml         # Local Docker setup
```

## Configuration

### Backend Environment Variables (`api/.env`)

```env
DATABASE_URL=mysql://user:password@localhost:3306/apico
JWT_SECRET=your-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
PORT=5000
NODE_ENV=development
```

### Frontend Environment Variables (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

## Development

### Running Tests

```bash
# Backend tests
cd api
npm test

# Frontend tests
cd apps/web
npm test
```

### Building for Production

```bash
# Backend
cd api
npm run build

# Frontend
cd apps/web
npm run build
```

## Deployment

See `docs/SELF_HOSTING.md` for detailed deployment instructions including Docker, Railway, and manual VPS deployment.

