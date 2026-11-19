import { STATUS_CODES } from "node:http";
import type { ErrorRequestHandler } from "express";
import mongoose from "mongoose";
import { z } from "zod";

/**
 * Custom application error class.
 * Extends the built-in Error class with an HTTP status code.
 * @param statusCode - The HTTP status code associated with the error.
 * @param message - The error message.
 * @example
 * throw new AppError(404, "Resource not found");
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Centralized error handling middleware for Express.
 * Handles validation errors, application errors, MongoDB errors, and generic errors.
 */
export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req,
  res,
  next,
) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof z.ZodError) {
    res.status(400).json({
      statusCode: 400,
      error: "ValidationError",
      message: "Request validation failed",
      details: z.treeifyError(error),
    });
    return;
  }

  let statusCode = 500;
  let message = "An unexpected error occurred";
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (
    error instanceof mongoose.mongo.MongoServerError &&
    error.code === 11000
  ) {
    statusCode = 409;
    message = "Email already registered";
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Document validation failed";
  } else if (
    error instanceof Error &&
    "status" in error &&
    typeof error.status === "number" &&
    error.status >= 400 &&
    error.status < 500
  ) {
    statusCode = error.status;
    message = STATUS_CODES[statusCode] ?? "Invalid request";
  }

  if (statusCode >= 500) console.error(error);
  res.status(statusCode).json({
    statusCode,
    error:
      statusCode >= 500
        ? "Internal Server Error"
        : error instanceof AppError
          ? "AppError"
          : STATUS_CODES[statusCode],
    message: statusCode >= 500 ? "An unexpected error occurred" : message,
  });
};
