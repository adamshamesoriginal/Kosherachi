import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { serializeMenuItem } from "@/lib/serialize";
import { FOOD_TYPES } from "@/lib/types";

const VALID_FOOD_TYPES = new Set(FOOD_TYPES.map((f) => f.id));

interface UpdateMenuItemBody {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  foodType?: string;
  popular?: boolean;
  available?: boolean;
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
  const existing = await prisma.menuItem.findUnique({
    where: { id },
    include: { restaurant: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (existing.restaurant.ownerId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as UpdateMenuItemBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  if (body.foodType !== undefined && !VALID_FOOD_TYPES.has(body.foodType as never)) {
    return NextResponse.json({ error: "Invalid foodType" }, { status: 400 });
  }
  if (body.price !== undefined && body.price <= 0) {
    return NextResponse.json({ error: "Invalid price" }, { status: 400 });
  }

  const menuItem = await prisma.menuItem.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      foodType: body.foodType,
      popular: body.popular,
      available: body.available,
    },
  });

  return NextResponse.json(serializeMenuItem(menuItem));
}
