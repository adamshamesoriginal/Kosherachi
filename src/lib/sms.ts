/**
 * Sends the OTP via Twilio when credentials are configured; otherwise falls
 * back to logging it server-side so the login flow stays testable without a
 * paid account. `SMS_DEV_MODE` gates whether the request-otp route is
 * allowed to echo the code back to the client (dev-only convenience) — see
 * src/app/api/auth/request-otp/route.ts.
 *
 * Required env vars for real sending: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
 * and either TWILIO_MESSAGING_SERVICE_SID or TWILIO_FROM_NUMBER (E.164,
 * e.g. "+15551234567" — a phone number purchased in the Twilio console).
 */
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

export const SMS_DEV_MODE = !(
  TWILIO_ACCOUNT_SID &&
  TWILIO_AUTH_TOKEN &&
  (TWILIO_MESSAGING_SERVICE_SID || TWILIO_FROM_NUMBER)
);

/** "0501234567" -> "+972501234567" (Twilio requires E.164). */
function toE164Israeli(localPhone: string): string {
  return `+972${localPhone.slice(1)}`;
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  if (SMS_DEV_MODE) {
    console.log(`[sms:mock] would send OTP ${code} to ${phone}`);
    return;
  }

  const body = new URLSearchParams();
  body.set("To", toE164Israeli(phone));
  body.set("Body", `${code} הוא קוד האימות שלך ל-KosherGo`);
  if (TWILIO_MESSAGING_SERVICE_SID) {
    body.set("MessagingServiceSid", TWILIO_MESSAGING_SERVICE_SID);
  } else {
    body.set("From", TWILIO_FROM_NUMBER!);
  }

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "");
    console.error(`[sms:twilio] failed to send to ${phone}: ${res.status} ${errorBody}`);
    throw new Error("Failed to send SMS via Twilio");
  }
}
