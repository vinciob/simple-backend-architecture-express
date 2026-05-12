import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { Todo, TodoOutputZ, TodoUpdateZ } from '../../entities/todo.entity.js'
// Utils
import { logger } from '../../lib/logger.js'
import { ObjectIdHexZ } from '../../lib/validateObjectId.js'
// Types
import type { AuthUser } from '../../middleware/validateToken.js'

const TodoParamsZ = z.object({
    todoId: ObjectIdHexZ,
})

export const editTodo = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser

    const validateParams = TodoParamsZ.safeParse(req.params)
    if (!validateParams.success) {
        const error = z.treeifyError(validateParams.error)
        res.status(400).json({ message: 'Todo id not valid', details: error.properties })
        return
    }

    const validateTodo = TodoUpdateZ.safeParse(req.body)
    if (!validateTodo.success) {
        const error = z.treeifyError(validateTodo.error)
        logger(`Todo fields validation error: ${JSON.stringify(error)}`, 'error')
        res.status(400).json({
            message: 'Todo fields not valid',
            details: error.properties,
        })
        return
    }

    if (Object.keys(validateTodo.data).length === 0) {
        res.status(400).json({ message: 'No todo fields to update' })
        return
    }

    const todo = await Todo.findOneAndUpdate(
        { _id: validateParams.data.todoId, user: user._id },
        validateTodo.data,
        { new: true, runValidators: true },
    )

    if (!todo) {
        res.status(404).json({ message: 'Todo not found' })
        return
    }

    const outputTodo = TodoOutputZ.safeParse(todo.toObject())
    if (!outputTodo.success) {
        res.status(500).json({ message: 'Error preparing todo output' })
        return
    }

    res.status(200).json({ todo: outputTodo.data })
}
