import { NextRequest } from "next/server";
import { getSessionUser } from "./auth";

/**
 * Lightweight admin gating: no separate admin auth system, just an
 * allowlist of phone numbers checked against the same phone+OTP login
 * everyone else uses. Set ADMIN_PHONES (comma-separated) in real
 * deployments — the default below is a demo-only fallback, printed by the
 * seed script, so the review flow is testable out of the box.
 */
const DEFAULT_ADMIN_PHONES = ["0501110000"];

function adminPhones(): string[] {
  const fromEnv = process.env.ADMIN_PHONES;
  if (!fromEnv) return DEFAULT_ADMIN_PHONES;
  return fromEnv
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
}

export function isAdminPhone(phone: string | null): boolean {
  if (!phone) return false;
  return adminPhones().includes(phone);
}

type RequireAdminResult =
  | { error: "unauthenticated" }
  | { error: "forbidden" }
  | { user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>> };

export async function requireAdmin(request: NextRequest): Promise<RequireAdminResult> {
  const user = await getSessionUser(request);
  if (!user) return { error: "unauthenticated" };
  if (!isAdminPhone(user.phone)) return { error: "forbidden" };
  return { user };
}

export function statusForAdminError(error: "unauthenticated" | "forbidden"): number {
  return error === "unauthenticated" ? 401 : 403;
}
