import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  generateOtpCode,
  normalizePhone,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
} from "@/lib/auth";
import { sendOtpSms, SMS_DEV_MODE } from "@/lib/sms";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { phone?: string } | null;
  const phone = body?.phone ? normalizePhone(body.phone) : null;

  if (!phone) {
    return NextResponse.json(
      { error: "מספר טלפון לא תקין. יש להזין מספר נייד ישראלי, לדוגמה 050-1234567" },
      { status: 400 }
    );
  }

  const recent = await prisma.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return NextResponse.json(
      { error: "קוד כבר נשלח לאחרונה, נסו שוב בעוד כמה שניות" },
      { status: 429 }
    );
  }

  const code = generateOtpCode();
  await prisma.otpCode.create({
    data: { phone, code, expiresAt: new Date(Date.now() + OTP_TTL_MS) },
  });
  await sendOtpSms(phone, code);

  return NextResponse.json({
    ok: true,
    phone,
    // Only present because no real SMS provider is configured yet; see src/lib/sms.ts.
    devCode: SMS_DEV_MODE ? code : undefined,
  });
}
