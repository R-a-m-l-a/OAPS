import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as jose from "jose";

const AUTH_COOKIE_NAME = "oaps_token";

type JWTPayload = {
  userId?: string;
  email?: string;
  role?: "interviewer" | "interviewee";
};

async function getPayload(req: NextRequest): Promise<JWTPayload | null> {
  const token = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) return null;
  try {
    const secretBytes = new TextEncoder().encode(secret);
    const { payload } = await jose.jwtVerify(token, secretBytes);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "interviewer" | "interviewee",
    };
  } catch {
    return null;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isApiAuth = pathname.startsWith("/api/auth/");
  const isInterviewer = pathname.startsWith("/interviewer");
  const isInterviewee = pathname.startsWith("/interviewee");
  const isDashboard = isInterviewer || isInterviewee;

  if (isApiAuth) {
    return NextResponse.next();
  }

  const payload = await getPayload(req);

  if (isAuthRoute) {
    if (payload?.role) {
      const redirect =
        payload.role === "interviewer" ? "/interviewer" : "/interviewee";
      return NextResponse.redirect(new URL(redirect, req.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    if (!payload?.role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    const redirect =
      payload.role === "interviewer" ? "/interviewer" : "/interviewee";
    return NextResponse.redirect(new URL(redirect, req.url));
  }

  if (isDashboard) {
    if (!payload) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isInterviewer && payload.role !== "interviewer") {
      return NextResponse.redirect(new URL("/interviewee", req.url));
    }
    if (isInterviewee && payload.role !== "interviewee") {
      return NextResponse.redirect(new URL("/interviewer", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/interviewer",
    "/interviewer/:path*",
    "/interviewee",
    "/interviewee/:path*",
    "/api/auth/:path*",
  ],
};
