import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedRestaurant, statusForError } from "@/lib/dashboard";
import { serializeOrder } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const restaurantId = searchParams.get("restaurantId");
  if (!restaurantId) {
    return NextResponse.json({ error: "restaurantId is required" }, { status: 400 });
  }

  const result = await requireOwnedRestaurant(request, restaurantId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: statusForError(result.error) });
  }

  // Unpaid orders never reach the restaurant's queue — no risk of a kitchen
  // starting on food nobody's paid for.
  const orders = await prisma.order.findMany({
    where: { restaurantId, paymentStatus: "paid" },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map(serializeOrder));
}
