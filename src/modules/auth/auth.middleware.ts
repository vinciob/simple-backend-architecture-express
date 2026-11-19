import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { env } from "../../config/env.js";
import { AppError } from "../../shared/errorHandler.js";

// Extend the Express Request interface to include an optional `auth` property for authenticated user info.
declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId: string };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT access tokens.
 * Verifies the token, extracts the user and session IDs, and attaches them to the request object.
 * Throws an AppError with status 401 if the token is missing or invalid.
 */
export const authenticate: RequestHandler = (req, _res, next) => {
  // Verify if token in valid Bearer format is present in the Authorization header.
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization ?? "");
  if (!match) throw new AppError(401, "Invalid access token");

  // Extract the token from the regex match and verify it using JWT.
  try {
    const payload = jwt.verify(match[1]!, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    const objectId = /^[a-f0-9]{24}$/i;
    if (
      typeof payload === "string" ||
      typeof payload.sub !== "string" ||
      !objectId.test(payload.sub) ||
      typeof payload.sid !== "string" ||
      !objectId.test(payload.sid)
    ) {
      throw new Error("Invalid claims");
    }

    // Attach the authenticated user's ID and session ID to the request object.
    req.auth = { userId: payload.sub, sessionId: payload.sid };
  } catch {
    throw new AppError(401, "Invalid access token");
  }
  // Session revocation applies to refresh tokens.
  next();
};
