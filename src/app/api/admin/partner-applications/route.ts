import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, statusForAdminError } from "@/lib/admin";
import { serializePartnerApplication } from "@/lib/serialize";

export async function GET(request: NextRequest) {
  const result = await requireAdmin(request);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: statusForAdminError(result.error) });
  }

  const applications = await prisma.partnerApplication.findMany({
    include: { applicant: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(applications.map(serializePartnerApplication));
}
