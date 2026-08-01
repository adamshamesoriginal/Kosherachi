import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface PartnerApplicationBody {
  businessName: string;
  businessId: string;
  phone: string;
  area: string;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<PartnerApplicationBody>;

  if (!body.businessName || !body.businessId || !body.phone || !body.area) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const application = await prisma.partnerApplication.create({
    data: {
      businessName: body.businessName,
      businessId: body.businessId,
      phone: body.phone,
      area: body.area,
    },
  });

  return NextResponse.json({ id: application.id }, { status: 201 });
}
