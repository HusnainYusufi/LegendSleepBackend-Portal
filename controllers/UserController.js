const express = require('express');
const router = express.Router();
const userService = require('../services/UserService');
const logger = require('../modules/logger'); // Import your centralized logger
const { verifyToken } = require('../modules/helper'); // Import verifyToken for role extraction

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

// Route to fetch users with the role "CRO"
router.get('/all/cro', async (req, res, next) => {
    try {
        // Extract and verify the authentication token
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);

        // Allow only SuperAdmin to fetch CRO users
        if (verifiedToken?.data?.userType.toLowerCase() !== 'superadmin') {
            logger.error('Unauthorized attempt to access CRO users list', {
                role: verifiedToken?.data?.userType || 'Unknown',
                userId: verifiedToken?.data?.userId || 'Unknown',
                ipAddress: req.ip || req.connection.remoteAddress
            });
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin can fetch CRO users.' });
        }

        // Fetch users with role "CRO"
        const result = await userService.getUsersByRole('cro');
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in UserController - /all/cro:', {
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

// Route to fetch leads assigned to a user
router.get('/my-leads', async (req, res, next) => {
    try {
        // Extract and verify the authentication token
        const token = req.headers['authorization']?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication token missing.' });
        }

        const verifiedToken = await verifyToken(token);
        const userId = verifiedToken?.data?.user;

        if (!userId) {
            return res.status(401).json({ message: 'Invalid token. Unable to retrieve user ID.' });
        }

        // Fetch leads assigned to the user
        const result = await userService.getUserLeads(userId);

        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Error in UserController - /my-leads:', {
            message: error.message,
            stack: error.stack,
            ipAddress: req.ip || req.connection.remoteAddress
        });
        next(error);
    }
});

module.exports = router;
