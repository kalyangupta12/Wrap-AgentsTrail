import { prisma } from "./index.js";

async function seed() {
  console.log("Seeding database...");

  // Create or get platform admin user (acts as default provider for demo APIs)
  const adminWallet = process.env.ADMIN_WALLET_ADDRESS || "DemoAdminWallet123";

  let admin = await prisma.user.findUnique({
    where: { walletAddress: adminWallet },
  });

  if (!admin) {
    admin = await prisma.user.create({
      data: {
        walletAddress: adminWallet,
        role: "ADMIN",
        payoutWallet: adminWallet,
        providerName: "Wrap Platform",
        providerBio: "Official Wrap platform APIs",
      },
    });
    console.log("  Created admin user");
  }

  // Create platform config
  await prisma.platformConfig.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      platformFeeRate: 0.1,
      minPayout: 1.0,
    },
  });
  console.log("  Created platform config");

  // Demo API products (without API keys - they need to be added via provider dashboard)
  const apiProducts = [
    {
      slug: "btc-price",
      name: "BTC Price",
      description: "Live Bitcoin price - Add your CoinMarketCap API key to enable",
      category: "crypto",
      upstreamUrl: "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
      httpMethod: "GET",
      authType: "header",
      authHeader: "X-CMC_PRO_API_KEY",
      pricePerCall: 0.001,
      rateLimit: 60,
      providerId: admin.id,
    },
    {
      slug: "eth-price",
      name: "ETH Price",
      description: "Live Ethereum price - Add your CoinMarketCap API key to enable",
      category: "crypto",
      upstreamUrl: "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest",
      httpMethod: "GET",
      authType: "header",
      authHeader: "X-CMC_PRO_API_KEY",
      pricePerCall: 0.001,
      rateLimit: 60,
      providerId: admin.id,
    },
    {
      slug: "weather",
      name: "Weather",
      description: "Current weather data - Add your OpenWeatherMap API key to enable",
      category: "weather",
      upstreamUrl: "https://api.openweathermap.org/data/2.5/weather",
      httpMethod: "GET",
      authType: "query",
      authQueryParam: "appid",
      pricePerCall: 0.002,
      rateLimit: 30,
      providerId: admin.id,
    },
  ];

  for (const product of apiProducts) {
    await prisma.apiProduct.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        category: product.category,
        upstreamUrl: product.upstreamUrl,
        httpMethod: product.httpMethod,
        authType: product.authType,
        authHeader: product.authHeader || null,
        authQueryParam: product.authQueryParam || null,
        pricePerCall: product.pricePerCall,
        rateLimit: product.rateLimit,
      },
      create: product,
    });
    console.log(`  Created/updated: ${product.name}`);
  }

  console.log("\nSeeding complete!");
  console.log("\nNote: Demo APIs are created without API keys.");
  console.log("Add your API keys via the Provider Dashboard to enable them.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
