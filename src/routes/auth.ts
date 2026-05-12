import { Router } from 'express'
// Controllers
import { loginUser } from '../controllers/auth/login.js'
import { getMe } from '../controllers/auth/me.js'
import { registerUser } from '../controllers/auth/register.js'
// Middleware
import { validateToken } from '../middleware/validateToken.js'

//////////////////
// Auth Routes //
////////////////

export const authRoutes = Router()

// Login User
authRoutes.post('/login', loginUser)

// Register User
authRoutes.post('/register', registerUser)

// Me Route (Protected)
authRoutes.get('/me', validateToken, getMe)
