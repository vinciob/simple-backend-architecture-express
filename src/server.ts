import { buildServer } from './app.js';
import { env } from './config/env.js';
import { connectDB } from './db/connection.js';
import { logger } from './lib/logger.js';

const startServer = async () => {
    try {

        // Connect to the database before starting the server
        await connectDB()

        // Build the Express server
        const app = buildServer()

        if (env.enableCron) {
            // Initialize scheduled tasks here when they are added.
        }

        // Start the server
        const port = env.port || 5001;
        app.listen(port, '0.0.0.0', () => {
            logger(`Server started on port ${port}`)
        })
    } catch (error) {
        logger('Failed to start server', 'error')
        logger(error instanceof Error ? error.stack || error.message : String(error), 'error')
        process.exit(1)
    }
};

startServer();
