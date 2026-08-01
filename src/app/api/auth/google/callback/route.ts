import { NextRequest, NextResponse } from "next/server";
import { createSession, setSessionCookie } from "@/lib/auth";
import { exchangeGoogleCode, verifyGoogleIdToken } from "@/lib/google-oauth";
import { findOrCreateOAuthUser } from "@/lib/oauthUser";
import { clearOAuthStateCookie, readOAuthState } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const stored = readOAuthState(request, "google");

  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/auth?error=${reason}`, request.url));
    clearOAuthStateCookie(response, "google");
    return response;
  };

  if (params.get("error")) return fail("google_denied");
  if (!code || !state || !stored || stored.token !== state) return fail("google_state_mismatch");

  try {
    const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;
    const tokens = await exchangeGoogleCode(code, redirectUri);
    const profile = await verifyGoogleIdToken(tokens.id_token);

    const user = await findOrCreateOAuthUser({
      provider: "googleId",
      providerId: profile.sub,
      email: profile.email,
      emailVerified: profile.emailVerified,
      name: profile.name,
    });

    const { token: sessionToken, expiresAt } = await createSession(user.id);
    const response = NextResponse.redirect(new URL(stored.next || "/home", request.url));
    setSessionCookie(response, sessionToken, expiresAt);
    clearOAuthStateCookie(response, "google");
    return response;
  } catch (err) {
    console.error("[oauth:google] callback failed", err);
    return fail("google_failed");
  }
}
