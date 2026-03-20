# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy web app package files
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm ci

# Copy web app source
COPY apps/web ./apps/web

# Build the app
RUN npm run build -w apps/web

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./.next/static
COPY --from=builder /app/apps/web/public ./public

# Expose port
EXPOSE 3000

# Start the app
CMD ["node", "server.js"]
