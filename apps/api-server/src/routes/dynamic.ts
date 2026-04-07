import type { Request, Response } from "express";
import { getApiKeyForProduct, hasApiKey } from "../lib/secrets.js";
import { logApiCall } from "../lib/analytics.js";

const PLATFORM_FEE_RATE = parseFloat(process.env.PLATFORM_FEE_RATE || "0.1");

export async function dynamicRouteHandler(req: Request, res: Response) {
  const startTime = Date.now();
  const product = (req as any).product;
  const network = (req as any).network;
  const walletAddress = req.headers["x-wallet-address"] as string;

  if (!product) {
    return res.status(500).json({ error: "Product not found in request" });
  }

  try {
    // Check if we have an API key configured for this product
    const hasKey = await hasApiKey(product.id);

    if (!hasKey) {
      // Return mock data for development/testing
      const mockResponse = {
        success: true,
        data: {
          message: `Mock response for ${product.name}`,
          endpoint: product.slug,
          timestamp: new Date().toISOString(),
          note: "This is mock data. Configure an API key in your provider dashboard.",
        },
        meta: {
          source: "mock",
          product: product.name,
          provider: product.provider?.providerName || "Unknown",
        },
      };

      await logApiCall({
        product,
        walletAddress,
        network,
        responseCode: 200,
        latencyMs: Date.now() - startTime,
        platformFeeRate: PLATFORM_FEE_RATE,
      });

      return res.json(mockResponse);
    }

    // Get the decrypted API key from database
    const apiKey = await getApiKeyForProduct(product.id);

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve API key",
      });
    }

    // Build upstream request URL
    const upstreamUrl = new URL(product.upstreamUrl);

    // Pass through query parameters
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        upstreamUrl.searchParams.set(key, value);
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    // Add API key based on auth type configured in product
    const authType = product.authType || "header";

    if (authType === "bearer") {
      headers["Authorization"] = `Bearer ${apiKey}`;
    } else if (authType === "query") {
      const queryParam = product.authQueryParam || "api_key";
      upstreamUrl.searchParams.set(queryParam, apiKey);
    } else {
      // Default: header auth
      const headerName = product.authHeader || "Authorization";
      if (headerName.toLowerCase() === "authorization") {
        headers["Authorization"] = `Bearer ${apiKey}`;
      } else {
        headers[headerName] = apiKey;
      }
    }

    // Add any custom headers from product config
    if (product.headers) {
      const customHeaders =
        typeof product.headers === "string"
          ? JSON.parse(product.headers)
          : product.headers;
      Object.assign(headers, customHeaders);
    }

    // Make upstream request
    const upstreamResponse = await fetch(upstreamUrl.toString(), {
      method: product.httpMethod || "GET",
      headers,
      body:
        product.httpMethod === "POST" ? JSON.stringify(req.body) : undefined,
    });

    const latencyMs = Date.now() - startTime;

    if (!upstreamResponse.ok) {
      await logApiCall({
        product,
        walletAddress,
        network,
        responseCode: upstreamResponse.status,
        latencyMs,
        platformFeeRate: PLATFORM_FEE_RATE,
      });

      return res.status(upstreamResponse.status).json({
        success: false,
        error: "Upstream API error",
        status: upstreamResponse.status,
      });
    }

    const data = await upstreamResponse.json();

    await logApiCall({
      product,
      walletAddress,
      network,
      responseCode: 200,
      latencyMs,
      platformFeeRate: PLATFORM_FEE_RATE,
    });

    res.json({
      success: true,
      data,
      meta: {
        source: "live",
        product: product.name,
        provider: product.provider?.providerName || "Unknown",
        latencyMs,
      },
    });
  } catch (error) {
    console.error(`Error handling ${product.slug}:`, error);

    await logApiCall({
      product,
      walletAddress,
      network,
      responseCode: 500,
      latencyMs: Date.now() - startTime,
      platformFeeRate: PLATFORM_FEE_RATE,
    });

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
}
