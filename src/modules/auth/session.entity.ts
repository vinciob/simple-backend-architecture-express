import { model, Schema, Types } from "mongoose";
import { z } from "zod";

/**
 * Session Schema and Model for managing user sessions.
 */

// Zod schema for validating session data.
export const SessionSchema = z.object({
  userId: z.instanceof(Types.ObjectId),
  refreshTokenHash: z.string(),
  usedTokenHashes: z.array(z.string()),
  createdAt: z.date(),
  lastUsedAt: z.date(),
  expiresAt: z.date(),
  revokedAt: z.date().nullable(),
});

// Type representing the session data validated by the SessionSchema.
export type SessionData = z.infer<typeof SessionSchema>;

// Mongoose schema for the Session model, corresponding to the SessionData type.
const sessionSchema = new Schema<SessionData>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refreshTokenHash: { type: String, required: true },
    usedTokenHashes: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { versionKey: false },
);

// Create indexes to optimize queries for active and expired sessions.
sessionSchema.index({ userId: 1, revokedAt: 1 });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Export the Session model for interacting with the sessions collection in MongoDB.
export const Session = model<SessionData>("Session", sessionSchema);
