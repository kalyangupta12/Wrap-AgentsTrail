import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wrap/db";
import { encrypt } from "@/lib/encryption";

export async function GET(request: NextRequest) {
  const walletAddress = request.nextUrl.searchParams.get("wallet");

  if (!walletAddress) {
    return NextResponse.json(
      { error: "Wallet address required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ products: [] });
    }

    const products = await prisma.apiProduct.findMany({
      where: { providerId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        apiKey: {
          select: {
            id: true,
            name: true,
            keyName: true,
            provider: true,
          },
        },
        _count: {
          select: { calls: true },
        },
      },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Provider products error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      name,
      slug,
      description,
      category,
      upstreamUrl,
      httpMethod,
      pricePerCall,
      rateLimit,
      isPublic,
      // API Key - can be existing key ID or new key value
      apiKeyId,
      apiKeyValue,
      apiKeyName,
      apiKeyProvider,
      // Auth config
      authType,
      authHeader,
      authQueryParam,
    } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    // Find or create user as provider
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          role: "PROVIDER",
          payoutWallet: walletAddress,
        },
      });
    } else if (user.role === "USER") {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: "PROVIDER",
          payoutWallet: user.payoutWallet || walletAddress,
        },
      });
    }

    // Check if slug is unique
    const existingProduct = await prisma.apiProduct.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { error: "Slug already exists. Choose a different slug." },
        { status: 400 }
      );
    }

    // Handle API key - either use existing or create new
    let keyId = apiKeyId;

    if (!keyId && apiKeyValue && apiKeyName) {
      // Create new API key
      const encryptedValue = encrypt(apiKeyValue);
      const keyNameNormalized = apiKeyName.toUpperCase().replace(/\s+/g, "_");

      // Check if key name already exists
      const existingKey = await prisma.apiKey.findUnique({
        where: {
          userId_keyName: {
            userId: user.id,
            keyName: keyNameNormalized,
          },
        },
      });

      if (existingKey) {
        keyId = existingKey.id;
      } else {
        const newKey = await prisma.apiKey.create({
          data: {
            userId: user.id,
            name: apiKeyName,
            keyName: keyNameNormalized,
            encryptedValue,
            provider: apiKeyProvider || "custom",
          },
        });
        keyId = newKey.id;
      }
    }

    // Create product
    const product = await prisma.apiProduct.create({
      data: {
        providerId: user.id,
        name,
        slug,
        description,
        category: category || "general",
        upstreamUrl,
        apiKeyId: keyId || null,
        httpMethod: httpMethod || "GET",
        authType: authType || "header",
        authHeader: authHeader || null,
        authQueryParam: authQueryParam || null,
        pricePerCall,
        rateLimit,
        isPublic: isPublic ?? true,
      },
      include: {
        apiKey: {
          select: {
            id: true,
            name: true,
            keyName: true,
          },
        },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
