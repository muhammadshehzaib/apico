# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# NEXT_PUBLIC_* values are inlined into the client bundle at BUILD time,
# so the API URL must be provided here as a build arg (not at runtime).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Install deps using the web app's own lockfile (no root workspace needed)
COPY apps/web/package*.json ./
RUN npm ci

# Build the standalone Next.js output (next.config.ts has output: 'standalone')
COPY apps/web ./
RUN npm run build

# ---------- Production stage ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# Listen on all interfaces inside the container so the reverse proxy can reach it
ENV HOSTNAME=0.0.0.0

# Copy the self-contained standalone server + static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
