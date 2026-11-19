import * as argon2 from "argon2";
import { Router } from "express";
import { Types } from "mongoose";
import { Session } from "./session.entity.js";
import { LoginSchema, User } from "../users/user.entity.js";
import {
  COOKIE_NAME,
  REFRESH_TOKEN_TTL,
  generateRefreshToken,
  getRefreshCookie,
  hashRefreshToken,
  parseRefreshToken,
  refreshCookieOptions,
  sendAccessToken,
} from "./auth.utils.js";
import { AppError } from "../../shared/errorHandler.js";

export const authRoutes = Router();

/*
 * Login route for authenticating users and creating a session.
 */
authRoutes.post("/login", async (req, res) => {
  const input = LoginSchema.parse(req.body);
  const user = await User.findOne({ email: input.email }).select(
    "+passwordHash",
  );
  if (!user || !(await argon2.verify(user.passwordHash, input.password))) {
    throw new AppError(401, "Invalid credentials");
  }

  const sessionId = new Types.ObjectId();
  const refreshToken = generateRefreshToken(sessionId);
  const session = await Session.create({
    _id: sessionId,
    userId: user._id,
    refreshTokenHash: hashRefreshToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL * 1000),
  });
  sendAccessToken(res, session, refreshToken);
});

/*
 * Refresh route for rotating refresh tokens and issuing new access tokens.
 */
authRoutes.post("/refresh", async (req, res) => {
  const token = getRefreshCookie(req);
  if (!token) throw new AppError(401, "Refresh token missing");
  const parsed = parseRefreshToken(token);
  if (!parsed) throw new AppError(401, "Invalid refresh token");

  const { sessionId, tokenHash } = parsed;
  const nextToken = generateRefreshToken(sessionId);
  // One atomic update prevents two requests from rotating the same token.
  const session = await Session.findOneAndUpdate(
    {
      _id: sessionId,
      refreshTokenHash: tokenHash,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    },
    {
      $set: {
        refreshTokenHash: hashRefreshToken(nextToken),
        lastUsedAt: new Date(),
      },
      $push: { usedTokenHashes: tokenHash },
    },
    { returnDocument: "after" },
  );

  if (!session) {
    await Session.updateOne(
      {
        _id: sessionId,
        usedTokenHashes: tokenHash,
        revokedAt: null,
      },
      { $set: { revokedAt: new Date() } },
    );
    throw new AppError(401, "Invalid refresh token");
  }

  if (!(await User.exists({ _id: session.userId }))) {
    await Session.updateOne(
      { _id: session._id },
      { $set: { revokedAt: new Date() } },
    );
    throw new AppError(401, "Invalid refresh token");
  }
  sendAccessToken(res, session, nextToken);
});

/*
 * Logout route for revoking the current session.
 */
authRoutes.post("/logout", async (req, res) => {
  const token = getRefreshCookie(req);
  const parsed = token ? parseRefreshToken(token) : null;
  if (parsed) {
    await Session.updateOne(
      {
        _id: parsed.sessionId,
        revokedAt: null,
        $or: [
          { refreshTokenHash: parsed.tokenHash },
          { usedTokenHashes: parsed.tokenHash },
        ],
      },
      { $set: { revokedAt: new Date() } },
    );
  }
  res.clearCookie(COOKIE_NAME, refreshCookieOptions);
  res.status(204).end();
});
