import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
// Config
import { env } from '../config/env.js'

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(10)
    return bcrypt.hash(password, salt)
}

export const comparePassword = async (
    candidatePassword: string,
    password: string,
): Promise<boolean> => bcrypt.compare(candidatePassword, password)

export const generateUserToken = (userId: string): string => {
    const payload = { user_id: userId }
    return jwt.sign(payload, env.jwtSecret, { expiresIn: '30d' })
}
