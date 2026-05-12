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

//////////////////
// Todo Routes //
////////////////

export const todoRoutes = Router()

// Get Todos list
todoRoutes.get('/', validateToken, getTodos)

// Create Todo
todoRoutes.post('/', validateToken, createTodo)

// Get Todo by ID
todoRoutes.get('/:todoId', validateToken, getTodoById)

// Edit Todo
todoRoutes.patch('/:todoId', validateToken, editTodo)

// Delete Todo
todoRoutes.delete('/:todoId', validateToken, deleteTodo)

// Complete Todo
todoRoutes.patch('/:todoId/complete', validateToken, completeTodo)

// Reopen Todo
todoRoutes.patch('/:todoId/reopen', validateToken, reopenTodo)
