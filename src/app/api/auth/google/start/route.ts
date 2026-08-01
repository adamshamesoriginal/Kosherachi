import { NextRequest, NextResponse } from "next/server";
import { GOOGLE_CONFIGURED, googleAuthUrl } from "@/lib/google-oauth";
import { createOAuthState, setOAuthStateCookie } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  if (!GOOGLE_CONFIGURED) {
    return NextResponse.redirect(new URL("/auth?error=google_not_configured", request.url));
  }

  const next = request.nextUrl.searchParams.get("next");
  const { state, cookieValue } = createOAuthState(next);
  const redirectUri = `${request.nextUrl.origin}/api/auth/google/callback`;

  const response = NextResponse.redirect(googleAuthUrl(redirectUri, state.token));
  setOAuthStateCookie(response, "google", cookieValue);
  return response;
}
