import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, statusForAdminError } from "@/lib/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: statusForAdminError(result.error) });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { verified?: boolean } | null;
  if (typeof body?.verified !== "boolean") {
    return NextResponse.json({ error: "verified must be a boolean" }, { status: 400 });
  }

  const restaurant = await prisma.restaurant.update({
    where: { id },
    data: { certificateVerified: body.verified },
    select: { id: true, certificateVerified: true },
  });

  return NextResponse.json(restaurant);
}
