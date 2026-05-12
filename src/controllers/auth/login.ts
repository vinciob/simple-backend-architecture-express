import z from 'zod'
import type { Request, Response } from 'express'
// Models
import { User, UserLoginZ, UserOutputZ } from '../../entities/user.entity.js'
// Utils
import { comparePassword, generateUserToken } from '../../lib/authUtils.js'
import { logger } from '../../lib/logger.js'

export const loginUser = async (req: Request, res: Response) => {
    const validateLogin = UserLoginZ.safeParse(req.body)
    if (!validateLogin.success) {
        const error = z.treeifyError(validateLogin.error)
        res.status(400).json({ message: 'Login fields not valid', details: error.properties })
        return
    }

    const { email, password } = validateLogin.data
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
        res.status(401).json({ message: 'Invalid email or password' })
        return
    }
    if (!user.isActive) {
        res.status(403).json({ message: 'User account is disabled' })
        return
    }

    const isPasswordValid = await comparePassword(password, user.password)
    if (!isPasswordValid) {
        res.status(401).json({ message: 'Invalid email or password' })
        return
    }

    const outputUser = UserOutputZ.safeParse(user.toObject())
    if (!outputUser.success) {
        logger('User output validation error', 'error')
        res.status(500).json({ message: 'Error preparing user output' })
        return
    }

    const token = generateUserToken(user._id.toString())
    res.status(200).json({ user: outputUser.data, token })
}
