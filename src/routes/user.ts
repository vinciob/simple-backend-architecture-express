import { Router } from 'express'
// Controllers
import { deleteMe } from '../controllers/user/deleteMe.js'
import { editMe } from '../controllers/user/editMe.js'
// Middleware
import { validateToken } from '../middleware/validateToken.js'

//////////////////
// User Routes //
////////////////

export const userRoutes = Router()

// Edit User
userRoutes.patch('/me', validateToken, editMe)

// Delete User
userRoutes.delete('/me', validateToken, deleteMe)
