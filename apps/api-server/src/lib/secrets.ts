import { prisma } from "@wrap/db";
import { decrypt } from "./encryption.js";

// In-memory cache for decrypted API keys
const secretsCache = new Map<string, { value: string; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get an API key for a specific product
 * Reads the encrypted key from database and decrypts it
 */
export async function getApiKeyForProduct(productId: string): Promise<string | null> {
  // Check cache first
  const cacheKey = `product:${productId}`;
  const cached = secretsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const product = await prisma.apiProduct.findUnique({
      where: { id: productId },
      include: {
        apiKey: true,
      },
    });

    if (!product?.apiKey) {
      return null;
    }

    // Decrypt the API key
    const decryptedKey = decrypt(product.apiKey.encryptedValue);

    // Cache the decrypted key
    secretsCache.set(cacheKey, {
      value: decryptedKey,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return decryptedKey;
  } catch (error) {
    console.error(`Failed to get API key for product ${productId}:`, error);
    return null;
  }
}

/**
 * Get an API key by user and key name
 */
export async function getApiKeyByName(
  userId: string,
  keyName: string
): Promise<string | null> {
  const cacheKey = `user:${userId}:${keyName}`;
  const cached = secretsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: {
        userId_keyName: {
          userId,
          keyName,
        },
      },
    });

    if (!apiKey) {
      return null;
    }

    const decryptedKey = decrypt(apiKey.encryptedValue);

    secretsCache.set(cacheKey, {
      value: decryptedKey,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return decryptedKey;
  } catch (error) {
    console.error(`Failed to get API key ${keyName} for user ${userId}:`, error);
    return null;
  }
}

/**
 * Check if a product has an API key configured
 */
export async function hasApiKey(productId: string): Promise<boolean> {
  const key = await getApiKeyForProduct(productId);
  return key !== null;
}

/**
 * Clear cached secrets
 */
export function clearSecretCache(key?: string): void {
  if (key) {
    secretsCache.delete(key);
  } else {
    secretsCache.clear();
  }
}

/**
 * Invalidate cache for a specific product
 */
export function invalidateProductCache(productId: string): void {
  secretsCache.delete(`product:${productId}`);
}

/**
 * Invalidate cache for a user's API key
 */
export function invalidateUserKeyCache(userId: string, keyName: string): void {
  secretsCache.delete(`user:${userId}:${keyName}`);
}
