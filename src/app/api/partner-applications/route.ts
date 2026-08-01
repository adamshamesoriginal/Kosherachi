import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { serializePartnerApplication } from "@/lib/serialize";

interface PartnerApplicationBody {
  businessName: string;
  businessId: string;
  area: string;
}

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const applications = await prisma.partnerApplication.findMany({
    where: { applicantUserId: user.id },
    include: { applicant: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications.map(serializePartnerApplication));
}

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as Partial<PartnerApplicationBody>;

  if (!body.businessName || !body.businessId || !body.area) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const application = await prisma.partnerApplication.create({
    data: {
      applicantUserId: user.id,
      businessName: body.businessName,
      businessId: body.businessId,
      area: body.area,
    },
    include: { applicant: true },
  });

  return NextResponse.json(serializePartnerApplication(application), { status: 201 });
}
