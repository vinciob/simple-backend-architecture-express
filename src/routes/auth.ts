import { Router } from 'express'
// Controllers
import { loginUser } from '../controllers/auth/login.js'
import { getMe } from '../controllers/auth/me.js'
import { registerUser } from '../controllers/auth/register.js'
// Middleware
import { validateToken } from '../middleware/validateToken.js'

export const authRoutes = Router()

authRoutes.post('/login', loginUser)
authRoutes.post('/register', registerUser)
authRoutes.get('/me', validateToken, getMe)
