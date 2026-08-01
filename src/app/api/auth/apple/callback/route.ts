import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { exchangeAppleCode, verifyAppleIdToken } from "@/lib/apple-oauth";
import { findOrCreateOAuthUser } from "@/lib/oauthUser";
import { clearOAuthStateCookie, readOAuthState } from "@/lib/oauth";

/** Apple only sends the user's name on the very first authorization ever. */
function parseAppleName(userField: string | null): string | undefined {
  if (!userField) return undefined;
  try {
    const parsed = JSON.parse(userField);
    const first = parsed?.name?.firstName;
    const last = parsed?.name?.lastName;
    return [first, last].filter(Boolean).join(" ") || undefined;
  } catch {
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const form = await request.formData();
  const code = form.get("code")?.toString() ?? null;
  const state = form.get("state")?.toString() ?? null;
  const stored = readOAuthState(request, "apple");

  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/auth?error=${reason}`, request.url));
    clearOAuthStateCookie(response, "apple");
    return response;
  };

  if (form.get("error")) return fail("apple_denied");
  if (!code || !state || !stored || stored.token !== state) return fail("apple_state_mismatch");

  try {
    const redirectUri = `${request.nextUrl.origin}/api/auth/apple/callback`;
    const tokens = await exchangeAppleCode(code, redirectUri);
    const profile = await verifyAppleIdToken(tokens.id_token);
    const name = parseAppleName(form.get("user")?.toString() ?? null);

    const user = await findOrCreateOAuthUser({
      provider: "appleId",
      providerId: profile.sub,
      email: profile.email,
      emailVerified: profile.emailVerified,
      name,
    });

    const { token: sessionToken, expiresAt } = await createSession(user.id);
    const response = NextResponse.redirect(new URL(stored.next || "/home", request.url));
    setSessionCookie(response, sessionToken, expiresAt);
    clearOAuthStateCookie(response, "apple");
    return response;
  } catch (err) {
    console.error("[oauth:apple] callback failed", err);
    return fail("apple_failed");
  }
}
