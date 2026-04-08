/**
 * Update all CoinMarketCap products to use the working API key
 * Run: DATABASE_URL="..." npx tsx scripts/update-api-keys.ts
 */

import { prisma } from "@wrap/db";

async function main() {
  // The working API key (used by crypto-listings which returns real data)
  const workingKeyId = "cmnotwha60002rdrnzr3zz642";

  // Get all products that have a different or no API key and use CoinMarketCap
  const products = await prisma.apiProduct.findMany({
    where: {
      OR: [{ apiKeyId: null }, { apiKeyId: { not: workingKeyId } }],
      upstreamUrl: { contains: "coinmarketcap" },
    },
    select: { id: true, slug: true, name: true, apiKeyId: true },
  });

  console.log("Products to update:", products.length);
  console.log(products.map((p) => `  - ${p.slug} (current key: ${p.apiKeyId})`).join("\n"));
  console.log("");

  for (const product of products) {
    console.log(`Updating: ${product.slug}...`);
    await prisma.apiProduct.update({
      where: { id: product.id },
      data: {
        apiKeyId: workingKeyId,
        authType: "header",
        authHeader: "X-CMC_PRO_API_KEY",
      },
    });
    console.log(`  ✓ Updated ${product.slug}`);
  }

  console.log("\nDone! Updated", products.length, "products to use working API key.");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
