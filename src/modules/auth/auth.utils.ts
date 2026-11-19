import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { Types } from "mongoose";
import type { CookieOptions, Request, Response } from "express";
import { env } from "../../config/env.js";

export const ACCESS_TOKEN_TTL = 10 * 60;
export const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60;
export const COOKIE_NAME = "refreshToken";

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/auth",
};

// Generates a new refresh token for the given session ID.
export function generateRefreshToken(sessionId: Types.ObjectId): string {
  return `${sessionId.toHexString()}.${randomBytes(32).toString("hex")}`;
}

// Hashes the given refresh token using SHA-256.
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Parses the refresh token and returns the session ID and token hash if valid.
export function parseRefreshToken(token: string) {
  const match = /^([a-f0-9]{24})\.([a-f0-9]{64})$/.exec(token);
  if (!match) return null;
  return {
    sessionId: new Types.ObjectId(match[1]),
    tokenHash: hashRefreshToken(token),
  };
}

// Retrieves the refresh token from the request cookies, if present.
export function getRefreshCookie(req: Request): string | undefined {
  const value: unknown = req.cookies?.[COOKIE_NAME];
  return typeof value === "string" ? value : undefined;
}

// Sends an access token and sets the refresh token cookie in the response.
export function sendAccessToken(
  res: Response,
  session: { _id: Types.ObjectId; userId: Types.ObjectId; expiresAt: Date },
  refreshToken: string,
) {
  res.cookie(COOKIE_NAME, refreshToken, {
    ...refreshCookieOptions,
    // Express expects milliseconds; the session keeps its original expiry.
    maxAge: Math.max(0, session.expiresAt.getTime() - Date.now()),
  });
  res.json({
    accessToken: jwt.sign(
      {
        sub: session.userId.toHexString(),
        sid: session._id.toHexString(),
      },
      env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: ACCESS_TOKEN_TTL },
    ),
    tokenType: "Bearer",
  });
}
