import { prisma } from "./db";

interface OAuthIdentity {
  provider: "googleId" | "appleId";
  providerId: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
}

/**
 * Finds the user for this provider identity, or links/creates one. Only
 * matches an existing account by email when the provider says that email is
 * verified — an unverified email is not a safe way to claim someone else's
 * account.
 */
export async function findOrCreateOAuthUser(identity: OAuthIdentity) {
  const existing =
    identity.provider === "googleId"
      ? await prisma.user.findUnique({ where: { googleId: identity.providerId } })
      : await prisma.user.findUnique({ where: { appleId: identity.providerId } });
  if (existing) return existing;

  if (identity.emailVerified && identity.email) {
    const byEmail = await prisma.user.findUnique({ where: { email: identity.email } });
    if (byEmail) {
      const name = byEmail.name ?? identity.name;
      return identity.provider === "googleId"
        ? prisma.user.update({
            where: { id: byEmail.id },
            data: { googleId: identity.providerId, name },
          })
        : prisma.user.update({
            where: { id: byEmail.id },
            data: { appleId: identity.providerId, name },
          });
    }
  }

  const email = identity.emailVerified ? identity.email : undefined;
  return identity.provider === "googleId"
    ? prisma.user.create({ data: { googleId: identity.providerId, email, name: identity.name } })
    : prisma.user.create({ data: { appleId: identity.providerId, email, name: identity.name } });
}
