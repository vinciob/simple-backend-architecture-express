import { Router } from 'express';
// Controllers
import { deleteMe } from '../controllers/user/deleteMe.js';
import { editMe } from '../controllers/user/editMe.js';
// Middleware
import { validateToken } from '../middleware/validateToken.js';

export const userRoutes = Router();

userRoutes.patch('/me', validateToken, editMe);
userRoutes.delete('/me', validateToken, deleteMe);
