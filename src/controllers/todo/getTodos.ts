import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { Todo, TodoOutputZ } from '../../entities/todo.entity.js'
// Types
import type { AuthUser } from '../../middleware/validateToken.js'

export const getTodos = async (req: Request, res: Response) => {
    const user = req.user as AuthUser

    // Get user todos
    const todos = await Todo.find({ user: user._id }).sort({ createdAt: -1 }).lean()

    // Prepare todos output
    const outputTodos = z.array(TodoOutputZ).safeParse(todos)
    if (!outputTodos.success) {
        res.status(500).json({ message: 'Error preparing todos output' })
        return
    }

    res.status(200).json({ todos: outputTodos.data })
}
