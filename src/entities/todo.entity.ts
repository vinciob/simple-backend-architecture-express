import mongoose, { type Model } from 'mongoose'
import z from 'zod'
// Utils
import { ObjectIdZ } from '../lib/validateObjectId.js'

export const todoStatusValues = ['pending', 'in_progress', 'completed'] as const
export type TTodoStatus = (typeof todoStatusValues)[number]
export const todoPriorityValues = ['low', 'medium', 'high'] as const
export type TTodoPriority = (typeof todoPriorityValues)[number]

const todoSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    status: { type: String, enum: todoStatusValues, default: 'pending', index: true },
    priority: { type: String, enum: todoPriorityValues, default: 'medium', index: true },
    dueDate: { type: Date },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true })

const TodoZ = z.object({
    title: z
        .string()
        .min(2, 'Title must be at least 2 characters long')
        .max(200),
    description: z
        .string()
        .max(2000)
        .optional(),
    status: z.enum(todoStatusValues).default('pending'),
    priority: z.enum(todoPriorityValues).default('medium'),
    dueDate: z.coerce.date().optional(),
    user: ObjectIdZ,
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    __v: z.number().optional(),
})

export const TodoCreateZ = TodoZ.pick({
    title: true,
    description: true,
    priority: true,
    dueDate: true,
})

export const TodoUpdateZ = TodoZ.pick({
    title: true,
    description: true,
    status: true,
    priority: true,
    dueDate: true,
}).partial()

export const TodoOutputZ = TodoZ.omit({
    __v: true,
}).extend({
    _id: ObjectIdZ,
})

export type TTodo = z.infer<typeof TodoZ>
export type TCreateTodo = z.infer<typeof TodoCreateZ>
export type TUpdateTodo = z.infer<typeof TodoUpdateZ>
export type TTodoOutput = z.infer<typeof TodoOutputZ>

export interface TodoDoc extends mongoose.Document, TTodo {}
export interface TodoModel extends Model<TodoDoc> {}

export const Todo = mongoose.model<TodoDoc, TodoModel>('Todo', todoSchema)
