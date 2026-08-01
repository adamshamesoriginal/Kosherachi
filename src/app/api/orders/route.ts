import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { serializeOrder } from "@/lib/serialize";
import { SERVICE_FEE, VAT_RATE } from "@/lib/pricing";
import { createPaymentPage, MESHULAM_CONFIGURED } from "@/lib/meshulam";
import { SelectedOption } from "@/lib/types";

interface CreateOrderBody {
  restaurantId: string;
  items: {
    menuItemId: string;
    quantity: number;
    selectedChoiceIds?: string[];
    note?: string;
  }[];
  address: string;
  phone: string;
  pickupOrDelivery: "delivery" | "pickup";
  note?: string;
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    include: { items: { include: { menuItem: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(orders.map(serializeOrder));
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<CreateOrderBody>;

  if (!body.restaurantId || !body.items?.length || !body.phone || !body.pickupOrDelivery) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (body.pickupOrDelivery === "delivery" && !body.address) {
    return NextResponse.json({ error: "Address is required for delivery" }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { id: body.restaurantId },
    include: {
      menuItems: { include: { options: { include: { choices: true } } } },
    },
  });
  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found" }, { status: 404 });
  }

  const menuById = new Map(restaurant.menuItems.map((m) => [m.id, m]));
  const orderItemsInput: {
    menuItem: (typeof restaurant.menuItems)[number];
    quantity: number;
    unitPrice: number;
    selectedOptions: SelectedOption[];
    note: string | null;
  }[] = [];

  for (const requested of body.items) {
    const menuItem = menuById.get(requested.menuItemId);
    if (!menuItem) {
      return NextResponse.json(
        { error: `Menu item ${requested.menuItemId} not found on this restaurant` },
        { status: 400 }
      );
    }
    if (!menuItem.available) {
      return NextResponse.json(
        { error: `${menuItem.name} is currently unavailable` },
        { status: 400 }
      );
    }

    // Never trust prices, labels, or which choices exist from the client —
    // every selected choice id is re-resolved against this menu item's own
    // options as stored in the DB right now.
    const requestedChoiceIds = new Set(requested.selectedChoiceIds ?? []);
    const choiceById = new Map(
      menuItem.options.flatMap((o) => o.choices.map((c) => [c.id, { option: o, choice: c }] as const))
    );
    const selectedOptions: SelectedOption[] = [];
    for (const choiceId of requestedChoiceIds) {
      const found = choiceById.get(choiceId);
      if (!found) {
        return NextResponse.json(
          { error: `${menuItem.name}: אפשרות בחירה לא תקינה` },
          { status: 400 }
        );
      }
      selectedOptions.push({
        optionId: found.option.id,
        optionName: found.option.name,
        choiceId: found.choice.id,
        choiceLabel: found.choice.label,
        priceDelta: found.choice.priceDelta,
      });
    }

    for (const option of menuItem.options) {
      const chosenForOption = selectedOptions.filter((s) => s.optionId === option.id);
      if (option.required && chosenForOption.length === 0) {
        return NextResponse.json(
          { error: `${menuItem.name}: יש לבחור אפשרות עבור "${option.name}"` },
          { status: 400 }
        );
      }
      if (option.type === "single" && chosenForOption.length > 1) {
        return NextResponse.json(
          { error: `${menuItem.name}: ניתן לבחור אפשרות אחת בלבד עבור "${option.name}"` },
          { status: 400 }
        );
      }
    }

    const unitPrice =
      menuItem.price + selectedOptions.reduce((sum, o) => sum + o.priceDelta, 0);

    orderItemsInput.push({
      menuItem,
      quantity: Math.max(1, Math.floor(requested.quantity)),
      unitPrice,
      selectedOptions,
      note: requested.note?.trim() || null,
    });
  }

  const subtotal = orderItemsInput.reduce(
    (sum, { unitPrice, quantity }) => sum + unitPrice * quantity,
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
  const address =
    body.pickupOrDelivery === "delivery" ? body.address! : `איסוף עצמי: ${restaurant.address}`;

  // With no payment provider configured, orders complete instantly (demo
  // mode) — same behavior the app has always had. With Meshulam configured,
  // the order starts "pending" and only becomes visible to the restaurant
  // once the webhook confirms it — see src/lib/meshulam.ts.
  let paymentTransactionId: string | undefined;
  let redirectUrl: string | undefined;

  if (MESHULAM_CONFIGURED) {
    try {
      const payment = await createPaymentPage({
        orderId,
        amountIls: total,
        description: `הזמנה מ${restaurant.name}`,
        customerName: user.name ?? "לקוח KosherGo",
        customerPhone: body.phone,
        successUrl: `${request.nextUrl.origin}/order/${orderId}`,
        cancelUrl: `${request.nextUrl.origin}/cart`,
        webhookUrl: `${request.nextUrl.origin}/api/payments/meshulam/webhook`,
      });
      paymentTransactionId = payment.transactionId;
      redirectUrl = payment.paymentUrl;
    } catch (err) {
      console.error("[orders] failed to start Meshulam payment", err);
      return NextResponse.json(
        { error: "פתיחת התשלום נכשלה, נסו שוב" },
        { status: 502 }
      );
    }
  }

  const order = await prisma.order.create({
    data: {
      id: orderId,
      userId: user.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      subtotal,
      deliveryFee,
      serviceFee: SERVICE_FEE,
      vat,
      total,
      address,
      phone: body.phone,
      pickupOrDelivery: body.pickupOrDelivery,
      note: body.note?.trim() || null,
      paymentStatus: MESHULAM_CONFIGURED ? "pending" : "paid",
      paymentProvider: MESHULAM_CONFIGURED ? "meshulam" : null,
      paymentTransactionId,
      items: {
        create: orderItemsInput.map(({ menuItem, quantity, unitPrice, selectedOptions, note }) => ({
          menuItemId: menuItem.id,
          name: menuItem.name,
          price: unitPrice,
          quantity,
          note,
          selectedOptionsJson: selectedOptions.length ? JSON.stringify(selectedOptions) : null,
        })),
      },
    },
    include: { items: { include: { menuItem: true } } },
  });

  return NextResponse.json(
    { ...serializeOrder(order), redirectUrl },
    { status: 201 }
  );
}
