import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rate-limit";

const { auth } = NextAuth(authConfig);

const publicRoutes = ["/", "/register/company", "/company/register", "/api/auth", "/api/company/register", "/api/company/validate-token", "/v", "/team"];
const sharedRoutes = ["/settings", "/profile", "/export", "/calendar"];

const roleRoutes: Record<string, string[]> = {
  student: ["/dashboard/student", "/jobs", "/applications", "/reports", "/companies"],
  tutor: ["/dashboard/staff", "/students", "/approvals", "/jobs", "/reports", "/users"],
  placement_coordinator: ["/dashboard/staff", "/students", "/approvals", "/jobs", "/reports", "/users"],
  hod: ["/dashboard/staff", "/students", "/approvals", "/jobs", "/reports", "/users"],
  dean: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies", "/reports"],
  placement_officer: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies", "/reports"],
  principal: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies", "/reports"],
  coe: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies", "/reports"],
  placement_head: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies", "/reports"],
  mcr: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies", "/reports"],
  management_corporation: ["/dashboard/admin", "/students", "/approvals", "/jobs", "/analytics", "/users", "/companies", "/reports"],
  company: ["/dashboard/company", "/jobs", "/applicants"],
  company_staff: ["/dashboard/company", "/jobs", "/applicants"],
  alumni: ["/dashboard/alumni"],
};

export const proxy = auth(async (req) => {
  const { pathname } = req.nextUrl;

  const shouldRateLimit = pathname.startsWith("/api/") || pathname === "/" || pathname.includes("/submit");
  if (shouldRateLimit) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown-ip";
    const rateLimit = await enforceRateLimit({
      namespace: pathname.startsWith("/api/") ? "proxy-api" : "proxy-ui",
      identifier: ip,
      limit: pathname.startsWith("/api/") ? 60 : 30,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (publicRoutes.some((route) => (route === "/" ? pathname === "/" : pathname.startsWith(route)))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const session = req.auth;
  if (!session?.user) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const role = session.user.role;
  const allowedRoutes = roleRoutes[role] || [];

  if (sharedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));
  if (!hasAccess) {
    return NextResponse.redirect(new URL(allowedRoutes[0] || "/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\..*).*)"],
};
