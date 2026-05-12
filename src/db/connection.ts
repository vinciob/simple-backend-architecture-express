import mongoose from 'mongoose'
import { env } from '../config/env.js'
import { logger } from '../lib/logger.js'

export const connectDB = async (): Promise<void> => {
    try {
        const conn = await mongoose.connect(env.dbUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
        })

        logger(`MongoDB connected: ${conn.connection.host}`)
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown database error'
        logger(`MongoDB connection error: ${message}`, 'error')
        throw error
    }
}
