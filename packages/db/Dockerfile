# Migration runner
FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy Prisma schema
COPY packages/db/prisma ./packages/db/prisma

# Generate Prisma client
RUN cd packages/db && npx prisma generate

WORKDIR /app/packages/db

# Default command - push schema to database
CMD ["npx", "prisma", "db", "push", "--skip-generate"]
