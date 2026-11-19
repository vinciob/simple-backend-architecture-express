import { model, Schema, Types } from "mongoose";
import { z } from "zod";

const NameSchema = z.string().trim().min(2).max(100);
const EmailSchema = z.string().trim().toLowerCase().pipe(z.email().max(254));

// Zod schemas for validating user input and data.
export const RegisterUserSchema = z.strictObject({
  name: NameSchema,
  email: EmailSchema,
  password: z.string().min(12).max(128),
});
export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

// Zod schema for validating login input.
export const LoginSchema = z.strictObject({
  email: EmailSchema,
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// Zod schema for validating user data stored in the database.
export const UserSchema = z.object({
  name: NameSchema,
  email: EmailSchema,
  passwordHash: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type UserData = z.infer<typeof UserSchema>;

// Zod schema for shaping the user response sent to clients.
export const UserResponseSchema = UserSchema.omit({
  passwordHash: true,
  updatedAt: true,
}).extend({
  id: z.string(),
  createdAt: z.iso.datetime(),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;

// Mongoose schema and model for the User entity.
const userSchema = new Schema<UserData>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true, versionKey: false },
);

// Create a unique index on the email field to enforce uniqueness at the database level.
userSchema.index({ email: 1 }, { unique: true });

// Create and export the Mongoose model for the User entity.
export const User = model<UserData>("User", userSchema);

// Explicit response fields keep password hashes and database internals private.
// export function toUserResponse(
//   user: UserData & { _id: Types.ObjectId },
// ): UserResponse {
//   return {
//     id: user._id.toHexString(),
//     name: user.name,
//     email: user.email,
//     createdAt: user.createdAt.toISOString(),
//   };
// }
