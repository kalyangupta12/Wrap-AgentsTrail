import { SignJWT, jwtVerify } from "jose";
import { CONFIG } from "@wrap/config";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "wrap-api-secret-change-in-production"
);

export interface JWTPayload {
  walletAddress: string;
  iat: number;
  exp: number;
}

export async function createJWT(walletAddress: string): Promise<string> {
  const jwt = await new SignJWT({ walletAddress })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(CONFIG.jwt.issuer)
    .setExpirationTime(CONFIG.jwt.expiresIn)
    .sign(JWT_SECRET);

  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: CONFIG.jwt.issuer,
    });
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}
