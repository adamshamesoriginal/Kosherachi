import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeRestaurant } from "@/lib/serialize";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { menuItems: { where: { available: true } }, reviews: true },
  });

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  return NextResponse.json(serializeRestaurant(restaurant));
}
