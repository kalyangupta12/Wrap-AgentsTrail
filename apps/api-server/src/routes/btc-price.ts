import type { Request, Response } from "express";
import { getSecret, hasSecret } from "../lib/secrets.js";
import { proxyUpstream } from "../lib/proxy.js";
import { logCall } from "../lib/analytics.js";

const CMC_API_URL =
  "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";

export async function btcPriceHandler(req: Request, res: Response) {
  const startTime = Date.now();
  const walletAddress = req.headers["x-wallet-address"] as string | undefined;

  try {
    // Check if we have the API key
    if (!hasSecret("CMC_PRO_API_KEY")) {
      // Return mock data for development
      const mockData = {
        symbol: "BTC",
        name: "Bitcoin",
        price: 67234.56,
        percent_change_24h: 2.34,
        percent_change_7d: 5.67,
        market_cap: 1324567890123,
        volume_24h: 45678901234,
        currency: "USD",
        timestamp: new Date().toISOString(),
        source: "mock",
      };

      await logCall({
        route: "/v1/btc-price",
        walletAddress,
        productSlug: "btc-price",
        cost: 0.001,
        responseCode: 200,
        latencyMs: Date.now() - startTime,
      });

      return res.json({ success: true, data: mockData });
    }

    // Fetch real data from CoinMarketCap
    const apiKey = await getSecret("CMC_PRO_API_KEY");
    const data = await proxyUpstream(CMC_API_URL, {
      headers: { "X-CMC_PRO_API_KEY": apiKey },
      params: { symbol: "BTC" },
    });

    const cmcData = data as {
      data: {
        BTC: {
          name: string;
          quote: {
            USD: {
              price: number;
              percent_change_24h: number;
              percent_change_7d: number;
              market_cap: number;
              volume_24h: number;
            };
          };
        };
      };
    };

    const btc = cmcData.data.BTC;
    const responseData = {
      symbol: "BTC",
      name: btc.name,
      price: btc.quote.USD.price,
      percent_change_24h: btc.quote.USD.percent_change_24h,
      percent_change_7d: btc.quote.USD.percent_change_7d,
      market_cap: btc.quote.USD.market_cap,
      volume_24h: btc.quote.USD.volume_24h,
      currency: "USD",
      timestamp: new Date().toISOString(),
      source: "coinmarketcap",
    };

    await logCall({
      route: "/v1/btc-price",
      walletAddress,
      productSlug: "btc-price",
      cost: 0.001,
      responseCode: 200,
      latencyMs: Date.now() - startTime,
    });

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("BTC price error:", error);

    await logCall({
      route: "/v1/btc-price",
      walletAddress,
      productSlug: "btc-price",
      cost: 0,
      responseCode: 500,
      latencyMs: Date.now() - startTime,
    });

    res.status(500).json({
      success: false,
      error: "Failed to fetch BTC price",
    });
  }
}
