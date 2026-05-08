FROM node:20-alpine AS builder

WORKDIR /app

COPY api/package*.json ./
RUN npm ci

COPY api/prisma ./prisma
RUN npx prisma generate

COPY api/tsconfig.json ./
COPY api/src ./src
RUN npm run build

# --- Production image ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY api/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY api/prisma ./prisma

EXPOSE 5000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
