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
          totalEarnings: 0,
          pendingPayout: 0,
          thisMonth: 0,
          lastMonth: 0,
        },
        recentEarnings: [],
      });
    }

    // Get current and last month period strings
    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, "0")}`;

    // Get earnings by period
    const [thisMonthEarnings, lastMonthEarnings, recentEarnings] =
      await Promise.all([
        prisma.earning.aggregate({
          where: { providerId: user.id, period: thisMonth },
          _sum: { amount: true },
        }),
        prisma.earning.aggregate({
          where: { providerId: user.id, period: lastMonth },
          _sum: { amount: true },
        }),
        prisma.earning.findMany({
          where: { providerId: user.id },
          orderBy: { period: "desc" },
          take: 20,
          include: {
            product: {
              select: { name: true, slug: true },
            },
          },
        }),
      ]);

    return NextResponse.json({
      stats: {
        totalEarnings: user.totalEarnings,
        pendingPayout: user.pendingPayout,
        thisMonth: thisMonthEarnings._sum.amount || 0,
        lastMonth: lastMonthEarnings._sum.amount || 0,
      },
      recentEarnings,
    });
  } catch (error) {
    console.error("Provider earnings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch earnings" },
      { status: 500 }
    );
  }
}
