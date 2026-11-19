import mongoose from "mongoose";
import { env } from "../config/env.js";
// import { Session } from "../modules/auth/session.entity.js";
// import { Task } from "../modules/tasks/task.entity.js";
// import { User } from "../modules/users/user.entity.js";

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * @throws Will throw an error if the connection to the database fails.
 */
export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, {
    dbName: env.MONGODB_DATABASE,
    serverSelectionTimeoutMS: 5000,
    autoIndex: false,
  });
  // Ensure unique, ownership and TTL indexes exist before accepting requests.
  // await Promise.all([
  //   User.createIndexes(),
  //   Task.createIndexes(),
  //   Session.createIndexes(),
  // ]);
  console.info("MongoDB connected");
}
