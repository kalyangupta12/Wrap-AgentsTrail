/**
 * Setup CoinMarketCap API key and update products
 * Run: pnpm dlx tsx scripts/setup-cmc-api.ts
 */

import { prisma } from "@wrap/db";
import crypto from "crypto";

// Encryption key from environment (must match the one used in the app)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default-dev-key-change-in-production!";

function encrypt(text: string): string {
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(ENCRYPTION_KEY, "salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

// CoinMarketCap API key
const CMC_API_KEY = "6565281283224d299ce6c810c4488ff7";

// Product configurations
const PRODUCTS_CONFIG: Record<string, { upstreamUrl: string; description: string }> = {
  "bitcoin-price": {
    upstreamUrl: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=BTC",
    description: "Get real-time Bitcoin price from CoinMarketCap",
  },
  "crypto-listings": {
    upstreamUrl: "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=100",
    description: "Get top 100 cryptocurrencies by market cap from CoinMarketCap",
  },
};

async function main() {
  console.log("Setting up CoinMarketCap API configuration...\n");

  // Find all products that need updating
  const products = await prisma.apiProduct.findMany({
    where: {
      slug: { in: Object.keys(PRODUCTS_CONFIG) },
    },
    include: {
      provider: true,
      apiKey: true,
    },
  });

  if (products.length === 0) {
    console.log("No products found to update. Make sure the products exist first.");
    return;
  }

  console.log(`Found ${products.length} products to update:\n`);

  for (const product of products) {
    console.log(`Processing: ${product.name} (${product.slug})`);

    const config = PRODUCTS_CONFIG[product.slug];
    if (!config) {
      console.log(`  - Skipping, no config for slug: ${product.slug}`);
      continue;
    }

    // Check if user already has a CMC API key
    let apiKey = await prisma.apiKey.findFirst({
      where: {
        userId: product.providerId,
        keyName: "CMC_API_KEY",
      },
    });

    if (!apiKey) {
      // Create new API key
      console.log(`  - Creating new CoinMarketCap API key...`);
      const encryptedValue = encrypt(CMC_API_KEY);

      apiKey = await prisma.apiKey.create({
        data: {
          userId: product.providerId,
          name: "CoinMarketCap API Key",
          keyName: "CMC_API_KEY",
          encryptedValue,
          provider: "coinmarketcap",
        },
      });
      console.log(`  - Created API key: ${apiKey.id}`);
    } else {
      console.log(`  - Using existing API key: ${apiKey.id}`);
    }

    // Update the product
    await prisma.apiProduct.update({
      where: { id: product.id },
      data: {
        apiKeyId: apiKey.id,
        upstreamUrl: config.upstreamUrl,
        description: config.description,
        authType: "header",
        authHeader: "X-CMC_PRO_API_KEY",
        httpMethod: "GET",
      },
    });

    console.log(`  - Updated product with:`);
    console.log(`    upstreamUrl: ${config.upstreamUrl}`);
    console.log(`    authHeader: X-CMC_PRO_API_KEY`);
    console.log(`    apiKeyId: ${apiKey.id}`);
    console.log("");
  }

  console.log("Done! Your products are now configured to use the real CoinMarketCap API.");
  console.log("\nTest with:");
  console.log("  curl https://api-wrap.agentstrail.ai/v1/bitcoin-price-d");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
