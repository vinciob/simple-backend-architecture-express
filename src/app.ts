import cors from 'cors';
import express from 'express';
// Config and Utils
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
// Routes
import { authRoutes } from './routes/auth.js';
import { todoRoutes } from './routes/todo.js';
import { userRoutes } from './routes/user.js';
// Types
import type { ErrorRequestHandler, Express, Request, Response } from 'express';

export const buildServer = (): Express => {
    const app = express()

    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
    app.use(cors({
        origin: env.feUrl,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    }))

    app.get('/health', (_req: Request, res: Response) => {
        res.status(200).json({ status: 'ok' })
    });

    app.use('/api/auth', authRoutes)
    app.use('/api/users', userRoutes)
    app.use('/api/todos', todoRoutes)

    app.use((_req: Request, res: Response) => {
        res.status(404).json({ message: 'Route not found' })
    })

    const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
        logger(error.stack || error.message, 'error');
        const isProduction = env.nodeEnv === 'production';
        res.status(500).json({
            message: isProduction ? 'Internal Server Error' : error.message,
        })
    }

    app.use(errorHandler)

    return app
};
