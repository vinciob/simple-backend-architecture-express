import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { User, UserCreateZ, UserOutputZ } from '../../entities/user.entity.js'
// Utils
import { generateUserToken, hashPassword } from '../../lib/authUtils.js'
import { logger } from '../../lib/logger.js'

export const registerUser = async (req: Request, res: Response) => {
    // Validate user fields
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

    // Check if user already exists
    const userExists = await User.findOne({ email: validateUser.data.email })
    if (userExists) {
        logger('User already exists', 'error')
        res.status(409).json({ message: 'User already exists' })
        return
    }

    // Hash password
    const hashedPassword = await hashPassword(validateUser.data.password)

    // Create user
    let newUser
    try {
        newUser = await User.create({ ...validateUser.data, password: hashedPassword })
    } catch (error: unknown) {
        // Handle duplicate key error (e.g., email already exists)
        if (error instanceof Error && 'code' in error && error.code === 11000) {
            logger('Duplicate key error', 'error')
            res.status(409).json({ message: 'Resource already exists' })
            return
        }

        // Handle validation errors
        logger(`Error creating new user: ${String(error)}`, 'error')
        res.status(500).json({ message: 'Error creating new user' })
        return
    }

    // Prepare user output
    const outputUser = UserOutputZ.safeParse(newUser.toObject())
    if (!outputUser.success) {
        res.status(500).json({ message: 'Error preparing user output' })
        return
    }

    // Generate token
    const token = generateUserToken(newUser._id.toString())
    res.status(201).json({ user: outputUser.data, token })
}
