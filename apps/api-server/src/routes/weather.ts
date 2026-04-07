import type { Request, Response } from "express";
import { getSecret, hasSecret } from "../lib/secrets.js";
import { proxyUpstream } from "../lib/proxy.js";
import { logCall } from "../lib/analytics.js";

const OPENWEATHER_API_URL = "https://api.openweathermap.org/data/2.5/weather";

export async function weatherHandler(req: Request, res: Response) {
  const startTime = Date.now();
  const walletAddress = req.headers["x-wallet-address"] as string | undefined;
  const city = req.query.city as string || "London";

  try {
    // Check if we have the API key
    if (!hasSecret("OPENWEATHER_API_KEY")) {
      // Return mock data for development
      const mockData = {
        city,
        country: "GB",
        temperature: 18.5,
        feels_like: 17.2,
        humidity: 65,
        pressure: 1013,
        wind_speed: 5.2,
        description: "partly cloudy",
        icon: "03d",
        timestamp: new Date().toISOString(),
        source: "mock",
      };

      await logCall({
        route: "/v1/weather",
        walletAddress,
        productSlug: "weather",
        cost: 0.002,
        responseCode: 200,
        latencyMs: Date.now() - startTime,
      });

      return res.json({ success: true, data: mockData });
    }

    // Fetch real data from OpenWeatherMap
    const apiKey = await getSecret("OPENWEATHER_API_KEY");
    const data = await proxyUpstream(OPENWEATHER_API_URL, {
      params: {
        q: city,
        appid: apiKey,
        units: "metric",
      },
    });

    const weatherData = data as {
      name: string;
      sys: { country: string };
      main: {
        temp: number;
        feels_like: number;
        humidity: number;
        pressure: number;
      };
      wind: { speed: number };
      weather: [{ description: string; icon: string }];
    };

    const responseData = {
      city: weatherData.name,
      country: weatherData.sys.country,
      temperature: weatherData.main.temp,
      feels_like: weatherData.main.feels_like,
      humidity: weatherData.main.humidity,
      pressure: weatherData.main.pressure,
      wind_speed: weatherData.wind.speed,
      description: weatherData.weather[0].description,
      icon: weatherData.weather[0].icon,
      timestamp: new Date().toISOString(),
      source: "openweathermap",
    };

    await logCall({
      route: "/v1/weather",
      walletAddress,
      productSlug: "weather",
      cost: 0.002,
      responseCode: 200,
      latencyMs: Date.now() - startTime,
    });

    res.json({ success: true, data: responseData });
  } catch (error) {
    console.error("Weather error:", error);

    await logCall({
      route: "/v1/weather",
      walletAddress,
      productSlug: "weather",
      cost: 0,
      responseCode: 500,
      latencyMs: Date.now() - startTime,
    });

    res.status(500).json({
      success: false,
      error: "Failed to fetch weather data",
    });
  }
}
