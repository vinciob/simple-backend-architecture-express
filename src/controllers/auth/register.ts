import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { User, UserCreateZ, UserOutputZ } from '../../entities/user.entity.js'
// Utils
import { generateUserToken, hashPassword } from '../../lib/authUtils.js'
import { logger } from '../../lib/logger.js'

export const registerUser = async (req: Request, res: Response): Promise<void> => {
    const validateUser = UserCreateZ.safeParse(req.body)
    if (!validateUser.success) {
        const error = z.treeifyError(validateUser.error)
        logger(`User fields validation error: ${JSON.stringify(error)}`, 'error')
        res.status(400).json({
            message: 'User fields not valid',
            details: error.properties,
        })
        return
    }

    const userExists = await User.findOne({ email: validateUser.data.email })
    if (userExists) {
        logger('User already exists', 'error')
        res.status(409).json({ message: 'User already exists' })
        return
    }

    const hashedPassword = await hashPassword(validateUser.data.password)

    let newUser
    try {
        newUser = await User.create({ ...validateUser.data, password: hashedPassword })
    } catch (error: unknown) {
        if (error instanceof Error && 'code' in error && error.code === 11000) {
            logger('Duplicate key error', 'error')
            res.status(409).json({ message: 'Resource already exists' })
            return
        }

        logger(`Error creating new user: ${String(error)}`, 'error')
        res.status(500).json({ message: 'Error creating new user' })
        return
    }

    const outputUser = UserOutputZ.safeParse(newUser.toObject())
    if (!outputUser.success) {
        res.status(500).json({ message: 'Error preparing user output' })
        return
    }

    const token = generateUserToken(newUser._id.toString())
    res.status(201).json({ user: outputUser.data, token })
}
