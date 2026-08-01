import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID; // the Services ID, e.g. "com.koshergo.web"
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;
const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY; // PEM contents of the .p8 key, \n-escaped

export const APPLE_CONFIGURED = !!(
  APPLE_CLIENT_ID &&
  APPLE_TEAM_ID &&
  APPLE_KEY_ID &&
  APPLE_PRIVATE_KEY
);

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export function appleAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: APPLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    // Apple requires form_post whenever "name"/"email" scope is requested.
    response_mode: "form_post",
    scope: "name email",
    state,
  });
  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
}

/**
 * Apple doesn't accept a static client secret — it's a short-lived JWT you
 * sign yourself with the private key from your Apple Developer account
 * (Keys > Sign in with Apple), generated fresh per request rather than
 * cached, since it's cheap and avoids any expiry bookkeeping.
 */
async function generateAppleClientSecret(): Promise<string> {
  const pem = APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const key = await importPKCS8(pem, "ES256");
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: APPLE_KEY_ID! })
    .setIssuer(APPLE_TEAM_ID!)
    .setIssuedAt()
    .setExpirationTime("5m")
    .setAudience("https://appleid.apple.com")
    .setSubject(APPLE_CLIENT_ID!)
    .sign(key);
}

export async function exchangeAppleCode(
  code: string,
  redirectUri: string
): Promise<{ id_token: string }> {
  const clientSecret = await generateAppleClientSecret();
  const res = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: APPLE_CLIENT_ID!,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apple token exchange failed: ${res.status} ${body}`);
  }
  return res.json();
}

export interface AppleProfile {
  sub: string;
  email?: string;
  emailVerified: boolean;
}

export async function verifyAppleIdToken(idToken: string): Promise<AppleProfile> {
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: APPLE_CLIENT_ID,
  });
  // Apple has historically sent this as either a boolean or the string "true"/"false".
  const emailVerifiedRaw = payload.email_verified;
  return {
    sub: payload.sub!,
    email: typeof payload.email === "string" ? payload.email : undefined,
    emailVerified: emailVerifiedRaw === true || emailVerifiedRaw === "true",
  };
}
