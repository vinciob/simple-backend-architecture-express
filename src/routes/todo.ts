import { Router } from 'express'
// Controllers
import { completeTodo } from '../controllers/todo/completeTodo.js'
import { createTodo } from '../controllers/todo/createTodo.js'
import { deleteTodo } from '../controllers/todo/deleteTodo.js'
import { editTodo } from '../controllers/todo/editTodo.js'
import { getTodoById } from '../controllers/todo/getTodoById.js'
import { getTodos } from '../controllers/todo/getTodos.js'
import { reopenTodo } from '../controllers/todo/reopenTodo.js'
// Middleware
import { validateToken } from '../middleware/validateToken.js'

export const todoRoutes = Router()

todoRoutes.get('/', validateToken, getTodos)
todoRoutes.post('/', validateToken, createTodo)
todoRoutes.get('/:todoId', validateToken, getTodoById)
todoRoutes.patch('/:todoId', validateToken, editTodo)
todoRoutes.delete('/:todoId', validateToken, deleteTodo)
todoRoutes.patch('/:todoId/complete', validateToken, completeTodo)
todoRoutes.patch('/:todoId/reopen', validateToken, reopenTodo)
