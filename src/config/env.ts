import "dotenv/config";
import { z } from "zod";

/**
 * Environment variables schema and validation using Zod.
 */
export const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  HOST: z.string().min(1).default("0.0.0.0"),
  CLIENT_ORIGIN: z.url().refine((value) => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && url.origin === value;
  }, "Expected an HTTP(S) origin without a trailing slash"),
  MONGODB_URI: z.string().regex(/^mongodb(\+srv)?:\/\//),
  MONGODB_DATABASE: z.string().min(1),
  JWT_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof EnvSchema>;

// Parse and validate environment variables using the defined schema.
// Throws an error if any environment variable is missing or invalid.
export const env = EnvSchema.parse(process.env);
