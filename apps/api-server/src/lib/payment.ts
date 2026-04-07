import type { Request, Response, NextFunction } from "express";
import {
  CONFIG,
  NETWORK_CONFIG,
  type SolanaNetwork,
} from "@wrap/config";
import { prisma } from "@wrap/db";
import { checkRateLimit } from "./redis.js";

// Cache for product data
const productCache = new Map<
  string,
  { product: any; expiresAt: number }
>();
const CACHE_TTL = 30 * 1000; // 30 seconds

async function getProductBySlug(slug: string) {
  const cached = productCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.product;
  }

  const product = await prisma.apiProduct.findUnique({
    where: { slug },
    include: {
      provider: {
        select: {
          id: true,
          payoutWallet: true,
          walletAddress: true,
          providerName: true,
        },
      },
    },
  });

  if (product) {
    productCache.set(slug, {
      product,
      expiresAt: Date.now() + CACHE_TTL,
    });
  }

  return product;
}

function getNetworkFromRequest(req: Request): SolanaNetwork {
  const networkHeader = req.headers["x-solana-network"] as string;
  if (networkHeader === "mainnet-beta" || networkHeader === "devnet") {
    return networkHeader;
  }
  return CONFIG.solana.defaultNetwork;
}

// Parse slug to extract base slug and network override
// Supports: slug-m (mainnet), slug-d (devnet), or just slug (uses header/default)
function parseSlugWithNetwork(slug: string): {
  baseSlug: string;
  networkOverride: SolanaNetwork | null;
} {
  if (slug.endsWith("-m")) {
    return { baseSlug: slug.slice(0, -2), networkOverride: "mainnet-beta" };
  }
  if (slug.endsWith("-d")) {
    return { baseSlug: slug.slice(0, -2), networkOverride: "devnet" };
  }
  return { baseSlug: slug, networkOverride: null };
}

export async function multiTenantPaymentMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const rawSlug = req.params.slug;

  // Parse slug for network suffix (-m for mainnet, -d for devnet)
  const { baseSlug, networkOverride } = parseSlugWithNetwork(rawSlug);

  // Get product from database using base slug (without network suffix)
  const product = await getProductBySlug(baseSlug);

  if (!product) {
    return res.status(404).json({
      error: "API not found",
      message: `No API found at /v1/${baseSlug}`,
    });
  }

  if (!product.isActive) {
    return res.status(503).json({
      error: "API unavailable",
      message: "This API is currently disabled",
    });
  }

  // Get provider's payout wallet
  const payoutWallet =
    product.provider.payoutWallet || product.provider.walletAddress;

  if (!payoutWallet) {
    return res.status(500).json({
      error: "Configuration error",
      message: "Provider has not configured a payout wallet",
    });
  }

  // Get network - use override from slug suffix (-m/-d), or header, or default
  const network = networkOverride || getNetworkFromRequest(req);
  const networkConfig = NETWORK_CONFIG[network];

  // Attach product to request for later use
  (req as any).product = product;
  (req as any).network = network;
  (req as any).payoutWallet = payoutWallet;

  // Check rate limit
  const walletAddress = req.headers["x-wallet-address"] as string;
  if (walletAddress) {
    const rateLimitKey = `${baseSlug}:${walletAddress}`;
    const rateLimit = await checkRateLimit(rateLimitKey, product.rateLimit, 60);

    if (!rateLimit.allowed) {
      return res.status(429).json({
        error: "Rate limit exceeded",
        message: `You've exceeded ${product.rateLimit} requests per minute for this API`,
        retryAfter: Math.ceil((rateLimit.resetAt - Date.now()) / 1000),
      });
    }
  }

  // Check for X-PAYMENT header (x402 uses X-PAYMENT for the payment payload)
  const paymentHeader = req.headers["x-payment"];

  if (!paymentHeader) {
    // Build x402 V1-compliant payment requirements (the format that actually works)
    // Price is in dollars (e.g., "0.001"), convert to USDC smallest unit (6 decimals)
    const priceInDollars = parseFloat(product.pricePerCall);
    const priceInMicroUnits = Math.round(priceInDollars * 1_000_000).toString();

    // Build the resource URL
    const resourceUrl = `https://${req.get("host")}${req.originalUrl}`;

    // Determine if this is mainnet or devnet based on the network config
    const isMainnet = network === "mainnet-beta";

    // Build endpoint variants for easy discovery
    const baseUrl = `https://${req.get("host")}/v1`;

    // x402 V1 format - this is what actually works with x402 clients
    const x402Response = {
      x402Version: 1,
      accepts: [
        {
          scheme: CONFIG.x402.paymentScheme,
          network: "solana", // V1 uses simple network name
          maxAmountRequired: priceInMicroUnits,
          resource: resourceUrl,
          description: product.description || product.name,
          mimeType: "application/json",
          payTo: payoutWallet,
          maxTimeoutSeconds: 60,
          asset: networkConfig.usdcAddress,
          extra: {
            name: product.name,
            slug: baseSlug,
            rateLimit: product.rateLimit,
            // Network info for clients
            solanaNetwork: network, // "mainnet-beta" or "devnet"
            chainId: networkConfig.chainId,
            isMainnet,
            // Endpoint variants for different networks
            endpoints: {
              mainnet: `${baseUrl}/${baseSlug}-m`,
              devnet: `${baseUrl}/${baseSlug}-d`,
              default: `${baseUrl}/${baseSlug}`,
            },
            // Supported networks info
            supportedNetworks: ["mainnet-beta", "devnet"],
            networkHeader: "X-Solana-Network",
          },
        },
      ],
    };

    // Return 402 with x402 V1 JSON body
    return res.status(402).json(x402Response);
  }

  // Verify payment with facilitator
  try {
    const verified = await verifyPayment(
      paymentHeader as string,
      `$${product.pricePerCall}`,
      networkConfig.chainId,
      payoutWallet
    );

    if (!verified) {
      return res.status(402).json({
        error: "Payment verification failed",
        message: "The payment could not be verified. Please try again.",
      });
    }

    // Payment verified, continue to route handler
    next();
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({
      error: "Payment verification error",
      message: "An error occurred while verifying the payment.",
    });
  }
}

async function verifyPayment(
  paymentHeader: string,
  expectedPrice: string,
  networkChainId: string,
  payTo: string
): Promise<boolean> {
  try {
    // Parse the payment header
    const paymentData = JSON.parse(
      Buffer.from(paymentHeader, "base64").toString("utf-8")
    );

    // Call the facilitator to verify the payment
    const response = await fetch(`${CONFIG.x402.facilitatorUrl}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        payment: paymentData,
        expectedPrice,
        network: networkChainId,
        payTo,
      }),
    });

    if (!response.ok) {
      console.error("Facilitator verification failed:", await response.text());
      return false;
    }

    const result = (await response.json()) as { verified?: boolean };
    return result.verified === true;
  } catch (error) {
    console.error("Payment parsing/verification error:", error);
    return false;
  }
}

export function clearProductCache(slug?: string) {
  if (slug) {
    productCache.delete(slug);
  } else {
    productCache.clear();
  }
}
