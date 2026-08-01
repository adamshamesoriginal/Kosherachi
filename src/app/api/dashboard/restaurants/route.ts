import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const restaurants = await prisma.restaurant.findMany({
    where: { ownerId: user.id },
    select: { id: true, name: true, imageUrl: true, area: true },
  });

  return NextResponse.json(restaurants);
}
