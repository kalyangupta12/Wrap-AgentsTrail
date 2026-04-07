import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@wrap/db";

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

    return NextResponse.json({
      provider: user
        ? {
            payoutWallet: user.payoutWallet,
            providerName: user.providerName,
            providerBio: user.providerBio,
          }
        : null,
    });
  } catch (error) {
    console.error("Provider settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { walletAddress, payoutWallet, providerName, providerBio } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Wallet address required" },
        { status: 400 }
      );
    }

    // Validate payout wallet format (basic Solana address check)
    if (payoutWallet && !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(payoutWallet)) {
      return NextResponse.json(
        { error: "Invalid Solana wallet address" },
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
          payoutWallet: payoutWallet || walletAddress,
          providerName,
          providerBio,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          role: user.role === "USER" ? "PROVIDER" : user.role,
          payoutWallet: payoutWallet || user.payoutWallet,
          providerName,
          providerBio,
        },
      });
    }

    return NextResponse.json({
      provider: {
        payoutWallet: user.payoutWallet,
        providerName: user.providerName,
        providerBio: user.providerBio,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
