FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY api/package*.json ./
COPY package*.json ../

# Install dependencies
RUN npm ci

# Copy source code
COPY api ./

# Run Prisma migrations
RUN npm run prisma:generate

# Expose port
EXPOSE 5000

# Start the application
CMD ["npm", "run", "start"]
