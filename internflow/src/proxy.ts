import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// ── Rate Limiter (In-Memory LRU) ──
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_POINTS = 50;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

function getRateLimitStatus(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_POINTS) return false;
  record.count += 1;
  return true;
}

const { auth } = NextAuth(authConfig);

// Routes accessible without auth
const publicRoutes = ["/", "/register/company", "/company/register", "/register", "/api/auth", "/v", "/team"];

// Shared routes every authenticated role can access
const sharedRoutes = ["/settings", "/profile", "/export", "/calendar"];

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
    "/reports",
  ],
  placement_coordinator: [
    "/dashboard/staff",
    "/students",
    "/approvals",
    "/jobs",
    "/reports",
    "/users",
  ],
  hod: [
    "/dashboard/staff",
    "/students",
    "/approvals",
    "/jobs",
    "/reports",
    "/users",
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
    "/reports",
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
    "/reports",
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
    "/reports",
  ],
  coe: [
    "/dashboard/admin",
    "/students",
    "/approvals",
    "/jobs",
    "/analytics",
    "/users",
    "/companies",
    "/drives",
    "/reports",
  ],
  mcr: [
    "/dashboard/admin",
    "/students",
    "/approvals",
    "/jobs",
    "/analytics",
    "/users",
    "/companies",
    "/drives",
    "/reports",
  ],
  placement_head: [
    "/dashboard/admin",
    "/students",
    "/approvals",
    "/jobs",
    "/analytics",
    "/users",
    "/companies",
    "/drives",
    "/reports",
  ],
  management_corporation: [
    "/dashboard/admin",
    "/students",
    "/approvals",
    "/jobs",
    "/analytics",
    "/users",
    "/companies",
    "/drives",
    "/reports",
  ],
  company: [
    "/dashboard/company",
    "/jobs",
    "/applicants",
  ],
  company_staff: [
    "/dashboard/company",
    "/jobs",
    "/applicants",
  ],
  alumni: [
    "/dashboard/alumni",
  ],
};

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  // ── Rate Limiting on sensitive routes ──
  const isRateLimited = pathname.startsWith("/api/") || pathname.startsWith("/login") || pathname.includes("/submit");
  if (isRateLimited) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown-ip";
    if (!getRateLimitStatus(ip)) {
      console.warn(`[Rate Limiter] Blocked IP: ${ip} on route ${pathname}`);
      return new NextResponse(
        JSON.stringify({ success: false, message: "Too many requests. Please try again later." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
  }

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\..*).*)" ],
};
