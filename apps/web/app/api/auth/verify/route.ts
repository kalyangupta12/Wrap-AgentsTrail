import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wrap/db";
import { verifyWalletSignature, createSignInMessage } from "@/lib/auth";
import { createJWT } from "@/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    const { walletAddress, signature, nonce } = await request.json();

    if (!walletAddress || !signature || !nonce) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Find session with nonce
    const session = await prisma.session.findFirst({
      where: {
        walletAddress,
        nonce,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired nonce" },
        { status: 401 }
      );
    }

    // Verify signature
    const message = createSignInMessage(nonce);
    const isValid = verifyWalletSignature(message, signature, walletAddress);

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Create or get user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress },
      });
    }

    // Generate JWT
    const jwt = await createJWT(walletAddress);

    // Update session with JWT
    await prisma.session.update({
      where: { id: session.id },
      data: { jwt },
    });

    return NextResponse.json({
      jwt,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        creditBalance: user.creditBalance,
      },
    });
  } catch (error) {
    console.error("Auth verify error:", error);
    return NextResponse.json(
      { error: "Failed to verify signature" },
      { status: 500 }
    );
  }
}
