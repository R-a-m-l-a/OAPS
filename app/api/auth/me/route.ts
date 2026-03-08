import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth/jwt";
import { findUserById } from "@/lib/db/user";

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const res = NextResponse.json({ user: null }, { status: 200 });
      res.cookies.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      return res;
    }

    const user = await findUserById(payload.userId);
    if (!user) {
      const res = NextResponse.json({ user: null }, { status: 200 });
      res.cookies.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/" });
      return res;
    }

    const userId = String(user._id);
    return NextResponse.json({
      user: { id: userId, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("[auth/me]", err);
    return NextResponse.json(
      { error: "Failed to fetch user." },
      { status: 500 }
    );
  }
}
