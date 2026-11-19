import { createServer } from "node:http";
import { once } from "node:events";
import mongoose from "mongoose";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDB } from "./db/connection.js";

/**
 * Entry point for the server.
 * Creates and starts the HTTP server using the Express app.
 * Handles graceful shutdown on SIGINT and SIGTERM signals.
 * Avoid to use app.listen() directly and use this server setup for better control over shutdown and error handling.
 */
async function startServer() {
  // Create the HTTP server using the Express app built by buildApp().
  const server = createServer(buildApp());

  // Connect to the database and start the server.
  try {
    await connectDB();
    server.listen(env.PORT, env.HOST);
    await once(server, "listening");
    console.info(`Server listening on http://${env.HOST}:${env.PORT}`);
  } catch (error) {
    console.error("Failed to start server", error);
    await mongoose.disconnect();
    process.exitCode = 1;
    return;
  }

  // Handle graceful shutdown on SIGINT and SIGTERM signals.
  let stopping = false;
  async function shutdown() {
    if (stopping) return;
    stopping = true;
    const timeout = setTimeout(() => process.exit(1), 10_000).unref();
    try {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
      await mongoose.disconnect();
    } catch (error) {
      console.error("Failed to shut down", error);
      process.exitCode = 1;
    } finally {
      clearTimeout(timeout);
    }
  }

  // Listen for termination signals and initiate Graceful shutdown.
  process.once("SIGINT", () => {
    void shutdown();
  });
  process.once("SIGTERM", () => {
    void shutdown();
  });
}

void startServer();
