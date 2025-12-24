import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/owner", "/admin"];
const OWNER_ROUTES = ["/owner"];
const ADMIN_ROUTES = ["/admin"];

export function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const role = req.cookies.get("role")?.value; // you must set this on login

  const path = req.nextUrl.pathname;

  // 1. If visiting protected page without token → redirect
  if (PROTECTED_ROUTES.some((route) => path.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  // 2. Role-based access
  if (OWNER_ROUTES.some((route) => path.startsWith(route))) {
    if (role !== "OWNER" && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  if (ADMIN_ROUTES.some((route) => path.startsWith(route))) {
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/owner/:path*",
    "/admin/:path*",
  ],
};
