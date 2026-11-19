import * as argon2 from 'argon2'
import { Router } from 'express'
import { RegisterUserSchema, toUserResponse, User } from './user.entity.js'
import { authenticate } from '../auth/auth.middleware.js'
import { AppError } from '../../shared/errorHandler.js'

export const userRoutes = Router()

userRoutes.post('/', async (req, res) => {
    const input = RegisterUserSchema.parse(req.body)
    if (await User.exists({ email: input.email })) {
        throw new AppError(409, 'Email already registered')
    }

    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id })
    const user = await User.create({ name: input.name, email: input.email, passwordHash })
    res.status(201).json({ user: toUserResponse(user) })
})

userRoutes.get('/me', authenticate, async (req, res) => {
    const user = await User.findById(req.auth!.userId)
    if (!user) throw new AppError(404, 'User not found')
    res.json(toUserResponse(user))
})
