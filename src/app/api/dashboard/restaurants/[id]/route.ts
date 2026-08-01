import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireOwnedRestaurant, statusForError } from "@/lib/dashboard";
import { serializeRestaurant } from "@/lib/serialize";
import { KASHRUT_LEVELS } from "@/lib/types";

const VALID_KASHRUT_LEVELS = new Set(KASHRUT_LEVELS.map((k) => k.id));

interface UpdateRestaurantBody {
  deliveryFee?: number;
  minOrder?: number;
  deliveryTimeMinLow?: number;
  deliveryTimeMinHigh?: number;
  selfDelivery?: boolean;
  kashrutLevel?: string;
  certifyingBody?: string;
  certificateNumber?: string;
  certificateExpiryDate?: string;
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

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: {
      deliveryFee: body.deliveryFee,
      minOrder: body.minOrder,
      deliveryTimeMinLow: body.deliveryTimeMinLow,
      deliveryTimeMinHigh: body.deliveryTimeMinHigh,
      selfDelivery: body.selfDelivery,
      kashrutLevel: body.kashrutLevel,
      certifyingBody: body.certifyingBody,
      certificateNumber: body.certificateNumber,
      certificateExpiryDate,
    },
    include: { menuItems: true, reviews: true },
  });

  return NextResponse.json(serializeRestaurant(restaurant));
}
