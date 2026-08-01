import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, statusForAdminError } from "@/lib/admin";

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: statusForAdminError(result.error) });
  }

  const restaurants = await prisma.restaurant.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      area: true,
      published: true,
      kashrutLevel: true,
      certifyingBody: true,
      certificateNumber: true,
      certificateExpiryDate: true,
      certificateVerified: true,
      owner: { select: { phone: true, email: true } },
    },
  });

  return NextResponse.json(
    restaurants.map((r) => ({
      id: r.id,
      name: r.name,
      area: r.area,
      published: r.published,
      kashrutLevel: r.kashrutLevel,
      certifyingBody: r.certifyingBody,
      certificateNumber: r.certificateNumber,
      certificateExpiryDate: r.certificateExpiryDate.toISOString(),
      certificateVerified: r.certificateVerified,
      ownerPhone: r.owner?.phone ?? null,
      ownerEmail: r.owner?.email ?? null,
    }))
  );
}
