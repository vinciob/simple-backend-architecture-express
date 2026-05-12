import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { Todo, TodoCreateZ, TodoOutputZ } from '../../entities/todo.entity.js'
// Utils
import { logger } from '../../lib/logger.js'
// Types
import type { AuthUser } from '../../middleware/validateToken.js'

export const createTodo = async (req: Request, res: Response) => {
    const user = req.user as AuthUser

    // Validate todo fields
    const validateTodo = TodoCreateZ.safeParse(req.body)
    if (!validateTodo.success) {
        const error = z.treeifyError(validateTodo.error)
        logger(`Todo fields validation error: ${JSON.stringify(error)}`, 'error')
        res.status(400).json({
            message: 'Todo fields not valid',
            details: error.properties,
        })
        return
    }

    // Create todo
    let newTodo
    try {
        newTodo = await Todo.create({ ...validateTodo.data, user: user._id })
    } catch (error: unknown) {
        logger(`Error creating new todo: ${String(error)}`, 'error')
        res.status(500).json({ message: 'Error creating new todo' })
        return
    }

    // Prepare todo output
    const outputTodo = TodoOutputZ.safeParse(newTodo.toObject())
    if (!outputTodo.success) {
        res.status(500).json({ message: 'Error preparing todo output' })
        return
    }

    res.status(201).json({ todo: outputTodo.data })
}
