import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Edge-safe middleware: uses only auth.config (no Prisma adapter / bcrypt).
export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
