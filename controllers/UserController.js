const express = require('express');
const router = express.Router();
const userService = require('../services/UserService');
const logger = require('../modules/logger'); // Import your centralized logger

router.post('/add/password', async (req, res, next) => {
    try {
        // Extract user email and password from the request body
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            logger.error('Validation error in /add/password:', {
                message: 'Email or password is missing.',
                body: req.body
            });
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        // Call the service to add the password
        const result = await userService.setUserPassword({ email, password });
        return res.json(result);
    } catch (error) {
        logger.error('Error in /add/password controller:', {
            message: error.message,
            stack: error.stack,
            headers: req.headers,
            body: req.body,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error); // Pass error to the centralized error handler
    }
});

module.exports = router;
