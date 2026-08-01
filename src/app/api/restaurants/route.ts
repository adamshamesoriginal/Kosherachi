import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeRestaurant } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const area = searchParams.get("area");
  const kashrut = searchParams.get("kashrut")?.split(",").filter(Boolean) ?? [];
  const foodType = searchParams.get("foodType")?.split(",").filter(Boolean) ?? [];
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const restaurants = await prisma.restaurant.findMany({
    where: { published: true, ...(area ? { area } : {}) },
    include: { menuItems: { where: { available: true } }, reviews: true },
    orderBy: { rating: "desc" },
  });

  const filtered = restaurants.filter((r) => {
    if (kashrut.length > 0 && !kashrut.includes(r.kashrutLevel)) return false;
    if (foodType.length > 0) {
      const types = r.foodTypes.split(",");
      if (!types.some((t) => foodType.includes(t))) return false;
    }
    if (q) {
      const haystack = `${r.name} ${r.cuisine} ${r.menuItems
        .map((m) => m.name)
        .join(" ")}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return NextResponse.json(filtered.map(serializeRestaurant));
}
