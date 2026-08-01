import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeOrder } from "@/lib/serialize";
import { SERVICE_FEE, VAT_RATE } from "@/lib/pricing";

interface CreateOrderBody {
  customerId: string;
  restaurantId: string;
  items: { menuItemId: string; quantity: number }[];
  address: string;
  phone: string;
  pickupOrDelivery: "delivery" | "pickup";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  if (!customerId) {
    return NextResponse.json({ error: "customerId is required" }, { status: 400 });
  }

  const orders = await prisma.order.findMany({
    where: { customerId },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map(serializeOrder));
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<CreateOrderBody>;

  if (
    !body.customerId ||
    !body.restaurantId ||
    !body.items?.length ||
    !body.phone ||
    !body.pickupOrDelivery
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (body.pickupOrDelivery === "delivery" && !body.address) {
    return NextResponse.json({ error: "Address is required for delivery" }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: body.restaurantId },
    include: { menuItems: true },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const menuById = new Map(restaurant.menuItems.map((m) => [m.id, m]));
  const orderItemsInput: { menuItem: (typeof restaurant.menuItems)[number]; quantity: number }[] = [];
  for (const requested of body.items) {
    const menuItem = menuById.get(requested.menuItemId);
    if (!menuItem) {
      return NextResponse.json(
        { error: `Menu item ${requested.menuItemId} not found on this restaurant` },
        { status: 400 }
      );
    }
    orderItemsInput.push({ menuItem, quantity: Math.max(1, Math.floor(requested.quantity)) });
  }

  const subtotal = orderItemsInput.reduce(
    (sum, { menuItem, quantity }) => sum + menuItem.price * quantity,
    0
  );

  if (subtotal < restaurant.minOrder) {
    return NextResponse.json(
      { error: `Order does not meet minimum of ${restaurant.minOrder}` },
      { status: 400 }
    );
  }

  const deliveryFee = body.pickupOrDelivery === "delivery" ? restaurant.deliveryFee : 0;
  const total = subtotal + deliveryFee + SERVICE_FEE;
  const vat = total - total / (1 + VAT_RATE);

  const orderId = `KG-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  const order = await prisma.order.create({
    data: {
      id: orderId,
      customerId: body.customerId,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      subtotal,
      deliveryFee,
      serviceFee: SERVICE_FEE,
      vat,
      total,
      address:
        body.pickupOrDelivery === "delivery"
          ? body.address!
          : `איסוף עצמי: ${restaurant.address}`,
      phone: body.phone,
      pickupOrDelivery: body.pickupOrDelivery,
      items: {
        create: orderItemsInput.map(({ menuItem, quantity }) => ({
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          quantity,
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  return NextResponse.json(serializeOrder(order), { status: 201 });
}
