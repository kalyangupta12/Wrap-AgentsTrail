import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from monorepo root (src -> api-server -> apps -> root)
config({ path: resolve(__dirname, "../../../.env") });

import express from "express";
import cors from "cors";
import { CONFIG } from "@wrap/config";
import { dynamicRouteHandler } from "./routes/dynamic.js";
import { multiTenantPaymentMiddleware } from "./lib/payment.js";
import { errorHandler } from "./lib/errorHandler.js";
import { redis } from "./lib/redis.js";

const app = express();
const PORT = process.env.PORT || 3001;
const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE || "0.1"); // 10%

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Facilitator connectivity test
app.get("/debug/facilitator", async (req, res) => {
  try {
    const facilitatorUrl = CONFIG.x402.facilitatorUrl;
    console.log("🔍 Testing facilitator connectivity:", facilitatorUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const start = Date.now();
    const response = await fetch(facilitatorUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const duration = Date.now() - start;

    const ok = response.ok;
    const status = response.status;

    console.log("✅ Facilitator responded:", { status, duration: `${duration}ms` });

    res.json({
      facilitatorUrl,
      reachable: true,
      status,
      ok,
      duration: `${duration}ms`,
      message: ok
        ? "Facilitator is reachable and responding"
        : "Facilitator is reachable but returned non-OK status",
    });
  } catch (error: any) {
    console.error("❌ Facilitator test failed:", error.message);
    res.json({
      facilitatorUrl: CONFIG.x402.facilitatorUrl,
      reachable: false,
      error: error.message,
      message:
        error.name === "AbortError"
          ? "Facilitator request timed out (>5s) - possible network issue"
          : `Facilitator is not reachable: ${error.message}`,
    });
  }
});

// List all available endpoints
app.get("/v1", async (req, res) => {
  const { prisma } = await import("@wrap/db");

  const products = await prisma.apiProduct.findMany({
    where: { isActive: true, isPublic: true },
    select: {
      slug: true,
      name: true,
      description: true,
      pricePerCall: true,
      rateLimit: true,
      category: true,
      httpMethod: true,
      provider: {
        select: { providerName: true },
      },
    },
    orderBy: { name: "asc" },
  });

  res.json({
    endpoints: products.map((p) => ({
      path: `/v1/${p.slug}`,
      method: p.httpMethod,
      name: p.name,
      description: p.description,
      price: `$${p.pricePerCall} USDC`,
      rateLimit: `${p.rateLimit} req/min`,
      category: p.category,
      provider: p.provider.providerName || "Anonymous",
    })),
  });
});

// Multi-tenant payment middleware + dynamic route handler
// Each provider's product has its own payout wallet
app.use("/v1/:slug", multiTenantPaymentMiddleware, dynamicRouteHandler);

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Wrap API Server running on port ${PORT}`);
  console.log(`Facilitator: ${CONFIG.x402.facilitatorUrl}`);
  console.log(`Platform fee: ${PLATFORM_FEE_RATE * 100}%`);
});
