import { NextRequest } from "next/server";
import { prisma } from "./db";
import { getSessionUser } from "./auth";

type OwnedRestaurantResult =
  | { error: "unauthenticated" }
  | { error: "not_found" }
  | { error: "forbidden" }
  | { user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>; restaurant: NonNullable<Awaited<ReturnType<typeof prisma.restaurant.findUnique>>> };

export async function requireOwnedRestaurant(
  request: NextRequest,
  restaurantId: string
): Promise<OwnedRestaurantResult> {
  const user = await getSessionUser(request);
  if (!user) return { error: "unauthenticated" };

  const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
  if (!restaurant) return { error: "not_found" };
  if (restaurant.ownerId !== user.id) return { error: "forbidden" };

  return { user, restaurant };
}

export function statusForError(error: "unauthenticated" | "not_found" | "forbidden"): number {
  if (error === "unauthenticated") return 401;
  if (error === "not_found") return 404;
  return 403;
}
