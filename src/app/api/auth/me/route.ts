import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isAdminPhone } from "@/lib/admin";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) return NextResponse.json({ user: null });

  const ownedRestaurants = await prisma.restaurant.findMany({
    where: { ownerId: user.id },
    select: { id: true, name: true },
  });

  return NextResponse.json({
    user: {
      id: user.id,
      phone: user.phone,
      ownedRestaurants,
      isAdmin: isAdminPhone(user.phone),
    },
  });
}
