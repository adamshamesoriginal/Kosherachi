/**
 * No real SMS provider (e.g. Twilio) is wired up. This logs the OTP
 * server-side like a provider would, and callers may expose the code back
 * to the client ONLY while `SMS_DEV_MODE` is on, so the login flow is
 * testable without a paid provider. Flip this to a real provider by
 * replacing the body of `sendOtpSms` with an API call and unsetting
 * SMS_DEV_MODE.
 */
export const SMS_DEV_MODE = !process.env.SMS_PROVIDER_API_KEY;

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  console.log(`[sms:mock] would send OTP ${code} to ${phone}`);
}
