import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, statusForAdminError } from "@/lib/admin";
import { serializePartnerApplication } from "@/lib/serialize";
import { placeholderImage } from "@/lib/placeholder";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await requireAdmin(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: statusForAdminError(result.error) });
  }

  const { id } = await params;
  const application = await prisma.partnerApplication.findUnique({ where: { id } });
  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (application.status !== "pending") {
    return NextResponse.json(
      { error: `Application already ${application.status}` },
      { status: 400 }
    );
  }

  const body = (await request.json().catch(() => null)) as { reviewNote?: string } | null;
  const now = new Date();

  const restaurant = await prisma.restaurant.create({
    data: {
      name: application.businessName,
      imageUrl: placeholderImage(application.businessName, "🍽️"),
      logoUrl: placeholderImage(`${application.businessName}-logo`, "🍽️", 200, 200),
      cuisine: "",
      area: application.area,
      address: "",
      foodTypes: "",
      rating: 0,
      reviewCount: 0,
      deliveryTimeMinLow: 30,
      deliveryTimeMinHigh: 50,
      deliveryFee: 12,
      minOrder: 30,
      selfDelivery: true,
      kashrutLevel: "regular",
      certifyingBody: "",
      certificateNumber: "",
      certificateIssuedDate: now,
      certificateExpiryDate: new Date(now.getTime() + ONE_YEAR_MS),
      certificateImageUrl: placeholderImage(`${application.businessName}-cert`, "📜", 400, 550),
      certificateVerified: false,
      published: false,
      ownerId: application.applicantUserId,
    },
  });

  const updated = await prisma.partnerApplication.update({
    where: { id },
    data: {
      status: "approved",
      restaurantId: restaurant.id,
      reviewNote: body?.reviewNote,
      reviewedAt: now,
    },
    include: { applicant: true },
  });

  return NextResponse.json(serializePartnerApplication(updated));
}
