import type { Express } from "express";
import { btcPriceHandler } from "./btc-price.js";
import { ethPriceHandler } from "./eth-price.js";
import { weatherHandler } from "./weather.js";

export function createRoutes(app: Express): void {
  // Crypto prices
  app.get("/v1/btc-price", btcPriceHandler);
  app.get("/v1/eth-price", ethPriceHandler);

  // Weather
  app.get("/v1/weather", weatherHandler);

  // List all available endpoints
  app.get("/v1", (req, res) => {
    res.json({
      endpoints: [
        {
          path: "/v1/btc-price",
          method: "GET",
          description: "Get current Bitcoin price in USD",
          price: "$0.001 USDC",
        },
        {
          path: "/v1/eth-price",
          method: "GET",
          description: "Get current Ethereum price in USD",
          price: "$0.001 USDC",
        },
        {
          path: "/v1/weather",
          method: "GET",
          description: "Get weather for a location",
          price: "$0.002 USDC",
          params: {
            city: "City name (e.g., London)",
          },
        },
      ],
    });
  });
}
