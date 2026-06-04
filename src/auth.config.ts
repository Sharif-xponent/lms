import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-safe config (no database adapter, no bcrypt).
 * Used by middleware. The full config in `auth.ts` extends this.
 */
export default {
  providers: [Google],
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    // Propagate the user's role + id into the JWT and session.
    jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
      }
      return session;
    },
    // Central route protection. Extend the matchers as you build out modules.
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const isAuthPage =
        nextUrl.pathname.startsWith("/sign-in") ||
        nextUrl.pathname.startsWith("/sign-up");

      const isInstructorArea = nextUrl.pathname.startsWith("/instructor");
      const isProtected =
        isInstructorArea ||
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/my-courses");

      // Logged-in users should not see the auth pages.
      if (isAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      if (isProtected && !isLoggedIn) return false; // -> redirected to signIn page

      // Only instructors (or admins) may access the authoring area.
      if (isInstructorArea && role !== "INSTRUCTOR" && role !== "ADMIN") {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
