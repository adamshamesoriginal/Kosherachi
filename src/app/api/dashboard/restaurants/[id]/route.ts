import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedRestaurant, statusForError } from "@/lib/dashboard";
import { serializeRestaurant } from "@/lib/serialize";
import { FOOD_TYPES, KASHRUT_LEVELS } from "@/lib/types";

const VALID_KASHRUT_LEVELS = new Set(KASHRUT_LEVELS.map((k) => k.id));
const VALID_FOOD_TYPES = new Set(FOOD_TYPES.map((f) => f.id));

interface UpdateRestaurantBody {
  name?: string;
  address?: string;
  cuisine?: string[];
  foodTypes?: string[];
  deliveryFee?: number;
  minOrder?: number;
  deliveryTimeMinLow?: number;
  deliveryTimeMinHigh?: number;
  selfDelivery?: boolean;
  kashrutLevel?: string;
  certifyingBody?: string;
  certificateNumber?: string;
  certificateExpiryDate?: string;
  published?: boolean;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await requireOwnedRestaurant(request, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: statusForError(result.error) });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id },
    include: { menuItems: true, reviews: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(serializeRestaurant(restaurant));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await requireOwnedRestaurant(request, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: statusForError(result.error) });
  }

  const body = (await request.json().catch(() => null)) as UpdateRestaurantBody | null;
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (body.kashrutLevel !== undefined && !VALID_KASHRUT_LEVELS.has(body.kashrutLevel as never)) {
    return NextResponse.json({ error: "Invalid kashrutLevel" }, { status: 400 });
  }
  if (body.foodTypes !== undefined) {
    if (!body.foodTypes.every((f) => VALID_FOOD_TYPES.has(f as never))) {
      return NextResponse.json({ error: "Invalid foodTypes" }, { status: 400 });
    }
  }
  if (
    body.deliveryTimeMinLow !== undefined &&
    body.deliveryTimeMinHigh !== undefined &&
    body.deliveryTimeMinLow > body.deliveryTimeMinHigh
  ) {
    return NextResponse.json(
      { error: "deliveryTimeMinLow must be <= deliveryTimeMinHigh" },
      { status: 400 }
    );
  }

  let certificateExpiryDate: Date | undefined;
  if (body.certificateExpiryDate !== undefined) {
    const parsed = new Date(body.certificateExpiryDate);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "Invalid certificateExpiryDate" }, { status: 400 });
    }
    certificateExpiryDate = parsed;
  }

  if (body.published === true) {
    const current = await prisma.restaurant.findUniqueOrThrow({
      where: { id },
      include: { _count: { select: { menuItems: true } } },
    });
    const name = body.name ?? current.name;
    const address = body.address ?? current.address;
    const foodTypes = body.foodTypes ?? current.foodTypes.split(",").filter(Boolean);
    if (!name.trim() || !address.trim() || foodTypes.length === 0 || current._count.menuItems === 0) {
      return NextResponse.json(
        {
          error:
            "כדי לפרסם צריך שם, כתובת, לפחות סוג תפריט אחד, ולפחות מנה אחת בתפריט",
        },
        { status: 400 }
      );
    }
  }

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: {
      name: body.name,
      address: body.address,
      cuisine: body.cuisine?.join(","),
      foodTypes: body.foodTypes?.join(","),
      deliveryFee: body.deliveryFee,
      minOrder: body.minOrder,
      deliveryTimeMinLow: body.deliveryTimeMinLow,
      deliveryTimeMinHigh: body.deliveryTimeMinHigh,
      selfDelivery: body.selfDelivery,
      kashrutLevel: body.kashrutLevel,
      certifyingBody: body.certifyingBody,
      certificateNumber: body.certificateNumber,
      certificateExpiryDate,
      published: body.published,
    },
    include: { menuItems: true, reviews: true },
  });

  return NextResponse.json(serializeRestaurant(restaurant));
}
