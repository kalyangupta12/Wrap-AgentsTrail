import { prisma } from "@wrap/db";

interface LogCallParams {
  product: {
    id: string;
    pricePerCall: number;
    provider: {
      id: string;
    };
  };
  walletAddress?: string;
  network: string;
  responseCode: number;
  latencyMs: number;
  platformFeeRate: number;
  txSignature?: string;
}

export async function logApiCall(params: LogCallParams): Promise<void> {
  try {
    const {
      product,
      walletAddress,
      network,
      responseCode,
      latencyMs,
      platformFeeRate,
      txSignature,
    } = params;

    // Only charge if request was successful (2xx)
    const isSuccess = responseCode >= 200 && responseCode < 300;
    const cost = isSuccess ? product.pricePerCall : 0;
    const platformFee = cost * platformFeeRate;
    const providerEarning = cost - platformFee;

    // Find or create user
    let user = null;
    if (walletAddress) {
      user = await prisma.user.findUnique({
        where: { walletAddress },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { walletAddress },
        });
      }
    }

    if (!user) {
      console.warn("No user found for API call logging");
      return;
    }

    // Log the call
    await prisma.apiCall.create({
      data: {
        userId: user.id,
        productId: product.id,
        cost,
        providerEarning,
        platformFee,
        responseCode,
        latencyMs,
        network,
        txSignature,
      },
    });

    if (isSuccess && cost > 0) {
      // Update user balance (deduct cost)
      await prisma.user.update({
        where: { id: user.id },
        data: {
          creditBalance: {
            decrement: cost,
          },
        },
      });

      // Update provider earnings
      await prisma.user.update({
        where: { id: product.provider.id },
        data: {
          totalEarnings: { increment: providerEarning },
          pendingPayout: { increment: providerEarning },
        },
      });

      // Update or create monthly earning record
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

      await prisma.earning.upsert({
        where: {
          providerId_productId_period: {
            providerId: product.provider.id,
            productId: product.id,
            period,
          },
        },
        update: {
          amount: { increment: providerEarning },
          callCount: { increment: 1 },
        },
        create: {
          providerId: product.provider.id,
          productId: product.id,
          period,
          amount: providerEarning,
          callCount: 1,
        },
      });
    }
  } catch (error) {
    console.error("Failed to log API call:", error);
  }
}
