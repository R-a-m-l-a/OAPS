import * as jose from "jose";

const COOKIE_NAME = "oaps_token";
const ALG = "HS256";

export type JWTPayload = {
  userId: string;
  email: string;
  role: "interviewer" | "interviewee";
  iat?: number;
  exp?: number;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Sign a JWT with userId, email, and role.
 */
export async function signToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  const secret = getSecret();
  return new jose.SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Verify and decode a JWT. Returns null if invalid.
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jose.jwtVerify(token, secret);
    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as "interviewer" | "interviewee",
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

export const AUTH_COOKIE_NAME = COOKIE_NAME;
