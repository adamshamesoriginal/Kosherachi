import { NextRequest, NextResponse } from "next/server";
import { APPLE_CONFIGURED, appleAuthUrl } from "@/lib/apple-oauth";
import { createOAuthState, setOAuthStateCookie } from "@/lib/oauth";

export async function GET(request: NextRequest) {
  if (!APPLE_CONFIGURED) {
    return NextResponse.redirect(new URL("/auth?error=apple_not_configured", request.url));
  }

  const next = request.nextUrl.searchParams.get("next");
  const { state, cookieValue } = createOAuthState(next);
  const redirectUri = `${request.nextUrl.origin}/api/auth/apple/callback`;

  const response = NextResponse.redirect(appleAuthUrl(redirectUri, state.token));
  setOAuthStateCookie(response, "apple", cookieValue);
  return response;
}
