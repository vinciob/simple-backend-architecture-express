import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import { env } from "./config/env.js";
import { AppError, errorHandler } from "./shared/errorHandler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { taskRoutes } from "./modules/tasks/task.routes.js";
import { userRoutes } from "./modules/users/users.routes.js";

/**
 * Builds and configures the Express application.
 * Does not open a port or connect to MongoDB.
 */
export function buildApp() {
  const app = express();
  app.disable("x-powered-by");

  // Enable CORS and parse JSON and cookies for incoming requests.
  app.use(cors({ origin: env.CLIENT_ORIGIN, credentials: true }));

  // Parse JSON and cookies for incoming requests.
  app.use(express.json());

  // Parse cookies for incoming requests.
  app.use(cookieParser());

  // Health check endpoints.
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });
  app.get("/health/db", async (_req, res) => {
    const db = mongoose.connection.db;
    if (!db) throw new AppError(503, "Database unavailable");
    await db.command({ ping: 1 });
    res.json({ status: "ok", database: "mongodb" });
  });

  // Application routes.
  app.use("/users", userRoutes);
  app.use("/auth", authRoutes);
  app.use("/tasks", taskRoutes);

  // Handle unknown routes.
  app.use((_req, _res) => {
    throw new AppError(404, "Route not found");
  });

  // Error handling middleware.
  app.use(errorHandler);
  return app;
}
