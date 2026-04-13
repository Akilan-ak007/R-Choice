import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Routes accessible without auth
const publicRoutes = ["/", "/register/company", "/api/auth", "/v"];

// Shared routes every authenticated role can access
const sharedRoutes = ["/settings", "/profile"];

// Role-based route mapping — must cover every sidebar/nav link the role can reach
const roleRoutes: Record<string, string[]> = {
  student: [
    "/dashboard/student",
    "/jobs",
    "/applications",
    "/reports",
    "/drives",
  ],
  tutor: [
    "/dashboard/staff",
    "/students",
    "/approvals",
    "/jobs",
  ],
  placement_coordinator: [
    "/dashboard/staff",
    "/students",
    "/approvals",
    "/jobs",
  ],
  hod: [
    "/dashboard/staff",
    "/students",
    "/approvals",
    "/jobs",
    "/reports",
  ],
  dean: [
    "/dashboard/admin",
    "/students",
    "/approvals",
    "/jobs",
    "/analytics",
    "/users",
    "/companies",
    "/drives",
  ],
  placement_officer: [
    "/dashboard/admin",
    "/students",
    "/approvals",
    "/jobs",
    "/analytics",
    "/users",
    "/companies",
    "/drives",
  ],
  principal: [
    "/dashboard/admin",
    "/students",
    "/approvals",
    "/jobs",
    "/analytics",
    "/users",
    "/companies",
    "/drives",
  ],
  company: [
    "/dashboard/company",
    "/jobs",
    "/applicants",
  ],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => route === "/" ? pathname === "/" : pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow all API routes (includes /api/auth CSRF endpoints)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const session = req.auth;

  // Not logged in → redirect to login
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const role = session.user.role;
  const allowedRoutes = roleRoutes[role] || [];

  // Shared routes are accessible to every authenticated user
  const isShared = sharedRoutes.some((route) => pathname.startsWith(route));
  if (isShared) {
    return NextResponse.next();
  }

  // Check if user has permission for this route
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));
  if (!hasAccess) {
    // Redirect to their dashboard
    const dashboardRoute = allowedRoutes[0] || "/";
    return NextResponse.redirect(new URL(dashboardRoute, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\..*).*)"],
};
