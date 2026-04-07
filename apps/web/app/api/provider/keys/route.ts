import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wrap/db";
import { encrypt, maskApiKey } from "@/lib/encryption";

// GET - List user's API keys
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
      include: {
        apiKeys: {
          select: {
            id: true,
            name: true,
            keyName: true,
            provider: true,
            createdAt: true,
            updatedAt: true,
            // Don't include encryptedValue for security
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ keys: [] });
    }

    return NextResponse.json({ keys: user.apiKeys });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json(
      { error: "Failed to fetch API keys" },
      { status: 500 }
    );
  }
}

// POST - Create new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, name, keyName, apiKeyValue, provider } = body;

    if (!walletAddress || !name || !keyName || !apiKeyValue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          role: "PROVIDER",
        },
      });
    } else if (user.role === "USER") {
      // Upgrade to provider
      user = await prisma.user.update({
        where: { id: user.id },
        data: { role: "PROVIDER" },
      });
    }

    // Check if key name already exists for this user
    const existingKey = await prisma.apiKey.findUnique({
      where: {
        userId_keyName: {
          userId: user.id,
          keyName,
        },
      },
    });

    if (existingKey) {
      return NextResponse.json(
        { error: "An API key with this name already exists" },
        { status: 400 }
      );
    }

    // Encrypt the API key
    const encryptedValue = encrypt(apiKeyValue);

    // Create the API key
    const apiKey = await prisma.apiKey.create({
      data: {
        userId: user.id,
        name,
        keyName,
        encryptedValue,
        provider: provider || "custom",
      },
    });

    return NextResponse.json({
      success: true,
      key: {
        id: apiKey.id,
        name: apiKey.name,
        keyName: apiKey.keyName,
        provider: apiKey.provider,
        maskedValue: maskApiKey(apiKeyValue),
      },
    });
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}

// DELETE - Delete API key
export async function DELETE(request: NextRequest) {
  const keyId = request.nextUrl.searchParams.get("id");
  const walletAddress = request.nextUrl.searchParams.get("wallet");

  if (!keyId || !walletAddress) {
    return NextResponse.json(
      { error: "Key ID and wallet address required" },
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

    // Verify the key belongs to the user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: keyId,
        userId: user.id,
      },
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Check if any products are using this key
    const productsUsingKey = await prisma.apiProduct.count({
      where: { apiKeyId: keyId },
    });

    if (productsUsingKey > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: ${productsUsingKey} API(s) are using this key`,
        },
        { status: 400 }
      );
    }

    // Delete the key
    await prisma.apiKey.delete({
      where: { id: keyId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Failed to delete API key" },
      { status: 500 }
    );
  }
}
