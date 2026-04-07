import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wrap/db";
import { encrypt } from "@/lib/encryption";

// GET - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const product = await prisma.apiProduct.findFirst({
      where: {
        id: params.id,
        providerId: user.id,
      },
      include: {
        apiKey: {
          select: {
            id: true,
            name: true,
            keyName: true,
            provider: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      walletAddress,
      name,
      description,
      category,
      upstreamUrl,
      httpMethod,
      pricePerCall,
      rateLimit,
      isPublic,
      isActive,
      authType,
      authHeader,
      authQueryParam,
      apiKeyId,
      apiKeyValue,
      apiKeyName,
      apiKeyProvider,
    } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership
    const existingProduct = await prisma.apiProduct.findFirst({
      where: {
        id: params.id,
        providerId: user.id,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 404 }
      );
    }

    // Handle API key changes
    let newKeyId = existingProduct.apiKeyId;

    if (apiKeyId !== undefined) {
      // Using existing key or removing key
      newKeyId = apiKeyId || null;
    } else if (apiKeyValue && apiKeyName) {
      // Creating new key
      const encryptedValue = encrypt(apiKeyValue);
      const keyNameNormalized = apiKeyName.toUpperCase().replace(/\s+/g, "_");

      // Check if key already exists
      const existingKey = await prisma.apiKey.findUnique({
        where: {
          userId_keyName: {
            userId: user.id,
            keyName: keyNameNormalized,
          },
        },
      });

      if (existingKey) {
        newKeyId = existingKey.id;
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
        newKeyId = newKey.id;
      }
    }

    // Update product
    const product = await prisma.apiProduct.update({
      where: { id: params.id },
      data: {
        name,
        description,
        category,
        upstreamUrl,
        httpMethod,
        pricePerCall,
        rateLimit,
        isPublic: isPublic ?? true,
        isActive: isActive ?? true,
        authType: authType || "header",
        authHeader: authHeader || null,
        authQueryParam: authQueryParam || null,
        apiKeyId: newKeyId,
      },
      include: {
        apiKey: {
          select: {
            id: true,
            name: true,
            keyName: true,
            provider: true,
          },
        },
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle product status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { isActive } = body;

    const product = await prisma.apiProduct.update({
      where: { id: params.id },
      data: { isActive },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Patch product error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Verify ownership
    const product = await prisma.apiProduct.findFirst({
      where: {
        id: params.id,
        providerId: user.id,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found or access denied" },
        { status: 404 }
      );
    }

    // Delete associated API calls first
    await prisma.apiCall.deleteMany({
      where: { productId: params.id },
    });

    // Delete the product
    await prisma.apiProduct.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
