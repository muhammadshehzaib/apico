# syntax=docker/dockerfile:1

# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Prisma needs OpenSSL present to detect/build the correct engine
RUN apk add --no-cache openssl

COPY api/package*.json ./
RUN npm ci

COPY api/prisma ./prisma
RUN npx prisma generate

COPY api/tsconfig.json ./
COPY api/src ./src
RUN npm run build

# ---------- Production image ----------
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# OpenSSL is required at runtime by the Prisma query + migration engines
RUN apk add --no-cache openssl

COPY api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Compiled application
COPY --from=builder /app/dist ./dist

# Prisma generated client + CLI + engines so `migrate deploy` runs offline
# (the prisma CLI is a devDependency, omitted above, so copy it from the builder)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY api/prisma ./prisma

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
