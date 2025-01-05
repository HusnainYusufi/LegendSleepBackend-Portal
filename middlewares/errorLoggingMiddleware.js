const logger = require('../modules/logger'); // Import the logger

// Error Logging Middleware
const errorLoggingMiddleware = (err, req, res, next) => {
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        method: req.method,
        url: req.originalUrl,
        body: req.body,
        params: req.params,
        query: req.query
    });

    // Respond to the client
    res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = errorLoggingMiddleware;
