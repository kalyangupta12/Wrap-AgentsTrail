# Base image for building
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
# Add build dependencies for native modules
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api-server/package.json ./apps/api-server/
COPY packages/db/package.json ./packages/db/
COPY packages/db/prisma ./packages/db/prisma
COPY packages/config/package.json ./packages/config/
RUN pnpm install --frozen-lockfile

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api-server/node_modules ./apps/api-server/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules
COPY --from=deps /app/packages/config/node_modules ./packages/config/node_modules
COPY . .

# Generate Prisma client
WORKDIR /app/packages/db
RUN npx prisma@5.22.0 generate
WORKDIR /app

# Build shared packages first
RUN pnpm --filter @wrap/config build
RUN pnpm --filter @wrap/db build

# Build API server
RUN pnpm --filter @wrap/api-server build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy necessary files
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/apps/api-server/package.json ./apps/api-server/
COPY --from=builder /app/apps/api-server/dist ./apps/api-server/dist
COPY --from=builder /app/apps/api-server/node_modules ./apps/api-server/node_modules
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/node_modules ./node_modules

USER expressjs

EXPOSE 3001

ENV PORT=3001

CMD ["node", "apps/api-server/dist/index.js"]
