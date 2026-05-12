import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { Todo } from '../../entities/todo.entity.js'
// Utils
import { logger } from '../../lib/logger.js'
import { ObjectIdHexZ } from '../../lib/validateObjectId.js'
// Types
import type { AuthUser } from '../../middleware/validateToken.js'

const TodoParamsZ = z.object({
    todoId: ObjectIdHexZ,
})

export const deleteTodo = async (req: Request, res: Response) => {
    const user = req.user as AuthUser

    // Validate todo id
    const validateParams = TodoParamsZ.safeParse(req.params)
    if (!validateParams.success) {
        const error = z.treeifyError(validateParams.error)
        res.status(400).json({ message: 'Todo id not valid', details: error.properties })
        return
    }

    // Delete todo
    try {
        const deletedTodo = await Todo.findOneAndDelete({
            _id: validateParams.data.todoId,
            user: user._id,
        })
        if (!deletedTodo) {
            res.status(404).json({ message: 'Todo not found' })
            return
        }

        res.status(200).json({ message: 'Todo deleted' })
    } catch (error) {
        logger(`Error deleting todo: ${String(error)}`, 'error')
        res.status(500).json({ message: 'Error deleting todo' })
    }
}
