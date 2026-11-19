import { Router } from "express";
import {
  CreateTaskSchema,
  Task,
  TaskParamsSchema,
  toTaskResponse,
  UpdateTaskSchema,
  type TaskListItem,
} from "./task.entity.js";
import { authenticate } from "../auth/auth.middleware.js";
import { AppError } from "../../shared/errorHandler.js";

export const taskRoutes = Router();
taskRoutes.use(authenticate);

/**
 * Route for creating a new task.
 */
taskRoutes.post("/", async (req, res) => {
  const input = CreateTaskSchema.parse(req.body);
  const task = await Task.create({
    ...input,
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
    createdBy: req.auth!.userId,
  });
  res.status(201).json(toTaskResponse(task));
});

/**
 * Route for fetching the list of tasks for the authenticated user.
 */
taskRoutes.get("/", async (req, res) => {
  const tasks = await Task.find({ createdBy: req.auth!.userId })
    .select("name dueDate status")
    .sort({ createdAt: -1 });
  const items: TaskListItem[] = tasks.map((task) => ({
    _id: task._id.toHexString(),
    name: task.name,
    dueDate: task.dueDate?.toISOString() ?? null,
    status: task.status,
  }));
  res.json(items);
});

/**
 * Route for fetching a single task by its ID for the authenticated user.
 */
taskRoutes.get("/:id", async (req, res) => {
  const { id } = TaskParamsSchema.parse(req.params);
  const task = await Task.findOne({ _id: id, createdBy: req.auth!.userId });
  if (!task) throw new AppError(404, "Task not found");
  res.json(toTaskResponse(task));
});

/**
 * Route for updating a task by its ID for the authenticated user.
 */
taskRoutes.patch("/:id", async (req, res) => {
  const { id } = TaskParamsSchema.parse(req.params);
  const input = UpdateTaskSchema.parse(req.body);
  // Omitted fields stay untouched; explicit null clears nullable fields.
  const changes = {
    ...input,
    ...(input.description !== undefined && {
      description: input.description?.trim() ?? null,
    }),
    ...(input.dueDate !== undefined && {
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
    }),
  };
  const task = await Task.findOneAndUpdate(
    { _id: id, createdBy: req.auth!.userId },
    { $set: changes },
    { returnDocument: "after", runValidators: true },
  );
  if (!task) throw new AppError(404, "Task not found");
  res.json(toTaskResponse(task));
});

/**
 * Route for deleting a task by its ID for the authenticated user.
 */
taskRoutes.delete("/:id", async (req, res) => {
  const { id } = TaskParamsSchema.parse(req.params);
  const task = await Task.findOneAndDelete({
    _id: id,
    createdBy: req.auth!.userId,
  });
  if (!task) throw new AppError(404, "Task not found");
  res.status(204).end();
});
