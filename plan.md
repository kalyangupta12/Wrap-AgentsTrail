# x402 API Monetization Layer — Platform Plan

> **Concept:** You own real API keys (CoinMarketCap, weather, AI, etc.). You wrap them behind your x402 facilitator, expose monetized endpoints, and users pay per call using Solana wallets. You earn the spread.

---

## 1. System Architecture Overview

```
User (Solana Wallet)
        │
        ▼
  [Next.js Frontend]  ←── wallet auth (Phantom / Backpack / Solflare)
        │
        ▼
  [Your x402 Facilitator Layer]
  ├── Payment verification (SOL / USDC on Solana)
  ├── Rate limiting per wallet
  └── Request routing
        │
        ▼
  [API Wrapper / Linker Layer]  ◄── YOUR actual API keys (stored securely)
  ├── /btc-price      → CoinMarketCap API
  ├── /weather        → OpenWeatherMap API
  ├── /ai-complete    → OpenAI / Anthropic API
  └── /custom         → any key you register
        │
        ▼
  [Response back to user]  +  [Revenue logged to your wallet]
```

---

## 2. Core Components

### 2A. Frontend (Next.js 14 App Router)

| Component | Purpose |
|---|---|
| Landing / Marketplace | Shows all your exposed endpoints, pricing per call |
| Wallet Connect | Phantom, Backpack, Solflare via `@solana/wallet-adapter` |
| API Explorer | Live test each endpoint after wallet auth |
| Dashboard (User) | Call history, spending, wallet balance |
| Dashboard (Admin — YOU) | All API keys, revenue, usage analytics |

### 2B. x402 Facilitator — AgentsTrail (yours at x402.agentstrail.ai)

The x402 protocol = HTTP 402 "Payment Required" flow:
1. User hits your endpoint
2. Server responds `402` with payment challenge (network, price, payTo wallet)
3. Client signs + sends the Solana transaction
4. Client retries with `X-PAYMENT` header containing the signed payload
5. Your facilitator at `x402.agentstrail.ai` verifies on-chain → approves
6. Express middleware unlocks the response

**Your stack uses the official `@x402` packages:**
```typescript
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactSvmScheme } from '@x402/svm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';

// Points to YOUR facilitator — x402.agentstrail.ai
const facilitator = new HTTPFacilitatorClient({ url: 'https://x402.agentstrail.ai' });

// Middleware wired once — all routes protected automatically
app.use(
  paymentMiddleware(
    {
      'GET /your-endpoint': {
        accepts: [{
          scheme: 'exact',
          price: '$0.001',
          network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', // Solana mainnet
          payTo: 'YOUR_SOLANA_WALLET_ADDRESS',
        }],
        description: 'Your API description',
      },
    },
    new x402ResourceServer(facilitator)
      .register('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', new ExactSvmScheme()),
  ),
);
```

**What each piece does:**
- `HTTPFacilitatorClient` — your Express server delegates payment verification to `x402.agentstrail.ai` (your own facilitator), so it never handles crypto logic itself
- `x402ResourceServer` — the resource server that registers supported payment schemes per network
- `ExactSvmScheme` — handles the Solana VM exact-amount payment scheme (atomic, no partial pays)
- `paymentMiddleware` — wraps any Express route, returns `402` to unpaid callers automatically

### 2C. API Key Manager (the "wrapper linker")

This is your secret layer. Users never see your real API keys.

Each "product" you create:
```
Product: BTC Price Lookup
  ├── Slug: /api/v1/btc-price
  ├── Upstream: CoinMarketCap → https://pro-api.coinmarketcap.com/v1/...
  ├── Your Key: CMC_PRO_API_KEY (stored encrypted in DB)
  ├── Price per call: 0.001 USDC
  ├── Rate limit: 10 req/min per wallet
  └── Markup: you pay $0.0001, you charge $0.001 → 10x margin
```

---

## 3. Tech Stack

### Frontend
- **Next.js 14** — App Router, Server Actions, RSC
- **Tailwind CSS** — utility-first styling
- **shadcn/ui** — component system
- **@solana/wallet-adapter-react** — wallet connection
- **@solana/web3.js** — transaction signing, balance checks
- **SWR / TanStack Query** — data fetching + caching

### Backend / API Layer
- **Next.js API Routes** — your facilitator endpoints live here
- **Prisma + PostgreSQL** (Supabase or Neon) — store: users, API products, usage logs, keys
- **Redis (Upstash)** — rate limiting, payment nonce cache
- **@noble/ed25519** or **@solana/web3.js** — verify wallet signatures

### Solana / x402
- **`@x402/express`** — `paymentMiddleware` + `x402ResourceServer` — the gate
- **`@x402/svm/exact/server`** — `ExactSvmScheme` — Solana exact-amount payment scheme
- **`@x402/core/server`** — `HTTPFacilitatorClient` pointing to `x402.agentstrail.ai`
- **`@x402/client`** — browser/Node client that auto-handles 402 → sign → retry
- **Helius RPC** — reliable Solana RPC (used internally by facilitator for tx verification)
- **USDC SPL Token** — preferred payment token on `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp`

### Secret Management (API Keys)
- **Option A — Vercel Environment Variables** — simple, good for start
- **Option B — HashiCorp Vault** — enterprise-grade, dynamic secrets
- **Option C — Infisical** — open-source Vault alternative, self-hostable on Coolify ✓
- **Option D — AWS Secrets Manager / GCP Secret Manager** — if on cloud

> **Recommended for you:** Infisical on your Coolify VPS — you already have the infrastructure.

---

## 4. API Key Management Options

### Option A: Infisical (Recommended — Self-Hosted on Coolify)
```
Pros:
  ✓ Open source, self-hosted on your existing Coolify VPS
  ✓ Web UI to add/rotate/audit keys
  ✓ SDK pulls secrets at runtime (no env file leaks)
  ✓ Version history + audit log
  ✓ Per-environment support (dev/staging/prod)

Cons:
  - Needs a separate Coolify service deployment
  - Slight learning curve

Integration:
  npm install @infisical/sdk
  const client = new InfisicalClient({ token: process.env.INFISICAL_TOKEN });
  const key = await client.getSecret("CMC_PRO_API_KEY");
```

### Option B: Vercel Encrypted Env Vars (Simplest)
```
Pros:
  ✓ Zero setup, built into Vercel
  ✓ Per-environment (preview vs production)
  ✓ Never exposed client-side

Cons:
  - Can't rotate without redeployment
  - No audit log
  - Not great if you're on a custom VPS

Best for: Early/MVP stage
```

### Option C: HashiCorp Vault
```
Pros:
  ✓ Industry standard
  ✓ Dynamic secrets (generate temp keys that expire)
  ✓ Full audit trail
  ✓ Kubernetes + cloud native integrations

Cons:
  - Complex to operate
  - Overkill for solo/small team

Best for: If you plan to scale with team members
```

### Option D: Doppler
```
Pros:
  ✓ SaaS, no infra needed
  ✓ Excellent DX, CLI + GitHub Actions integration
  ✓ Free tier available

Cons:
  - Third-party SaaS (not self-hosted)
  - Costs money at scale

Best for: If you don't want to manage infra
```

---

## 5. Monetization Layer Design

### Pricing Models You Can Offer

| Model | Description | Example |
|---|---|---|
| **Per Call** | Fixed price each request | 0.001 USDC / BTC price lookup |
| **Prepaid Credits** | Deposit SOL/USDC, deducted per call | 1 USDC = 500 calls |
| **Subscription** | Monthly wallet-signed commitment | 5 USDC/month = unlimited |
| **Tiered** | Price drops at volume | 0-100 calls @ full price, 100+ @ 50% |

### Your Revenue Flow
```
User deposits USDC → your treasury wallet
                          │
             ┌────────────┘
             ▼
    Per API call: deduct from user's credit balance
             │
             ▼
    You pay actual API provider (CoinMarketCap etc.)
    at their rate (usually much lower)
             │
             ▼
    You keep the margin
```

---

## 6. Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  walletAddress String   @unique
  creditBalance Float    @default(0)   // in USDC
  createdAt     DateTime @default(now())
  calls         ApiCall[]
  deposits      Deposit[]
}

model ApiProduct {
  id            String   @id @default(cuid())
  slug          String   @unique        // e.g. "btc-price"
  name          String
  description   String
  upstreamUrl   String                  // real API endpoint
  secretKey     String                  // key name in Infisical/Vault
  pricePerCall  Float                   // in USDC
  rateLimit     Int                     // req/min per wallet
  isActive      Boolean  @default(true)
  calls         ApiCall[]
}

model ApiCall {
  id            String   @id @default(cuid())
  userId        String
  productId     String
  cost          Float
  responseCode  Int
  latencyMs     Int
  createdAt     DateTime @default(now())
  user          User     @relation(fields: [userId], references: [id])
  product       ApiProduct @relation(fields: [productId], references: [id])
}

model Deposit {
  id            String   @id @default(cuid())
  userId        String
  txSignature   String   @unique
  amountUsdc    Float
  confirmedAt   DateTime?
  user          User     @relation(fields: [userId], references: [id])
}
```

---

## 7. Wallet Auth Flow (Solana)

No passwords. Pure wallet signature auth:

```
1. User connects wallet (Phantom)
2. Backend generates a nonce: "Sign in to Deveplexity API Hub: abc123"
3. User signs nonce with their private key (never leaves browser)
4. Backend verifies signature using wallet's public key
5. If valid → issue JWT with walletAddress claim
6. JWT used for all subsequent requests
```

```typescript
// Verify signature server-side
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";

function verifyWalletSignature(
  message: string,
  signature: string,
  walletAddress: string
): boolean {
  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = bs58.decode(signature);
  const publicKeyBytes = new PublicKey(walletAddress).toBytes();
  return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
}
```

---

## 8. x402 Integration — Real Code with AgentsTrail Facilitator

### Express API Server (separate from Next.js frontend)

```typescript
// server/index.ts
import express from 'express';
import { paymentMiddleware, x402ResourceServer } from '@x402/express';
import { ExactSvmScheme } from '@x402/svm/exact/server';
import { HTTPFacilitatorClient } from '@x402/core/server';
import { getSecret } from './lib/secrets';        // Infisical wrapper
import { proxyUpstream } from './lib/proxy';       // your API key linker
import { logCall } from './lib/analytics';         // DB logging

const app = express();
const YOUR_WALLET = process.env.DEVEPLEXITY_WALLET_ADDRESS!;

// ── AgentsTrail facilitator — YOUR server at x402.agentstrail.ai ──────────
const facilitator = new HTTPFacilitatorClient({
  url: 'https://x402.agentstrail.ai',
});

const resourceServer = new x402ResourceServer(facilitator)
  .register('solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', new ExactSvmScheme());

// ── Route registry — loaded from DB / admin panel ─────────────────────────
// Each entry maps to an upstream API you wrap with your own key
const ROUTE_CONFIG = {
  'GET /v1/btc-price': {
    accepts: [{
      scheme: 'exact',
      price: '$0.001',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      payTo: YOUR_WALLET,
    }],
    description: 'Live BTC/USD price via CoinMarketCap',
  },
  'GET /v1/eth-price': {
    accepts: [{
      scheme: 'exact',
      price: '$0.001',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      payTo: YOUR_WALLET,
    }],
    description: 'Live ETH/USD price via CoinMarketCap',
  },
  'GET /v1/weather': {
    accepts: [{
      scheme: 'exact',
      price: '$0.002',
      network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      payTo: YOUR_WALLET,
    }],
    description: 'Weather lookup via OpenWeatherMap',
  },
  // add more via admin panel → writes to DB → server hot-reloads config
};

// ── Mount x402 payment middleware ─────────────────────────────────────────
app.use(paymentMiddleware(ROUTE_CONFIG, resourceServer));

// ── Actual route handlers (only reached after payment verified) ───────────
app.get('/v1/btc-price', async (req, res) => {
  const apiKey = await getSecret('CMC_PRO_API_KEY');   // from Infisical
  const data = await proxyUpstream(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC',
    { 'X-CMC_PRO_API_KEY': apiKey }
  );
  await logCall({ route: '/v1/btc-price', wallet: req.headers['x-wallet-address'], cost: 0.001 });
  res.json(data);
});

app.get('/v1/eth-price', async (req, res) => {
  const apiKey = await getSecret('CMC_PRO_API_KEY');
  const data = await proxyUpstream(
    'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ETH',
    { 'X-CMC_PRO_API_KEY': apiKey }
  );
  await logCall({ route: '/v1/eth-price', wallet: req.headers['x-wallet-address'], cost: 0.001 });
  res.json(data);
});

app.listen(3001, () => console.log('x402 API server running on :3001'));
```

### Dynamic Route Loader (Admin Panel → Hot Config)

```typescript
// lib/routeConfig.ts — build ROUTE_CONFIG from DB at startup + reload
import { prisma } from './prisma';

export async function buildRouteConfig(walletAddress: string) {
  const products = await prisma.apiProduct.findMany({ where: { isActive: true } });
  return Object.fromEntries(
    products.map(p => [
      `GET /v1/${p.slug}`,
      {
        accepts: [{
          scheme: 'exact',
          price: `$${p.pricePerCall}`,
          network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
          payTo: walletAddress,
        }],
        description: p.description,
      },
    ])
  );
}
```

### Client-Side: Auto 402 Handler (Next.js frontend)

```typescript
// lib/x402Client.ts — wraps fetch to auto-handle 402 → sign → retry
import { wrapFetchWithPayment } from '@x402/client';
import { useWallet } from '@solana/wallet-adapter-react';

export function useX402Fetch() {
  const { signTransaction, publicKey } = useWallet();
  
  return wrapFetchWithPayment(fetch, {
    wallet: {
      address: publicKey?.toBase58()!,
      sign: async (tx) => signTransaction(tx),
    },
  });
}

// Usage in any component:
// const x402Fetch = useX402Fetch();
// const data = await x402Fetch('https://api.deveplexity.com/v1/btc-price');
// → auto pays 402, retries, returns data. No manual tx handling.
```

---

## 9. Project Structure

```
deveplexity-api-hub/
├── apps/
│   ├── web/                          # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── (public)/
│   │   │   │   ├── page.tsx          # Marketplace / landing
│   │   │   │   └── docs/[slug]/      # Per-endpoint docs
│   │   │   ├── (authed)/
│   │   │   │   ├── dashboard/        # User: usage + credits
│   │   │   │   └── explorer/         # Live API explorer
│   │   │   └── (admin)/
│   │   │       └── admin/
│   │   │           ├── keys/         # Add/manage API products
│   │   │           ├── revenue/      # Earnings dashboard
│   │   │           └── users/        # All wallet users
│   │   ├── lib/
│   │   │   ├── x402Client.ts         # wrapFetchWithPayment hook
│   │   │   └── WalletProvider.tsx
│   │   └── components/
│   │       ├── ApiCard.tsx
│   │       └── CreditBalance.tsx
│   │
│   └── api-server/                   # Express — x402 gated API
│       ├── src/
│       │   ├── index.ts              # paymentMiddleware setup
│       │   ├── routes/
│       │   │   ├── btc-price.ts      # GET /v1/btc-price
│       │   │   ├── eth-price.ts      # GET /v1/eth-price
│       │   │   └── [dynamic].ts      # DB-driven routes
│       │   └── lib/
│       │       ├── secrets.ts        # Infisical secret fetcher
│       │       ├── proxy.ts          # Upstream API proxy
│       │       ├── routeConfig.ts    # DB → ROUTE_CONFIG builder
│       │       ├── ratelimit.ts      # Upstash Redis
│       │       └── analytics.ts     # Call logging to Prisma
│       └── package.json
│           # @x402/express
│           # @x402/svm
│           # @x402/core
│
├── packages/
│   ├── db/                           # Prisma schema + client (shared)
│   │   ├── schema.prisma
│   │   └── index.ts
│   └── config/                       # Shared env types
│
└── package.json                      # Turborepo / pnpm workspace
```

---

## 10. Build Phases

### Phase 1 — Foundation (Week 1)
- [ ] Next.js 14 project setup + Prisma + Neon/Supabase
- [ ] Wallet connect (Phantom) + signature auth → JWT
- [ ] Basic API product model + one hardcoded endpoint (BTC price)
- [ ] Infisical setup on Coolify, pull keys at runtime

### Phase 2 — x402 Core with AgentsTrail Facilitator (Week 2)
- [ ] Install `@x402/express`, `@x402/svm`, `@x402/core`, `@x402/client`
- [ ] Wire `HTTPFacilitatorClient` → `https://x402.agentstrail.ai`
- [ ] Mount `paymentMiddleware` on Express with `ExactSvmScheme` for Solana mainnet
- [ ] Register `DEVEPLEXITY_WALLET_ADDRESS` as `payTo` across all routes
- [ ] `wrapFetchWithPayment` on frontend — auto 402 → wallet sign → retry loop
- [ ] Per-call rate limiting (Upstash Redis) post-payment verification
- [ ] `buildRouteConfig()` — load active products from DB into middleware at startup

### Phase 3 — Admin Layer (Week 3)
- [ ] Admin dashboard: add new API products (name, upstream URL, key name, price)
- [ ] Revenue tracking: per product, per day, total
- [ ] User management: see all wallet users + balances
- [ ] Key rotation: update key reference in Infisical without code change

### Phase 4 — Polish + Public (Week 4)
- [ ] Public marketplace page (all endpoints, pricing, docs)
- [ ] Live API explorer (test endpoint in browser after wallet auth)
- [ ] User dashboard (call history, spending graph)
- [ ] Deveplexity branding, deploy to Vercel + custom domain

---

## 11. Key Decisions Summary

| Decision | Recommendation | Why |
|---|---|---|
| Facilitator | **x402.agentstrail.ai (yours)** | You control it, no third-party trust needed |
| x402 packages | **@x402/express + @x402/svm + @x402/core** | Official SDK, ExactSvmScheme for Solana |
| API server | **Express (separate from Next.js)** | `paymentMiddleware` is Express-native |
| Frontend client | **@x402/client `wrapFetchWithPayment`** | Auto 402 → sign → retry, no manual tx code |
| Payment scheme | **ExactSvmScheme** | Atomic exact-amount Solana payments |
| Network | **solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp** | Solana mainnet chain ID |
| Secret Management | **Infisical on Coolify** | Self-hosted, audit logs, fits your infra |
| Payment Token | **USDC (SPL)** | Stable value, no price volatility |
| Wallet Auth | **Signature-based JWT** | No passwords, trustless |
| Database | **Neon (Postgres) + Prisma** | Serverless-friendly, free tier |
| Rate Limiting | **Upstash Redis** | Edge-compatible, per-wallet |

---

## 12. Revenue Potential Model

```
Example: BTC Price endpoint
  CoinMarketCap Basic: $0/month → ~333 calls/day free
  You charge: 0.001 USDC/call
  
  If 50 users × 20 calls/day = 1,000 calls/day
  Revenue: 1,000 × $0.001 = $1/day = $30/month
  
  Add 5 more endpoints × same volume:
  = $150–200/month passive from API keys you already have
  
  At scale (500 users, 10 endpoints):
  = $1,500–3,000/month
```

---

*Built on Deveplexity infrastructure. Powered by x402 + AgentsTrail Facilitator + Solana mainnet.*
