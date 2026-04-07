# Deploying Wrap on Coolify

This guide explains how to deploy Wrap on Coolify (self-hosted PaaS).

## Prerequisites

- Coolify installed on your VPS
- Domain configured (optional but recommended)
- At least 2GB RAM recommended

## Quick Deploy

### Option 1: Docker Compose (Recommended)

1. **Create a new project** in Coolify dashboard

2. **Add a new resource** → Select "Docker Compose"

3. **Connect your repository** or upload the code

4. **Set environment variables** in Coolify:
   ```
   POSTGRES_USER=wrap
   POSTGRES_PASSWORD=<generate-secure-password>
   POSTGRES_DB=wrap
   JWT_SECRET=<generate-with: openssl rand -base64 32>
   ENCRYPTION_SECRET=<generate-with: openssl rand -base64 32>
   X402_FACILITATOR_URL=https://x402.agentstrail.ai
   PLATFORM_FEE_RATE=0.1
   SOLANA_NETWORK=devnet
   ```

5. **Deploy** - Coolify will build and start all services

### Option 2: Individual Services

If you prefer more control, deploy each service separately:

#### 1. PostgreSQL
- Add PostgreSQL from Coolify's database templates
- Note the connection string

#### 2. Redis
- Add Redis from Coolify's database templates

#### 3. Web App (Next.js)
- Add new service → Dockerfile
- Dockerfile path: `apps/web/Dockerfile`
- Set environment variables:
  ```
  DATABASE_URL=<postgres-connection-string>
  NEXT_PUBLIC_SOLANA_NETWORK=devnet
  JWT_SECRET=<your-secret>
  ENCRYPTION_SECRET=<your-secret>
  ```

#### 4. API Server (Express)
- Add new service → Dockerfile
- Dockerfile path: `apps/api-server/Dockerfile`
- Set environment variables:
  ```
  DATABASE_URL=<postgres-connection-string>
  REDIS_URL=redis://redis:6379
  X402_FACILITATOR_URL=https://x402.agentstrail.ai
  PLATFORM_FEE_RATE=0.1
  JWT_SECRET=<your-secret>
  ENCRYPTION_SECRET=<your-secret>
  ```

## Domain Setup

### Recommended Configuration

| Service | Domain | Port |
|---------|--------|------|
| Web | wrap.yourdomain.com | 3000 |
| API | api.wrap.yourdomain.com | 3001 |

### In Coolify:
1. Go to each service's settings
2. Add your domain
3. Enable SSL (Let's Encrypt)

## Database Migrations

After first deployment, run migrations:

```bash
# SSH into your server or use Coolify's terminal
docker exec wrap-migrate npx prisma db push
```

Or the migration container runs automatically on `docker-compose up`.

## Seeding Demo Data (Optional)

```bash
docker exec -it wrap-api sh -c "cd /app && npx tsx packages/db/seed.ts"
```

## Health Checks

- Web: `https://wrap.yourdomain.com`
- API: `https://api.wrap.yourdomain.com/health`
- Endpoints: `https://api.wrap.yourdomain.com/v1`

## Updating

1. Push changes to your repository
2. Coolify auto-deploys (if configured) or manually redeploy
3. Migrations run automatically

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is healthy
- Check DATABASE_URL format
- Verify network connectivity between containers

### Redis Connection Issues
- Ensure Redis is running
- Check REDIS_URL format

### API Key Encryption Issues
- Ensure ENCRYPTION_SECRET is set
- Use same secret across web and API services

## Production Checklist

- [ ] Generate secure JWT_SECRET
- [ ] Generate secure ENCRYPTION_SECRET
- [ ] Generate secure POSTGRES_PASSWORD
- [ ] Set SOLANA_NETWORK=mainnet for production
- [ ] Configure domain with SSL
- [ ] Set appropriate PLATFORM_FEE_RATE
- [ ] Configure backup for PostgreSQL volume
