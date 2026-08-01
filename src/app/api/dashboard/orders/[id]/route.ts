import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { serializeOrder } from "@/lib/serialize";
import { isForwardTransition, STATUS_FLOW } from "@/lib/orderStatus";
import { OrderStatus } from "@/lib/types";

interface UpdateOrderBody {
  status?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.order.findUnique({
    where: { id },
    include: { restaurant: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.restaurant.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as UpdateOrderBody | null;
  const nextStatus = body?.status;
  if (!nextStatus || !STATUS_FLOW.includes(nextStatus as OrderStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }
  if (!isForwardTransition(existing.status as OrderStatus, nextStatus as OrderStatus)) {
    return NextResponse.json(
      { error: `Cannot move from ${existing.status} to ${nextStatus}` },
      { status: 400 }
    );
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: nextStatus },
    include: { items: { include: { menuItem: true } } },
  });

  return NextResponse.json(serializeOrder(order));
}
