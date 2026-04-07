# Deploying Wrap on Coolify

This guide explains how to deploy Wrap on Coolify with an external PostgreSQL database.

## Prerequisites

- Coolify installed on your VPS
- PostgreSQL database already deployed on Coolify
- Domain configured (optional but recommended)
- At least 2GB RAM recommended

## Quick Deploy

### Step 1: Set Environment Variables in Coolify

Add these environment variables to your Coolify project:

```bash
# External PostgreSQL Database (from your existing Coolify PostgreSQL)
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@YOUR_DB_HOST:5432/wrap

# Security Secrets
JWT_SECRET=<generate-with: openssl rand -base64 32>
ENCRYPTION_SECRET=<generate-with: openssl rand -base64 32>

# Solana Configuration
SOLANA_NETWORK=devnet  # or mainnet for production

# x402 Settings
X402_FACILITATOR_URL=https://x402.agentstrail.ai
PLATFORM_FEE_RATE=0.1

# Ports (optional)
WEB_PORT=3000
API_PORT=3001
```

### Step 2: Deploy with Docker Compose

1. **Create a new resource** in Coolify dashboard
2. **Add resource** → Select "Docker Compose"
3. **Connect your GitHub repository**: `kalyangupta12/Wrap-AgentsTrail`
4. **Deploy** - Coolify will:
   - Build Next.js web app
   - Build Express API server
   - Start Redis cache
   - Connect to your external PostgreSQL

### Step 3: Run Database Migrations

After first deployment, run migrations manually:

```bash
# SSH into your Coolify server
cd /path/to/your/app

# Run Prisma migration
docker exec wrap-api sh -c "cd /app && npx prisma db push"
```

Or use this one-liner from your local machine:

```bash
# From project root with DATABASE_URL set
npx prisma db push
```

## Services Structure

| Service | Port | Description |
|---------|------|-------------|
| Web (Next.js) | 3000 | Frontend application |
| API (Express) | 3001 | Backend API with x402 |
| Redis | 6379 | Cache & rate limiting (internal) |
| PostgreSQL | external | Your existing Coolify database |

## Domain Setup

### Recommended Configuration

| Service | Domain |
|---------|--------|
| Web | wrap.yourdomain.com |
| API | api.wrap.yourdomain.com |

### In Coolify:
1. Go to each service's settings (web, api)
2. Add your domain
3. Enable SSL (Let's Encrypt automatically)

## Health Checks

- Web: `https://wrap.yourdomain.com`
- API: `https://api.wrap.yourdomain.com/health`
- Endpoints: `https://api.wrap.yourdomain.com/v1`

## Seeding Demo Data (Optional)

```bash
# SSH into your server and run seed script
docker exec wrap-api sh -c "cd /app && npx tsx packages/db/seed.ts"
```

## Updating

1. Push changes to your GitHub repository
2. Coolify auto-deploys (if webhook configured)
3. Or manually trigger redeploy in Coolify dashboard

## Using External PostgreSQL

This setup uses an external PostgreSQL database. To connect:

1. Get your PostgreSQL connection details from Coolify
2. Format as: `postgresql://user:password@host:5432/database`
3. Set as `DATABASE_URL` environment variable
4. Ensure the database is accessible from your app containers

Example with Coolify PostgreSQL:
```
DATABASE_URL=postgres://postgres:8xDJ6...VuVgWdD3@89.116.32.103:5432/wrap?sslmode=require
```

## Troubleshooting

### Build Fails at pnpm install
- Ensure `pnpm-lock.yaml` is committed to repo
- Check that all `package.json` files are present
- Try forcing a fresh build in Coolify

### Database Connection Issues
- Verify DATABASE_URL format
- Check database host is accessible
- Ensure database port (5432) is open
- Run `docker logs wrap-api` to see connection errors

### Redis Connection Issues
- Redis runs internally in docker-compose
- Check with: `docker exec wrap-redis redis-cli ping`

### API Key Encryption Issues
- Ensure `ENCRYPTION_SECRET` is set and consistent
- Use the same secret across web and API services
- Never change this secret after creating API keys

## Production Checklist

- [ ] Generated secure `JWT_SECRET`
- [ ] Generated secure `ENCRYPTION_SECRET`
- [ ] Set `DATABASE_URL` to external PostgreSQL
- [ ] Ran database migrations (`prisma db push`)
- [ ] Set `SOLANA_NETWORK=mainnet` for production
- [ ] Configured domains with SSL
- [ ] Set appropriate `PLATFORM_FEE_RATE`
- [ ] Tested all 15 crypto endpoints
- [ ] Set up database backups on PostgreSQL service

## Manual Commands

```bash
# Check logs
docker logs wrap-web
docker logs wrap-api
docker logs wrap-redis

# Restart services
docker restart wrap-web
docker restart wrap-api

# Run migrations
docker exec wrap-api npx prisma db push

# Access database
docker exec -it wrap-api npx prisma studio
```
