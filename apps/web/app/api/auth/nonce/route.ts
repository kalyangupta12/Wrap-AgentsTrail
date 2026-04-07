import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wrap/db";
import { generateNonce, createSignInMessage } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json();

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 }
      );
    }

    const nonce = generateNonce();
    const message = createSignInMessage(nonce);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store session with nonce
    await prisma.session.create({
      data: {
        walletAddress,
        nonce,
        expiresAt,
      },
    });

    return NextResponse.json({
      message,
      nonce,
    });
  } catch (error) {
    console.error("Auth nonce error:", error);
    return NextResponse.json(
      { error: "Failed to generate nonce" },
      { status: 500 }
    );
  }
}
