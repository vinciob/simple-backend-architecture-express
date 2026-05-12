import type { Request, Response } from 'express'
// Models
import { Todo } from '../../entities/todo.entity.js'
import { User } from '../../entities/user.entity.js'
// Utils
import { logger } from '../../lib/logger.js'
// Types
import type { AuthUser } from '../../middleware/validateToken.js'

export const deleteMe = async (req: Request, res: Response) => {
    const user = req.user as AuthUser

    // Delete user and related todos
    try {
        const deletedUser = await User.findByIdAndDelete(user._id)
        if (!deletedUser) {
            res.status(404).json({ message: 'User not found' })
            return
        }

        await Todo.deleteMany({ user: user._id })

        res.status(200).json({ message: 'User deleted' })
    } catch (error) {
        logger(`Error deleting user: ${String(error)}`, 'error')
        res.status(500).json({ message: 'Error deleting user' })
    }
}
