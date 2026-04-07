# Wrap - Multi-Tenant API Monetization Platform

**Wrap** is a multi-tenant platform where users can become API providers, monetize their APIs using Solana payments via x402 protocol, and earn revenue.

## 🚀 Live Services

- **Web Frontend:** http://localhost:3000
- **API Server:** http://localhost:3001
- **API Docs:** http://localhost:3001/v1

## 🏗️ Architecture

### Multi-Tenant Model
- Users log in with Solana wallet (Phantom, Solflare)
- Each user can become a **Provider** by creating API products
- Providers set their own **payout wallet** (can differ from login wallet)
- Platform takes **10% fee**, provider gets **90%** (configurable via `PLATFORM_FEE_RATE`)
- Each API has its own pricing, rate limits, and configuration

### Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- Solana wallet-adapter
- Tailwind CSS + shadcn/ui
- Network switcher (Mainnet/Devnet)

**Backend:**
- Express API server
- x402 payment middleware
- PostgreSQL (via Prisma)
- Redis (for rate limiting)
- Infisical Cloud (secret management)

**Blockchain:**
- Solana (Mainnet/Devnet switchable)
- x402 protocol for pay-per-call
- AgentsTrail facilitator (`x402.agentstrail.ai`)

## 📦 Project Structure

```
wrap-agentstrail/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── app/
│   │   │   ├── (public)/       # Landing page
│   │   │   ├── (authed)/
│   │   │   │   ├── dashboard/  # User dashboard
│   │   │   │   ├── explorer/   # API explorer
│   │   │   │   └── provider/   # Provider dashboard
│   │   │   └── api/            # Next.js API routes
│   │   └── components/
│   │
│   └── api-server/             # Express API server
│       └── src/
│           ├── index.ts        # Server entry
│           ├── lib/
│           │   ├── payment.ts  # x402 middleware
│           │   ├── secrets.ts  # Infisical integration
│           │   ├── redis.ts    # Rate limiting
│           │   └── analytics.ts # Usage tracking
│           └── routes/
│               └── dynamic.ts  # Dynamic API proxy
│
├── packages/
│   ├── db/                     # Prisma + PostgreSQL
│   │   ├── prisma/schema.prisma
│   │   ├── index.ts
│   │   └── seed.ts
│   └── config/                 # Shared config
│
└── .env                        # Environment variables
```

## 🗄️ Database Schema

### User Model
```prisma
model User {
  role            UserRole     // USER, PROVIDER, ADMIN
  walletAddress   String       @unique

  // Consumer fields
  creditBalance   Float        // USDC balance for API calls

  // Provider fields
  payoutWallet    String?      // Where to receive payments
  providerName    String?      // Display name
  totalEarnings   Float        // Total earned
  pendingPayout   Float        // Pending withdrawal

  products        ApiProduct[] // APIs they provide
}
```

### ApiProduct Model
```prisma
model ApiProduct {
  slug            String       @unique
  name            String
  description     String
  providerId      String       // Owner

  // Upstream API
  upstreamUrl     String
  secretKeyName   String       // In Infisical
  httpMethod      String       // GET/POST

  // Pricing
  pricePerCall    Float        // USDC
  rateLimit       Int          // req/min

  isActive        Boolean
  isPublic        Boolean      // Show in marketplace
}
```

### Revenue Tracking
- `ApiCall` - Every API call logged with earnings split
- `Earning` - Monthly aggregated earnings per provider per product
- `PlatformConfig` - Platform fee rate (default 10%)

## 🔧 Setup Instructions

### 1. Prerequisites
- Node.js 18+
- pnpm
- PostgreSQL
- Redis
- Infisical Cloud account (app.infisical.com)

### 2. Database Setup

```bash
# Copy environment file
cp .env.example .env

# Update .env with your PostgreSQL connection
DATABASE_URL="postgresql://user:pass@host:5432/wrap?sslmode=require"

# Push schema to database
pnpm --filter @wrap/db push

# Seed demo data
pnpm --filter @wrap/db seed
```

### 3. Infisical Setup

1. Go to [app.infisical.com](https://app.infisical.com)
2. Create a project
3. Create a Machine Identity with Universal Auth
4. Add secrets:
   - `CMC_PRO_API_KEY` - CoinMarketCap API key
   - `OPENWEATHER_API_KEY` - OpenWeatherMap API key
5. Update `.env`:
```bash
INFISICAL_CLIENT_ID="your-client-id"
INFISICAL_CLIENT_SECRET="your-client-secret"
INFISICAL_PROJECT_ID="your-project-id"
INFISICAL_ENVIRONMENT="dev"
```

### 4. Redis Setup

```bash
# Local Redis
redis-server

# Or use your VPS Redis
REDIS_URL="redis://your-vps:6379"
```

### 5. Run Development

```bash
# Install dependencies
pnpm install

# Start web frontend
pnpm --filter @wrap/web dev

# Start API server (in another terminal)
pnpm --filter @wrap/api-server dev
```

**Services:**
- Web: http://localhost:3000
- API: http://localhost:3001

## 🎯 Key Features

### For API Consumers
- Connect Solana wallet (Phantom, Solflare)
- Browse API marketplace
- Pay per API call with USDC
- Switch between Mainnet/Devnet
- Track usage and spending

### For API Providers
- Create and list APIs in marketplace
- Set pricing and rate limits
- Configure upstream API endpoints
- Store API keys securely in Infisical
- Separate payout wallet support
- Track earnings and analytics
- 90% revenue share

### Payment Flow (x402)
1. User calls `/v1/btc-price`
2. Server responds `402 Payment Required` with payment details
3. Client auto-signs Solana transaction
4. Client retries with `X-PAYMENT` header
5. Server verifies payment via facilitator (`x402.agentstrail.ai`)
6. Server proxies request to upstream API
7. Revenue split: 90% provider, 10% platform

## 🌐 Network Switching

Toggle between Solana Mainnet and Devnet:
- Dropdown in header (green = Mainnet, yellow = Devnet)
- Selection persisted in localStorage
- Page reloads to reinitialize wallet connections
- API server reads network from `X-Solana-Network` header

## 📊 Provider Dashboard

Access at `/provider`:

### `/provider/products`
- List your APIs
- Create new API products
- Edit pricing and settings
- Toggle active/inactive

### `/provider/earnings`
- Total earnings (all time)
- Pending payout
- Monthly breakdown
- Per-product revenue

### `/provider/settings`
- Configure payout wallet
- Provider name and bio
- API key management

## 🔑 Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Solana Network (default: devnet)
NEXT_PUBLIC_SOLANA_NETWORK="devnet"

# x402 Facilitator
X402_FACILITATOR_URL="https://x402.agentstrail.ai"

# Redis
REDIS_URL="redis://localhost:6379"

# Platform Settings
PLATFORM_FEE_RATE="0.1"  # 10% platform fee

# Infisical Cloud
INFISICAL_SITE_URL="https://app.infisical.com"
INFISICAL_CLIENT_ID="..."
INFISICAL_CLIENT_SECRET="..."
INFISICAL_PROJECT_ID="..."
INFISICAL_ENVIRONMENT="dev"

# Fallback API Keys (if Infisical not configured)
CMC_PRO_API_KEY=""
OPENWEATHER_API_KEY=""
```

## 🚢 Deployment

### Database
- Deploy PostgreSQL on your VPS or use managed service (Neon, Supabase)
- Run `pnpm --filter @wrap/db push` to create tables
- Run `pnpm --filter @wrap/db seed` for demo data

### Redis
- Deploy on VPS with Coolify or use managed Redis

### API Server
Deploy on VPS with Coolify:
```bash
pnpm --filter @wrap/api-server build
pnpm --filter @wrap/api-server start
```

### Frontend
Deploy on Vercel:
```bash
pnpm --filter @wrap/web build
```

## 📝 Creating Your First API

1. **Login** with Phantom wallet
2. Go to **`/provider/products/new`**
3. Fill in:
   - Name: "My API"
   - Slug: "my-api" (becomes `/v1/my-api`)
   - Description
   - Upstream URL: Your actual API
   - Secret Key Name: Name in Infisical (e.g., `MY_API_KEY`)
   - Price: 0.001 USDC per call
   - Rate Limit: 60 req/min
4. **Click Create**
5. Your API is now live at `/v1/my-api`

## 🔒 Security

- API keys stored in Infisical Cloud (encrypted)
- Wallet-based authentication (no passwords)
- Rate limiting per wallet per API
- Payment verification via x402 facilitator
- Secrets cached for 5 minutes to reduce API calls

## 📈 Revenue Model

**Example:**
- Provider charges: $0.001 USDC/call
- Platform fee: 10%
- Provider earns: **$0.0009 USDC/call**
- Platform earns: **$0.0001 USDC/call**

**At Scale:**
- 1,000 calls/day = **$0.90/day** for provider
- 30,000 calls/month = **$27/month** for provider

## 🛠️ Development Commands

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter @wrap/db generate

# Push database schema
pnpm --filter @wrap/db push

# Seed database
pnpm --filter @wrap/db seed

# Start web dev server
pnpm --filter @wrap/web dev

# Start API dev server
pnpm --filter @wrap/api-server dev

# Build all
pnpm build

# Type check
pnpm typecheck
```

## 📄 License

MIT

---

Built with ❤️ using Next.js, Solana, x402, and Infisical Cloud
