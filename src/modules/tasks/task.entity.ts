import { model, Schema, Types } from "mongoose";
import { z } from "zod";

export const TaskStatusSchema = z.enum(["created", "in_progress", "completed"]);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const TaskParamsSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid task id"),
});

// Zod schema for validating task creation input.
export const CreateTaskSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  description: z.string().max(2000).nullable().optional(),
  status: TaskStatusSchema.optional(),
  dueDate: z.iso.datetime({ offset: true }).nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

// Zod schema for validating task update input.
export const UpdateTaskSchema = CreateTaskSchema.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  "At least one field is required",
);
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

// Zod schema for validating task data stored in the database.
export const TaskSchema = z.object({
  name: CreateTaskSchema.shape.name,
  description: z.string().max(2000).nullable(),
  status: TaskStatusSchema,
  dueDate: z.date().nullable(),
  createdBy: z.instanceof(Types.ObjectId),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type TaskData = z.infer<typeof TaskSchema>;

// Zod schema for shaping the task response sent to clients.
export const TaskResponseSchema = TaskSchema.extend({
  id: z.string(),
  createdBy: z.string(),
  dueDate: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type TaskResponse = z.infer<typeof TaskResponseSchema>;

// Zod schema for shaping the task list item response sent to clients.
export const TaskListItemSchema = TaskResponseSchema.pick({
  name: true,
  dueDate: true,
  status: true,
}).extend({ _id: z.string() });
export type TaskListItem = z.infer<typeof TaskListItemSchema>;

// Mongoose schema for the Task model.
const taskSchema = new Schema<TaskData>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: null, maxlength: 2000 },
    status: {
      type: String,
      enum: TaskStatusSchema.options,
      default: "created",
      required: true,
    },
    dueDate: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true, versionKey: false },
);

// Index to optimize queries by the user who created the task and the creation date.
taskSchema.index({ createdBy: 1, createdAt: -1 });

// Export the Task model and utility function for converting to response format.
export const Task = model<TaskData>("Task", taskSchema);

/**
 * Utility function to convert a TaskData object to a TaskResponse object.
 * @param task The TaskData object to convert.
 * @returns The corresponding TaskResponse object.
 */
export function toTaskResponse(
  task: TaskData & { _id: Types.ObjectId },
): TaskResponse {
  return {
    id: task._id.toHexString(),
    name: task.name,
    description: task.description,
    status: task.status,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    createdBy: task.createdBy.toHexString(),
  };
}
