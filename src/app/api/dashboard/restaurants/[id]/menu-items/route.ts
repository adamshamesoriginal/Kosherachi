import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedRestaurant, statusForError } from "@/lib/dashboard";
import { serializeMenuItem } from "@/lib/serialize";
import { placeholderImage } from "@/lib/placeholder";
import { FOOD_TYPES } from "@/lib/types";

const VALID_FOOD_TYPES = new Set(FOOD_TYPES.map((f) => f.id));
const EMOJI_BY_FOOD_TYPE: Record<string, string> = {
  meat: "🥩",
  dairy: "🧀",
  parve: "🌱",
};

interface CreateMenuItemBody {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  foodType?: string;
  popular?: boolean;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await requireOwnedRestaurant(request, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: statusForError(result.error) });
  }

  const body = (await request.json().catch(() => null)) as CreateMenuItemBody | null;
  if (
    !body?.name ||
    !body.description ||
    typeof body.price !== "number" ||
    body.price <= 0 ||
    !body.category ||
    !body.foodType
  ) {
    return NextResponse.json({ error: "Missing or invalid fields" }, { status: 400 });
  }
  if (!VALID_FOOD_TYPES.has(body.foodType as never)) {
    return NextResponse.json({ error: "Invalid foodType" }, { status: 400 });
  }

  const menuItem = await prisma.menuItem.create({
    data: {
      restaurantId: id,
      name: body.name,
      description: body.description,
      price: body.price,
      category: body.category,
      foodType: body.foodType,
      popular: !!body.popular,
      imageUrl: placeholderImage(body.name, EMOJI_BY_FOOD_TYPE[body.foodType] ?? "🍽️"),
    },
  });

  return NextResponse.json(serializeMenuItem(menuItem), { status: 201 });
}
