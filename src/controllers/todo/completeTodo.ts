import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { Todo, TodoOutputZ } from '../../entities/todo.entity.js'
// Utils
import { ObjectIdHexZ } from '../../lib/validateObjectId.js'
// Types
import type { AuthUser } from '../../middleware/validateToken.js'

const TodoParamsZ = z.object({
    todoId: ObjectIdHexZ,
})

export const completeTodo = async (req: Request, res: Response): Promise<void> => {
    const user = req.user as AuthUser

    const validateParams = TodoParamsZ.safeParse(req.params)
    if (!validateParams.success) {
        const error = z.treeifyError(validateParams.error)
        res.status(400).json({ message: 'Todo id not valid', details: error.properties })
        return
    }

    const todo = await Todo.findOneAndUpdate(
        { _id: validateParams.data.todoId, user: user._id },
        { status: 'completed' },
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
