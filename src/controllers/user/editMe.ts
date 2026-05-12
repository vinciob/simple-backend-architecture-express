import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { User, UserOutputZ, UserUpdateZ } from '../../entities/user.entity.js'
// Utils
import { logger } from '../../lib/logger.js'
// Types
import type { AuthUser } from '../../middleware/validateToken.js'

export const editMe = async (req: Request, res: Response) => {
    const user = req.user as AuthUser

    // Validate user fields
    const validateUser = UserUpdateZ.safeParse(req.body)
    if (!validateUser.success) {
        const error = z.treeifyError(validateUser.error)
        logger(`User fields validation error: ${JSON.stringify(error)}`, 'error')
        res.status(400).json({
            message: 'User fields not valid',
            details: error.properties,
        })
        return
    }

    if (Object.keys(validateUser.data).length === 0) {
        res.status(400).json({ message: 'No user fields to update' })
        return
    }

    // Edit user
    const updatedUser = await User.findByIdAndUpdate(
        user._id,
        validateUser.data,
        { new: true, runValidators: true },
    )

    if (!updatedUser) {
        res.status(404).json({ message: 'User not found' })
        return
    }

    // Prepare user output
    const outputUser = UserOutputZ.safeParse(updatedUser.toObject())
    if (!outputUser.success) {
        res.status(500).json({ message: 'Error preparing user output' })
        return
    }

    res.status(200).json({ user: outputUser.data })
}
