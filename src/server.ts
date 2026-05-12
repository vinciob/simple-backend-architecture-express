// Entry point of the application
import { buildServer } from './app.js'
// Config and utilities
import { env } from './config/env.js'
import { connectDB } from './db/connection.js'
import { logger } from './lib/logger.js'

const startServer = async () => {
    try {

        // Connect to the database
        await connectDB()

        // Build the Express server
        const app = buildServer()

        if (env.enableCron) {
            // If there are scheduled tasks, initialize them here
            // scheduleTasks()
        }

        // Start the server
        const port = env.port || 5001
        app.listen(port, '0.0.0.0', () => {
            logger(`Server started on port ${port}`)
        })
    } catch (error) {
        // Log server start failure
        logger('Failed to start server', 'error')
        logger(error instanceof Error ? error.stack || error.message : String(error), 'error')

        // Exit the process with failure code
        process.exit(1)
    }
}

startServer()
