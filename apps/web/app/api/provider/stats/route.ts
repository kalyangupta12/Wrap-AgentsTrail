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

    if (!user) {
      return NextResponse.json({
        stats: {
          totalProducts: 0,
          totalEarnings: 0,
          pendingPayout: 0,
          totalCalls: 0,
        },
      });
    }

    const [totalProducts, totalCalls] = await Promise.all([
      prisma.apiProduct.count({
        where: { providerId: user.id },
      }),
      prisma.apiCall.count({
        where: { product: { providerId: user.id } },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalProducts,
        totalEarnings: user.totalEarnings,
        pendingPayout: user.pendingPayout,
        totalCalls,
      },
    });
  } catch (error) {
    console.error("Provider stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
