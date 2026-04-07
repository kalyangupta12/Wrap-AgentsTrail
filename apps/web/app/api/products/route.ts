import { NextResponse } from "next/server";
import { prisma } from "@wrap/db";

export async function GET() {
  try {
    const products = await prisma.apiProduct.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
