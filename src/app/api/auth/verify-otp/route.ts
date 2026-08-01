import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createSession, normalizePhone, OTP_MAX_ATTEMPTS, setSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { phone?: string; code?: string }
    | null;
  const phone = body?.phone ? normalizePhone(body.phone) : null;
  const code = body?.code?.trim();

  if (!phone || !code) {
    return NextResponse.json({ error: "חסרים פרטים" }, { status: 400 });
  }

  const otp = await prisma.otpCode.findFirst({
    where: { phone, consumed: false },
    orderBy: { createdAt: "desc" },
  });

  if (!otp || otp.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "הקוד פג תוקף, בקשו קוד חדש" },
      { status: 400 }
    );
  }

  if (otp.code !== code) {
    const attempts = otp.attempts + 1;
    const exhausted = attempts >= OTP_MAX_ATTEMPTS;
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts, consumed: exhausted },
    });
    return NextResponse.json(
      {
        error: exhausted
          ? "יותר מדי ניסיונות שגויים, בקשו קוד חדש"
          : "קוד שגוי, נסו שוב",
      },
      { status: 400 }
    );
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });

  const user = await prisma.user.upsert({
    where: { phone },
    update: {},
    create: { phone },
  });

  const { token, expiresAt } = await createSession(user.id);

  const response = NextResponse.json({ id: user.id, phone: user.phone });
  setSessionCookie(response, token, expiresAt);
  return response;
}
