import { auth } from "@/auth";
import type { Role } from "@prisma/client";

/**
 * Server-side helpers for use in Server Components, Server Actions,
 * and Route Handlers. The server is the source of truth for access —
 * never rely on client-side checks alone.
 */

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHENTICATED");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new Error("FORBIDDEN");
  return user;
}
