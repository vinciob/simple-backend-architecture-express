import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { User, UserLoginZ, UserOutputZ } from '../../entities/user.entity.js'
// Utils
import { comparePassword, generateUserToken } from '../../lib/authUtils.js'
import { logger } from '../../lib/logger.js'

export const loginUser = async (req: Request, res: Response) => {
    // Validate input
    const validateLogin = UserLoginZ.safeParse(req.body)
    if (!validateLogin.success) {
        const error = z.treeifyError(validateLogin.error)
        res.status(400).json({ message: 'Login fields not valid', details: error.properties })
        return
    }

    const { email, password } = validateLogin.data

    // Find user by email
    const user = await User.findOne({ email }).select('+password')

    // Check if user exists and is active
    if (!user) {
        res.status(401).json({ message: 'Invalid email or password' })
        return
    }
    if (!user.isActive) {
        res.status(403).json({ message: 'User account is disabled' })
        return
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid email or password' })
        return
    }

    // Validate user output
    const outputUser = UserOutputZ.safeParse(user.toObject())
    if (!outputUser.success) {
        logger('User output validation error', 'error')
        res.status(500).json({ message: 'Error preparing user output' })
        return
    }

    // Generate user token
    const token = generateUserToken(user._id.toString())
    res.status(200).json({ user: outputUser.data, token })
}
