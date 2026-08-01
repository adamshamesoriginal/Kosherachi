import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, statusForAdminError } from "@/lib/admin";
import { serializePartnerApplication } from "@/lib/serialize";

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

  const updated = await prisma.partnerApplication.update({
    where: { id },
    data: {
      status: "rejected",
      reviewNote: body?.reviewNote,
      reviewedAt: new Date(),
    },
    include: { applicant: true },
  });

  return NextResponse.json(serializePartnerApplication(updated));
}
