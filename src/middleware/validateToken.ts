import jwt, { type JwtPayload } from 'jsonwebtoken'
import type { NextFunction, Request, Response } from 'express'
// Config
import { env } from '../config/env.js'
// Models
import { User } from '../entities/user.entity.js'

type AccessTokenPayload = JwtPayload & {
    user_id?: string
    userId?: string
}

export type AuthUser = {
    _id: string
    email: string
    firstName: string
    lastName: string
}

// Extend Express Request to include user information
declare global {
    namespace Express {
        interface Request {
            user?: AuthUser
        }
    }
}

export const validateToken = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        res.status(401).json({ message: 'Unauthorized: no token' })
        return
    }

    // get token from header
    const token = authorization.split(' ')[1]
    if (!token) {
        res.status(401).json({ message: 'Unauthorized: no token' })
        return
    }

    // Verify token and attach user info to request
    try {
        const decoded = jwt.verify(token, env.jwtSecret) as AccessTokenPayload
        const userId = decoded.user_id || decoded.userId
        if (!userId) {
            res.status(401).json({ message: 'Unauthorized: invalid token' })
            return
        }

        const user = await User.findById(userId).select('firstName lastName email isActive').lean()
        if (!user) {
            res.status(401).json({ message: 'Invalid Token' })
            return
        }
        if (!user.isActive) {
            res.status(403).json({ message: 'User account is disabled' })
            return
        }

        req.user = {
            _id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
        }

        next()
    } catch {
        res.status(401).json({ message: 'Unauthorized: invalid token' })
    }
}
