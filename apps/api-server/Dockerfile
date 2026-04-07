# Base image for building
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api-server/package.json ./apps/api-server/
COPY packages/db/package.json ./packages/db/
COPY packages/config/package.json ./packages/config/
COPY packages/db/tsconfig.json ./packages/db/
COPY packages/config/tsconfig.json ./packages/config/
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build the application
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client using workspace Prisma version
RUN pnpm --filter @wrap/db exec prisma generate

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
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/packages/config ./packages/config
COPY --from=builder /app/node_modules ./node_modules

USER expressjs

EXPOSE 3001

ENV PORT=3001

CMD ["node", "apps/api-server/dist/index.js"]
