import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const STATE_COOKIE_PREFIX = "koshergo_oauth_state_";
const STATE_TTL_SECONDS = 10 * 60; // 10 minutes — long enough for the provider round-trip

export interface OAuthState {
  token: string;
  next: string | null;
}

/** Random CSRF token + the post-login redirect target, bundled so both survive the round-trip to the provider. */
export function createOAuthState(next: string | null): { state: OAuthState; cookieValue: string } {
  const token = randomBytes(16).toString("hex");
  const state: OAuthState = { token, next };
  return { state, cookieValue: JSON.stringify(state) };
}

export function setOAuthStateCookie(response: NextResponse, provider: string, cookieValue: string) {
  response.cookies.set(`${STATE_COOKIE_PREFIX}${provider}`, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // Lax (not Strict): the browser must still send this cookie when the provider
    // redirects the user back via a top-level GET/POST navigation.
    sameSite: "lax",
    path: "/",
    maxAge: STATE_TTL_SECONDS,
  });
}

export function readOAuthState(request: NextRequest, provider: string): OAuthState | null {
  const raw = request.cookies.get(`${STATE_COOKIE_PREFIX}${provider}`)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.token !== "string") return null;
    return { token: parsed.token, next: typeof parsed.next === "string" ? parsed.next : null };
  } catch {
    return null;
  }
}

export function clearOAuthStateCookie(response: NextResponse, provider: string) {
  response.cookies.delete(`${STATE_COOKIE_PREFIX}${provider}`);
}
