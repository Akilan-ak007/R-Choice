import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes accessible without auth
const publicRoutes = ["/", "/register/company", "/api/auth"];

// Role-based route mapping
const roleRoutes: Record<string, string[]> = {
  student: ["/dashboard/student", "/profile", "/jobs", "/applications", "/reports"],
  tutor: ["/dashboard/staff", "/students", "/approvals", "/jobs"],
  placement_coordinator: ["/dashboard/staff", "/students", "/approvals", "/jobs"],
  hod: ["/dashboard/staff", "/students", "/approvals", "/jobs", "/reports"],
  dean: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies"],
  placement_officer: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies"],
  principal: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies"],
  company: ["/dashboard/company", "/jobs/manage", "/applicants"],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow API auth routes
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = req.auth;

  // Not logged in → redirect to login
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const role = (session.user as any).role as string;
  const allowedRoutes = roleRoutes[role] || [];

  // Check if user has permission for this route
  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));
  if (!hasAccess && !pathname.startsWith("/api")) {
    // Redirect to their dashboard
    const dashboardRoute = allowedRoutes[0] || "/";
    return NextResponse.redirect(new URL(dashboardRoute, req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
